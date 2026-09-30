"""Employee router — self-service workspace (tasks, timesheets, leave, attendance, documents, profile)."""
import datetime as dt

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from supabase import Client

from app.core.clients import service_client
from app.core.helpers import audit, raise_db_error
from app.core.security import SessionUser, client_ip, require_role

router = APIRouter(prefix="/employee", tags=["employee"])


def _sb() -> Client:
    sb = service_client()
    if not sb:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    return sb


def _my_employee(sb: Client, profile_id: str) -> dict | None:
    res = sb.table("employees").select("id, annual_leave_balance, status").eq("profile_id", profile_id).maybe_single().execute()
    return res.data if res else None


# ---------------------------------------------------------------------------
# My tasks
# ---------------------------------------------------------------------------

TASK_SELECT = (
    "id, title, description, priority, status, estimated_hours, due_date, created_at, updated_at, "
    "project:projects (id, name, code, organization:client_organizations (name)), "
    "milestone:milestones (id, title)"
)


@router.get("/tasks", summary="My assigned tasks")
def my_tasks(status: str | None = None, user: SessionUser = Depends(require_role("employee", "manager"))):
    sb = _sb()
    me = _my_employee(sb, user.id)
    if not me:
        return []
    try:
        query = sb.table("tasks").select(TASK_SELECT).eq("assignee_id", me["id"])
        if status:
            query = query.eq("status", status)
        res = query.order("due_date", desc_first=False, nulls_first=False).execute()
    except Exception as e:
        raise_db_error(e)
    return res.data or []


class TaskUpdate(BaseModel):
    id: str
    status: str | None = None
    description: str | None = None


@router.patch("/tasks", summary="Update my task (status transitions)")
def update_task(body: TaskUpdate, request: Request, user: SessionUser = Depends(require_role("employee", "manager"))):
    if body.status and body.status not in ("todo", "in_progress", "in_review", "blocked", "done"):
        raise HTTPException(status_code=400, detail="invalid status")
    sb = _sb()
    me = _my_employee(sb, user.id)
    if not me:
        raise HTTPException(status_code=400, detail="No employee record")
    updates = {k: v for k, v in {"status": body.status, "description": body.description}.items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update")
    try:
        res = sb.table("tasks").update(updates).eq("id", body.id).eq("assignee_id", me["id"]).select("id, title, status").execute()
    except Exception as e:
        raise_db_error(e)
    if not res.data:
        raise HTTPException(status_code=404, detail="Task not found among your assignments")
    audit("EMPLOYEE_TASK_UPDATE", "tasks", body.id, user, {"status": updates.get("status")}, client_ip(request))
    return {"success": True, "task": res.data[0]}


# ---------------------------------------------------------------------------
# Timesheets
# ---------------------------------------------------------------------------

SHEET_SELECT = (
    "id, work_date, hours, notes, status, review_notes, reviewed_at, "
    "project:projects (id, name, code), task:tasks (id, title)"
)


@router.get("/timesheets", summary="My timesheet entries")
def my_timesheets(from_: str | None = None, to: str | None = None, status: str | None = None, user: SessionUser = Depends(require_role("employee", "manager"))):
    sb = _sb()
    me = _my_employee(sb, user.id)
    if not me:
        return []
    try:
        query = sb.table("timesheets").select(SHEET_SELECT).eq("employee_id", me["id"])
        if from_:
            query = query.gte("work_date", from_)
        if to:
            query = query.lte("work_date", to)
        if status:
            query = query.eq("status", status)
        res = query.order("work_date", desc=True).limit(500).execute()
    except Exception as e:
        raise_db_error(e)
    return res.data or []


class TimesheetCreate(BaseModel):
    workDate: str
    hours: float = Field(gt=0, le=24)
    projectId: str | None = None
    taskId: str | None = None
    notes: str | None = None


@router.post("/timesheets", status_code=201, summary="Log hours (goes to manager approvals)")
def log_time(body: TimesheetCreate, request: Request, user: SessionUser = Depends(require_role("employee", "manager"))):
    if not dt.date.fromisoformat(body.workDate):
        raise HTTPException(status_code=400, detail="workDate must be YYYY-MM-DD")
    sb = _sb()
    me = _my_employee(sb, user.id)
    if not me:
        raise HTTPException(status_code=400, detail="No employee record; contact HR")
    try:
        if body.taskId:
            dup = sb.table("timesheets").select("id").eq("employee_id", me["id"]).eq("work_date", body.workDate).eq("task_id", body.taskId).maybe_single().execute()
            if dup.data:
                raise HTTPException(status_code=409, detail="Hours already logged for this task and date; edit the existing entry")
        res = sb.table("timesheets").insert({
            "employee_id": me["id"], "work_date": body.workDate, "hours": body.hours,
            "project_id": body.projectId, "task_id": body.taskId, "notes": body.notes,
            "status": "pending",
        }).select(SHEET_SELECT).execute()
    except HTTPException:
        raise
    except Exception as e:
        raise_db_error(e)
    row = res.data[0]
    audit("LOG_TIME", "timesheets", row["id"], user, {"date": body.workDate, "hours": body.hours}, client_ip(request))
    return row


class TimesheetUpdate(BaseModel):
    id: str
    hours: float | None = Field(default=None, gt=0, le=24)
    notes: str | None = None
    taskId: str | None = None
    projectId: str | None = None
    cancel: bool = False


@router.patch("/timesheets", summary="Edit my unapproved entry / cancel pending")
def edit_timesheet(body: TimesheetUpdate, request: Request, user: SessionUser = Depends(require_role("employee", "manager"))):
    sb = _sb()
    me = _my_employee(sb, user.id)
    if not me:
        raise HTTPException(status_code=400, detail="No employee record")
    try:
        if body.cancel:
            sb.table("timesheets").update({"status": "draft"}).eq("id", body.id).eq("employee_id", me["id"]).eq("status", "pending").execute()
            return {"success": True, "cancelled": True}
        updates = {k: v for k, v in {
            "hours": body.hours, "notes": body.notes,
            "task_id": body.taskId, "project_id": body.projectId,
        }.items() if v is not None}
        if not updates:
            raise HTTPException(status_code=400, detail="Nothing to update")
        res = sb.table("timesheets").update(updates).eq("id", body.id).eq("employee_id", me["id"]).in_("status", ["draft", "pending", "rejected"]).select(SHEET_SELECT).execute()
    except HTTPException:
        raise
    except Exception as e:
        raise_db_error(e)
    if not res.data:
        raise HTTPException(status_code=404, detail="Entry not found or already approved")
    audit("EDIT_TIME", "timesheets", body.id, user, updates, client_ip(request))
    return res.data[0]


# ---------------------------------------------------------------------------
# Leave
# ---------------------------------------------------------------------------

MY_LEAVE_SELECT = (
    "id, leave_type, start_date, end_date, reason, status, review_notes, reviewed_at, created_at, "
    # two FKs exist to employees (employee_id, reviewer_id) — the hint is required
    "reviewer:employees!leave_requests_reviewer_id_fkey (id, profile:profiles (full_name))"
)


@router.get("/leave", summary="My leave history + balance")
def my_leave(user: SessionUser = Depends(require_role("employee", "manager"))):
    sb = _sb()
    me = _my_employee(sb, user.id)
    if not me:
        return {"balance": None, "requests": []}
    try:
        res = sb.table("leave_requests").select(MY_LEAVE_SELECT).eq("employee_id", me["id"]).order("created_at", desc=True).execute()
    except Exception as e:
        raise_db_error(e)
    return {"balance": me.get("annual_leave_balance"), "requests": res.data or []}


class LeaveCreate(BaseModel):
    leaveType: str
    startDate: str
    endDate: str
    reason: str | None = None


@router.post("/leave", status_code=201, summary="Submit a leave request")
def apply_leave(body: LeaveCreate, request: Request, user: SessionUser = Depends(require_role("employee", "manager"))):
    types = ("annual", "sick", "unpaid", "maternity", "paternity")
    if body.leaveType not in types:
        raise HTTPException(status_code=400, detail=f"leaveType must be one of: {', '.join(types)}")
    try:
        start, end = dt.date.fromisoformat(body.startDate), dt.date.fromisoformat(body.endDate)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid dates; use YYYY-MM-DD")
    if end < start:
        raise HTTPException(status_code=400, detail="endDate cannot be before startDate")

    sb = _sb()
    me = _my_employee(sb, user.id)
    if not me:
        raise HTTPException(status_code=400, detail="No employee record; contact HR")
    if me.get("status") == "exited":
        raise HTTPException(status_code=403, detail="Inactive employees cannot request leave")
    try:
        overlap = (
            sb.table("leave_requests").select("id").eq("employee_id", me["id"])
            .in_("status", ["pending", "approved"]).lte("start_date", body.endDate)
            .gte("end_date", body.startDate).limit(1).execute()
        )
        if overlap.data:
            raise HTTPException(status_code=409, detail="You already have a pending or approved leave overlapping these dates")
        if body.leaveType == "annual":
            days = (end - start).days + 1
            if days > int(me.get("annual_leave_balance") or 0):
                raise HTTPException(status_code=409, detail=f"Insufficient balance: requesting {days} day(s) but only {me.get('annual_leave_balance')} remain")
        res = sb.table("leave_requests").insert({
            "employee_id": me["id"], "leave_type": body.leaveType,
            "start_date": body.startDate, "end_date": body.endDate,
            "reason": body.reason, "status": "pending",
        }).select(MY_LEAVE_SELECT).execute()
    except HTTPException:
        raise
    except Exception as e:
        raise_db_error(e)
    row = res.data[0]
    audit("REQUEST_LEAVE", "leave_requests", row["id"], user, {"type": body.leaveType}, client_ip(request))
    return {**row, "balance": me.get("annual_leave_balance")}


@router.delete("/leave/{leave_id}", summary="Cancel my pending leave request")
def cancel_leave(leave_id: str, request: Request, user: SessionUser = Depends(require_role("employee", "manager"))):
    sb = _sb()
    me = _my_employee(sb, user.id)
    if not me:
        raise HTTPException(status_code=400, detail="No employee record")
    try:
        res = sb.table("leave_requests").update({"status": "cancelled"}).eq("id", leave_id).eq("employee_id", me["id"]).eq("status", "pending").select("id").execute()
    except Exception as e:
        raise_db_error(e)
    if not res.data:
        raise HTTPException(status_code=404, detail="Request not found or no longer cancellable")
    audit("CANCEL_LEAVE", "leave_requests", leave_id, user)
    return {"success": True}


# ---------------------------------------------------------------------------
# Attendance (punch in / out)
# ---------------------------------------------------------------------------

@router.get("/attendance", summary="My attendance (today + month history)")
def my_attendance(from_: str | None = None, to: str | None = None, user: SessionUser = Depends(require_role("employee", "manager"))):
    sb = _sb()
    me = _my_employee(sb, user.id)
    if not me:
        return {"today": None, "history": []}
    today = dt.date.today().isoformat()
    try:
        query = sb.table("attendance").select("id, work_date, check_in, check_out, status, notes").eq("employee_id", me["id"])
        query = query.gte("work_date", from_ or today[:8] + "01").lte("work_date", to or today)
        res = query.order("work_date", desc=True).execute()
    except Exception as e:
        raise_db_error(e)
    rows = res.data or []
    return {"today": next((r for r in rows if r["work_date"] == today), None), "history": rows}


class PunchRequest(BaseModel):
    action: str  # check_in | check_out
    notes: str | None = None


@router.post("/attendance", summary="Check in / check out")
def punch(body: PunchRequest, request: Request, user: SessionUser = Depends(require_role("employee", "manager"))):
    if body.action not in ("check_in", "check_out"):
        raise HTTPException(status_code=400, detail="action must be check_in or check_out")
    sb = _sb()
    me = _my_employee(sb, user.id)
    if not me:
        raise HTTPException(status_code=400, detail="No employee record; contact HR")
    today = dt.date.today().isoformat()
    now = dt.datetime.now(dt.timezone.utc).isoformat()
    try:
        existing = sb.table("attendance").select("id, check_in, check_out").eq("employee_id", me["id"]).eq("work_date", today).maybe_single().execute()
        row = existing.data if existing else None
        if body.action == "check_in":
            if row:
                raise HTTPException(status_code=409, detail="Already checked in today")
            res = sb.table("attendance").insert({"employee_id": me["id"], "work_date": today, "check_in": now, "status": "present", "notes": body.notes}).select("id, work_date, check_in, check_out, status").execute()
            audit("ATTENDANCE_CHECK_IN", "attendance", res.data[0]["id"], user, {"date": today}, client_ip(request))
            return {"today": res.data[0]}
        if not row:
            raise HTTPException(status_code=409, detail="No check-in found for today")
        if row.get("check_out"):
            raise HTTPException(status_code=409, detail="Already checked out today")
        res = sb.table("attendance").update({"check_out": now}).eq("id", row["id"]).select("id, work_date, check_in, check_out, status").execute()
        audit("ATTENDANCE_CHECK_OUT", "attendance", res.data[0]["id"], user, {"date": today}, client_ip(request))
        return {"today": res.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise_db_error(e)


# ---------------------------------------------------------------------------
# Documents
# ---------------------------------------------------------------------------

@router.get("/documents", summary="My visible documents (shared + own + member projects)")
def my_documents(projectId: str | None = None, user: SessionUser = Depends(require_role("employee", "manager"))):
    sb = _sb()
    me = _my_employee(sb, user.id)
    member_ids: list[str] = []
    if me:
        try:
            memberships = sb.table("project_members").select("project_id").eq("employee_id", me["id"]).execute()
            member_ids = [m["project_id"] for m in (memberships.data or [])]
        except Exception as e:
            raise_db_error(e)

    DOC_SELECT = "id, title, category, file_name, file_size_bytes, mime_type, created_at, project:projects (id, name)"
    merged: dict[str, dict] = {}
    try:
        shared = sb.table("documents").select(DOC_SELECT).eq("is_shared_with_staff", True).execute()
        for d in shared.data or []:
            merged[d["id"]] = d
        if me:
            own = sb.table("documents").select(DOC_SELECT).eq("employee_id", me["id"]).execute()
            for d in own.data or []:
                merged[d["id"]] = d
        if member_ids:
            proj = sb.table("documents").select(DOC_SELECT).in_("project_id", member_ids).execute()
            for d in proj.data or []:
                merged[d["id"]] = d
    except Exception as e:
        raise_db_error(e)

    items = list(merged.values())
    if projectId:
        def _proj_id(d: dict):
            p = d.get("project")
            if isinstance(p, list):
                p = p[0] if p else None
            return (p or {}).get("id")
        items = [d for d in items if _proj_id(d) == projectId]
    return items


class DocumentDownload(BaseModel):
    id: str


@router.post("/documents", summary="Signed download URL for a visible document")
def download_document(body: DocumentDownload, request: Request, user: SessionUser = Depends(require_role("employee", "manager"))):
    sb = _sb()
    me = _my_employee(sb, user.id)
    try:
        doc = sb.table("documents").select("id, storage_path, file_name, is_shared_with_staff, employee_id, project_id").eq("id", body.id).maybe_single().execute()
    except Exception as e:
        raise_db_error(e)
    d = doc.data if doc else None
    if not d:
        raise HTTPException(status_code=404, detail="Document not found")

    allowed = d.get("is_shared_with_staff") or (me and d.get("employee_id") == me["id"])
    if not allowed and me and d.get("project_id"):
        try:
            member = sb.table("project_members").select("id").eq("project_id", d["project_id"]).eq("employee_id", me["id"]).maybe_single().execute()
            allowed = bool(member.data)
        except Exception as e:
            raise_db_error(e)
    if not allowed:
        raise HTTPException(status_code=403, detail="Not permitted to access this document")

    svc = service_client()
    if not svc:
        raise HTTPException(status_code=500, detail="Server configuration error")
    try:
        signed = svc.storage.from_("documents").create_signed_url(d["storage_path"], 600)
    except Exception as e:
        raise_db_error(e, "Failed to generate download link")
    return {"downloadUrl": signed["signedURL"] if isinstance(signed, dict) else signed.signedURL, "fileName": d["file_name"], "expiresIn": 600}


# ---------------------------------------------------------------------------
# Profile & notifications
# ---------------------------------------------------------------------------

@router.get("/profile", summary="My profile (or ?view=directory)")
def my_profile(view: str | None = None, user: SessionUser = Depends(require_role("employee", "manager", "hr", "sales"))):
    sb = _sb()
    if view == "directory":
        try:
            res = (
                sb.table("employees")
                .select("id, employee_code, designation, work_model, status, profile:profiles (id, full_name, email, phone), department:departments (name)")
                .in_("status", ["active", "on_leave", "onboarding"]).order("employee_code").execute()
            )
        except Exception as e:
            raise_db_error(e)
        return [
            {
                "id": e["id"], "code": e["employee_code"],
                "name": (e.get("profile") or {}).get("full_name", ""),
                "email": (e.get("profile") or {}).get("email", ""),
                "phone": (e.get("profile") or {}).get("phone"),
                "designation": e["designation"],
                "department": ((e.get("department") or [{}])[0].get("name") if isinstance(e.get("department"), list) else (e.get("department") or {}).get("name")),
                "workModel": e["work_model"], "status": e["status"],
            }
            for e in (res.data or [])
        ]

    me = _my_employee(sb, user.id)
    if not me:
        raise HTTPException(status_code=404, detail="No employee record; contact HR")
    MY_PROFILE_SELECT = (
        "id, employee_code, designation, employment_type, work_model, date_of_joining, status, annual_leave_balance, "
        "profile:profiles!employees_profile_id_fkey (id, email, full_name, phone, avatar_url), "
        "department:departments (id, name), "
        # self-referencing FK: alias form (hint form fails on this PostgREST)
        "manager:employees (id, employee_code, profile:profiles (full_name, email))"
    )
    try:
        res = sb.table("employees").select(MY_PROFILE_SELECT).eq("id", me["id"]).maybe_single().execute()
    except Exception as e:
        raise_db_error(e)
    return res.data


class ProfileUpdate(BaseModel):
    phone: str | None = None
    avatarUrl: str | None = None


@router.patch("/profile", summary="Self-service contact info (phone/avatar only)")
def update_profile(body: ProfileUpdate, request: Request, user: SessionUser = Depends(require_role("employee", "manager", "hr", "sales"))):
    if body.phone is None and body.avatarUrl is None:
        raise HTTPException(status_code=400, detail="Only phone and avatarUrl can be self-updated")
    sb = _sb()
    updates = {"phone": body.phone, "avatar_url": body.avatarUrl}
    updates = {k: v for k, v in updates.items() if v is not None}
    try:
        res = sb.table("profiles").update(updates).eq("id", user.id).select("id, email, full_name, phone, avatar_url").execute()
    except Exception as e:
        raise_db_error(e)
    audit("UPDATE_OWN_PROFILE", "profiles", user.id, user, updates, client_ip(request))
    return res.data[0]


@router.get("/notifications", summary="My notifications")
def notifications(unread: bool = False, user: SessionUser = Depends(require_role("hr", "sales", "manager", "employee", "client"))):
    sb = _sb()
    try:
        query = sb.table("notifications").select("id, title, body, category, link, is_read, created_at").eq("user_id", user.id).order("created_at", desc=True).limit(100)
        if unread:
            query = query.eq("is_read", False)
        res = query.execute()
    except Exception as e:
        raise_db_error(e)
    return res.data or []


class NotificationUpdate(BaseModel):
    id: str | None = None


@router.patch("/notifications", summary="Mark one (id) or all as read")
def mark_notifications(body: NotificationUpdate, user: SessionUser = Depends(require_role("hr", "sales", "manager", "employee", "client"))):
    sb = _sb()
    try:
        query = sb.table("notifications").update({"is_read": True}).eq("user_id", user.id)
        if body.id:
            query = query.eq("id", body.id)
        query.execute()
    except Exception as e:
        raise_db_error(e)
    return {"success": True}
