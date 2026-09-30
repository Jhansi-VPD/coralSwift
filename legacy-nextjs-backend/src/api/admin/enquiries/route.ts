import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@backend/lib/supabase/admin';
import { initialEnquiries } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const adminClient = createAdminClient();
    if (!adminClient) {
      // Zero-config demo mode only — never used to mask a real failure
      return NextResponse.json(initialEnquiries);
    }
    const { data, error } = await adminClient
      .from('enquiries')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message || 'Failed to fetch enquiries');
    return NextResponse.json(data || []);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch enquiries';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const adminClient = createAdminClient();
  if (!adminClient) {
    return NextResponse.json({ success: true, message: 'Fallback mode active (no database configured)' });
  }
  try {
    const body = await request.json();
    const { id, status, notes } = body;
    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }
    const now = new Date().toISOString();
    const { error } = await adminClient
      .from('enquiries')
      .update({ status, admin_notes: notes, updated_at: now })
      .eq('id', id);
    if (error) throw new Error(error.message || 'Failed to update enquiry');
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    // FIX (ISSUES_REPORT #2): return the real error instead of fake success
    const message = error instanceof Error ? error.message : 'Failed to update enquiry';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const adminClient = createAdminClient();
  if (!adminClient) {
    return NextResponse.json({ success: true, message: 'Fallback mode active (no database configured)' });
  }
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing enquiry id' }, { status: 400 });
    }
    const { error } = await adminClient.from('enquiries').delete().eq('id', id);
    if (error) throw new Error(error.message || 'Failed to delete enquiry');
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    // FIX (ISSUES_REPORT #2): return the real error instead of fake success
    const message = error instanceof Error ? error.message : 'Failed to delete enquiry';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
