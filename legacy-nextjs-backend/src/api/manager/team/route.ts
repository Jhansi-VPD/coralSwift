import { NextResponse } from 'next/server';
import { requireRole, isRejected, jsonError } from '@backend/lib/api-helpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/manager/team — team oversight (manager's direct reports).
 * Per report: profile, department, status, open task count, hours logged this month,
 * pending approvals, and current project allocations.
 */
export async function GET() {
  const guard = await requireRole('manager', 'admin');
  if (isRejected(guard)) return guard;

  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartIso = monthStart.toISOString().slice(0, 10);

  // 1. Resolve the team
  let employeesQuery = guard.supabase
    .from('employees')
    .select(`
      id, employee_code, designation, status, date_of_joining,
      profile:profiles (id, full_name, email, role),
      department:departments (name)
    `)
    .neq('status', 'exited');

  if (guard.user.role === 'manager') {
    const { data: me } = await guard.supabase
      .from('employees').select('id').eq('profile_id', guard.user.id).maybeSingle();
    if (!me) return jsonError('Manager has no employee record; contact HR', 400);
    employeesQuery = employeesQuery.eq('manager_id', me.id);
  }

  const { data: team, error } = await employeesQuery.order('employee_code');
  if (error) return jsonError(error.message, 500);
  const teamRows = team ?? [];
  const teamIds = teamRows.map(e => e.id);

  if (teamIds.length === 0) return NextResponse.json([]);

  // 2. Aggregate workload per member in parallel
  const [tasksRes, hoursRes, pendingTsRes, pendingLvRes, allocRes] = await Promise.all([
    guard.supabase.from('tasks').select('assignee_id, status').in('assignee_id', teamIds),
    guard.supabase
      .from('timesheets')
      .select('employee_id, hours')
      .in('employee_id', teamIds)
      .gte('work_date', monthStartIso),
    guard.supabase.from('timesheets').select('employee_id').in('employee_id', teamIds).eq('status', 'pending'),
    guard.supabase.from('leave_requests').select('employee_id').in('employee_id', teamIds).eq('status', 'pending'),
    guard.supabase
      .from('project_members')
      .select('employee_id, allocation_percent, project:projects (id, name, status)')
      .in('employee_id', teamIds),
  ]);

  if (tasksRes.error) return jsonError(tasksRes.error.message, 500);

  const openTasks: Record<string, number> = {};
  for (const t of tasksRes.data ?? []) {
    if (t.status !== 'done') openTasks[t.assignee_id] = (openTasks[t.assignee_id] ?? 0) + 1;
  }

  const monthHours: Record<string, number> = {};
  for (const h of hoursRes.data ?? []) {
    monthHours[h.employee_id] = (monthHours[h.employee_id] ?? 0) + Number(h.hours || 0);
  }

  const pendingTs: Record<string, number> = {};
  for (const p of pendingTsRes.data ?? []) pendingTs[p.employee_id] = (pendingTs[p.employee_id] ?? 0) + 1;

  const pendingLv: Record<string, number> = {};
  for (const p of pendingLvRes.data ?? []) pendingLv[p.employee_id] = (pendingLv[p.employee_id] ?? 0) + 1;

  const allocations: Record<string, { project: { id: string; name: string; status: string }; allocation_percent: number }[]> = {};
  for (const a of allocRes.data ?? []) {
    const proj = (a.project as unknown as { id: string; name: string; status: string } | null);
    if (!proj) continue;
    (allocations[a.employee_id] ??= []).push({ project: proj, allocation_percent: a.allocation_percent });
  }

  interface TeamRow {
    id: string;
    employee_code: string;
    designation: string;
    status: string;
    date_of_joining: string;
    profile: { id: string; full_name: string; email: string; role: string } | null;
    department: { name: string } | null;
  }

  return NextResponse.json(
    (teamRows as unknown as TeamRow[]).map(e => ({
      id: e.id,
      employee_code: e.employee_code,
      name: e.profile?.full_name ?? '',
      email: e.profile?.email ?? '',
      designation: e.designation,
      department: e.department?.name ?? null,
      status: e.status,
      joined: e.date_of_joining,
      openTasks: openTasks[e.id] ?? 0,
      hoursThisMonth: monthHours[e.id] ?? 0,
      pendingTimesheets: pendingTs[e.id] ?? 0,
      pendingLeave: pendingLv[e.id] ?? 0,
      allocations: allocations[e.id] ?? [],
    }))
  );
}
