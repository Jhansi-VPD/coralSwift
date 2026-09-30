/**
 * API ROUTE HELPERS
 *
 * Every /api/{hr,sales,manager,employee,client,admin}/* handler starts with
 * requireRole() or requirePermission(); these helpers return either an
 * AuthContext (proceed) or a NextResponse (reject, already sent).
 */

import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getAuthContext, type AuthContext } from './auth-server';
import { can, type Permission, type Role } from './rbac';

export function jsonError(message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

type Handler = (ctx: AuthContext) => Promise<NextResponse>;

/** Allow only these roles to proceed. usage: const guard = await requireRole(req,'hr','admin') */
export async function requireRole(...roles: Role[]): Promise<AuthContext | NextResponse> {
  const ctx = await getAuthContext();
  if (!ctx) return jsonError('Authentication required', 401);
  if (!roles.includes(ctx.user.role)) {
    return jsonError(`Forbidden: requires role ${roles.join(' or ')}`, 403);
  }
  return ctx;
}

export async function requirePermission(permission: Permission): Promise<AuthContext | NextResponse> {
  const ctx = await getAuthContext();
  if (!ctx) return jsonError('Authentication required', 401);
  if (!can(ctx.user.role, permission)) {
    return jsonError(`Forbidden: missing '${permission}' permission`, 403);
  }
  return ctx;
}

/** Type narrowing: true when the guard returned an error response. */
export function isRejected<T>(r: T | NextResponse): r is NextResponse {
  return r instanceof NextResponse;
}

/**
 * Validates a JSON body against a required-field list.
 * Returns the parsed body or a 400 response.
 */
export async function parseJsonBody<T = Record<string, unknown>>(
  request: NextRequest,
  requiredFields: string[] = []
): Promise<T | NextResponse> {
  let body: T;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }
  const missing = requiredFields.filter(f => (body as Record<string, unknown>)?.[f] == null);
  if (missing.length > 0) {
    return jsonError(`Missing required fields: ${missing.join(', ')}`, 400);
  }
  return body;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isValidUUID(v: unknown): v is string {
  return typeof v === 'string' && UUID_RE.test(v);
}

/** Server-side audit trail — always via service client so RLS never blocks it. */
export async function audit(
  action: string,
  entityType: string,
  entityId: string | null,
  ctx?: AuthContext | null,
  details?: Record<string, unknown>,
  ip?: string | null
): Promise<void> {
  try {
    const { createServiceClient } = await import('./auth-server');
    const client = createServiceClient();
    if (!client) return;
    await client.from('audit_logs').insert({
      user_id: ctx?.user.id ?? null,
      user_email: ctx?.user.email ?? null,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: details ?? null,
      ip_address: ip ?? null,
    });
  } catch (e) {
    console.warn('audit log write failed:', e);
  }
}

/** Notify a user (service-role write; notifications are user-private). */
export async function notify(
  userId: string,
  title: string,
  bodyText: string,
  category: string,
  link?: string
): Promise<void> {
  try {
    const { createServiceClient } = await import('./auth-server');
    const client = createServiceClient();
    if (!client) return;
    await client.from('notifications').insert({
      user_id: userId,
      title,
      body: bodyText,
      category,
      link: link ?? null,
    });
  } catch (e) {
    console.warn('notification write failed:', e);
  }
}

export type { SupabaseClient };
