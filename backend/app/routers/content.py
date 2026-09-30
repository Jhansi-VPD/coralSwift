"""Content router — marketing site CRUD (services, jobs, case studies), admin-authored.

The public website reads these tables through the public router / Supabase anon client.
Admin mutations happen here with the service role.
"""
import datetime as dt

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from app.core.helpers import audit, raise_db_error
from app.core.security import SessionUser, client_ip, require_role

router = APIRouter(prefix="", tags=["content"])


def _sb():
    from app.core.clients import service_client
    sb = service_client()
    if not sb:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    return sb


import re as _re

_UUID_RE = _re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", _re.IGNORECASE
)


def _delete_by_id_or_slug(table: str, id_or_slug: str) -> bool:
    """Delete by UUID id when the value looks like one, else by slug."""
    sb = _sb()
    column = "id" if _UUID_RE.match(id_or_slug or "") else "slug"
    try:
        sb.table(table).delete().eq(column, id_or_slug).execute()
    except Exception as e:
        raise_db_error(e)
    return True


# --------------------------- Services ---------------------------

class ServicePayload(BaseModel):
    id: str | None = None
    title: str | None = None
    slug: str | None = None
    category: str | None = None
    short_description: str | None = None
    overview: str | None = None
    capabilities: list[str] | None = None
    approach: list[dict] | None = None
    requirements: str | None = None
    deliverables: list[str] | None = None
    cta_text: str | None = None
    icon: str | None = None
    order_index: int | None = None
    status: str | None = None
    meta_title: str | None = None
    meta_description: str | None = None


@router.post("/services", summary="Create or update a service")
def save_service(body: ServicePayload, request: Request, user: SessionUser = Depends(require_role())):
    sb = _sb()
    now = dt.datetime.now(dt.timezone.utc).isoformat()
    payload = body.model_dump(exclude_none=True)
    payload["updated_at"] = now
    try:
        if body.id:
            res = sb.table("services").update(payload).eq("id", body.id).select("*").execute()
            if not res.data:
                res = sb.table("services").insert(payload).select("*").execute()
        else:
            payload.setdefault("status", "published")
            res = sb.table("services").insert(payload).select("*").execute()
    except Exception as e:
        raise_db_error(e, "Failed to save service")
    audit("SAVE_SERVICE", "services", res.data[0]["id"], user, {"title": res.data[0].get("title")}, client_ip(request))
    return res.data[0]


@router.delete("/services/{service_id}", summary="Delete a service (id or slug)")
def delete_service(service_id: str, request: Request, user: SessionUser = Depends(require_role())):
    _delete_by_id_or_slug("services", service_id)
    audit("DELETE_SERVICE", "services", service_id, user, ip=client_ip(request))
    return {"success": True}


# --------------------------- Jobs ---------------------------

class JobPayload(BaseModel):
    id: str | None = None
    title: str | None = None
    slug: str | None = None
    department: str | None = None
    location: str | None = None
    work_model: str | None = None
    employment_type: str | None = None
    experience_level: str | None = None
    short_description: str | None = None
    description: str | None = None
    responsibilities: list[str] | None = None
    requirements: list[str] | None = None
    benefits: list[str] | None = None
    salary_range: str | None = None
    status: str | None = None


@router.post("/jobs", summary="Create or update a job posting")
def save_job(body: JobPayload, request: Request, user: SessionUser = Depends(require_role())):
    sb = _sb()
    payload = body.model_dump(exclude_none=True)
    payload["updated_at"] = dt.datetime.now(dt.timezone.utc).isoformat()
    try:
        if body.id:
            res = sb.table("jobs").update(payload).eq("id", body.id).select("*").execute()
            if not res.data:
                res = sb.table("jobs").insert(payload).select("*").execute()
        else:
            payload.setdefault("status", "active")
            res = sb.table("jobs").insert(payload).select("*").execute()
    except Exception as e:
        raise_db_error(e, "Failed to save job")
    audit("SAVE_JOB", "jobs", res.data[0]["id"], user, {"title": res.data[0].get("title")}, client_ip(request))
    return res.data[0]


@router.delete("/jobs/{job_id}", summary="Delete a job posting (id or slug)")
def delete_job(job_id: str, request: Request, user: SessionUser = Depends(require_role())):
    _delete_by_id_or_slug("jobs", job_id)
    audit("DELETE_JOB", "jobs", job_id, user, ip=client_ip(request))
    return {"success": True}


# --------------------------- Case studies ---------------------------

class CaseStudyPayload(BaseModel):
    id: str | None = None
    title: str | None = None
    slug: str | None = None
    client_name: str | None = None
    industry: str | None = None
    project_context: str | None = None
    challenge: str | None = None
    solution: str | None = None
    implementation: str | None = None
    outcome_metrics: list[dict] | None = None
    tech_stack: list[str] | None = None
    related_service_slug: str | None = None
    is_featured: bool | None = None
    status: str | None = None
    hero_image: str | None = None


@router.post("/case-studies", summary="Create or update a case study")
def save_case_study(body: CaseStudyPayload, request: Request, user: SessionUser = Depends(require_role())):
    sb = _sb()
    payload = body.model_dump(exclude_none=True)
    payload["updated_at"] = dt.datetime.now(dt.timezone.utc).isoformat()
    try:
        if body.id:
            res = sb.table("case_studies").update(payload).eq("id", body.id).select("*").execute()
            if not res.data:
                res = sb.table("case_studies").insert(payload).select("*").execute()
        else:
            payload.setdefault("status", "published")
            res = sb.table("case_studies").insert(payload).select("*").execute()
    except Exception as e:
        raise_db_error(e, "Failed to save case study")
    audit("SAVE_CASE_STUDY", "case_studies", res.data[0]["id"], user, {"title": res.data[0].get("title")}, client_ip(request))
    return res.data[0]


@router.delete("/case-studies/{case_study_id}", summary="Delete a case study (id or slug)")
def delete_case_study(case_study_id: str, request: Request, user: SessionUser = Depends(require_role())):
    _delete_by_id_or_slug("case_studies", case_study_id)
    audit("DELETE_CASE_STUDY", "case_studies", case_study_id, user, ip=client_ip(request))
    return {"success": True}
