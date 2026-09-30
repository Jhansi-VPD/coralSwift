import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCaseStudies, saveCaseStudy, deleteCaseStudy } from '@/lib/api';
import { createAdminClient } from '@backend/lib/supabase/admin';

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
    const mode = searchParams.get('mode');
    const featuredOnly = searchParams.get('featured') === 'true';

    if (mode === 'admin') {
      const adminClient = createAdminClient();
      if (adminClient) {
        try {
          const { data, error } = await adminClient
            .from('case_studies')
            .select('*')
            .order('created_at', { ascending: false });
          if (!error && data && data.length > 0) {
            return NextResponse.json(data);
          }
        } catch (e) {
          console.warn('Supabase admin case_studies query fallback:', e);
        }
      }
      const fallback = await getCaseStudies(false);
      return NextResponse.json(fallback);
    }

    const caseStudies = await getCaseStudies(featuredOnly);
    const published = caseStudies.filter(c => c.status === 'published');
    return NextResponse.json(published);
  } catch (error: any) {
    const fallback = await getCaseStudies(false);
    return NextResponse.json(fallback);
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
    const saved = await saveCaseStudy(body, adminClient, ip);

    revalidatePath('/case-studies');
    revalidatePath('/case-studies/[slug]', 'page');
    revalidatePath('/');
    revalidatePath('/admin/case-studies');

    return NextResponse.json(saved);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save case study' }, { status: 500 });
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
      return NextResponse.json({ error: 'Missing case study id' }, { status: 400 });
    }
    const ip = getAuditIp(request);
    const success = await deleteCaseStudy(id, adminClient, ip);

    revalidatePath('/case-studies');
    revalidatePath('/case-studies/[slug]', 'page');
    revalidatePath('/');
    revalidatePath('/admin/case-studies');

    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete case study' }, { status: 500 });
  }
}
