"""Centralized application exceptions.

Every error leaves the API as:
    { "success": false, "message": "<human message>", "error_code": "<MACHINE_CODE>" }

Existing `HTTPException(detail=...)` usage keeps working: the FastAPI handler
wraps plain `detail` strings into the same envelope so responses stay uniform
without rewriting every router.
"""
import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

logger = logging.getLogger("coralswift.exceptions")


class AppError(Exception):
    """Base class for domain errors carrying an HTTP status + machine code."""

    status_code = 500
    error_code = "INTERNAL_ERROR"

    def __init__(self, message: str | None = None, *, error_code: str | None = None):
        self.message = message or self.__class__.__doc__.strip().splitlines()[0] if self.__doc__ else "Internal error"
        if error_code:
            self.error_code = error_code
        super().__init__(self.message)


class NotFoundError(AppError):
    status_code = 404
    error_code = "NOT_FOUND"


class ConflictError(AppError):
    status_code = 409
    error_code = "CONFLICT"


class PermissionDeniedError(AppError):
    status_code = 403
    error_code = "FORBIDDEN"


class ValidationFailedError(AppError):
    status_code = 422
    error_code = "VALIDATION_FAILED"


class RateLimitedError(AppError):
    status_code = 429
    error_code = "RATE_LIMITED"


def _error_payload(message: str, error_code: str) -> dict:
    return {"success": False, "message": message, "error_code": error_code}


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def app_error_handler(_: Request, exc: AppError):
        return JSONResponse(status_code=exc.status_code, content=_error_payload(exc.message, exc.error_code))

    @app.exception_handler(HTTPException)
    async def http_exception_handler(_: Request, exc: HTTPException):
        detail = exc.detail
        if isinstance(detail, dict):
            payload = {"success": False, **detail}
            if "message" not in payload:
                payload["message"] = str(payload.get("detail", "Error"))
        else:
            codes = {401: "UNAUTHENTICATED", 403: "FORBIDDEN", 404: "NOT_FOUND", 409: "CONFLICT",
                     413: "PAYLOAD_TOO_LARGE", 415: "UNSUPPORTED_MEDIA_TYPE", 422: "VALIDATION_FAILED",
                     429: "RATE_LIMITED", 500: "INTERNAL_ERROR", 503: "SERVICE_UNAVAILABLE"}
            payload = _error_payload(str(detail or "Error"), codes.get(exc.status_code, "HTTP_ERROR"))
        return JSONResponse(status_code=exc.status_code, content=payload, headers=getattr(exc, "headers", None))

    @app.exception_handler(RequestValidationError)
    async def validation_handler(_: Request, exc: RequestValidationError):
        first = exc.errors()[0] if exc.errors() else {}
        loc = ".".join(str(p) for p in first.get("loc", []) if p not in ("body",))
        msg = f"Invalid request: {loc}: {first.get('msg', 'validation failed')}" if loc else "Invalid request payload"
        return JSONResponse(status_code=422, content=_error_payload(msg, "VALIDATION_FAILED"))

    @app.exception_handler(Exception)
    async def unhandled_handler(request: Request, exc: Exception):
        # Never leak stack traces / SQL / internals to clients.
        logger.exception("Unhandled error on %s %s", request.method, request.url.path)
        return JSONResponse(status_code=500, content=_error_payload("Internal server error", "INTERNAL_ERROR"))
