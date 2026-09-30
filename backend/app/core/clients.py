"""Supabase client factories.

Two flavors, mirroring the legacy TS backend:

- anon_client(token)  : user-context client. When a bearer token is supplied it
                        is used as the request's auth (RLS applies as that user);
                        otherwise the anon key (RLS anon policies apply).
- service_client()    : service-role client. Bypasses RLS entirely. Server-only
                        operations: user provisioning, audit, notifications,
                        storage uploads/signing.
"""
from supabase import Client, ClientOptions, create_client

from app.core.config import settings


def anon_client(token: str | None = None) -> Client | None:
    if not settings.supabase_configured:
        return None
    options = ClientOptions(
        headers={"Authorization": f"Bearer {token}"} if token else {},
    )
    return create_client(settings.supabase_url, settings.supabase_anon_key, options)


def service_client() -> Client | None:
    if not settings.service_role_configured:
        return None
    options = ClientOptions(auto_refresh_token=False, persist_session=False)
    return create_client(settings.supabase_url, settings.supabase_service_role_key, options)
