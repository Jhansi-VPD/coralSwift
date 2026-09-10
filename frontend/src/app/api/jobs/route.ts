import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getJobs, saveJob, deleteJob } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'active' | 'closed' | 'draft' | undefined;
    const jobs = await getJobs(status || undefined);
    return NextResponse.json(jobs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch jobs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const saved = await saveJob(body);

    // Revalidate public and admin routes so Server Components refresh immediately
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing job id' }, { status: 400 });
    }

    const success = await deleteJob(id);

    revalidatePath('/careers');
    revalidatePath('/careers/[id]', 'page');
    revalidatePath('/');
    revalidatePath('/admin/careers');

    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete job' }, { status: 500 });
  }
}
