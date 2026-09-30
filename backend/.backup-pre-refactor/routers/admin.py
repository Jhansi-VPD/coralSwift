"""Admin router — org-wide KPIs, enquiry assignment workflow, applications, audit."""
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from app.core.clients import service_client
from app.core.helpers import audit, raise_db_error
from app.core.security import SessionUser, client_ip, get_session_user, require_role

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _sum(rows: list[dict], key: str) -> float:
    return float(sum(float(r.get(key) or 0) for r in rows))


def _count_by(rows: list[dict], key: str) -> dict[str, int]:
    out: dict[str, int] = {}
    for r in rows:
        k = str(r.get(key))
        out[k] = out.get(k, 0) + 1
    return out


@router.get("/stats", summary="Organization-wide KPIs (dashboard)")
def stats(user: SessionUser = Depends(require_role())):
    sb = service_client()
    if not sb:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    today = __import__("datetime").date.today().isoformat()
    try:
        enquiries = sb.table("enquiries").select("id,status,created_at").execute().data or []
        leads = sb.table("leads").select("id,stage,estimated_value").execute().data or []
        orgs = sb.table("client_organizations").select("id").eq("status", "active").execute().data or []
        projects = sb.table("projects").select("id,status,health,progress_percent,client_review_status").execute().data or []
        employees = sb.table("employees").select("id,status").execute().data or []
        attendance = sb.table("attendance").select("id,status").gte("work_date", today).execute().data or []
        leave_pending = sb.table("leave_requests").select("id").eq("status", "pending").execute().data or []
        invoices = sb.table("invoices").select("id,status,amount").execute().data or []
        tickets = sb.table("tickets").select("id,status").execute().data or []
        activity = (
            sb.table("audit_logs").select("id,action,entity_type,user_email,created_at")
            .order("created_at", desc=True).limit(8).execute().data or []
        )
    except Exception as e:
        raise_db_error(e, "Failed to aggregate statistics")

    open_leads = [l for l in leads if l["stage"] not in ("won", "lost")]
    won = [l for l in leads if l["stage"] == "won"]
    valid_invoices = [i for i in invoices if i["status"] not in ("draft", "cancelled")]

    return {
        "business": {
            "totalEnquiries": len(enquiries),
            "newEnquiries": sum(1 for e in enquiries if e["status"] == "new"),
            "activeClients": len(orgs),
            "activeProjects": sum(1 for p in projects if p["status"] == "active"),
            "completedProjects": sum(1 for p in projects if p["status"] == "completed"),
        },
        "sales": {
            "byStage": _count_by(leads, "stage"),
            "openLeads": len(open_leads),
            "wonLeads": len(won),
            "wonValue": _sum(won, "estimated_value"),
            "pipelineValue": _sum(open_leads, "estimated_value"),
        },
        "projects": {
            "byStatus": _count_by(projects, "status"),
            "byHealth": _count_by(projects, "health"),
            "awaitingReview": sum(1 for p in projects if p["client_review_status"] == "submitted"),
            "changesRequested": sum(1 for p in projects if p["client_review_status"] == "changes_requested"),
            "avgProgress": round(sum(int(p.get("progress_percent") or 0) for p in projects) / len(projects)) if projects else 0,
        },
        "employees": {
            "total": len(employees),
            "active": sum(1 for e in employees if e["status"] == "active"),
            "byStatus": _count_by(employees, "status"),
            "attendanceToday": _count_by(attendance, "status"),
            "onLeaveToday": sum(1 for a in attendance if a["status"] == "leave"),
        },
        "finance": {
            "invoiceCount": len(invoices),
            "byStatus": _count_by(invoices, "status"),
            "invoiced": _sum(valid_invoices, "amount"),
            "paid": _sum([i for i in invoices if i["status"] == "paid"], "amount"),
            "outstanding": _sum([i for i in invoices if i["status"] in ("sent", "overdue")], "amount"),
        },
        "support": _count_by(tickets, "status"),
        "leavePending": len(leave_pending),
        "recentActivity": activity,
    }


# ---------------------------------------------------------------------------
# Enquiries — list / detail / assign / transitions
# ---------------------------------------------------------------------------

ENQUIRY_SELECT = (
    "id, full_name, email, company, phone, service_interest, message, consent, source_page, "
    "status, admin_notes, created_at, assigned_to, assigned_at, follow_up_at, meeting_at, meeting_link, "
    "assignee:profiles!enquiries_assigned_to_fkey (id, full_name, email, role)"
)

VALID_ENQUIRY_STATUSES = {
    "new", "under_review", "assigned_to_sales", "sales_review",
    "accepted", "rejected", "in_review", "contacted", "qualified", "closed",
}


@router.get("/enquiries", summary="List enquiries (search/filter/paginate)")
def list_enquiries(
    status: str | None = None,
    q: str | None = None,
    page: int = 1,
    pageSize: int = 25,
    user: SessionUser = Depends(require_role()),
):
    sb = service_client()
    if not sb:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    page, pageSize = max(1, page), min(100, max(5, pageSize))

    try:
        query = sb.table("enquiries").select(ENQUIRY_SELECT, count="exact")
        if status and status != "all":
            query = query.eq("status", status)
        if q:
            query = query.or_(f"full_name.ilike.%{q}%,company.ilike.%{q}%,email.ilike.%{q}%,message.ilike.%{q}%")
        start = (page - 1) * pageSize
        res = query.order("created_at", desc=True).range(start, start + pageSize - 1).execute()
    except Exception as e:
        raise_db_error(e, "Failed to list enquiries")

    total = getattr(res, "count", 0) or 0
    return {
        "items": res.data or [],
        "page": page,
        "pageSize": pageSize,
        "total": total,
        "totalPages": max(1, -(-total // pageSize)),
    }


class EnquiryPatch(BaseModel):
    status: str | None = None
    assignTo: str | None = None
    notes: str | None = None
    followUpAt: str | None = None
    meetingAt: str | None = None
    meetingLink: str | None = None
    decisionNotes: str | None = None


@router.patch("/enquiries/{enquiry_id}", summary="Enquiry workflow: assign / transition / notes")
def patch_enquiry(enquiry_id: str, body: EnquiryPatch, request: Request, user: SessionUser = Depends(require_role())):
    sb = service_client()
    if not sb:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    try:
        row = sb.table("enquiries").select("id,status,assigned_to,full_name,company,email").eq("id", enquiry_id).maybe_single().execute()
    except Exception as e:
        raise_db_error(e)
    enquiry = row.data if row else None
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")

    updates: dict = {}
    note = body.notes

    if body.assignTo is not None:
        try:
            target = sb.table("profiles").select("id,role,full_name").eq("id", body.assignTo).maybe_single().execute()
        except Exception as e:
            raise_db_error(e)
        t = target.data if target else None
        if not t or t.get("role") not in ("sales", "admin"):
            raise HTTPException(status_code=400, detail="Enquiries can only be assigned to sales users")
        updates |= {
            "assigned_to": body.assignTo,
            "assigned_by": user.id,
            "assigned_at": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
            "status": "assigned_to_sales",
        }
        from app.core.helpers import notify
        notify(body.assignTo, "New enquiry assigned", f"{enquiry['full_name']} ({enquiry['company']}) assigned by {user.full_name or 'admin'}.", "general", "/sales/enquiries")
        note = f"Assigned to {t.get('full_name') or t.get('role')}"

    if body.status:
        if body.status not in VALID_ENQUIRY_STATUSES:
            raise HTTPException(status_code=400, detail=f"Invalid status '{body.status}'")
        if body.status == "rejected" and not (body.decisionNotes or body.notes):
            raise HTTPException(status_code=422, detail="A rejection reason is required")
        if body.status == "accepted":
            try:
                lead = sb.table("leads").insert({
                    "company_name": enquiry["company"] or enquiry["full_name"],
                    "contact_name": enquiry["full_name"],
                    "contact_email": enquiry["email"],
                    "source": "admin_enquiry",
                    "stage": "qualified",
                    "owner_id": enquiry.get("assigned_to") or user.id,
                }).select("id").execute()
                if lead.data:
                    updates["converted_lead_id"] = lead.data[0]["id"]
            except Exception as e:
                raise_db_error(e, "Failed to create lead from enquiry")
        updates["status"] = body.status
        try:
            sb.table("enquiry_status_history").insert({
                "enquiry_id": enquiry_id,
                "from_status": enquiry["status"],
                "to_status": body.status,
                "changed_by": user.id,
                "note": body.decisionNotes or body.notes,
            }).execute()
        except Exception as e:
            raise_db_error(e, "Failed to record transition")

    if body.notes is not None and not body.status and body.assignTo is None:
        updates["admin_notes"] = body.notes
    if body.followUpAt is not None:
        updates["follow_up_at"] = body.followUpAt or None
    if body.meetingAt is not None:
        updates["meeting_at"] = body.meetingAt or None
    if body.meetingLink is not None:
        updates["meeting_link"] = body.meetingLink or None

    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update")

    try:
        res = sb.table("enquiries").update(updates).eq("id", enquiry_id).select(ENQUIRY_SELECT).execute()
    except Exception as e:
        raise_db_error(e, "Failed to update enquiry")

    audit("ENQUIRY_UPDATE", "enquiries", enquiry_id, user, {**updates, "note": note}, client_ip(request))
    return res.data[0]


@router.get("/enquiries/{enquiry_id}", summary="Enquiry detail + status history")
def enquiry_detail(enquiry_id: str, user: SessionUser = Depends(require_role())):
    sb = service_client()
    if not sb:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    try:
        res = sb.table("enquiries").select(ENQUIRY_SELECT).eq("id", enquiry_id).maybe_single().execute()
        history = (
            sb.table("enquiry_status_history")
            .select("id, from_status, to_status, note, created_at, changed_by:profiles (full_name, role)")
            .eq("enquiry_id", enquiry_id).order("created_at").execute()
        )
    except Exception as e:
        raise_db_error(e)
    if not res.data:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    return {"enquiry": res.data, "history": history.data or []}


@router.delete("/enquiries/{enquiry_id}", summary="Delete enquiry (admin)")
def delete_enquiry(enquiry_id: str, request: Request, user: SessionUser = Depends(require_role())):
    sb = service_client()
    try:
        sb.table("enquiries").delete().eq("id", enquiry_id).execute()
    except Exception as e:
        raise_db_error(e)
    audit("DELETE_ENQUIRY", "enquiries", enquiry_id, user, ip=client_ip(request))
    return {"success": True}


# ---------------------------------------------------------------------------
# Applications & audit logs
# ---------------------------------------------------------------------------

@router.get("/applications", summary="List job applications")
def list_applications(user: SessionUser = Depends(require_role())):
    sb = service_client()
    try:
        res = (
            sb.table("applications").select("*, jobs:jobs(title)")
            .order("created_at", desc=True).execute()
        )
    except Exception as e:
        raise_db_error(e)
    return [
        {**a, "job_title": (a.get("jobs") or {}).get("title") or "Engineering Position"}
        for a in (res.data or [])
    ]


class ApplicationPatch(BaseModel):
    id: str
    status: str
    notes: str | None = None


@router.patch("/applications", summary="Update application status")
def patch_application(body: ApplicationPatch, request: Request, user: SessionUser = Depends(require_role())):
    sb = service_client()
    try:
        sb.table("applications").update({
            "status": body.status,
            "admin_notes": body.notes,
            "updated_at": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
        }).eq("id", body.id).execute()
    except Exception as e:
        raise_db_error(e, "Failed to update application")
    audit("UPDATE_APPLICATION", "applications", body.id, user, {"status": body.status}, client_ip(request))
    return {"success": True}


@router.get("/audit-logs", summary="Recent audit logs")
def audit_logs(limit: int = 50, user: SessionUser = Depends(require_role("admin"))):
    sb = service_client()
    try:
        res = (
            sb.table("audit_logs").select("*")
            .order("created_at", desc=True).limit(min(200, max(1, limit))).execute()
        )
    except Exception as e:
        raise_db_error(e)
    return res.data or []


@router.delete("/applications/{application_id}", summary="Delete a job application (admin)")
def delete_application(application_id: str, request: Request, user: SessionUser = Depends(require_role())):
    sb = service_client()
    try:
        sb.table("applications").delete().eq("id", application_id).execute()
    except Exception as e:
        raise_db_error(e)
    audit("DELETE_APPLICATION", "applications", application_id, user, ip=client_ip(request))
    return {"success": True}


# ---------------------------------------------------------------------------
# Site settings + session echo (legacy admin surface)
# ---------------------------------------------------------------------------

@router.get("/me", summary="Current admin session echo")
def admin_me(user: SessionUser = Depends(get_session_user)):
    return {"email": user.email, "role": user.role, "fullName": user.full_name}


@router.get("/settings", summary="Site settings as a key→value map")
def get_settings_map(user: SessionUser = Depends(require_role())):
    sb = service_client()
    if not sb:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    try:
        res = sb.table("site_settings").select("key, value").execute()
    except Exception:
        res = None
    settings_map = {row["key"]: row["value"] for row in (res.data or [])} if res else {}
    if not settings_map:
        from app.core.rbac import INITIAL_SITE_SETTINGS
        settings_map = dict(INITIAL_SITE_SETTINGS)
    return settings_map


class SettingUpdate(BaseModel):
    key: str
    value: object = None


@router.put("/settings", summary="Upsert one site setting")
def put_setting(body: SettingUpdate, request: Request, user: SessionUser = Depends(require_role())):
    sb = service_client()
    if not sb:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    now = __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat()
    try:
        sb.table("site_settings").upsert(
            {"key": body.key, "value": body.value, "updated_at": now},
            on_conflict="key",
        ).execute()
    except Exception as e:
        raise_db_error(e, "Failed to update settings")
    audit("UPDATE_SITE_SETTINGS", "site_settings", body.key, user, {"value": body.value}, client_ip(request))
    return {"success": True}
