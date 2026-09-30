"""Project tracking & updates — the multi-party delivery workflow.

Flow: employee → manager · QA → manager · QA → employee · manager → client.
Admin sees every update across all projects.

Visibility rules on each update row:
  - "employee"  → the assigned employee (and their manager) on the project
  - "manager"   → the project manager only (internal)
  - "public"    → client-visible (client sees only these; the rest are internal)
"""
import datetime as dt

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from supabase import Client

from app.core.clients import service_client
from app.core.helpers import audit, notify, raise_db_error
from app.core.security import SessionUser, client_ip, require_role

router = APIRouter(prefix="/tracking", tags=["tracking"])

STAFF_FOR_TRACKING = ("employee", "manager", "qa")


def _sb() -> Client:
    sb = service_client()
    if not sb:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    return sb


def _my_employee_id(sb: Client, profile_id: str) -> str | None:
    res = sb.table("employees").select("id").eq("profile_id", profile_id).maybe_single().execute()
    # postgrest-py 2.31: .maybe_single().execute() returns bare None when no row matches.
    return ((res.data or {}).get("id")) if res else None


def _role_of(sb: Client, profile_id: str) -> str | None:
    res = sb.table("profiles").select("role").eq("id", profile_id).maybe_single().execute()
    return (res.data or {}).get("role") if res else None


def _project_scoped(sb: Client, project_id: str, user: SessionUser) -> dict | None:
    """Return the project row when the caller may participate in it, else None.

    admin → any project; manager → projects they manage; employee/QA → projects
    they are assigned to (member or qa_employee_id); client → their org's projects.
    """
    base = "id, name, code, manager_id, qa_employee_id, organization_id, status"
    try:
        if user.role == "manager":
            my_id = _my_employee_id(sb, user.id)
            if not my_id:
                return None
            res = sb.table("projects").select(base).eq("id", project_id).eq("manager_id", my_id).maybe_single().execute()
            return res.data if res else None

        my_emp = _my_employee_id(sb, user.id)
        res = sb.table("projects").select(base).eq("id", project_id).maybe_single().execute()
        project = res.data if res else None
        if not project:
            return None

        if user.role == "qa":
            return project if project.get("qa_employee_id") and project.get("qa_employee_id") == my_emp else None
        if user.role == "employee":
            if not my_emp:
                return None
            member = (
                sb.table("project_members").select("id")
                .eq("project_id", project_id).eq("employee_id", my_emp).maybe_single().execute()
            )
            return project if member else None
        if user.role == "client":
            org = (
                sb.table("client_contacts").select("organization_id")
                .eq("profile_id", user.id).maybe_single().execute()
            )
            org_id = (org.data or {}).get("organization_id") if org else None
            return project if org_id and project.get("organization_id") == org_id else None
    except Exception as e:
        raise_db_error(e)
    return None


UPDATE_SELECT = (
    "id, project_id, title, body, author_role, visibility, review_status, thread_root_id, "
    "employee_id, manager_acknowledged_at, manager_note, created_at, "
    "author:profiles (id, full_name, email), "
    "employee:employees (id, employee_code, profile:profiles (full_name))"
)


def _visible_for(project: dict, user: SessionUser) -> list[str]:
    if user.role == "admin":
        return ["public", "manager", "employee"]
    if user.role == "manager":
        return ["public", "manager", "employee"]
    if user.role == "client":
        return ["public"]
    if user.role == "qa":
        return ["public", "manager", "employee"]
    return ["public", "employee"]  # assigned employee


def _client_visible_only(rows: list[dict]) -> list[dict]:
    return [r for r in rows if r.get("visibility") == "public"]


@router.get("/projects", summary="Projects I can post tracking updates on (role-scoped)")
def my_projects(user: SessionUser = Depends(require_role(*STAFF_FOR_TRACKING))):
    sb = _sb()
    try:
        if user.role == "manager":
            my_id = _my_employee_id(sb, user.id)
            if not my_id:
                return []
            res = sb.table("projects").select("id, name, code, status, health, progress_percent").eq("manager_id", my_id).order("created_at", desc=True).execute()
            return res.data or []
        if user.role == "qa":
            my_id = _my_employee_id(sb, user.id)
            if not my_id:
                return []
            res = sb.table("projects").select("id, name, code, status, health, progress_percent").eq("qa_employee_id", my_id).order("created_at", desc=True).execute()
            return res.data or []
        # employee → projects they are a member of
        my_id = _my_employee_id(sb, user.id)
        if not my_id:
            return []
        res = (
            sb.table("project_members").select("project:projects (id, name, code, status, health, progress_percent)")
            .eq("employee_id", my_id).execute()
        )
        return [m["project"] for m in (res.data or []) if m.get("project")]
    except Exception as e:
        raise_db_error(e)


@router.get("/projects/{project_id}/updates", summary="Tracking updates for a project (role-filtered)")
def list_updates(project_id: str, user: SessionUser = Depends(require_role(*STAFF_FOR_TRACKING, "client"))):
    sb = _sb()
    project = _project_scoped(sb, project_id, user)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or you are not part of it")
    try:
        res = (
            sb.table("project_updates").select(UPDATE_SELECT)
            .eq("project_id", project_id).order("created_at", desc=True).limit(300).execute()
        )
    except Exception as e:
        raise_db_error(e)
    rows = res.data or []
    if user.role == "client":
        return _client_visible_only(rows)
    allowed = _visible_for(project, user)
    # Staff always see their own posts (an employee's manager-directed update,
    # a QA's manager-directed note) plus everything visible to their role.
    return [
        r for r in rows
        if (r.get("visibility") or "manager") in allowed or (r.get("author") or {}).get("id") == user.id
    ]


@router.get("/projects/{project_id}/members", summary="Project members (for update targeting)")
def project_members(project_id: str, user: SessionUser = Depends(require_role(*STAFF_FOR_TRACKING))):
    sb = _sb()
    project = _project_scoped(sb, project_id, user)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or you are not part of it")
    try:
        res = sb.table("project_members").select(
            "id, employee:employees (id, employee_code, profile:profiles (full_name))"
        ).eq("project_id", project_id).execute()
    except Exception as e:
        raise_db_error(e)
    return res.data or []


class UpdateCreate(BaseModel):
    projectId: str
    title: str
    body: str | None = None
    visibility: str = "manager"       # public | manager | employee
    employeeId: str | None = None     # QA posting about a specific employee
    threadRootId: str | None = None   # reply into an existing thread


@router.post("/projects/{project_id}/updates", status_code=201, summary="Post a tracking update (employee/QA/manager)")
def create_update(project_id: str, body: UpdateCreate, request: Request, user: SessionUser = Depends(require_role(*STAFF_FOR_TRACKING))):
    if body.visibility not in ("public", "manager", "employee"):
        raise HTTPException(status_code=400, detail="visibility must be public, manager, or employee")
    if not body.title.strip():
        raise HTTPException(status_code=422, detail="A title is required")

    # Role rules (input-level, before any DB access):
    #   manager → any visibility (public = ships to the client)
    #   qa      → manager/employee (the manager publishes to the client)
    #   employee→ manager only (progress reports upward)
    if user.role == "employee" and body.visibility != "manager":
        raise HTTPException(status_code=403, detail="Employees post updates to their manager only")
    if user.role == "qa" and body.visibility == "public":
        raise HTTPException(status_code=403, detail="QA updates go to the manager; the manager publishes to the client")

    sb = _sb()
    project = _project_scoped(sb, project_id, user)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or you are not part of it")

    employee_id = None
    if body.visibility == "employee":
        if user.role == "qa":
            employee_id = body.employeeId or _my_employee_id(sb, user.id)
            if not employee_id:
                raise HTTPException(status_code=400, detail="employeeId is required when QA posts to an employee")
            member = (
                sb.table("project_members").select("id")
                .eq("project_id", project_id).eq("employee_id", employee_id).maybe_single().execute()
            )
            if not member:
                raise HTTPException(status_code=404, detail="That employee is not on this project")
        else:
            employee_id = _my_employee_id(sb, user.id)

    if body.threadRootId:
        try:
            root = (
                sb.table("project_updates").select("id, thread_root_id")
                .eq("id", body.threadRootId).eq("project_id", project_id).maybe_single().execute()
            )
        except Exception as e:
            raise_db_error(e)
        root_row = root.data if root else None
        if not root_row:
            raise HTTPException(status_code=404, detail="Thread root not found on this project")

    payload = {
        "project_id": project_id,
        "author_id": user.id,
        "author_role": user.role,
        "title": body.title.strip(),
        "body": body.body,
        "visibility": body.visibility,
        "review_status": "open",
        "thread_root_id": body.threadRootId,
        "employee_id": employee_id,
    }
    try:
        sb.table("project_updates").insert(payload).execute()
    except Exception as e:
        raise_db_error(e, "Failed to post update")

    # In-app notifications along the workflow edges
    try:
        if body.visibility == "manager" and project.get("manager_id"):
            mgr = sb.table("employees").select("profile_id").eq("id", project["manager_id"]).maybe_single().execute()
            if (mgr.data or {}).get("profile_id"):
                notify(
                    mgr.data["profile_id"], f"New {user.role} update: {payload['title']}",
                    f"{user.full_name or user.email} posted on {project['name']}.", "project", "/manager/projects",
                )
        elif body.visibility == "employee" and employee_id:
            emp = sb.table("employees").select("profile_id").eq("id", employee_id).maybe_single().execute()
            if (emp.data or {}).get("profile_id"):
                notify(
                    emp.data["profile_id"], f"QA note for you: {payload['title']}",
                    f"{user.full_name or user.email} on {project['name']}.", "project", "/employee/tasks",
                )
        elif body.visibility == "public" and project.get("organization_id"):
            contacts = (
                sb.table("client_contacts").select("profile_id")
                .eq("organization_id", project["organization_id"]).not_.is_("profile_id", "null").execute()
            )
            for c in contacts.data or []:
                notify(c["profile_id"], f"Project update: {payload['title']}", project["name"], "project", "/client/projects")
    except Exception:
        pass  # notifications are best-effort; the update itself is persisted

    audit("POST_TRACKING_UPDATE", "project_updates", project_id, user,
          {"visibility": body.visibility, "role": user.role}, client_ip(request))
    return {"success": True}


class ManagerReview(BaseModel):
    updateId: str
    note: str | None = None
    resolve: bool = False


@router.patch("/updates/review", summary="Manager acknowledges / resolves a team update (manager)")
def review_update(body: ManagerReview, request: Request, user: SessionUser = Depends(require_role("manager"))):
    sb = _sb()
    try:
        row = sb.table("project_updates").select("id, project_id, visibility, author_id").eq("id", body.updateId).maybe_single().execute()
    except Exception as e:
        raise_db_error(e)
    update = row.data if row else None
    if not update:
        raise HTTPException(status_code=404, detail="Update not found")

    project = _project_scoped(sb, update["project_id"], user)
    if not project:
        raise HTTPException(status_code=403, detail="Not your project")

    updates: dict = {"manager_acknowledged_at": dt.datetime.now(dt.timezone.utc).isoformat()}
    if body.note:
        updates["manager_note"] = body.note
    if body.resolve:
        updates["review_status"] = "resolved"

    try:
        sb.table("project_updates").update(updates).eq("id", body.updateId).execute()
    except Exception as e:
        raise_db_error(e, "Failed to review update")

    # Close the loop: tell the author their update was acknowledged
    if update.get("author_id") and update["author_id"] != user.id:
        notify(update["author_id"], "Manager reviewed your update",
               f"\"{body.note or 'Acknowledged'}\" on {project['name']}.", "project", None)
    audit("REVIEW_TRACKING_UPDATE", "project_updates", body.updateId, user, {"resolve": body.resolve}, client_ip(request))
    return {"success": True}


@router.get("/summary", summary="Admin: tracking activity across all projects")
def summary(user: SessionUser = Depends(require_role())):
    sb = _sb()
    try:
        rows = (
            sb.table("project_updates").select(UPDATE_SELECT + ", project:projects (id, name, code)")
            .order("created_at", desc=True).limit(200).execute()
        )
    except Exception as e:
        raise_db_error(e)
    data = rows.data or []
    by_role: dict[str, int] = {}
    open_count = 0
    for r in data:
        by_role[r.get("author_role") or "manager"] = by_role.get(r.get("author_role") or "manager", 0) + 1
        if (r.get("review_status") or "open") == "open":
            open_count += 1
    return {"total": len(data), "openCount": open_count, "byRole": by_role, "recent": data[:50]}
