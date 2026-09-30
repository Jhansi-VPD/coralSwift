"""Manager router — projects, tasks, approvals, team, performance reviews."""
import datetime as dt

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from supabase import Client

from app.core.clients import service_client
from app.core.helpers import audit, notify, raise_db_error
from app.core.security import SessionUser, client_ip, require_role

router = APIRouter(prefix="/manager", tags=["manager"])


def _sb() -> Client:
    sb = service_client()
    if not sb:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    return sb


def _my_employee_id(sb: Client, profile_id: str) -> str | None:
    res = sb.table("employees").select("id").eq("profile_id", profile_id).maybe_single().execute()
    # postgrest-py 2.31: .maybe_single().execute() returns bare None when no row matches.
    return ((res.data or {}).get("id")) if res else None


PROJECT_SELECT = (
    "id, name, code, description, status, health, progress_percent, client_review_status, expected_comp"
    "letion_date, "
    "start_date, target_end_date, budget, "
    "organization:client_organizations (id, name), "
    "manager:employees (id, employee_code, profile:profiles (full_name)), "
    "milestones:milestones (id, title, description, due_date, status, sort_order, completed_at), "
    "members:project_members (id, allocation_percent, role_on_project, "
    "employee:employees (id, employee_code, designation, profile:profiles (id, full_name, email))), "
    "updates:project_updates (id, title, body, is_client_visible, created_at, author:profiles (full_name)), "
    "tasks:tasks (status)"
)


def _fold_task_stats(p: dict) -> dict:
    stats: dict[str, int] = {}
    for t in p.get("tasks") or []:
        stats[t["status"]] = stats.get(t["status"], 0) + 1
    p["task_stats"] = stats
    del p["tasks"]
    return p


@router.get("/projects", summary="My projects (manager-scoped; admin sees all)")
def list_projects(status: str | None = None, user: SessionUser = Depends(require_role("manager"))):
    sb = _sb()
    try:
        query = sb.table("projects").select(PROJECT_SELECT)
        if user.role == "manager":
            my_id = _my_employee_id(sb, user.id)
            if not my_id:
                return []
            query = query.eq("manager_id", my_id)
        if status:
            query = query.eq("status", status)
        res = query.order("created_at", desc=True).execute()
    except Exception as e:
        raise_db_error(e)
    return [_fold_task_stats(p) for p in (res.data or [])]


class MilestoneIn(BaseModel):
    id: str | None = None
    title: str
    dueDate: str | None = None
    status: str | None = None
    remove: bool = False


class ProjectCreate(BaseModel):
    name: str
    code: str | None = None
    description: str | None = None
    organizationId: str | None = None
    contractId: str | None = None
    managerId: str | None = None
    startDate: str | None = None
    targetEndDate: str | None = None
    budget: float | None = None
    milestones: list[MilestoneIn] = []


@router.post("/projects", status_code=201, summary="Create a project (+ milestones)")
def create_project(body: ProjectCreate, request: Request, user: SessionUser = Depends(require_role("manager"))):
    sb = _sb()
    manager_id = body.managerId
    if user.role == "manager":
        manager_id = _my_employee_id(sb, user.id)
        if not manager_id:
            raise HTTPException(status_code=400, detail="Your user has no employee record; contact HR")
    try:
        res = sb.table("projects").insert({
            "name": body.name.strip(), "code": body.code, "description": body.description,
            "organization_id": body.organizationId, "contract_id": body.contractId,
            "manager_id": manager_id, "status": "planning",
            "start_date": body.startDate, "target_end_date": body.targetEndDate,
            "budget": body.budget,
        }).select("id, name, code").execute()
        row = res.data[0]
        if body.milestones:
            sb.table("milestones").insert([
                {"project_id": row["id"], "title": m.title, "due_date": m.dueDate, "sort_order": n}
                for n, m in enumerate(body.milestones)
            ]).execute()
    except Exception as e:
        raise_db_error(e)
    audit("CREATE_PROJECT", "projects", row["id"], user, {"name": body.name}, client_ip(request))
    return row


@router.get("/projects/{project_id}", summary="Project detail")
def project_detail(project_id: str, user: SessionUser = Depends(require_role("manager"))):
    sb = _sb()
    try:
        query = sb.table("projects").select(PROJECT_SELECT).eq("id", project_id)
        if user.role == "manager":
            query = query.eq("manager_id", _my_employee_id(sb, user.id))
        res = query.maybe_single().execute()
    except Exception as e:
        raise_db_error(e)
    if not res.data:
        raise HTTPException(status_code=404, detail="Project not found")
    return _fold_task_stats(res.data)


class ProjectPatch(BaseModel):
    status: str | None = None
    health: str | None = None
    progressPercent: int | None = None
    expectedCompletionDate: str | None = None
    submitForReview: bool = False
    update: dict | None = None          # {title, body?, isClientVisible?}
    milestone: dict | None = None       # {id?, title, dueDate?, status?, remove?}
    member: dict | None = None          # {employeeId, allocationPercent?, roleOnProject?, remove?}


@router.patch("/projects/{project_id}", summary="Project lifecycle: status/health/progress, submit for review, updates, milestones, members")
def patch_project(project_id: str, body: ProjectPatch, request: Request, user: SessionUser = Depends(require_role("manager"))):
    sb = _sb()
    try:
        scoped = sb.table("projects").select("id, name, status, client_review_status, organization_id").eq("id", project_id)
        if user.role == "manager":
            scoped = scoped.eq("manager_id", _my_employee_id(sb, user.id))
        row = scoped.maybe_single().execute()
    except Exception as e:
        raise_db_error(e)
    project = row.data if row else None
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    updates: dict = {}
    client_notification: tuple[str, str] | None = None

    if body.submitForReview:
        if project["client_review_status"] == "submitted":
            raise HTTPException(status_code=409, detail="Project is already awaiting client review")
        updates |= {
            "client_review_status": "submitted",
            "submitted_for_review_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        }
        client_notification = ("Review requested", f"Project \"{project['name']}\" was submitted for your review.")

    if body.status:
        if body.status not in ("planning", "active", "on_hold", "completed", "cancelled"):
            raise HTTPException(status_code=400, detail="invalid status")
        updates["status"] = body.status
    if body.health:
        if body.health not in ("on_track", "at_risk", "critical"):
            raise HTTPException(status_code=400, detail="invalid health")
        updates["health"] = body.health
    if body.progressPercent is not None:
        updates["progress_percent"] = max(0, min(100, int(body.progressPercent)))
    if body.expectedCompletionDate is not None:
        updates["expected_completion_date"] = body.expectedCompletionDate or None

    try:
        if updates:
            sb.table("projects").update(updates).eq("id", project_id).execute()

        if body.update:
            sb.table("project_updates").insert({
                "project_id": project_id, "author_id": user.id,
                "title": body.update.get("title", ""),
                "body": body.update.get("body"),
                "is_client_visible": body.update.get("isClientVisible", True),
            }).execute()

        m = body.milestone
        if m:
            if m.get("remove") and m.get("id"):
                sb.table("milestones").delete().eq("id", m["id"]).execute()
            elif m.get("id"):
                mu: dict = {"title": m["title"]}
                if "dueDate" in m:
                    mu["due_date"] = m.get("dueDate")
                if m.get("status"):
                    mu["status"] = m["status"]
                    if m["status"] == "completed":
                        mu["completed_at"] = dt.datetime.now(dt.timezone.utc).isoformat()
                sb.table("milestones").update(mu).eq("id", m["id"]).execute()
            else:
                sb.table("milestones").insert({
                    "project_id": project_id, "title": m["title"], "due_date": m.get("dueDate"),
                }).execute()

        mem = body.member
        if mem:
            if mem.get("remove"):
                sb.table("project_members").delete().eq("project_id", project_id).eq("employee_id", mem["employeeId"]).execute()
            else:
                sb.table("project_members").upsert({
                    "project_id": project_id, "employee_id": mem["employeeId"],
                    "allocation_percent": mem.get("allocationPercent", 100),
                    "role_on_project": mem.get("roleOnProject"),
                }, on_conflict="project_id,employee_id").execute()
    except Exception as e:
        raise_db_error(e, "Project update failed")

    if client_notification and project.get("organization_id"):
        try:
            contacts = sb.table("client_contacts").select("profile_id").eq("organization_id", project["organization_id"]).not_.is_("profile_id", "null").execute()
            for c in contacts.data or []:
                if c.get("profile_id"):
                    notify(c["profile_id"], client_notification[0], client_notification[1], "project", "/client")
        except Exception:
            pass

    audit("UPDATE_PROJECT", "projects", project_id, user, {**updates, "update": (body.update or {}).get("title")}, client_ip(request))
    return {"success": True}


# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------

TASK_SELECT = (
    "id, title, description, priority, status, estimated_hours, due_date, created_at, updated_at, "
    "project:projects (id, name, code), "
    "milestone:milestones (id, title), "
    "assignee:employees!tasks_assignee_id_fkey (id, employee_code, profile:profiles (full_name, email))"
)


@router.get("/tasks", summary="Tasks across my projects")
def list_tasks(
    project: str | None = None,
    assignee: str | None = None,
    status: str | None = None,
    user: SessionUser = Depends(require_role("manager")),
):
    sb = _sb()
    try:
        query = sb.table("tasks").select(TASK_SELECT)
        if user.role == "manager":
            my_id = _my_employee_id(sb, user.id)
            if not my_id:
                return []
            res_owned = sb.table("projects").select("id").eq("manager_id", my_id).execute()
            ids = [p["id"] for p in (res_owned.data or [])]
            if not ids:
                return []
            query = query.in_("project_id", ids)
        if project:
            query = query.eq("project_id", project)
        if assignee:
            query = query.eq("assignee_id", assignee)
        if status:
            query = query.eq("status", status)
        res = query.order("created_at", desc=True).limit(500).execute()
    except Exception as e:
        raise_db_error(e)
    return res.data or []


class TaskCreate(BaseModel):
    projectId: str
    title: str
    assigneeId: str
    description: str | None = None
    priority: str = "medium"
    estimatedHours: float | None = None
    dueDate: str | None = None
    milestoneId: str | None = None


@router.post("/tasks", status_code=201, summary="Create & assign a task (notifies assignee)")
def create_task(body: TaskCreate, request: Request, user: SessionUser = Depends(require_role("manager"))):
    if body.priority not in ("low", "medium", "high", "urgent"):
        raise HTTPException(status_code=400, detail="priority must be low, medium, high, or urgent")
    sb = _sb()
    if user.role == "manager":
        try:
            owned = sb.table("projects").select("id").eq("id", body.projectId).eq("manager_id", _my_employee_id(sb, user.id)).maybe_single().execute()
        except Exception as e:
            raise_db_error(e)
        if not owned.data:
            raise HTTPException(status_code=404, detail="Project not found or not yours")
    try:
        res = sb.table("tasks").insert({
            "project_id": body.projectId, "milestone_id": body.milestoneId,
            "title": body.title.strip(), "description": body.description,
            "assignee_id": body.assigneeId, "priority": body.priority,
            "estimated_hours": body.estimatedHours, "due_date": body.dueDate,
            "created_by": user.id,
        }).select(TASK_SELECT).execute()
        row = res.data[0]
        profile = sb.table("employees").select("profile_id").eq("id", body.assigneeId).maybe_single().execute()
    except Exception as e:
        raise_db_error(e)
    if (profile.data or {}).get("profile_id"):
        notify(profile.data["profile_id"], f"New task assigned: {row['title']}",
               f"Priority: {row['priority']}" + (f" • Due {row['due_date']}" if row.get("due_date") else ""),
               "task", "/employee/tasks")
    audit("CREATE_TASK", "tasks", row["id"], user, {"title": row["title"]}, client_ip(request))
    return row


class TaskPatch(BaseModel):
    id: str
    title: str | None = None
    description: str | None = None
    assigneeId: str | None = None
    priority: str | None = None
    status: str | None = None
    dueDate: str | None = None
    estimatedHours: float | None = None


@router.patch("/tasks", summary="Edit / reassign a task")
def patch_task(body: TaskPatch, request: Request, user: SessionUser = Depends(require_role("manager"))):
    field_map = {
        "title": "title", "description": "description", "assigneeId": "assignee_id",
        "priority": "priority", "status": "status", "dueDate": "due_date", "estimatedHours": "estimated_hours",
    }
    updates = {col: getattr(body, key) for key, col in field_map.items() if getattr(body, key) is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update")
    if updates.get("priority") and updates["priority"] not in ("low", "medium", "high", "urgent"):
        raise HTTPException(status_code=400, detail="invalid priority")
    if updates.get("status") and updates["status"] not in ("todo", "in_progress", "in_review", "blocked", "done"):
        raise HTTPException(status_code=400, detail="invalid status")
    sb = _sb()
    try:
        res = sb.table("tasks").update(updates).eq("id", body.id).select(TASK_SELECT).execute()
        row = res.data[0]
        if "assignee_id" in updates:
            profile = sb.table("employees").select("profile_id").eq("id", updates["assignee_id"]).maybe_single().execute()
            if (profile.data or {}).get("profile_id"):
                notify(profile.data["profile_id"], f"Task assigned: {row['title']}", "You have been assigned a task.", "task", "/employee/tasks")
    except Exception as e:
        raise_db_error(e)
    audit("UPDATE_TASK", "tasks", body.id, user, updates, client_ip(request))
    return row


# ---------------------------------------------------------------------------
# Approvals inbox
# ---------------------------------------------------------------------------

@router.get("/approvals", summary="Unified approvals inbox (timesheets + leave)")
def approvals(user: SessionUser = Depends(require_role("manager"))):
    sb = _sb()
    try:
        if user.is_admin:
            ts = sb.table("timesheets").select(
                "id, work_date, hours, notes, created_at, employee:employees!timesheets_employee_id_fkey (id, employee_code, profile:profiles (full_name)), project:projects (name)"
            ).eq("status", "pending").order("work_date").execute()
            lv = sb.table("leave_requests").select(
                "id, leave_type, start_date, end_date, reason, created_at, employee:employees!leave_requests_employee_id_fkey (id, employee_code, profile:profiles (full_name))"
            ).eq("status", "pending").order("start_date").execute()
            return {"timesheets": ts.data or [], "leave": lv.data or []}

        my_id = _my_employee_id(sb, user.id)
        if not my_id:
            return {"timesheets": [], "leave": []}
        ts = sb.table("timesheets").select(
            "id, work_date, hours, notes, created_at, employee:employees!timesheets_employee_id_fkey!inner (id, employee_code, manager_id, profile:profiles (full_name)), project:projects (name)"
        ).eq("status", "pending").eq("employee.manager_id", my_id).order("work_date").execute()
        lv = sb.table("leave_requests").select(
            "id, leave_type, start_date, end_date, reason, created_at, employee:employees!leave_requests_employee_id_fkey!inner (id, employee_code, manager_id, profile:profiles (full_name))"
        ).eq("status", "pending").eq("employee.manager_id", my_id).order("start_date").execute()
    except Exception as e:
        raise_db_error(e)
    return {"timesheets": ts.data or [], "leave": lv.data or []}


class ApprovalDecision(BaseModel):
    type: str          # timesheet | leave
    id: str
    decision: str      # approved | rejected
    notes: str | None = None


@router.post("/approvals", summary="Approve / reject a timesheet or leave request")
def decide_approval(body: ApprovalDecision, request: Request, user: SessionUser = Depends(require_role("manager"))):
    if body.type not in ("timesheet", "leave"):
        raise HTTPException(status_code=400, detail="type must be timesheet or leave")
    if body.decision not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="decision must be approved or rejected")
    sb = _sb()
    reviewer_id = _my_employee_id(sb, user.id)
    now = dt.datetime.now(dt.timezone.utc).isoformat()

    try:
        if body.type == "timesheet":
            if not user.is_admin:
                scoped = sb.table("timesheets").select("id, employee:employees!timesheets_employee_id_fkey!inner (manager_id)").eq("id", body.id).eq("employee.manager_id", reviewer_id).maybe_single().execute()
                if not scoped.data:
                    raise HTTPException(status_code=404, detail="Timesheet not found in your team")
            res = sb.table("timesheets").update({
                "status": body.decision, "reviewer_id": reviewer_id,
                "reviewed_at": now, "review_notes": body.notes,
            }).eq("id", body.id).select("id, status, employee_id").execute()
            row = res.data[0]
            emp = sb.table("employees").select("profile_id").eq("id", row["employee_id"]).maybe_single().execute()
            if (emp.data or {}).get("profile_id"):
                notify(emp.data["profile_id"], f"Timesheet {body.decision}", "Your timesheet entry was {dec}.".format(dec=body.decision), "timesheet", "/employee/timesheets")
        else:
            if not user.is_admin:
                scoped = sb.table("leave_requests").select("id, employee:employees!leave_requests_employee_id_fkey!inner (manager_id)").eq("id", body.id).eq("employee.manager_id", reviewer_id).maybe_single().execute()
                if not scoped.data:
                    raise HTTPException(status_code=404, detail="Leave request not found in your team")
            res = sb.table("leave_requests").update({
                "status": body.decision, "reviewer_id": reviewer_id,
                "review_notes": body.notes, "reviewed_at": now,
            }).eq("id", body.id).select("id, employee_id").execute()
            row = res.data[0]
            emp = sb.table("employees").select("profile_id").eq("id", row["employee_id"]).maybe_single().execute()
            if (emp.data or {}).get("profile_id"):
                notify(emp.data["profile_id"], f"Leave {body.decision}", "Your leave request was {dec}.".format(dec=body.decision), "leave", "/employee/leave")
    except HTTPException:
        raise
    except Exception as e:
        raise_db_error(e, "Decision failed")

    audit(f"{'TIMESHEET' if body.type == 'timesheet' else 'LEAVE'}_{body.decision.upper()}", body.type + ("s" if body.type == "timesheet" else "_requests"), body.id, user, ip=client_ip(request))
    return {"success": True}


# ---------------------------------------------------------------------------
# Team oversight
# ---------------------------------------------------------------------------

@router.get("/team", summary="Direct reports with workload & capacity")
def team(user: SessionUser = Depends(require_role("manager"))):
    sb = _sb()
    month_start = dt.date.today().replace(day=1).isoformat()
    try:
        query = sb.table("employees").select(
            "id, employee_code, designation, status, date_of_joining, "
            "profile:profiles (id, full_name, email, role), department:departments (name)"
        ).neq("status", "exited")
        if user.role == "manager":
            my_id = _my_employee_id(sb, user.id)
            if not my_id:
                raise HTTPException(status_code=400, detail="Manager has no employee record; contact HR")
            query = query.eq("manager_id", my_id)
        employees = query.order("employee_code").execute().data or []
        ids = [e["id"] for e in employees]
        if not ids:
            return []

        tasks = sb.table("tasks").select("assignee_id, status").in_("assignee_id", ids).execute().data or []
        hours = sb.table("timesheets").select("employee_id, hours").in_("employee_id", ids).gte("work_date", month_start).execute().data or []
        pending_ts = sb.table("timesheets").select("employee_id").in_("employee_id", ids).eq("status", "pending").execute().data or []
        pending_lv = sb.table("leave_requests").select("employee_id").in_("employee_id", ids).eq("status", "pending").execute().data or []
        allocs = sb.table("project_members").select(
            "employee_id, allocation_percent, project:projects (id, name, status)"
        ).in_("employee_id", ids).execute().data or []
    except Exception as e:
        raise_db_error(e)

    open_tasks: dict[str, int] = {}
    for t in tasks:
        if t["status"] != "done":
            open_tasks[t["assignee_id"]] = open_tasks.get(t["assignee_id"], 0) + 1
    month_hours: dict[str, float] = {}
    for h in hours:
        month_hours[h["employee_id"]] = month_hours.get(h["employee_id"], 0) + float(h.get("hours") or 0)
    p_ts: dict[str, int] = {}
    for p in pending_ts:
        p_ts[p["employee_id"]] = p_ts.get(p["employee_id"], 0) + 1
    p_lv: dict[str, int] = {}
    for p in pending_lv:
        p_lv[p["employee_id"]] = p_lv.get(p["employee_id"], 0) + 1
    allocations: dict[str, list] = {}
    for a in allocs:
        proj = (a.get("project") or [None])[0] if isinstance(a.get("project"), list) else a.get("project")
        if not proj:
            continue
        allocations.setdefault(a["employee_id"], []).append({"project": proj, "allocation_percent": a["allocation_percent"]})

    return [
        {
            "id": e["id"], "employee_code": e["employee_code"],
            "name": (e.get("profile") or {}).get("full_name", ""),
            "email": (e.get("profile") or {}).get("email", ""),
            "designation": e["designation"], "department": (e.get("department") or {}).get("name"),
            "status": e["status"], "joined": e["date_of_joining"],
            "openTasks": open_tasks.get(e["id"], 0),
            "hoursThisMonth": month_hours.get(e["id"], 0),
            "pendingTimesheets": p_ts.get(e["id"], 0),
            "pendingLeave": p_lv.get(e["id"], 0),
            "allocations": allocations.get(e["id"], []),
        }
        for e in employees
    ]


# ---------------------------------------------------------------------------
# Performance reviews
# ---------------------------------------------------------------------------

REVIEW_SELECT = (
    "id, cycle_name, overall_rating, strengths, improvements, goals, status, employee_comment, "
    "acknowledged_at, created_at, updated_at, "
    "employee:employees!performance_reviews_employee_id_fkey (id, employee_code, profile:profiles (full_name, email)), "
    "reviewer:employees!performance_reviews_reviewer_id_fkey (id, profile:profiles (full_name))"
)


@router.get("/reviews", summary="Reviews (team scope)")
def list_reviews(employee: str | None = None, cycle: str | None = None, user: SessionUser = Depends(require_role("manager", "hr"))):
    sb = _sb()
    try:
        query = sb.table("performance_reviews").select(REVIEW_SELECT)
        if employee:
            query = query.eq("employee_id", employee)
        if cycle:
            query = query.eq("cycle_name", cycle)
        res = query.order("created_at", desc=True).execute()
    except Exception as e:
        raise_db_error(e)
    return res.data or []


class ReviewCreate(BaseModel):
    employeeId: str
    cycleName: str
    overallRating: int | None = None
    strengths: str | None = None
    improvements: str | None = None
    goals: str | None = None


@router.post("/reviews", status_code=201, summary="Create a review (draft)")
def create_review(body: ReviewCreate, request: Request, user: SessionUser = Depends(require_role("manager", "hr"))):
    if body.overallRating is not None and not (1 <= body.overallRating <= 5):
        raise HTTPException(status_code=400, detail="overallRating must be between 1 and 5")
    sb = _sb()
    reviewer_id = _my_employee_id(sb, user.id)
    try:
        res = sb.table("performance_reviews").insert({
            "employee_id": body.employeeId, "reviewer_id": reviewer_id or body.employeeId,
            "cycle_name": body.cycleName.strip(), "overall_rating": body.overallRating,
            "strengths": body.strengths, "improvements": body.improvements, "goals": body.goals,
            "status": "draft",
        }).select(REVIEW_SELECT).execute()
    except Exception as e:
        raise_db_error(e)
    row = res.data[0]
    audit("CREATE_REVIEW", "performance_reviews", row["id"], user, {"cycle": body.cycleName}, client_ip(request))
    return row


class ReviewPatch(BaseModel):
    id: str
    overallRating: int | None = None
    strengths: str | None = None
    improvements: str | None = None
    goals: str | None = None
    status: str | None = None
    employeeComment: str | None = None


@router.patch("/reviews", summary="Update / share / acknowledge a review")
def patch_review(body: ReviewPatch, request: Request, user: SessionUser = Depends(require_role("manager", "hr", "employee"))):
    sb = _sb()
    try:
        row = sb.table("performance_reviews").select("id, employee_id, reviewer_id, status").eq("id", body.id).maybe_single().execute()
    except Exception as e:
        raise_db_error(e)
    review = row.data if row else None
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    my_id = _my_employee_id(sb, user.id)
    is_reviewer = review["reviewer_id"] == my_id or user.role in ("admin", "hr")
    is_employee = review["employee_id"] == my_id
    if not is_reviewer and not is_employee:
        raise HTTPException(status_code=403, detail="Not your review")

    updates: dict = {}
    if is_reviewer:
        if body.overallRating is not None:
            if not (1 <= body.overallRating <= 5):
                raise HTTPException(status_code=400, detail="rating must be 1–5")
            updates["overall_rating"] = body.overallRating
        for key in ("strengths", "improvements", "goals"):
            if getattr(body, key) is not None:
                updates[key] = getattr(body, key)
        if body.status:
            if body.status not in ("draft", "shared", "acknowledged"):
                raise HTTPException(status_code=400, detail="invalid status")
            updates["status"] = body.status
    if is_employee:
        if body.employeeComment is not None:
            updates["employee_comment"] = body.employeeComment
        if body.status == "acknowledged":
            if review["status"] != "shared":
                raise HTTPException(status_code=409, detail="Review has not been shared yet")
            updates["status"] = "acknowledged"
            updates["acknowledged_at"] = dt.datetime.now(dt.timezone.utc).isoformat()
        elif body.status and not is_reviewer:
            raise HTTPException(status_code=403, detail="Employees can only acknowledge")

    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update")
    try:
        sb.table("performance_reviews").update(updates).eq("id", body.id).execute()
    except Exception as e:
        raise_db_error(e)

    if updates.get("status") == "shared":
        try:
            emp = sb.table("employees").select("profile_id").eq("id", review["employee_id"]).maybe_single().execute()
            if (emp.data or {}).get("profile_id"):
                notify(emp.data["profile_id"], "Performance review shared", "Your manager shared your performance review.", "review", "/employee/reviews")
        except Exception:
            pass
    audit("UPDATE_REVIEW", "performance_reviews", body.id, user, {"status": updates.get("status")}, client_ip(request))
    return {"success": True}
