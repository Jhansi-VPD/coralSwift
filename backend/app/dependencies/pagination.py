"""Shared pagination dependency + envelope."""
from dataclasses import dataclass

from fastapi import Query, HTTPException


@dataclass
class PageParams:
    page: int
    page_size: int

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size


def pagination_params(
    page: int = Query(1, ge=1, description="1-based page number"),
    page_size: int = Query(20, ge=1, le=100, description="Rows per page (max 100)"),
) -> PageParams:
    return PageParams(page=page, page_size=page_size)


def page_envelope(items: list, total: int, params: PageParams) -> dict:
    if total < 0:
        raise HTTPException(status_code=500, detail="Negative total from count query")
    return {
        "items": items,
        "pagination": {
            "page": params.page,
            "page_size": params.page_size,
            "total": total,
            "total_pages": max(1, -(-total // params.page_size)),
        },
    }
