import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCaseStudies, getAllCaseStudiesAdmin, saveCaseStudy, deleteCaseStudy } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');
    const featuredOnly = searchParams.get('featured') === 'true';

    if (mode === 'admin') {
      const all = await getAllCaseStudiesAdmin();
      return NextResponse.json(all);
    }

    const caseStudies = await getCaseStudies(featuredOnly);
    const published = caseStudies.filter(c => c.status === 'published');
    return NextResponse.json(published);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch case studies' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const saved = await saveCaseStudy(body);

    // Revalidate public and admin routes so Server Components refresh immediately
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing case study id' }, { status: 400 });
    }

    const success = await deleteCaseStudy(id);

    revalidatePath('/case-studies');
    revalidatePath('/case-studies/[slug]', 'page');
    revalidatePath('/');
    revalidatePath('/admin/case-studies');

    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete case study' }, { status: 500 });
  }
}
