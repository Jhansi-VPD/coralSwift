import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServices, saveService, deleteService } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'published' | 'draft' | 'archived' | undefined;
    const mode = searchParams.get('mode');

    if (mode === 'admin') {
      const adminClient = createAdminClient();
      if (!adminClient) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
      }
      const { data, error } = await adminClient
        .from('services')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw new Error(error.message || 'Failed to fetch services');
      return NextResponse.json(data || []);
    }

    const services = await getServices(status || undefined);
    return NextResponse.json(services);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch services' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const body = await request.json();
    const saved = await saveService(body, adminClient);

    revalidatePath('/services');
    revalidatePath('/services/[slug]', 'page');
    revalidatePath('/');
    revalidatePath('/admin/services');

    return NextResponse.json(saved);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save service' }, { status: 500 });
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
      return NextResponse.json({ error: 'Missing service id' }, { status: 400 });
    }

    const success = await deleteService(id, adminClient);

    revalidatePath('/services');
    revalidatePath('/services/[slug]', 'page');
    revalidatePath('/');
    revalidatePath('/admin/services');

    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete service' }, { status: 500 });
  }
}
