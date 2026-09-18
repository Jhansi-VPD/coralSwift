import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const { data, error } = await adminClient.from('site_settings').select('*');
    if (error) throw new Error(error.message || 'Failed to fetch settings');
    const settingsMap: Record<string, any> = {};
    (data || []).forEach((item: any) => {
      settingsMap[item.key] = item.value;
    });
    return NextResponse.json(settingsMap);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const body = await request.json();
    const { key, value } = body;
    if (!key) {
      return NextResponse.json({ error: 'Missing key' }, { status: 400 });
    }
    const now = new Date().toISOString();
    const { error } = await adminClient
      .from('site_settings')
      .upsert({ key, value, updated_at: now }, { onConflict: 'key' });
    if (error) throw new Error(error.message || 'Failed to update settings');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update settings' }, { status: 500 });
  }
}
