"""Public router — website intake (no auth): enquiries + job applications."""
import datetime as dt
import re

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr

from app.core.clients import service_client
from app.core.helpers import audit
from app.core.security import client_ip, get_session_user

router = APIRouter(prefix="", tags=["public"])

bearer_scheme = HTTPBearer(auto_error=False)


async def _staff_content_guard(
    mode: str | None = None,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> None:
    """No-op for the public site; when mode=admin, require a valid staff session."""
    if mode != "admin":
        return
    user = await get_session_user(credentials)  # raises 401 on missing/invalid token
    if user.role == "client":
        raise HTTPException(status_code=403, detail="Forbidden")


_rate_store: dict[str, list[float]] = {}


def _form_limited(ip: str) -> bool:
    """10 submissions / 10 min / IP (in-memory; use Redis for multi-instance)."""
    now = dt.datetime.now(dt.timezone.utc).timestamp()
    stamps = [t for t in _rate_store.get(ip, []) if now - t < 600]
    if len(stamps) >= 10:
        _rate_store[ip] = stamps
        return True
    stamps.append(now)
    _rate_store[ip] = stamps
    return False


def _sb_public():
    sb = service_client()
    if not sb:
        raise HTTPException(status_code=503, detail="Service temporarily unavailable. Please try again later.")
    return sb


# ---------------------------------------------------------------------------
# Website enquiry
# ---------------------------------------------------------------------------

class EnquirySubmit(BaseModel):
    full_name: str
    email: EmailStr
    company: str
    phone: str | None = None
    service_interest: str | None = None
    message: str = ""
    consent: bool = True
    source_page: str = "/contact"


def _field(message: str, key: str) -> str | None:
    """Extract a 'Key: value' line from a consultation message body."""
    m = re.search(rf"^\s*{key}\s*:\s*(.+)$", message or "", re.IGNORECASE | re.MULTILINE)
    return m.group(1).strip() if m else None


@router.post("/enquiries/submit", status_code=201, summary="Public website enquiry / consultation request")
def submit_enquiry(body: EnquirySubmit, request: Request):
    ip = client_ip(request)
    if _form_limited(ip):
        raise HTTPException(status_code=429, detail="Too many submissions. Please try again later.")

    sb = _sb_public()
    clean_email = body.email.lower().strip()
    clean_message = (body.message or "").strip()

    # Duplicate consultation guard (same email + service + date/slot)
    try:
        existing = (
            sb.table("enquiries").select("id, email, service_interest, message")
            .ilike("email", clean_email).execute()
        )
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to submit enquiry")

    new_date = _field(clean_message, "Date")
    new_slot = _field(clean_message, "Slot")
    new_service = (body.service_interest or "").strip().lower()
    for row in existing.data or []:
        same_service = (row.get("service_interest") or "").strip().lower() == new_service
        if new_date and new_slot and same_service:
            old = row.get("message") or ""
            if _field(old, "Date") == new_date and _field(old, "Slot") == new_slot:
                raise HTTPException(
                    status_code=409,
                    detail="This consultation request has already been submitted.",
                )

    try:
        res = sb.table("enquiries").insert({
            "full_name": body.full_name.strip()[:255],
            "email": clean_email,
            "company": body.company.strip()[:255],
            "phone": body.phone,
            "service_interest": body.service_interest or "General Enterprise Consultation",
            "message": clean_message,
            "consent": body.consent,
            "source_page": body.source_page or "/contact",
            "status": "new",
        }).select("id").execute()
    except Exception as e:
        code = getattr(getattr(e, "args", [None])[0], "get", lambda _: None)("code") if e.args and isinstance(e.args[0], dict) else None
        if code == "23505":
            raise HTTPException(status_code=409, detail="This enquiry was already submitted.")
        raise HTTPException(status_code=500, detail="Failed to submit enquiry")

    enquiry_id = res.data[0]["id"]
    audit("PUBLIC_ENQUIRY_SUBMIT", "enquiries", enquiry_id, None, {"email": clean_email, "source": body.source_page}, ip)
    return {"success": True, "id": enquiry_id, "message": "Enquiry received. Our team will reach out shortly."}


# ---------------------------------------------------------------------------
# Job application (multipart resume upload)
# ---------------------------------------------------------------------------

ALLOWED_RESUME_TYPES = {"pdf", "doc", "docx"}
MAX_RESUME_BYTES = 10 * 1024 * 1024  # 10 MB
_UUID_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.IGNORECASE)


@router.post("/applications/submit", status_code=201, summary="Public job application (multipart resume upload)")
def submit_application(
    request: Request,
    job_id: str = Form(...),
    full_name: str = Form(...),
    email: EmailStr = Form(...),
    phone: str | None = Form(None),
    portfolio_url: str | None = Form(None),
    linkedin_url: str | None = Form(None),
    cover_note: str | None = Form(None),
    resume: UploadFile = File(...),
):
    ip = client_ip(request)
    if _form_limited(ip):
        raise HTTPException(status_code=429, detail="Too many submissions. Please try again later.")

    sb = _sb_public()
    clean_email = email.lower().strip()

    # Resume validation: extension + size
    original_name = resume.filename or "resume"
    ext = original_name.rsplit(".", 1)[-1].lower() if "." in original_name else ""
    if ext not in ALLOWED_RESUME_TYPES:
        raise HTTPException(status_code=415, detail="Resume must be a PDF, DOC, or DOCX file.")
    data = resume.file.read()
    if len(data) > MAX_RESUME_BYTES:
        raise HTTPException(status_code=413, detail="Resume exceeds the 10 MB size limit.")

    # job_id may be a UUID or a slug
    try:
        if _UUID_RE.match(job_id):
            job = sb.table("jobs").select("id, title, status").eq("id", job_id).maybe_single().execute()
        else:
            job = sb.table("jobs").select("id, title, status").eq("slug", job_id).maybe_single().execute()
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to resolve the job posting")
    job_row = job.data if job else None
    if not job_row or job_row.get("status") != "active":
        raise HTTPException(status_code=404, detail="This position is no longer accepting applications.")

    # Upload to private storage: resumes/{ms}_{cleaned_filename}
    ms = int(dt.datetime.now(dt.timezone.utc).timestamp() * 1000)
    clean_name = re.sub(r"[^A-Za-z0-9._-]", "_", original_name)[-255:]
    storage_path = f"resumes/{ms}_{clean_name}"
    svc = sb
    try:
        svc.storage.from_("resumes").upload(storage_path, data, {"content-type": resume.content_type or "application/octet-stream"})
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to store the resume file. Please try again.")

    try:
        res = sb.table("applications").insert({
            "job_id": job_row["id"],
            "full_name": full_name.strip()[:255],
            "email": clean_email,
            "phone": (phone or "").strip() or None,
            "portfolio_url": (portfolio_url or "").strip() or None,
            "linkedin_url": (linkedin_url or "").strip() or None,
            "cover_note": (cover_note or "").strip() or None,
            "resume_path": storage_path,
            "resume_filename": clean_name,
            "status": "submitted",
        }).select("id").execute()
    except Exception:
        # rollback the uploaded object so storage stays clean
        try:
            svc.storage.from_("resumes").remove([storage_path])
        except Exception:
            pass
        raise HTTPException(status_code=500, detail="Failed to save application. Please try again.")

    application_id = res.data[0]["id"]
    audit("SUBMIT_APPLICATION", "applications", application_id, None, {"email": clean_email}, ip)
    return {"success": True, "id": application_id, "message": "Application submitted successfully."}


# ---------------------------------------------------------------------------
# Public content (marketing site) — services / jobs / case studies
# ---------------------------------------------------------------------------

@router.get("/services", summary="Published services (public) or all with mode=admin (staff)")
def public_services(
    status: str | None = None,
    mode: str | None = None,
    _guard: None = Depends(_staff_content_guard),
):
    from app.core.clients import anon_client
    sb = anon_client()
    if not sb:
        return []
    try:
        query = sb.table("services").select("*")
        if mode != "admin":
            query = query.eq("status", "published")
        elif status:
            query = query.eq("status", status)
        res = query.order("order_index").execute()
        return res.data or []
    except Exception:
        return []


@router.get("/jobs", summary="Active jobs (public) or all with mode=admin (staff)")
def public_jobs(
    mode: str | None = None,
    _guard: None = Depends(_staff_content_guard),
):
    from app.core.clients import anon_client
    sb = anon_client()
    if not sb:
        return []
    try:
        query = sb.table("jobs").select("*")
        if mode != "admin":
            # public site only shows active postings
            query = query.eq("status", "active")
        res = query.order("created_at", desc=True).execute()
        return res.data or []
    except Exception:
        return []


@router.get("/case-studies", summary="Published case studies (public) or all with mode=admin (staff)")
def public_case_studies(
    featured: bool = False,
    mode: str | None = None,
    _guard: None = Depends(_staff_content_guard),
):
    from app.core.clients import anon_client
    sb = anon_client()
    if not sb:
        return []
    try:
        query = sb.table("case_studies").select("*")
        if mode != "admin":
            query = query.eq("status", "published")
            if featured:
                query = query.eq("is_featured", True)
        res = query.order("created_at", desc=True).execute()
        return res.data or []
    except Exception:
        return []
