import { NextRequest, NextResponse } from 'next/server';
import { requireRole, isRejected, parseJsonBody, jsonError, audit } from '@backend/lib/api-helpers';
import { createServiceClient } from '@backend/lib/auth-server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/client/documents — list downloadable documents for the org.
 * Query: ?projectId=<uuid>&category=deliverable|contract|report|agreement
 */
export async function GET(request: NextRequest) {
  const guard = await requireRole('client');
  if (isRejected(guard)) return guard;

  const { data: contact } = await guard.supabase
    .from('client_contacts')
    .select('organization_id')
    .eq('profile_id', guard.user.id)
    .maybeSingle();

  if (!contact) return jsonError('No client organization linked', 403);

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const category = searchParams.get('category');

  // hr_record category is never client-visible
  let query = guard.supabase
    .from('documents')
    .select('id, title, category, file_name, file_size_bytes, mime_type, created_at, project:projects (id, name)')
    .eq('organization_id', contact.organization_id)
    .neq('category', 'hr_record');

  if (projectId) query = query.eq('project_id', projectId);
  if (category) query = query.eq('category', category);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data);
}

/**
 * POST /api/client/documents — get a short-lived signed download URL for one document.
 * Body: { id }
 * Returns { downloadUrl, expiresIn } — URL valid for 10 minutes, org-scoped.
 */
export async function POST(request: NextRequest) {
  const guard = await requireRole('client');
  if (isRejected(guard)) return guard;

  const body = await parseJsonBody<{ id: string }>(request, ['id']);
  if (isRejected(body)) return body;

  const { data: contact } = await guard.supabase
    .from('client_contacts')
    .select('organization_id')
    .eq('profile_id', guard.user.id)
    .maybeSingle();

  if (!contact) return jsonError('No client organization linked', 403);

  // Verify the document belongs to this client's org before signing anything
  const { data: doc } = await guard.supabase
    .from('documents')
    .select('id, storage_path, file_name, category')
    .eq('id', body.id)
    .eq('organization_id', contact.organization_id)
    .neq('category', 'hr_record')
    .maybeSingle();

  if (!doc) return jsonError('Document not found', 404);

  // Sign with the service client (bucket is private)
  const service = createServiceClient();
  if (!service) return jsonError('Server configuration error', 500);

  const { data: signed, error: signError } = await service.storage
    .from('documents')
    .createSignedUrl(doc.storage_path, 600); // 10 minutes

  if (signError || !signed) {
    return jsonError(signError?.message || 'Failed to generate download link', 500);
  }

  await audit('CLIENT_DOCUMENT_DOWNLOAD', 'documents', doc.id, guard);
  return NextResponse.json({ downloadUrl: signed.signedUrl, fileName: doc.file_name, expiresIn: 600 });
}
