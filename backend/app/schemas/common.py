"""Shared response schemas (documented in Swagger for every list/success shape)."""
from typing import Any, Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total: int
    total_pages: int


class PagedResponse(BaseModel, Generic[T]):
    items: list[T]
    pagination: PaginationMeta


class SuccessResponse(BaseModel):
    success: bool = True
    message: str = "OK"
    data: Any = None


class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    error_code: str = Field(examples=["NOT_FOUND", "FORBIDDEN", "VALIDATION_FAILED"])
