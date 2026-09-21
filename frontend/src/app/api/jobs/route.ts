import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getJobs, saveJob, deleteJob } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Extracts a trustworthy client IP for audit logging only.
 * Kept intentionally separate from the rate-limit getClientIp() in login/route.ts.
 *
 * Header priority:
 *   1. x-real-ip  — On Vercel, set by the edge network; not overridable by clients.
 *                   ASSUMPTION: Vercel production behaviour. Requires deployment validation.
 *   2. x-forwarded-for[0] — First value in the chain; fallback when x-real-ip absent.
 *   3. null       — Returned when neither header is present (e.g. local dev without proxy).
 *
 * Do not treat the returned value as spoof-proof in local development:
 * without a reverse proxy both headers are client-controlled.
 */
function getAuditIp(request: NextRequest): string {
  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0].trim();
    if (first) return first;
  }
  return 'unknown';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'active' | 'closed' | 'draft' | undefined;
    const mode = searchParams.get('mode');

    if (mode === 'admin') {
      const adminClient = createAdminClient();
      if (!adminClient) {
        return NextResponse.json(await getJobs(undefined));
      }
      const { data, error } = await adminClient
        .from('jobs')
        .select('*, applications:applications(count)')
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message || 'Failed to fetch jobs');
      const jobs = (data || []).map((j: any) => ({
        ...j,
        applications_count: j.applications?.[0]?.count || 0
      }));
      return NextResponse.json(jobs);
    }

    const jobs = await getJobs(status || undefined);
    return NextResponse.json(jobs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch jobs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const body = await request.json();
    const ip = getAuditIp(request);
    const saved = await saveJob(body, adminClient, ip);

    revalidatePath('/careers');
    revalidatePath('/careers/[id]', 'page');
    revalidatePath('/');
    revalidatePath('/admin/careers');

    return NextResponse.json(saved);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save job' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing job id' }, { status: 400 });
    }
    const ip = getAuditIp(request);
    const success = await deleteJob(id, adminClient, ip);

    revalidatePath('/careers');
    revalidatePath('/careers/[id]', 'page');
    revalidatePath('/');
    revalidatePath('/admin/careers');

    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete job' }, { status: 500 });
  }
}
