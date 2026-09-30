"""notifications table access."""
from app.repositories.base import Repository

NOTIFICATION_COLUMNS = "id, title, body, category, link, is_read, created_at"


class NotificationRepository(Repository):
    table = "notifications"

    def send(self, user_id: str, title: str, body: str, category: str = "general", link: str | None = None) -> None:
        """Fire-and-forget notification; never raises into the request path."""
        try:
            self.insert_one({
                "user_id": user_id, "title": title, "body": body,
                "category": category, "link": link,
            })
        except Exception:
            pass

    def send_many(self, user_ids, title: str, body: str, category: str = "general", link: str | None = None) -> None:
        ids = [u for u in user_ids if u]
        if not ids:
            return
        try:
            self.insert_many([
                {"user_id": u, "title": title, "body": body, "category": category, "link": link}
                for u in ids
            ])
        except Exception:
            pass

    def list_for_user(self, user_id: str, unread_only: bool = False, limit: int = 100) -> list[dict]:
        q = self.sb.table(self.table).select(NOTIFICATION_COLUMNS).eq("user_id", user_id).order("created_at", desc=True).limit(limit)
        if unread_only:
            q = q.eq("is_read", False)
        return q.execute().data or []

    def mark_read(self, user_id: str, notification_id: str | None = None) -> None:
        q = self.sb.table(self.table).update({"is_read": True}).eq("user_id", user_id)
        if notification_id:
            q = q.eq("id", notification_id)
        q.execute()
