"""Sales router — leads, clients, proposals, contracts, analytics."""
import datetime as dt

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr
from supabase import Client

from app.core.clients import service_client
from app.core.helpers import audit, raise_db_error
from app.core.security import SessionUser, client_ip, require_role

router = APIRouter(prefix="/sales", tags=["sales"])

STAGES = ("new", "contacted", "qualified", "proposal_sent", "won", "lost")


def _sb() -> Client:
    sb = service_client()
    if not sb:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    return sb


LEAD_SELECT = (
    "id, company_name, contact_name, contact_email, contact_phone, service_interest, source, "
    "estimated_value, stage, loss_reason, converted_client_org_id, created_at, updated_at, "
    "enquiry:enquiries!leads_enquiry_id_fkey (id, message, source_page), "
    "owner:profiles!leads_owner_id_fkey (id, full_name, email)"
)


@router.get("/leads", summary="Lead pipeline")
def list_leads(stage: str | None = None, user: SessionUser = Depends(require_role("sales"))):
    sb = _sb()
    try:
        query = sb.table("leads").select(LEAD_SELECT)
        if stage:
            query = query.eq("stage", stage)
        res = query.order("created_at", desc=True).execute()
    except Exception as e:
        raise_db_error(e)
    return res.data or []


class CreateLeadRequest(BaseModel):
    companyName: str
    contactName: str
    contactEmail: EmailStr
    enquiryId: str | None = None
    serviceInterest: str | None = None
    estimatedValue: float | None = None
    contactPhone: str | None = None
    source: str | None = None


@router.post("/leads", status_code=201, summary="Create a lead (optionally from an enquiry)")
def create_lead(body: CreateLeadRequest, request: Request, user: SessionUser = Depends(require_role("sales"))):
    sb = _sb()
    email = body.contactEmail.lower()
    try:
        dup = sb.table("leads").select("id, stage").eq("contact_email", email).in_("stage", ["new", "contacted", "qualified", "proposal_sent"]).limit(1).execute()
    except Exception as e:
        raise_db_error(e)
    if dup.data:
        raise HTTPException(status_code=409, detail="An open lead with this contact email already exists")

    try:
        res = sb.table("leads").insert({
            "enquiry_id": body.enquiryId,
            "company_name": body.companyName.strip(),
            "contact_name": body.contactName.strip(),
            "contact_email": email,
            "contact_phone": body.contactPhone,
            "service_interest": body.serviceInterest,
            "source": body.source or "manual",
            "estimated_value": body.estimatedValue,
            "stage": "new",
            "owner_id": user.id,
        }).select(LEAD_SELECT).execute()
    except Exception as e:
        raise_db_error(e)
    row = res.data[0]

    if body.enquiryId:
        try:
            sb.table("enquiries").update({"status": "qualified"}).eq("id", body.enquiryId).execute()
        except Exception:
            pass

    audit("CREATE_LEAD", "leads", row["id"], user, {"company": row["company_name"]}, client_ip(request))
    return row


class UpdateLeadRequest(BaseModel):
    id: str
    stage: str | None = None
    estimatedValue: float | None = None
    lossReason: str | None = None
    note: str | None = None


@router.patch("/leads", summary="Move a lead through the pipeline / add a note")
def update_lead(body: UpdateLeadRequest, request: Request, user: SessionUser = Depends(require_role("sales"))):
    sb = _sb()
    updates: dict = {}
    if body.stage:
        if body.stage not in STAGES:
            raise HTTPException(status_code=400, detail=f"stage must be one of: {', '.join(STAGES)}")
        if body.stage == "lost" and not body.lossReason:
            raise HTTPException(status_code=400, detail="lossReason is required when marking a lead lost")
        updates["stage"] = body.stage
        updates["loss_reason"] = body.lossReason
    if body.estimatedValue is not None:
        updates["estimated_value"] = body.estimatedValue

    if updates:
        try:
            sb.table("leads").update(updates).eq("id", body.id).execute()
        except Exception as e:
            raise_db_error(e)

    if body.note:
        try:
            sb.table("lead_activities").insert({"lead_id": body.id, "author_id": user.id, "note": body.note}).execute()
        except Exception as e:
            raise_db_error(e)

    if not updates and not body.note:
        raise HTTPException(status_code=400, detail="Nothing to update")

    audit("UPDATE_LEAD", "leads", body.id, user, updates, client_ip(request))
    return {"success": True}


class ConvertLeadRequest(BaseModel):
    leadId: str
    organizationName: str | None = None


@router.put("/leads", status_code=201, summary="Convert a lead into a client organization")
def convert_lead(body: ConvertLeadRequest, request: Request, user: SessionUser = Depends(require_role("sales"))):
    sb = _sb()
    try:
        row = sb.table("leads").select("*").eq("id", body.leadId).maybe_single().execute()
    except Exception as e:
        raise_db_error(e)
    lead = row.data if row else None
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if lead.get("converted_client_org_id"):
        raise HTTPException(status_code=409, detail="Lead is already converted")

    try:
        org = sb.table("client_organizations").insert({
            "name": (body.organizationName or lead["company_name"]).strip(),
            "account_owner_id": user.id,
            "status": "active",
        }).select("id, name").execute()
        org_row = org.data[0]
        sb.table("client_contacts").insert({
            "organization_id": org_row["id"], "name": lead["contact_name"],
            "email": lead["contact_email"], "phone": lead.get("contact_phone"), "is_primary": True,
        }).execute()
        sb.table("leads").update({"stage": "won", "converted_client_org_id": org_row["id"]}).eq("id", lead["id"]).execute()
    except Exception as e:
        raise_db_error(e, "Conversion failed")

    audit("CONVERT_LEAD", "client_organizations", org_row["id"], user, {"lead_id": lead["id"]}, client_ip(request))
    return {"success": True, "organization": org_row}


# ---------------------------------------------------------------------------
# Clients
# ---------------------------------------------------------------------------

ORG_SELECT = (
    "id, name, industry, website, address, status, created_at, "
    "account_owner:profiles!client_organizations_account_owner_id_fkey (id, full_name, email), "
    "contacts:client_contacts (id, name, email, phone, is_primary), "
    "contracts:contracts (id, title, engagement_type, status, contract_value, currency, start_date, end_date)"
)


@router.get("/clients", summary="Client organizations with contacts & contracts")
def list_clients(status: str | None = None, user: SessionUser = Depends(require_role("sales"))):
    sb = _sb()
    try:
        query = sb.table("client_organizations").select(ORG_SELECT)
        if status:
            query = query.eq("status", status)
        res = query.order("name").execute()
    except Exception as e:
        raise_db_error(e)
    return res.data or []


class ContactIn(BaseModel):
    name: str
    email: EmailStr
    phone: str | None = None
    isPrimary: bool | None = None


class CreateClientRequest(BaseModel):
    name: str
    industry: str | None = None
    website: str | None = None
    address: str | None = None
    contacts: list[ContactIn] = []


@router.post("/clients", status_code=201, summary="Create a client organization")
def create_client(body: CreateClientRequest, request: Request, user: SessionUser = Depends(require_role("sales"))):
    sb = _sb()
    try:
        org = sb.table("client_organizations").insert({
            "name": body.name.strip(), "industry": body.industry, "website": body.website,
            "address": body.address, "account_owner_id": user.id, "status": "prospect",
        }).select("id, name").execute()
        org_row = org.data[0]
        if body.contacts:
            sb.table("client_contacts").insert([
                {
                    "organization_id": org_row["id"], "name": c.name, "email": c.email.lower(),
                    "phone": c.phone, "is_primary": c.isPrimary if c.isPrimary is not None else i == 0,
                }
                for i, c in enumerate(body.contacts)
            ]).execute()
    except Exception as e:
        raise_db_error(e)
    audit("CREATE_CLIENT_ORG", "client_organizations", org_row["id"], user, {"name": body.name}, client_ip(request))
    return org_row


class UpdateClientRequest(BaseModel):
    id: str
    name: str | None = None
    industry: str | None = None
    website: str | None = None
    address: str | None = None
    status: str | None = None
    contact: ContactIn | None = None
    contactId: str | None = None


@router.patch("/clients", summary="Update an organization / upsert a contact")
def update_client(body: UpdateClientRequest, request: Request, user: SessionUser = Depends(require_role("sales"))):
    sb = _sb()
    updates = {k: v for k, v in {
        "name": body.name.strip() if body.name else None,
        "industry": body.industry, "website": body.website, "address": body.address,
        "status": body.status,
    }.items() if v is not None}
    if body.status and body.status not in ("prospect", "active", "churned"):
        raise HTTPException(status_code=400, detail="status must be prospect, active, or churned")
    try:
        if updates:
            sb.table("client_organizations").update(updates).eq("id", body.id).execute()
        if body.contact:
            payload = {
                "organization_id": body.id, "name": body.contact.name,
                "email": body.contact.email.lower(), "phone": body.contact.phone,
                "is_primary": body.contact.isPrimary or False,
            }
            if body.contactId:
                sb.table("client_contacts").update(payload).eq("id", body.contactId).execute()
            else:
                sb.table("client_contacts").insert(payload).execute()
    except Exception as e:
        raise_db_error(e)
    if not updates and not body.contact:
        raise HTTPException(status_code=400, detail="Nothing to update")
    audit("UPDATE_CLIENT_ORG", "client_organizations", body.id, user, updates, client_ip(request))
    return {"success": True}


# ---------------------------------------------------------------------------
# Proposals
# ---------------------------------------------------------------------------

PROPOSAL_SELECT = (
    "id, title, total_amount, currency, valid_until, status, sent_at, decided_at, created_at, "
    "lead:leads (id, company_name, contact_name), "
    "organization:client_organizations (id, name), "
    "items:proposal_items (id, description, quantity, unit_price, sort_order)"
)


@router.get("/proposals", summary="Proposals with line items")
def list_proposals(status: str | None = None, user: SessionUser = Depends(require_role("sales"))):
    sb = _sb()
    try:
        query = sb.table("proposals").select(PROPOSAL_SELECT)
        if status:
            query = query.eq("status", status)
        res = query.order("created_at", desc=True).execute()
    except Exception as e:
        raise_db_error(e)
    return res.data or []


class ProposalItemIn(BaseModel):
    description: str
    quantity: float = 1
    unitPrice: float = 0


class CreateProposalRequest(BaseModel):
    title: str
    leadId: str | None = None
    organizationId: str | None = None
    validUntil: str | None = None
    currency: str = "USD"
    items: list[ProposalItemIn] = []


@router.post("/proposals", status_code=201, summary="Create a proposal with line items")
def create_proposal(body: CreateProposalRequest, request: Request, user: SessionUser = Depends(require_role("sales"))):
    sb = _sb()
    total = sum(i.quantity * i.unitPrice for i in body.items)
    try:
        res = sb.table("proposals").insert({
            "title": body.title.strip(), "lead_id": body.leadId, "organization_id": body.organizationId,
            "valid_until": body.validUntil, "currency": body.currency, "total_amount": total,
            "status": "draft", "created_by": user.id,
        }).select(PROPOSAL_SELECT).execute()
        row = res.data[0]
        if body.items:
            sb.table("proposal_items").insert([
                {"proposal_id": row["id"], "description": i.description,
                 "quantity": i.quantity, "unit_price": i.unitPrice, "sort_order": n}
                for n, i in enumerate(body.items)
            ]).execute()
    except Exception as e:
        raise_db_error(e)
    audit("CREATE_PROPOSAL", "proposals", row["id"], user, {"title": body.title}, client_ip(request))
    return row


class UpdateProposalRequest(BaseModel):
    id: str
    title: str | None = None
    validUntil: str | None = None
    status: str | None = None
    items: list[ProposalItemIn] | None = None


@router.patch("/proposals", summary="Update a proposal (status transitions, replace items)")
def update_proposal(body: UpdateProposalRequest, request: Request, user: SessionUser = Depends(require_role("sales"))):
    sb = _sb()
    updates: dict = {}
    if body.title:
        updates["title"] = body.title.strip()
    if body.validUntil is not None:
        updates["valid_until"] = body.validUntil or None
    if body.status:
        if body.status not in ("draft", "sent", "accepted", "declined", "expired"):
            raise HTTPException(status_code=400, detail="Invalid proposal status")
        updates["status"] = body.status
        if body.status == "sent":
            updates["sent_at"] = dt.datetime.now(dt.timezone.utc).isoformat()
        if body.status in ("accepted", "declined"):
            updates["decided_at"] = dt.datetime.now(dt.timezone.utc).isoformat()

    try:
        if body.items is not None:
            updates["total_amount"] = sum(i.quantity * i.unitPrice for i in body.items)
            sb.table("proposal_items").delete().eq("proposal_id", body.id).execute()
            if body.items:
                sb.table("proposal_items").insert([
                    {"proposal_id": body.id, "description": i.description,
                     "quantity": i.quantity, "unit_price": i.unitPrice, "sort_order": n}
                    for n, i in enumerate(body.items)
                ]).execute()
        if updates:
            sb.table("proposals").update(updates).eq("id", body.id).execute()
    except Exception as e:
        raise_db_error(e)
    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update")
    audit("UPDATE_PROPOSAL", "proposals", body.id, user, {"status": updates.get("status")}, client_ip(request))
    return {"success": True}


# ---------------------------------------------------------------------------
# Contracts
# ---------------------------------------------------------------------------

CONTRACT_SELECT = (
    "id, title, engagement_type, start_date, end_date, contract_value, currency, status, "
    "document_path, created_at, "
    "organization:client_organizations (id, name), "
    "proposal:proposals (id, title, total_amount)"
)


@router.get("/contracts", summary="Contracts list")
def list_contracts(organization: str | None = None, status: str | None = None, user: SessionUser = Depends(require_role("sales"))):
    sb = _sb()
    try:
        query = sb.table("contracts").select(CONTRACT_SELECT)
        if organization:
            query = query.eq("organization_id", organization)
        if status:
            query = query.eq("status", status)
        res = query.order("created_at", desc=True).execute()
    except Exception as e:
        raise_db_error(e)
    return res.data or []


class CreateContractRequest(BaseModel):
    organizationId: str
    title: str
    engagementType: str = "project"
    startDate: str | None = None
    endDate: str | None = None
    contractValue: float | None = None
    currency: str = "USD"
    proposalId: str | None = None


@router.post("/contracts", status_code=201, summary="Create a contract")
def create_contract(body: CreateContractRequest, request: Request, user: SessionUser = Depends(require_role("sales"))):
    sb = _sb()
    try:
        res = sb.table("contracts").insert({
            "organization_id": body.organizationId, "proposal_id": body.proposalId,
            "title": body.title.strip(), "engagement_type": body.engagementType,
            "start_date": body.startDate, "end_date": body.endDate,
            "contract_value": body.contractValue, "currency": body.currency,
            "status": "draft", "created_by": user.id,
        }).select(CONTRACT_SELECT).execute()
    except Exception as e:
        raise_db_error(e)
    row = res.data[0]
    audit("CREATE_CONTRACT", "contracts", row["id"], user, {"title": body.title}, client_ip(request))
    return row


class UpdateContractRequest(BaseModel):
    id: str
    status: str | None = None
    endDate: str | None = None
    contractValue: float | None = None
    documentPath: str | None = None


@router.patch("/contracts", summary="Update contract lifecycle")
def update_contract(body: UpdateContractRequest, request: Request, user: SessionUser = Depends(require_role("sales"))):
    sb = _sb()
    updates: dict = {}
    if body.status:
        if body.status not in ("draft", "active", "expired", "terminated"):
            raise HTTPException(status_code=400, detail="Invalid contract status")
        updates["status"] = body.status
    if body.endDate is not None:
        updates["end_date"] = body.endDate or None
    if body.contractValue is not None:
        updates["contract_value"] = body.contractValue
    if body.documentPath is not None:
        updates["document_path"] = body.documentPath or None
    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update")
    try:
        res = sb.table("contracts").update(updates).eq("id", body.id).select(CONTRACT_SELECT).execute()
    except Exception as e:
        raise_db_error(e)
    if not res.data:
        raise HTTPException(status_code=404, detail="Contract not found")
    audit("UPDATE_CONTRACT", "contracts", body.id, user, updates, client_ip(request))
    return res.data[0]


# ---------------------------------------------------------------------------
# Analytics
# ---------------------------------------------------------------------------

@router.get("/analytics", summary="Sales KPIs (pipeline, conversion, proposals, revenue)")
def analytics(user: SessionUser = Depends(require_role("sales"))):
    sb = _sb()
    year_start = dt.date(dt.date.today().year, 1, 1).isoformat()
    try:
        leads = sb.table("leads").select("stage, estimated_value").execute().data or []
        proposals = sb.table("proposals").select("status, total_amount, currency").execute().data or []
        invoices = sb.table("invoices").select("status, amount, currency").gte("issue_date", year_start).execute().data or []
    except Exception as e:
        raise_db_error(e)

    pipeline = [
        {"stage": s, "count": sum(1 for l in leads if l["stage"] == s),
         "value": sum(float(l.get("estimated_value") or 0) for l in leads if l["stage"] == s)}
        for s in STAGES
    ]
    open_pipeline = [p for p in pipeline if p["stage"] not in ("won", "lost")]
    won = sum(1 for l in leads if l["stage"] == "won")
    lost = sum(1 for l in leads if l["stage"] == "lost")
    closed = won + lost
    sent = [p for p in proposals if p["status"] != "draft"]
    accepted = [p for p in proposals if p["status"] == "accepted"]
    paid = sum(float(i.get("amount") or 0) for i in invoices if i["status"] == "paid")
    invoiced = sum(float(i.get("amount") or 0) for i in invoices if i["status"] not in ("draft", "cancelled"))

    return {
        "pipeline": pipeline,
        "openPipeline": {"count": sum(p["count"] for p in open_pipeline), "value": sum(p["value"] for p in open_pipeline)},
        "conversion": {"leadsWon": won, "leadsLost": lost, "winRate": round(won / closed * 100, 1) if closed else None},
        "proposals": {
            "sent": len(sent), "accepted": len(accepted),
            "acceptanceRate": round(len(accepted) / len(sent) * 100, 1) if sent else None,
            "acceptedValue": sum(float(p.get("total_amount") or 0) for p in accepted),
        },
        "revenue": {"invoicedYtd": invoiced, "paidYtd": paid, "outstanding": invoiced - paid},
    }


# ---------------------------------------------------------------------------
# Enquiries (sales-facing slice of the admin workflow)
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


@router.get("/enquiries", summary="Assigned + pool enquiries (sales workflow)")
def list_enquiries(
    status: str | None = None,
    q: str | None = None,
    page: int = 1,
    pageSize: int = 25,
    user: SessionUser = Depends(require_role("sales")),
):
    sb = _sb()
    page, pageSize = max(1, page), min(100, max(5, pageSize))

    try:
        query = sb.table("enquiries").select(ENQUIRY_SELECT, count="exact")
        # Sales sees enquiries assigned to them plus the unassigned pool.
        query = query.or_(f"assigned_to.eq.{user.id},assigned_to.is.null")
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
    notes: str | None = None
    followUpAt: str | None = None
    meetingAt: str | None = None
    meetingLink: str | None = None
    decisionNotes: str | None = None


@router.patch("/enquiries/{enquiry_id}", summary="Sales enquiry workflow: claim / transition / schedule")
def patch_enquiry(enquiry_id: str, body: EnquiryPatch, request: Request, user: SessionUser = Depends(require_role("sales"))):
    sb = _sb()

    try:
        row = sb.table("enquiries").select("id,status,assigned_to,full_name,company,email").eq("id", enquiry_id).maybe_single().execute()
    except Exception as e:
        raise_db_error(e)
    enquiry = row.data if row else None
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")

    # Sales may only touch unassigned-pool enquiries or their own.
    if enquiry.get("assigned_to") and enquiry["assigned_to"] != user.id:
        raise HTTPException(status_code=403, detail="This enquiry is assigned to another sales user")

    updates: dict = {}
    note = body.notes

    # Claiming an unassigned enquiry assigns it to the current sales user.
    if not enquiry.get("assigned_to") and (body.status or body.followUpAt or body.meetingAt):
        updates |= {
            "assigned_to": user.id,
            "assigned_by": user.id,
            "assigned_at": dt.datetime.now(dt.timezone.utc).isoformat(),
            "status": "assigned_to_sales" if enquiry["status"] in ("new", "under_review") else enquiry["status"],
        }
        note = f"Claimed by {user.full_name or user.email}"

    if body.status:
        if body.status not in VALID_ENQUIRY_STATUSES:
            raise HTTPException(status_code=400, detail=f"Invalid status '{body.status}'")
        if body.status == "rejected" and not (body.decisionNotes or body.notes):
            raise HTTPException(status_code=422, detail="A rejection reason is required")
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

    if body.notes is not None and not body.status:
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

    audit("ENQUIRY_SALES_UPDATE", "enquiries", enquiry_id, user, {**updates, "note": note}, client_ip(request))
    return res.data[0]
