"""Cross-cutting services: audit trail + user notifications."""
from typing import Any

from app.core.clients import service_client
from app.repositories.audit_repository import AuditRepository
from app.repositories.notification_repository import NotificationRepository


def _repo(repo_cls):
    client = service_client()
    return repo_cls(client) if client else None


def audit(
    action: str,
    entity_type: str,
    entity_id: str | None,
    user: Any = None,
    details: dict | None = None,
    ip: str | None = None,
) -> None:
    repo: AuditRepository | None = _repo(AuditRepository)
    if not repo:
        return
    repo.record(
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        user_id=getattr(user, "id", None),
        user_email=getattr(user, "email", None),
        details=details,
        ip=ip,
    )


def notify_user(user_id: str, title: str, body: str, category: str = "general", link: str | None = None) -> None:
    repo: NotificationRepository | None = _repo(NotificationRepository)
    if repo:
        repo.send(user_id, title, body, category, link)


def notify_many(user_ids, title: str, body: str, category: str = "general", link: str | None = None) -> None:
    repo: NotificationRepository | None = _repo(NotificationRepository)
    if repo:
        repo.send_many(user_ids, title, body, category, link)
