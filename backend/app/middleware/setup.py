"""Middleware registration (kept tiny — main.py stays clean)."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import register_request_logging

SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    # Supabase Auth tokens ride in the Authorization header
    "Cache-Control": "no-store",
}


def register_middleware(app: FastAPI) -> None:
    origins = settings.cors_origin_list
    if not origins:
        raise RuntimeError("CORS_ORIGINS must not be empty — set it in .env")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "x-refresh-token"],
        expose_headers=["Retry-After"],
    )

    @app.middleware("http")
    async def security_headers(request, call_next):
        response = await call_next(request)
        for k, v in SECURITY_HEADERS.items():
            response.headers.setdefault(k, v)
        return response

    register_request_logging(app)
