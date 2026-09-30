"""Announcements — admin/HR broadcast posts with per-role targeting.

Every authenticated role can read its feed; only admin/HR can create, update,
or delete announcements (writes go through the service-role API).
"""
import datetime as dt

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from app.core.clients import service_client
from app.core.helpers import audit, notify_many, raise_db_error
from app.core.security import SessionUser, client_ip, get_session_user, require_role

router = APIRouter(prefix="/announcements", tags=["announcements"])

ALL_ROLES = ("admin", "hr", "sales", "manager", "employee", "qa", "client")
VALID_AUDIENCES = {"all", "staff", *ALL_ROLES}
VALID_PRIORITIES = {"low", "normal", "high"}


def _sb():
    sb = service_client()
    if not sb:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    return sb


def _visible_to(audience: str, role: str) -> bool:
    if audience in ("all", role):
        return True
    if audience == "staff":
        return role in ("admin", "hr", "sales", "manager", "employee", "qa")
    return False


@router.get("", summary="My announcements feed (role-targeted)")
def my_feed(user: SessionUser = Depends(get_session_user)):
    sb = _sb()
    try:
        res = sb.table("announcements").select(
            "id, title, body, audience, priority, created_at, expires_at, author:profiles (full_name)"
        ).order("created_at", desc=True).limit(100).execute()
    except Exception as e:
        raise_db_error(e)
    now = dt.datetime.now(dt.timezone.utc)
    feed = []
    for row in res.data or []:
        if row.get("expires_at"):
            try:
                if dt.datetime.fromisoformat(row["expires_at"].replace("Z", "+00:00")) < now:
                    continue
            except Exception:
                pass
        if _visible_to(row.get("audience", "all"), user.role):
            feed.append(row)
    return feed


class AnnouncementIn(BaseModel):
    title: str
    body: str
    audience: str = "all"
    priority: str = "normal"
    expiresAt: str | None = None
    notifyRoles: list[str] | None = None  # subset of roles to ping in-app


@router.post("", status_code=201, summary="Publish an announcement (admin/HR)")
def create_announcement(body: AnnouncementIn, request: Request, user: SessionUser = Depends(require_role("hr"))):
    if body.audience not in VALID_AUDIENCES:
        raise HTTPException(status_code=400, detail=f"audience must be one of: {', '.join(sorted(VALID_AUDIENCES))}")
    if body.priority not in VALID_PRIORITIES:
        raise HTTPException(status_code=400, detail="priority must be low, normal, or high")
    if not body.title.strip() or not body.body.strip():
        raise HTTPException(status_code=422, detail="Title and body are required")

    sb = _sb()
    try:
        res = sb.table("announcements").insert({
            "title": body.title.strip(), "body": body.body.strip(),
            "audience": body.audience, "priority": body.priority,
            "expires_at": body.expiresAt, "created_by": user.id,
        }).select("id, title, audience, priority").execute()
        row = res.data[0]
    except Exception as e:
        raise_db_error(e, "Failed to publish announcement")

    # Best-effort in-app notifications to the targeted audience.
    targets = body.notifyRoles or [body.audience]
    try:
        profiles = sb.table("profiles").select("id, role").eq("is_active", True).execute()
        ids = [p["id"] for p in (profiles.data or []) if _visible_to(body.audience, p.get("role", "employee"))]
        notify_many(ids[:500], f"Announcement: {row['title']}", body.body[:200], "general", None)
    except Exception:
        pass

    audit("CREATE_ANNOUNCEMENT", "announcements", row["id"], user, {"audience": body.audience}, client_ip(request))
    return row


class AnnouncementPatch(BaseModel):
    id: str
    title: str | None = None
    body: str | None = None
    audience: str | None = None
    priority: str | None = None
    expiresAt: str | None = None


@router.patch("", summary="Edit an announcement (admin/HR)")
def patch_announcement(body: AnnouncementPatch, request: Request, user: SessionUser = Depends(require_role("hr"))):
    updates = {
        k: v for k, v in {
            "title": body.title, "body": body.body, "audience": body.audience,
            "priority": body.priority, "expires_at": body.expiresAt,
        }.items() if v is not None
    }
    if body.audience and body.audience not in VALID_AUDIENCES:
        raise HTTPException(status_code=400, detail="invalid audience")
    if body.priority and body.priority not in VALID_PRIORITIES:
        raise HTTPException(status_code=400, detail="invalid priority")
    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update")
    sb = _sb()
    try:
        res = sb.table("announcements").update(updates).eq("id", body.id).select("id").execute()
    except Exception as e:
        raise_db_error(e, "Failed to update announcement")
    if not res.data:
        raise HTTPException(status_code=404, detail="Announcement not found")
    audit("UPDATE_ANNOUNCEMENT", "announcements", body.id, user, updates, client_ip(request))
    return {"success": True}


@router.delete("/{announcement_id}", summary="Delete an announcement (admin/HR)")
def delete_announcement(announcement_id: str, request: Request, user: SessionUser = Depends(require_role("hr"))):
    sb = _sb()
    try:
        sb.table("announcements").delete().eq("id", announcement_id).execute()
    except Exception as e:
        raise_db_error(e)
    audit("DELETE_ANNOUNCEMENT", "announcements", announcement_id, user, ip=client_ip(request))
    return {"success": True}
