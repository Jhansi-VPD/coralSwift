"""Client router — org-scoped portal: overview, project review, tickets, documents."""
import datetime as dt

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from supabase import Client

from app.core.clients import service_client
from app.core.helpers import audit, notify, raise_db_error
from app.core.security import SessionUser, client_ip, require_role

router = APIRouter(prefix="/client", tags=["client"])


def _sb() -> Client:
    sb = service_client()
    if not sb:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    return sb


def _org_id(sb, profile_id: str) -> str | None:
    res = sb.table("client_contacts").select("organization_id").eq("profile_id", profile_id).maybe_single().execute()
    return (res.data or {}).get("organization_id")


def _require_org(sb, user: SessionUser) -> str:
    org = _org_id(sb, user.id)
    if not org:
        raise HTTPException(status_code=403, detail="No client organization linked to this account")
    return org


# ---------------------------------------------------------------------------
# Overview
# ---------------------------------------------------------------------------

@router.get("/overview", summary="Portal landing data (org, projects, invoices, contracts)")
def overview(user: SessionUser = Depends(require_role("client"))):
    sb = _sb()
    org_id = _require_org(sb, user.id)
    try:
        org = sb.table("client_organizations").select(
            "id, name, industry, status, account_owner:profiles (full_name, email)"
        ).eq("id", org_id).maybe_single().execute()
        projects = sb.table("projects").select(
            "id, name, code, description, status, health, progress_percent, client_review_status, "
            "submitted_for_review_at, start_date, target_end_date, expected_completion_date, "
            "manager:employees (employee_code, profile:profiles (full_name)), "
            "milestones:milestones (id, title, due_date, status, sort_order), "
            "documents:documents (id, title, category, file_name, created_at)"
        ).eq("organization_id", org_id).in_("status", ["planning", "active", "on_hold"]).order("created_at", desc=True).execute()
        invoices = sb.table("invoices").select(
            "id, invoice_number, issue_date, due_date, amount, currency, status, paid_at"
        ).eq("organization_id", org_id).order("issue_date", desc=True).limit(24).execute()
        contracts = sb.table("contracts").select(
            "id, title, engagement_type, start_date, end_date, contract_value, currency, status"
        ).eq("organization_id", org_id).in_("status", ["active", "draft"]).order("created_at", desc=True).execute()
    except Exception as e:
        raise_db_error(e)

    project_list = []
    for p in (projects.data or []):
        ms = sorted(p.get("milestones") or [], key=lambda m: m["sort_order"])
        completed = sum(1 for m in ms if m["status"] == "completed")
        p["milestones"] = ms
        p["progress"] = round(completed / len(ms) * 100) if ms else None
        project_list.append(p)

    outstanding = sum(float(i.get("amount") or 0) for i in (invoices.data or []) if i["status"] in ("sent", "overdue"))
    return {
        "organization": org.data,
        "projects": project_list,
        "invoices": invoices.data or [],
        "contracts": contracts.data or [],
        "summary": {
            "activeProjects": sum(1 for p in project_list if p["status"] == "active"),
            "outstandingInvoices": outstanding,
            "openContracts": sum(1 for c in (contracts.data or []) if c["status"] == "active"),
        },
    }


# ---------------------------------------------------------------------------
# Project tracker + review workflow
# ---------------------------------------------------------------------------

CLIENT_PROJECT_SELECT = (
    "id, name, code, description, status, health, progress_percent, "
    "client_review_status, submitted_for_review_at, client_feedback, client_feedback_at, "
    "expected_completion_date, start_date, target_end_date, "
    "milestones:milestones (id, title, description, due_date, status, sort_order, completed_at), "
    "updates:project_updates (id, title, body, created_at, is_client_visible, author:profiles (full_name))"
)


@router.get("/projects/{project_id}", summary="Client-safe project tracker (no internal data)")
def project_detail(project_id: str, user: SessionUser = Depends(require_role("client"))):
    sb = _sb()
    org_id = _require_org(sb, user.id)
    try:
        res = sb.table("projects").select(CLIENT_PROJECT_SELECT).eq("id", project_id).eq("organization_id", org_id).maybe_single().execute()
    except Exception as e:
        raise_db_error(e)
    if not res.data:
        raise HTTPException(status_code=404, detail="Project not found")
    project = res.data
    project["updates"] = [u for u in (project.get("updates") or []) if u.get("is_client_visible") is not False]
    return {"project": project}


class ReviewDecision(BaseModel):
    decision: str  # accept | request_changes
    feedback: str | None = None


@router.patch("/projects/{project_id}", summary="Client review: accept or request changes")
def review_project(project_id: str, body: ReviewDecision, request: Request, user: SessionUser = Depends(require_role("client"))):
    if body.decision not in ("accept", "request_changes"):
        raise HTTPException(status_code=400, detail="decision must be accept or request_changes")
    if body.decision == "request_changes" and not (body.feedback or "").strip():
        raise HTTPException(status_code=422, detail="Feedback is required when requesting changes")

    sb = _sb()
    org_id = _require_org(sb, user.id)
    try:
        row = sb.table("projects").select("id, name, client_review_status, manager_id, organization_id").eq("id", project_id).eq("organization_id", org_id).maybe_single().execute()
    except Exception as e:
        raise_db_error(e)
    project = row.data if row else None
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project["client_review_status"] != "submitted":
        raise HTTPException(status_code=409, detail=f"Project is not awaiting review (current state: {project['client_review_status']})")

    updates: dict = {
        "client_feedback": body.feedback,
        "client_feedback_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "client_feedback_by": user.id,
    }
    if body.decision == "accept":
        updates |= {"client_review_status": "approved", "status": "completed"}
        mgr_notify = ("Project accepted", f"Client approved \"{project['name']}\". Ready for invoicing.")
    else:
        updates["client_review_status"] = "changes_requested"
        mgr_notify = ("Changes requested", f"Client requested changes on \"{project['name']}\": {(body.feedback or '')[:140]}")

    try:
        sb.table("projects").update(updates).eq("id", project_id).execute()
    except Exception as e:
        raise_db_error(e)

    if project.get("manager_id"):
        try:
            mgr = sb.table("employees").select("profile_id").eq("id", project["manager_id"]).maybe_single().execute()
            if (mgr.data or {}).get("profile_id"):
                notify(mgr.data["profile_id"], mgr_notify[0], mgr_notify[1], "project", "/manager/projects")
        except Exception:
            pass

    audit("CLIENT_ACCEPT_PROJECT" if body.decision == "accept" else "CLIENT_REQUEST_CHANGES",
          "projects", project_id, user, {"feedback": body.feedback}, client_ip(request))
    return {"success": True, "decision": body.decision}


# ---------------------------------------------------------------------------
# Tickets
# ---------------------------------------------------------------------------

TICKET_SELECT = (
    "id, ticket_number, title, description, priority, status, resolved_at, created_at, updated_at, "
    "project:projects (id, name), "
    "assignee:employees (id, profile:profiles (full_name))"
)


@router.get("/tickets", summary="My organization's tickets (+ thread via includeMessages)")
def list_tickets(status: str | None = None, includeMessages: str | None = None, user: SessionUser = Depends(require_role("client"))):
    sb = _sb()
    org_id = _require_org(sb, user.id)
    try:
        if includeMessages:
            ticket = sb.table("tickets").select(TICKET_SELECT).eq("id", includeMessages).eq("organization_id", org_id).maybe_single().execute()
            if not ticket.data:
                raise HTTPException(status_code=404, detail="Ticket not found")
            messages = (
                sb.table("ticket_messages")
                .select("id, message, created_at, is_internal, author:profiles (id, full_name)")
                .eq("ticket_id", includeMessages).eq("is_internal", False).order("created_at").execute()
            )
            return {"ticket": ticket.data, "messages": [m for m in (messages.data or []) if not m.get("is_internal")]}
        query = sb.table("tickets").select(TICKET_SELECT).eq("organization_id", org_id)
        if status:
            query = query.eq("status", status)
        res = query.order("created_at", desc=True).limit(200).execute()
    except HTTPException:
        raise
    except Exception as e:
        raise_db_error(e)
    return res.data or []


class TicketCreate(BaseModel):
    title: str
    description: str | None = None
    projectId: str | None = None
    priority: str = "medium"


@router.post("/tickets", status_code=201, summary="Raise a ticket")
def create_ticket(body: TicketCreate, request: Request, user: SessionUser = Depends(require_role("client"))):
    if body.priority not in ("low", "medium", "high", "urgent"):
        raise HTTPException(status_code=400, detail="Invalid priority")
    sb = _sb()
    org_id = _require_org(sb, user.id)
    if body.projectId:
        try:
            proj = sb.table("projects").select("id").eq("id", body.projectId).eq("organization_id", org_id).maybe_single().execute()
        except Exception as e:
            raise_db_error(e)
        if not proj.data:
            raise HTTPException(status_code=404, detail="Project not found under your organization")
    ticket_number = f"TKT-{int(dt.datetime.now(dt.timezone.utc).timestamp() * 1000):X}"
    try:
        res = sb.table("tickets").insert({
            "ticket_number": ticket_number, "organization_id": org_id,
            "project_id": body.projectId, "raised_by": user.id,
            "title": body.title.strip(), "description": body.description,
            "priority": body.priority, "status": "open",
        }).select(TICKET_SELECT).execute()
    except Exception as e:
        raise_db_error(e)
    row = res.data[0]
    audit("CLIENT_TICKET_CREATED", "tickets", row["id"], user, {"number": ticket_number}, client_ip(request))
    return row


class TicketReply(BaseModel):
    id: str
    message: str


@router.patch("/tickets", summary="Reply to a ticket thread (status/priority are staff-managed)")
def reply_ticket(body: TicketReply, request: Request, user: SessionUser = Depends(require_role("client"))):
    sb = _sb()
    org_id = _require_org(sb, user.id)
    try:
        ticket = sb.table("tickets").select("id, ticket_number").eq("id", body.id).eq("organization_id", org_id).maybe_single().execute()
    except Exception as e:
        raise_db_error(e)
    if not ticket.data:
        raise HTTPException(status_code=404, detail="Ticket not found")
    try:
        sb.table("ticket_messages").insert({
            "ticket_id": body.id, "author_id": user.id, "message": body.message.strip(), "is_internal": False,
        }).execute()
    except Exception as e:
        raise_db_error(e)
    return {"success": True}


# ---------------------------------------------------------------------------
# Documents
# ---------------------------------------------------------------------------

@router.get("/documents", summary="Downloadable documents for my organization")
def list_documents(projectId: str | None = None, category: str | None = None, user: SessionUser = Depends(require_role("client"))):
    sb = _sb()
    org_id = _require_org(sb, user.id)
    try:
        query = (
            sb.table("documents")
            .select("id, title, category, file_name, file_size_bytes, mime_type, created_at, project:projects (id, name)")
            .eq("organization_id", org_id).neq("category", "hr_record")
        )
        if projectId:
            query = query.eq("project_id", projectId)
        if category:
            query = query.eq("category", category)
        res = query.order("created_at", desc=True).execute()
    except Exception as e:
        raise_db_error(e)
    return res.data or []


class DocumentDownload(BaseModel):
    id: str


@router.post("/documents", summary="Signed download URL (10 min) for an org document")
def download_document(body: DocumentDownload, request: Request, user: SessionUser = Depends(require_role("client"))):
    sb = _sb()
    org_id = _require_org(sb, user.id)
    try:
        doc = sb.table("documents").select("id, storage_path, file_name").eq("id", body.id).eq("organization_id", org_id).neq("category", "hr_record").maybe_single().execute()
    except Exception as e:
        raise_db_error(e)
    d = doc.data if doc else None
    if not d:
        raise HTTPException(status_code=404, detail="Document not found")
    from app.core.clients import service_client
    svc = service_client()
    if not svc:
        raise HTTPException(status_code=500, detail="Server configuration error")
    try:
        signed = svc.storage.from_("documents").create_signed_url(d["storage_path"], 600)
    except Exception as e:
        raise_db_error(e, "Failed to generate download link")
    audit("CLIENT_DOCUMENT_DOWNLOAD", "documents", d["id"], user)
    url = signed["signedURL"] if isinstance(signed, dict) else getattr(signed, "signedURL", None) or signed.get("signedUrl")
    return {"downloadUrl": url, "fileName": d["file_name"], "expiresIn": 600}
