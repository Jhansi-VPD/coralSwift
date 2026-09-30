import { NextRequest, NextResponse } from 'next/server';
import { requireRole, isRejected, parseJsonBody, jsonError, audit, notify } from '@backend/lib/api-helpers';

export const dynamic = 'force-dynamic';

const REVIEW_SELECT = `
  id, cycle_name, overall_rating, strengths, improvements, goals, status,
  employee_comment, acknowledged_at, created_at, updated_at,
  employee:employees!performance_reviews_employee_id_fkey (id, employee_code, profile:profiles (full_name, email)),
  reviewer:employees!performance_reviews_reviewer_id_fkey (id, profile:profiles (full_name))
`;

/**
 * GET /api/manager/reviews — reviews written by or about this manager's team.
 * Query: ?employee=<uuid>&cycle=H1+2026
 */
export async function GET(request: NextRequest) {
  const guard = await requireRole('manager', 'admin', 'hr');
  if (isRejected(guard)) return guard;

  const { searchParams } = new URL(request.url);
  const employee = searchParams.get('employee');
  const cycle = searchParams.get('cycle');

  let query = guard.supabase.from('performance_reviews').select(REVIEW_SELECT);
  if (employee) query = query.eq('employee_id', employee);
  if (cycle) query = query.eq('cycle_name', cycle);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data);
}

/**
 * POST /api/manager/reviews — create a review.
 * Body: { employeeId, cycleName, overallRating?, strengths?, improvements?, goals? }
 */
export async function POST(request: NextRequest) {
  const guard = await requireRole('manager', 'admin', 'hr');
  if (isRejected(guard)) return guard;

  const body = await parseJsonBody<{
    employeeId: string;
    cycleName: string;
    overallRating?: number;
    strengths?: string;
    improvements?: string;
    goals?: string;
  }>(request, ['employeeId', 'cycleName']);
  if (isRejected(body)) return body;

  if (body.overallRating !== undefined && (body.overallRating < 1 || body.overallRating > 5)) {
    return jsonError('overallRating must be between 1 and 5', 400);
  }

  const { data: reviewer } = await guard.supabase
    .from('employees').select('id').eq('profile_id', guard.user.id).maybeSingle();

  const { data, error } = await guard.supabase
    .from('performance_reviews')
    .insert({
      employee_id: body.employeeId,
      reviewer_id: reviewer?.id ?? (body.employeeId as string), // fallback; HR/admin path
      cycle_name: body.cycleName.trim(),
      overall_rating: body.overallRating ?? null,
      strengths: body.strengths || null,
      improvements: body.improvements || null,
      goals: body.goals || null,
      status: 'draft',
    })
    .select(REVIEW_SELECT)
    .single();

  if (error) return jsonError(error.message, 500);

  await audit('CREATE_REVIEW', 'performance_reviews', data.id, guard, { cycle: body.cycleName }, request.headers.get('x-real-ip'));
  return NextResponse.json(data, { status: 201 });
}

/**
 * PATCH /api/manager/reviews — edit or transition a review.
 * Body: { id, overallRating?, strengths?, improvements?, goals?, status?, employeeComment? }
 * status: draft → shared (notifies employee) → acknowledged (employee comment path).
 * Only the reviewed employee may set acknowledged + employeeComment.
 */
export async function PATCH(request: NextRequest) {
  const guard = await requireRole('manager', 'admin', 'hr', 'employee');
  if (isRejected(guard)) return guard;

  const body = await parseJsonBody<{
    id: string;
    overallRating?: number;
    strengths?: string;
    improvements?: string;
    goals?: string;
    status?: string;
    employeeComment?: string;
  }>(request, ['id']);
  if (isRejected(body)) return body;

  const { data: review } = await guard.supabase
    .from('performance_reviews')
    .select('id, employee_id, reviewer_id, status')
    .eq('id', body.id)
    .maybeSingle();

  if (!review) return jsonError('Review not found', 404);

  const { data: myEmployee } = await guard.supabase
    .from('employees').select('id').eq('profile_id', guard.user.id).maybeSingle();

  const isReviewer = review.reviewer_id === myEmployee?.id || ['admin', 'hr'].includes(guard.user.role);
  const isReviewedEmployee = review.employee_id === myEmployee?.id;

  if (!isReviewer && !isReviewedEmployee) {
    return jsonError('Not your review', 403);
  }

  const updates: Record<string, unknown> = {};

  if (isReviewer) {
    if (body.overallRating !== undefined) {
      if (body.overallRating < 1 || body.overallRating > 5) return jsonError('rating must be 1–5', 400);
      updates.overall_rating = body.overallRating;
    }
    if (body.strengths !== undefined) updates.strengths = body.strengths;
    if (body.improvements !== undefined) updates.improvements = body.improvements;
    if (body.goals !== undefined) updates.goals = body.goals;
    if (body.status) {
      if (!['draft', 'shared', 'acknowledged'].includes(body.status)) return jsonError('invalid status', 400);
      updates.status = body.status;
    }
  }

  if (isReviewedEmployee) {
    // Employee may only comment + acknowledge a shared review
    if (body.employeeComment !== undefined) updates.employee_comment = body.employeeComment;
    if (body.status === 'acknowledged') {
      if (review.status !== 'shared') return jsonError('Review has not been shared yet', 409);
      updates.status = 'acknowledged';
      updates.acknowledged_at = new Date().toISOString();
    } else if (body.status && !isReviewer) {
      return jsonError('Employees can only acknowledge, not change status otherwise', 403);
    }
  }

  if (Object.keys(updates).length === 0) return jsonError('Nothing to update', 400);

  const { error } = await guard.supabase
    .from('performance_reviews')
    .update(updates)
    .eq('id', body.id);

  if (error) return jsonError(error.message, 500);

  if (updates.status === 'shared') {
    const { data: emp } = await guard.supabase
      .from('employees').select('profile_id').eq('id', review.employee_id).maybeSingle();
    if (emp?.profile_id) {
      await notify(emp.profile_id, 'Performance review shared', 'Your manager shared your performance review.', 'review', '/employee/reviews');
    }
  }

  await audit('UPDATE_REVIEW', 'performance_reviews', body.id, guard, { status: updates.status }, request.headers.get('x-real-ip'));
  return NextResponse.json({ success: true });
}
