import { NextRequest, NextResponse } from 'next/server';
import { requireRole, isRejected, parseJsonBody, jsonError } from '@backend/lib/api-helpers';
import { createServiceClient } from '@backend/lib/auth-server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/employee/documents — documents visible to the signed-in employee:
 *   - HR/policy docs flagged is_shared_with_staff
 *   - documents attached to their employee record
 *   - documents on projects they are a member of
 * Query: ?projectId=<uuid>&category=deliverable|report|hr_record|...
 */
export async function GET(request: NextRequest) {
  const guard = await requireRole('employee', 'manager', 'admin');
  if (isRejected(guard)) return guard;

  const { data: me } = await guard.supabase
    .from('employees').select('id').eq('profile_id', guard.user.id).maybeSingle();

  const projectId = new URL(request.url).searchParams.get('projectId');

  // Member project ids
  let memberProjectIds: string[] = [];
  if (me) {
    const { data: memberships } = await guard.supabase
      .from('project_members').select('project_id').eq('employee_id', me.id);
    memberProjectIds = (memberships ?? []).map(m => m.project_id);
  }

  // Fetch in scopes and merge (simplest correct approach across three visibility rules)
  const [sharedRes, ownRes, projectRes] = await Promise.all([
    guard.supabase
      .from('documents')
      .select('id, title, category, file_name, file_size_bytes, mime_type, created_at, project:projects (id, name)')
      .eq('is_shared_with_staff', true),
    me
      ? guard.supabase
          .from('documents')
          .select('id, title, category, file_name, file_size_bytes, mime_type, created_at, project:projects (id, name)')
          .eq('employee_id', me.id)
      : Promise.resolve({ data: [], error: null }),
    memberProjectIds.length > 0
      ? guard.supabase
          .from('documents')
          .select('id, title, category, file_name, file_size_bytes, mime_type, created_at, project:projects (id, name)')
          .in('project_id', memberProjectIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (sharedRes.error) return jsonError(sharedRes.error.message, 500);

  interface DocRow {
    id: string;
    title: string;
    category: string;
    file_name: string;
    file_size_bytes: number | null;
    mime_type: string | null;
    created_at: string;
    project: { id: string; name: string } | null;
  }

  const merged = new Map<string, DocRow>();
  for (const doc of [...(sharedRes.data ?? []), ...(ownRes.data ?? []), ...(projectRes.data ?? [])] as unknown as DocRow[]) {
    merged.set(doc.id, doc);
  }

  let items = Array.from(merged.values());
  if (projectId) items = items.filter(d => d.project?.id === projectId);

  return NextResponse.json(items);
}

/**
 * POST /api/employee/documents — signed download URL for one visible document.
 * Body: { id }
 */
export async function POST(request: NextRequest) {
  const guard = await requireRole('employee', 'manager', 'admin');
  if (isRejected(guard)) return guard;

  const body = await parseJsonBody<{ id: string }>(request, ['id']);
  if (isRejected(body)) return body;

  const { data: me } = await guard.supabase
    .from('employees').select('id').eq('profile_id', guard.user.id).maybeSingle();

  // Visibility re-check server-side
  const { data: doc } = await guard.supabase
    .from('documents')
    .select('id, storage_path, file_name, is_shared_with_staff, employee_id, project_id')
    .eq('id', body.id)
    .maybeSingle();

  if (!doc) return jsonError('Document not found', 404);

  let allowed = doc.is_shared_with_staff || (me && doc.employee_id === me.id);
  if (!allowed && me && doc.project_id) {
    const { data: membership } = await guard.supabase
      .from('project_members')
      .select('id')
      .eq('project_id', doc.project_id)
      .eq('employee_id', me.id)
      .maybeSingle();
    allowed = Boolean(membership);
  }
  if (!allowed) return jsonError('Not permitted to access this document', 403);

  const service = createServiceClient();
  if (!service) return jsonError('Server configuration error', 500);

  const { data: signed, error } = await service.storage
    .from('documents')
    .createSignedUrl(doc.storage_path, 600);

  if (error || !signed) return jsonError(error?.message || 'Failed to generate download link', 500);

  return NextResponse.json({ downloadUrl: signed.signedUrl, fileName: doc.file_name, expiresIn: 600 });
}
