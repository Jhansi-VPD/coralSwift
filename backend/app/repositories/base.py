"""Base repository — the ONLY place that knows supabase-py quirks.

postgrest 2.x notes (learned the hard way):
  - Write chains (insert/update/upsert) return a LIST from execute() — never
    chain .single() there; use *_one helpers below.
  - Read chains support .single() / .maybe_single() as before.
"""
from typing import Any

from postgrest.exceptions import APIError
from supabase import Client

from app.core.exceptions import ConflictError, NotFoundError


class Repository:
    table: str = ""

    def __init__(self, client: Client):
        self.sb = client

    # ---- reads -------------------------------------------------------------
    def select(self, columns: str = "*", **filters):
        q = self.sb.table(self.table).select(columns)
        for col, val in filters.items():
            q = q.eq(col, val)
        return q

    def fetch_all(self, columns: str = "*", **filters) -> list[dict]:
        return (self.select(columns, **filters).execute()).data or []

    def fetch_one(self, columns: str = "*", **filters) -> dict | None:
        q = self.select(columns, **filters)
        res = q.limit(1).execute()
        return (res.data or [None])[0]

    def fetch_by_id(self, row_id: str, columns: str = "*") -> dict | None:
        return self.fetch_one(columns, id=row_id)

    def exists(self, **filters) -> bool:
        return self.fetch_one("id", **filters) is not None

    # ---- writes (list-returning in postgrest 2.x) ---------------------------
    def _guard(self, e: Exception, fallback: str) -> None:
        code = getattr(getattr(e, "args", [None])[0], "get", lambda _k: None)("code") if e.args and isinstance(e.args[0], dict) else None
        if code == "23505":
            raise ConflictError(fallback)
        raise

    def insert_one(self, payload: dict, columns: str = "*", not_found: str | None = None) -> dict:
        try:
            res = self.sb.table(self.table).insert(payload).select(columns).execute()
        except APIError as e:
            self._guard(e, not_found or "Duplicate record")
            raise
        if not res.data:
            raise NotFoundError(not_found or "Insert returned no row")
        return res.data[0]

    def insert_many(self, rows: list[dict]) -> list[dict]:
        if not rows:
            return []
        res = self.sb.table(self.table).insert(rows).execute()
        return res.data or []

    def update_one(self, row_id: str, payload: dict, columns: str = "*", not_found: str | None = None) -> dict:
        try:
            res = self.sb.table(self.table).update(payload).eq("id", row_id).select(columns).execute()
        except APIError as e:
            self._guard(e, not_found or "Duplicate record")
            raise
        if not res.data:
            raise NotFoundError(not_found or f"{self.table} row not found")
        return res.data[0]

    def update_where(self, payload: dict, columns: str = "*", not_found: str | None = None, **filters) -> list[dict]:
        q = self.sb.table(self.table).update(payload)
        for col, val in filters.items():
            q = q.eq(col, val)
        try:
            res = q.select(columns).execute()
        except APIError as e:
            self._guard(e, not_found or "Duplicate record")
            raise
        return res.data or []

    def upsert_one(self, payload: dict, on_conflict: str, columns: str = "*") -> dict:
        res = self.sb.table(self.table).upsert(payload, on_conflict=on_conflict).select(columns).execute()
        if not res.data:
            raise NotFoundError("Upsert returned no row")
        return res.data[0]

    def delete_where(self, **filters) -> None:
        q = self.sb.table(self.table).delete()
        for col, val in filters.items():
            q = q.eq(col, val)
        q.execute()

    # ---- pagination helper --------------------------------------------------
    def fetch_page(self, columns: str, *, offset: int, limit: int, order: str, desc: bool = True, count: bool = False, **filters):
        q = self.sb.table(self.table).select(columns, count="exact" if count else None)
        for col, val in filters.items():
            q = q.eq(col, val)
        q = q.order(order, desc=desc).range(offset, offset + limit - 1)
        res = q.execute()
        total = getattr(res, "count", None)
        return res.data or [], (total if total is not None else len(res.data or []))
