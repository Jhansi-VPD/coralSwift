import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServices, saveService, deleteService } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'published' | 'draft' | 'archived' | undefined;
    const services = await getServices(status || undefined);
    return NextResponse.json(services);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch services' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const saved = await saveService(body);

    // Revalidate public routes so Server Components refresh immediately
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing service id' }, { status: 400 });
    }

    const success = await deleteService(id);

    revalidatePath('/services');
    revalidatePath('/services/[slug]', 'page');
    revalidatePath('/');
    revalidatePath('/admin/services');

    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete service' }, { status: 500 });
  }
}
