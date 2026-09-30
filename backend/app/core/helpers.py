"""Shared helpers: error translation + legacy facades.

audit()/notify() now delegate to the service layer (single implementation,
centralized repositories). Kept here so the routers' imports stay stable.
"""
from typing import Any

from fastapi import HTTPException
from supabase import Client


def raise_db_error(e: Exception, fallback: str = "Database operation failed") -> None:
    """Translate a supabase-py error into a proper HTTPException."""
    message = str(e)
    status = 500
    lowered = message.lower()
    if "duplicate key" in lowered or "23505" in message:
        status, message = 409, "A record with these unique values already exists"
    elif "violates foreign key" in lowered or "23503" in message:
        status, message = 409, "Referenced record does not exist"
    elif "row-level security" in lowered or "42501" in message:
        status, message = 403, "Not permitted by database policies"
    elif "invalid input" in lowered or "22p02" in message:
        status, message = 400, "Invalid value supplied"
    raise HTTPException(status_code=status, detail=message or fallback)


def q(client: Client, table: str):
    """Small convenience: client.table(table) with error raising deferred to callers."""
    return client.table(table)


def audit(
    action: str,
    entity_type: str,
    entity_id: str | None,
    user: Any = None,
    details: dict | None = None,
    ip: str | None = None,
) -> None:
    """Write an audit log row — delegates to app.services.audit_service."""
    from app.services.audit_service import audit as _audit
    _audit(action, entity_type, entity_id, user, details, ip)


def notify(
    user_id: str,
    title: str,
    body: str,
    category: str,
    link: str | None = None,
) -> None:
    """Insert a notification — delegates to app.services.audit_service."""
    from app.services.audit_service import notify_user as _notify
    _notify(user_id, title, body, category, link)


def notify_many(user_ids: list[str | None], title: str, body: str, category: str, link: str | None = None) -> None:
    for uid in user_ids:
        if uid:
            notify(uid, title, body, category, link)
