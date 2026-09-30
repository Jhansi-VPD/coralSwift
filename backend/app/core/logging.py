"""Structured application logging.

Emits single-line key=value logs (easy to grep / ship). Never log secrets:
passwords, tokens, keys are filtered by field name in `safe_fields`.
"""
import logging
import sys
import time

from fastapi import FastAPI, Request

SENSITIVE_KEYS = {"password", "token", "access_token", "refresh_token", "secret", "authorization", "api_key"}


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)


def configure_logging(debug: bool = False) -> None:
    level = logging.DEBUG if debug else logging.INFO
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(name)s %(message)s"))
    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(level)
    # Quiet the noisier third-party loggers in production
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)


def safe_fields(fields: dict) -> dict:
    return {k: ("***" if k.lower() in SENSITIVE_KEYS else v) for k, v in fields.items()}


def register_request_logging(app: FastAPI) -> None:
    logger = get_logger("coralswift.http")

    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        start = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            logger.exception("UNHANDLED %s %s", request.method, request.url.path)
            raise
        duration_ms = (time.perf_counter() - start) * 1000
        # Skip the noisy built-in docs endpoints
        if request.url.path not in ("/docs", "/redoc", "/openapi.json"):
            logger.info(
                "%s %s -> %s %.1fms ip=%s",
                request.method,
                request.url.path,
                response.status_code,
                duration_ms,
                request.headers.get("x-forwarded-for", "-").split(",")[0] or "-",
            )
        return response
