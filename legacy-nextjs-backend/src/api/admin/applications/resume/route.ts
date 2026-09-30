import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@backend/lib/auth-server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/applications/resume?id=<applicationId>
 *
 * FIX (ISSUES_REPORT #3): admin retrieval previously used getPublicUrl() on a
 * PRIVATE bucket (never works). Returns a 10-minute signed URL instead.
 * Requires an authenticated admin session (enforced by middleware).
 */
export async function GET(request: NextRequest) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing application id' }, { status: 400 });
  }

  const service = createServiceClient();
  if (!service) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const { data: application } = await service
    .from('applications')
    .select('id, resume_path, resume_filename, resume_url')
    .eq('id', id)
    .maybeSingle();

  if (!application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  // Legacy rows may hold fake /uploads/... paths — report that honestly
  if (!application.resume_path || application.resume_path.startsWith('/uploads/') || application.resume_path.startsWith('data:')) {
    return NextResponse.json(
      {
        error: 'No stored resume file for this application (legacy record).',
        fallbackUrl: application.resume_url && application.resume_url.startsWith('data:') ? application.resume_url : null,
      },
      { status: 404 }
    );
  }

  const { data: signed, error: signError } = await service.storage
    .from('resumes')
    .createSignedUrl(application.resume_path, 600); // 10 minutes

  if (signError || !signed) {
    return NextResponse.json(
      { error: signError?.message || 'Failed to generate resume link' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    downloadUrl: signed.signedUrl,
    fileName: application.resume_filename,
    expiresIn: 600,
  });
}
