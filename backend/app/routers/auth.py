"""Auth router (legacy /api paths) — delegates to the v1 controllers.

One implementation, two mounts: /api/auth/* and /api/v1/auth/* stay in lockstep
by construction, so a service fix can never desynchronize the versions.
"""
from app.api.v1.auth import router  # noqa: F401 — re-export (same /auth prefix)
