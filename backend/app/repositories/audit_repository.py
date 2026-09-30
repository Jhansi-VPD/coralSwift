"""audit_logs table access."""
from app.repositories.base import Repository


class AuditRepository(Repository):
    table = "audit_logs"

    def record(
        self,
        *,
        action: str,
        entity_type: str,
        entity_id: str | None,
        user_id: str | None,
        user_email: str | None,
        details: dict | None,
        ip: str | None,
    ) -> None:
        """Fire-and-forget; audit failures must never break the request."""
        try:
            self.insert_one({
                "user_id": user_id,
                "user_email": user_email,
                "action": action,
                "entity_type": entity_type,
                "entity_id": entity_id,
                "details": details,
                "ip_address": ip,
            })
        except Exception:
            pass

    def recent(self, limit: int = 50) -> list[dict]:
        return (
            self.sb.table(self.table).select("*")
            .order("created_at", desc=True).limit(limit).execute().data or []
        )
