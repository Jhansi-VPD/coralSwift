import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@backend/lib/auth-server';
import { createClient } from '@supabase/supabase-js';
import { checkFormRateLimit } from '@backend/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/applications/submit — server-side job application intake.
 *
 * FIX (ISSUES_REPORT #3): the resume upload previously happened in the
 * candidate's browser with the anon key against a PRIVATE storage bucket
 * (always rejected, silently swallowed). Upload now happens here with the
 * service-role client, and the DB row points at the real storage path.
 *
 * Body: multipart/form-data
 *   job_id?, full_name, email, phone?, portfolio_url?, linkedin_url?,
 *   cover_note?, resume (File), resume_filename
 */
export async function POST(request: NextRequest) {
  try {
    // FIX (ISSUES_REPORT #5): public form abuse protection
    const ipHeader = request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const formLimit = await checkFormRateLimit(ipHeader.trim());
    if (!formLimit.success) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '600' } }
      );
    }

    const service = createServiceClient();

    // Fallback: anon client when service key is absent (dev zero-config)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const client = service ?? (supabaseUrl && anonKey && !supabaseUrl.includes('your-project')
      ? createClient(supabaseUrl, anonKey)
      : null);

    if (!client) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    const form = await request.formData();
    const fullName = String(form.get('full_name') || '').trim();
    const email = String(form.get('email') || '').trim().toLowerCase();
    const jobId = String(form.get('job_id') || '').trim();
    const resumeFile = form.get('resume');

    if (!fullName || !email) {
      return NextResponse.json({ error: 'Missing required fields: full_name, email' }, { status: 400 });
    }
    if (!(resumeFile instanceof File) || resumeFile.size === 0) {
      return NextResponse.json({ error: 'A resume file is required' }, { status: 400 });
    }
    // 10 MB cap
    if (resumeFile.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Resume must be under 10 MB' }, { status: 413 });
    }
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(resumeFile.type)) {
      return NextResponse.json({ error: 'Resume must be a PDF or Word document' }, { status: 415 });
    }

    // Resolve job (uuid or slug)
    let validJobId: string | null = null;
    if (jobId) {
      const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (UUID_RE.test(jobId)) {
        const { data } = await client.from('jobs').select('id').eq('id', jobId).maybeSingle();
        validJobId = data?.id ?? null;
      }
      if (!validJobId) {
        const { data: found } = await client
          .from('jobs').select('id').eq('slug', jobId).maybeSingle();
        validJobId = found?.id ?? null;
      }
    }

    // Upload resume server-side (service client bypasses storage RLS)
    const cleanFilename = resumeFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `resumes/${Date.now()}_${cleanFilename}`;

    const { error: uploadError } = await client.storage
      .from('resumes')
      .upload(storagePath, resumeFile, {
        contentType: resumeFile.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Resume upload failed:', uploadError);
      return NextResponse.json(
        { error: 'Failed to store resume. Please try again.' },
        { status: 500 }
      );
    }

    // Insert the application row pointing at the REAL storage path
    const { data: application, error: insertError } = await client
      .from('applications')
      .insert({
        job_id: validJobId,
        full_name: fullName.slice(0, 255),
        email,
        phone: (form.get('phone') as string) || null,
        portfolio_url: (form.get('portfolio_url') as string) || null,
        linkedin_url: (form.get('linkedin_url') as string) || null,
        cover_note: (form.get('cover_note') as string) || null,
        resume_path: storagePath,
        resume_filename: cleanFilename.slice(0, 255),
        status: 'submitted',
      })
      .select('id')
      .single();

    if (insertError) {
      // Roll back the orphaned upload
      await client.storage.from('resumes').remove([storagePath]);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, id: application.id, message: 'Application submitted successfully.' },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Application submit error:', error);
    const message = error instanceof Error ? error.message : 'Failed to submit application';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
