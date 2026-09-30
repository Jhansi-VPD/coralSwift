"""Notifications — shared inbox for every staff/client role."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.security import SessionUser, require_role
from app.core.clients import service_client
from app.repositories.notification_repository import NotificationRepository

router = APIRouter(prefix="/notifications", tags=["notifications"])


def _repo() -> NotificationRepository:
    sb = service_client()
    if not sb:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail="Supabase not configured")
    return NotificationRepository(sb)


@router.get("", summary="My notifications")
def my_notifications(unread: bool = False, user: SessionUser = Depends(require_role("hr", "sales", "manager", "employee", "qa", "client"))):
    return _repo().list_for_user(user.id, unread_only=unread)


class NotificationUpdate(BaseModel):
    id: str | None = None


@router.patch("", summary="Mark one (id) or all as read")
def mark_read(body: NotificationUpdate, user: SessionUser = Depends(require_role("hr", "sales", "manager", "employee", "qa", "client"))):
    _repo().mark_read(user.id, body.id)
    return {"success": True}
