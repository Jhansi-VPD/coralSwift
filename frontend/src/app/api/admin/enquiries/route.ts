import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const { data, error } = await adminClient
      .from('enquiries')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message || 'Failed to fetch enquiries');
    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch enquiries' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update enquiry' }, { status: 500 });
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
      return NextResponse.json({ error: 'Missing enquiry id' }, { status: 400 });
    }
    const { error } = await adminClient.from('enquiries').delete().eq('id', id);
    if (error) throw new Error(error.message || 'Failed to delete enquiry');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete enquiry' }, { status: 500 });
  }
}
