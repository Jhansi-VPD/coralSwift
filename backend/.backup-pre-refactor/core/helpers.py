"""Shared helpers: audit logging, notifications, error translation."""
from typing import Any

from fastapi import HTTPException
from supabase import Client

from app.core.clients import service_client


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
    """Write an audit log row (service-role; never blocks the request on failure)."""
    try:
        client = service_client()
        if not client:
            return
        client.table("audit_logs").insert({
            "user_id": user.id if user else None,
            "user_email": user.email if user else None,
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "details": details or None,
            "ip_address": ip,
        }).execute()
    except Exception as e:  # noqa: BLE001 — audit must never break the request
        print(f"[audit] write failed: {e}")


def notify(
    user_id: str,
    title: str,
    body: str,
    category: str,
    link: str | None = None,
) -> None:
    """Insert a notification row (service-role; failures are non-fatal)."""
    try:
        client = service_client()
        if not client:
            return
        client.table("notifications").insert({
            "user_id": user_id,
            "title": title,
            "body": body,
            "category": category,
            "link": link,
        }).execute()
    except Exception as e:  # noqa: BLE001
        print(f"[notify] write failed: {e}")


def notify_many(user_ids: list[str | None], title: str, body: str, category: str, link: str | None = None) -> None:
    for uid in user_ids:
        if uid:
            notify(uid, title, body, category, link)
