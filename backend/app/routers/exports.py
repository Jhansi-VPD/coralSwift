"""Exports — CSV downloads for every major table + calendar sync.

CSV: /api/exports/{resource}.csv — role-gated, streams text/csv with a
Content-Disposition filename. Frontend download buttons hit these directly.

Calendar: /api/exports/calendar.ics aggregates the signed-in user's leave,
sales follow-ups/meetings (enquiries), and project milestones into one iCalendar
feed; /api/exports/calendar/google-links returns Google Calendar template URLs.
"""
import csv
import datetime as dt
import io
import urllib.parse

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse

from app.core.clients import service_client
from app.core.helpers import audit, raise_db_error
from app.core.security import SessionUser, client_ip, get_session_user, require_role

router = APIRouter(prefix="/exports", tags=["exports"])


def _sb():
    sb = service_client()
    if not sb:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    return sb


def _csv_response(rows: list[dict], filename: str) -> StreamingResponse:
    if not rows:
        rows = [{"info": "no data"}]
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=list(rows[0].keys()), extrasaction="ignore")
    writer.writeheader()
    for r in rows:
        # Flatten nested embeds like {"profile": {"full_name": "X"}} → profile.full_name
        flat: dict = {}
        for k, v in r.items():
            if isinstance(v, dict):
                for k2, v2 in v.items():
                    if not isinstance(v2, (dict, list)):
                        flat[f"{k}.{k2}"] = v2
            elif not isinstance(v, list):
                flat[k] = v
        writer.writerow(flat)
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _audit_export(resource: str, user: SessionUser, request: Request) -> None:
    audit("EXPORT_CSV", resource, None, user, ip=client_ip(request))


# --------------------------------------------------------------------------
# HR exports (hr/admin)
# --------------------------------------------------------------------------

@router.get("/attendance", summary="Attendance CSV (hr/admin)")
def export_attendance(request: Request, user: SessionUser = Depends(require_role("hr"))):
    sb = _sb()
    try:
        res = (
            sb.table("attendance").select(
                "work_date, check_in, check_out, status, notes, "
                "employee:employees!attendance_employee_id_fkey (employee_code, profile:profiles (full_name))"
            ).order("work_date", desc=True).limit(5000).execute()
        )
    except Exception as e:
        raise_db_error(e)
    _audit_export("attendance", user, request)
    return _csv_response(res.data or [], "attendance.csv")


@router.get("/leave", summary="Leave requests CSV (hr/admin)")
def export_leave(request: Request, user: SessionUser = Depends(require_role("hr"))):
    sb = _sb()
    try:
        res = (
            sb.table("leave_requests").select(
                "leave_type, start_date, end_date, status, reason, review_notes, created_at, reviewed_at, "
                "employee:employees!leave_requests_employee_id_fkey (employee_code, profile:profiles (full_name))"
            ).order("created_at", desc=True).limit(5000).execute()
        )
    except Exception as e:
        raise_db_error(e)
    _audit_export("leave", user, request)
    return _csv_response(res.data or [], "leave_requests.csv")


# --------------------------------------------------------------------------
# Sales exports (sales/admin)
# --------------------------------------------------------------------------

@router.get("/leads", summary="Leads pipeline CSV (sales/admin)")
def export_leads(request: Request, user: SessionUser = Depends(require_role("sales"))):
    sb = _sb()
    try:
        res = (
            sb.table("leads").select(
                "company_name, contact_name, contact_email, contact_phone, service_interest, source, "
                "estimated_value, stage, loss_reason, created_at, "
                "owner:profiles!leads_owner_id_fkey (full_name)"
            ).order("created_at", desc=True).limit(5000).execute()
        )
    except Exception as e:
        raise_db_error(e)
    _audit_export("leads", user, request)
    return _csv_response(res.data or [], "leads.csv")


# --------------------------------------------------------------------------
# Finance exports (admin/sales — invoices are org-scoped for clients)
# --------------------------------------------------------------------------

@router.get("/invoices", summary="Invoices CSV (staff)")
def export_invoices(request: Request, user: SessionUser = Depends(get_session_user)):
    sb = _sb()
    try:
        query = sb.table("invoices").select(
            "invoice_number, issue_date, due_date, amount, currency, status, paid_at, notes, "
            "organization:client_organizations (name), project:projects (name, code)"
        )
        if user.role == "client":
            org = sb.table("client_contacts").select("organization_id").eq("profile_id", user.id).maybe_single().execute()
            org_id = (org.data or {}).get("organization_id") if org else None
            if not org_id:
                return _csv_response([], "invoices.csv")
            query = query.eq("organization_id", org_id)
        res = query.order("issue_date", desc=True).limit(5000).execute()
    except Exception as e:
        raise_db_error(e)
    _audit_export("invoices", user, request)
    return _csv_response(res.data or [], "invoices.csv")


# --------------------------------------------------------------------------
# Delivery / people exports (manager/admin)
# --------------------------------------------------------------------------

@router.get("/projects", summary="Projects CSV (staff)")
def export_projects(request: Request, user: SessionUser = Depends(get_session_user)):
    if user.role == "client":
        raise HTTPException(status_code=403, detail="Not available for client accounts")
    sb = _sb()
    try:
        res = (
            sb.table("projects").select(
                "name, code, status, health, progress_percent, client_review_status, start_date, target_end_date, budget, "
                "organization:client_organizations (name), "
                "manager:employees!projects_manager_id_fkey (employee_code, profile:profiles (full_name))"
            ).order("created_at", desc=True).limit(5000).execute()
        )
    except Exception as e:
        raise_db_error(e)
    _audit_export("projects", user, request)
    return _csv_response(res.data or [], "projects.csv")


@router.get("/employees", summary="Employee directory CSV (hr/admin)")
def export_employees(request: Request, user: SessionUser = Depends(require_role("hr"))):
    sb = _sb()
    try:
        res = (
            sb.table("employees").select(
                "employee_code, designation, employment_type, work_model, date_of_joining, status, annual_leave_balance, "
                "profile:profiles (full_name, email, role), department:departments (name)"
            ).order("employee_code").limit(5000).execute()
        )
    except Exception as e:
        raise_db_error(e)
    _audit_export("employees", user, request)
    return _csv_response(res.data or [], "employees.csv")


@router.get("/timesheets", summary="Timesheets CSV (hr/admin)")
def export_timesheets(request: Request, user: SessionUser = Depends(require_role("hr"))):
    sb = _sb()
    try:
        res = (
            sb.table("timesheets").select(
                "work_date, hours, notes, status, reviewed_at, review_notes, "
                "employee:employees!timesheets_employee_id_fkey (employee_code, profile:profiles (full_name)), "
                "project:projects (name, code)"
            ).order("work_date", desc=True).limit(5000).execute()
        )
    except Exception as e:
        raise_db_error(e)
    _audit_export("timesheets", user, request)
    return _csv_response(res.data or [], "timesheets.csv")


@router.get("/tickets", summary="Support tickets CSV (staff)")
def export_tickets(request: Request, user: SessionUser = Depends(get_session_user)):
    if user.role == "client":
        raise HTTPException(status_code=403, detail="Not available for client accounts")
    sb = _sb()
    try:
        res = (
            sb.table("tickets").select(
                "ticket_number, title, priority, status, created_at, resolved_at, "
                "organization:client_organizations (name), "
                "assignee:employees!tickets_assigned_employee_id_fkey (employee_code, profile:profiles (full_name))"
            ).order("created_at", desc=True).limit(5000).execute()
        )
    except Exception as e:
        raise_db_error(e)
    _audit_export("tickets", user, request)
    return _csv_response(res.data or [], "tickets.csv")


# --------------------------------------------------------------------------
# Calendar sync (.ics + Google Calendar links)
# --------------------------------------------------------------------------

def _ics_escape(text: str) -> str:
    return text.replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,").replace("\n", "\\n")


def _ics_dt(moment: str) -> str:
    return dt.datetime.fromisoformat(moment.replace("Z", "+00:00")).strftime("%Y%m%dT%H%M%SZ")


def _all_day(day: str) -> tuple[str, str]:
    d = dt.date.fromisoformat(day)
    return d.strftime("%Y%m%d"), (d + dt.timedelta(days=1)).strftime("%Y%m%d")


@router.get("/calendar.ics", summary="Personal calendar feed (.ics): leave, follow-ups, meetings, milestones")
def calendar_ics(user: SessionUser = Depends(get_session_user)):
    sb = _sb()
    events: list[str] = []

    def add(uid: str, title: str, start: str, end: str, desc: str, location: str | None = None) -> None:
        events.append(
            "BEGIN:VEVENT\r\n"
            f"UID:{uid}\r\n"
            f"DTSTAMP:{dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%SZ')}\r\n"
            f"DTSTART:{start}\r\n"
            f"DTEND:{end}\r\n"
            f"SUMMARY:{_ics_escape(title)}\r\n"
            f"DESCRIPTION:{_ics_escape(desc)}\r\n"
            + (f"LOCATION:{_ics_escape(location)}\r\n" if location else "")
            + "END:VEVENT\r\n"
        )

    try:
        # Approved leave (own, for staff with an employee record)
        my_emp = sb.table("employees").select("id").eq("profile_id", user.id).maybe_single().execute()
        emp_id = ((my_emp.data or {}).get("id")) if my_emp else None
        if emp_id:
            lv = (
                sb.table("leave_requests").select("id, leave_type, start_date, end_date, status")
                .eq("employee_id", emp_id).eq("status", "approved").execute()
            )
            for l in lv.data or []:
                start, end = _all_day(l["start_date"])
                add(f"leave-{l['id']}@coralswift", f"Leave ({l['leave_type']})", start, end, "Approved leave")

        # Sales: follow-ups & meetings on my enquiries
        if user.role in ("sales", "admin"):
            enq = (
                sb.table("enquiries").select("id, full_name, company, follow_up_at, meeting_at, meeting_link")
                .or_(f"assigned_to.eq.{user.id},assigned_to.is.null").execute()
            )
            for e in enq.data or []:
                who = f"{e['full_name']} ({e['company']})"
                if e.get("follow_up_at"):
                    t = _ics_dt(e["follow_up_at"])
                    add(f"followup-{e['id']}@coralswift", f"Follow-up: {who}", t, t, "Sales follow-up")
                if e.get("meeting_at"):
                    t = _ics_dt(e["meeting_at"])
                    add(f"meeting-{e['id']}@coralswift", f"Meeting: {who}", t, t, e.get("meeting_link") or "Sales meeting",
                        location=e.get("meeting_link"))

        # Milestones on projects I manage, QA, or am a member of
        if emp_id:
            managed = sb.table("projects").select("id, name").eq("manager_id", emp_id).execute()
            qa = sb.table("projects").select("id, name").eq("qa_employee_id", emp_id).execute()
            member = (
                sb.table("project_members").select("project:projects (id, name)")
                .eq("employee_id", emp_id).execute()
            )
            project_ids: dict[str, str] = {}
            for p in (managed.data or []) + (qa.data or []):
                project_ids[p["id"]] = p["name"]
            for m in member or []:
                p = (m.get("project") or {}) if isinstance(m, dict) else {}
                if isinstance(p, dict) and p.get("id"):
                    project_ids[p["id"]] = p["name"]
            if project_ids:
                ms = (
                    sb.table("milestones").select("id, title, due_date, project_id")
                    .in_("project_id", list(project_ids.keys())).not_.is_("due_date", "null").execute()
                )
                for m in ms.data or []:
                    start, end = _all_day(m["due_date"])
                    add(f"milestone-{m['id']}@coralswift", f"Milestone: {m['title']}", start, end,
                        f"Project: {project_ids.get(m['project_id'], '')}")
    except Exception as e:
        raise_db_error(e, "Failed to build calendar")

    body = (
        "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//CoralSwift//EN\r\nCALSCALE:GREGORIAN\r\n"
        + "".join(events)
        + "END:VCALENDAR\r\n"
    )
    return StreamingResponse(
        iter([body]),
        media_type="text/calendar",
        headers={"Content-Disposition": 'attachment; filename="coralswift-calendar.ics"'},
    )


@router.get("/calendar/google-links", summary="Google Calendar one-click links for upcoming items")
def google_links(user: SessionUser = Depends(get_session_user)):
    sb = _sb()
    links: list[dict] = []

    def glink(title: str, start: str, details: str) -> dict:
        s = dt.datetime.fromisoformat(start.replace("Z", "+00:00"))
        e = s + dt.timedelta(hours=1)
        fmt = "%Y%m%dT%H%M%SZ"
        params = urllib.parse.urlencode({
            "action": "TEMPLATE", "text": title, "dates": f"{s.strftime(fmt)}/{e.strftime(fmt)}", "details": details,
        })
        return {"title": title, "start": start, "url": f"https://calendar.google.com/calendar/render?{params}"}

    try:
        if user.role in ("sales", "admin"):
            enq = (
                sb.table("enquiries").select("id, full_name, company, follow_up_at, meeting_at, meeting_link")
                .or_(f"assigned_to.eq.{user.id},assigned_to.is.null").execute()
            )
            for e in enq.data or []:
                who = f"{e['full_name']} ({e['company']})"
                if e.get("follow_up_at"):
                    links.append(glink(f"Follow-up: {who}", e["follow_up_at"], "Sales follow-up"))
                if e.get("meeting_at"):
                    links.append(glink(f"Meeting: {who}", e["meeting_at"], e.get("meeting_link") or "Sales meeting"))

        my_emp = sb.table("employees").select("id").eq("profile_id", user.id).maybe_single().execute()
        emp_id = ((my_emp.data or {}).get("id")) if my_emp else None
        if emp_id:
            managed = sb.table("projects").select("id, name").eq("manager_id", emp_id).execute()
            ids = [p["id"] for p in (managed.data or [])]
            if ids:
                ms = (
                    sb.table("milestones").select("id, title, due_date, project_id")
                    .in_("project_id", ids).not_.is_("due_date", "null").execute()
                )
                names = {p["id"]: p["name"] for p in (managed.data or [])}
                for m in ms.data or []:
                    d = dt.date.fromisoformat(m["due_date"])
                    fmt = "%Y%m%d"
                    params = urllib.parse.urlencode({
                        "action": "TEMPLATE", "text": f"Milestone: {m['title']}",
                        "dates": f"{d.strftime(fmt)}/{(d + dt.timedelta(days=1)).strftime(fmt)}",
                        "details": f"Project: {names.get(m['project_id'], '')}",
                    })
                    links.append({
                        "title": f"Milestone: {m['title']}", "start": m["due_date"],
                        "url": f"https://calendar.google.com/calendar/render?{params}",
                    })
    except Exception as e:
        raise_db_error(e, "Failed to build calendar links")

    return links
