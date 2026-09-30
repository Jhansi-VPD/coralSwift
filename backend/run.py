"""Run the CoralSwift FastAPI backend:  python run.py  (or uvicorn app.main:app)"""
import socket

import uvicorn

from app.core.config import settings

DISPLAY_HOST = "localhost" if settings.host in ("0.0.0.0", "127.0.0.1", "::") else settings.host


def _port_free(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            s.bind((host, port))
            return True
        except OSError:
            return False


if __name__ == "__main__":
    if not _port_free(settings.host if settings.host != "0.0.0.0" else "127.0.0.1", settings.port):
        print(
            f"\n[!] Port {settings.port} is already in use on this machine.\n"
            f"    Start on another port instead:\n"
            f"        PORT=8002 python run.py        (macOS/Linux)\n"
            f"        set PORT=8002 && python run.py (Windows)\n"
            f"    Then point the frontend at it: NEXT_PUBLIC_API_URL=http://localhost:8002\n"
        )
    print(
        f"\n  CoralSwift API"
        f"\n  ------------------------------"
        f"\n  Swagger UI : http://{DISPLAY_HOST}:{settings.port}/docs"
        f"\n  ReDoc      : http://{DISPLAY_HOST}:{settings.port}/redoc"
        f"\n  OpenAPI    : http://{DISPLAY_HOST}:{settings.port}/openapi.json"
        f"\n  Health     : http://{DISPLAY_HOST}:{settings.port}/health"
        f"\n",
        flush=True,
    )
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload,
    )
