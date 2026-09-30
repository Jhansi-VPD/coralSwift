/**
 * ROLE-BASED ACCESS CONTROL
 *
 * Single source of truth for the 6 CoralSwift roles and what each may do.
 * Used by:
 *   - API route handlers (lib/api-helpers.ts requireRole)
 *   - middleware.ts (role-scoped route prefixes)
 *   - dashboard UI guards
 *
 * Mirrors the RLS helper functions in
 * supabase/migrations/20260929010000_org_rbac_rls_policies.sql
 */

export const ROLES = ['admin', 'hr', 'sales', 'manager', 'employee', 'client'] as const;
export type Role = (typeof ROLES)[number];

export interface SessionUser {
  id: string;        // auth.users id == profiles.id
  email: string;
  role: Role;
  fullName: string;
  isActive: boolean;
}

// Route prefixes each role may access (portal UI + its API namespace).
export const ROLE_ROUTE_PREFIXES: Record<Role, string> = {
  admin: '/admin',
  hr: '/hr',
  sales: '/sales',
  manager: '/manager',
  employee: '/employee',
  client: '/client',
};

// API namespaces each role may call.
export const ROLE_API_PREFIXES: Record<Role, string[]> = {
  admin: ['/api/hr', '/api/sales', '/api/manager', '/api/employee', '/api/client', '/api/admin'],
  hr: ['/api/hr'],
  sales: ['/api/sales'],
  manager: ['/api/manager', '/api/employee'], // managers use some employee endpoints for own tasks/leave
  employee: ['/api/employee'],
  client: ['/api/client'],
};

// Feature permissions — mirrors RLS. Extend as the dashboards grow.
export type Permission =
  // HR
  | 'employees.read' | 'employees.write'
  | 'leave.approve' | 'attendance.read.all'
  | 'departments.write'
  // Sales
  | 'leads.read' | 'leads.write'
  | 'clients.read' | 'clients.write'
  | 'proposals.write' | 'contracts.write' | 'invoices.write' | 'sales.analytics'
  // Delivery
  | 'projects.read.all' | 'projects.write'
  | 'tasks.assign' | 'milestones.write'
  | 'timesheets.approve'
  | 'reviews.write'
  // Employee self-service
  | 'tasks.read.own' | 'tasks.update.own'
  | 'timesheets.own' | 'leave.own'
  // Client portal
  | 'client.projects.read' | 'client.invoices.read'
  | 'client.tickets' | 'client.documents.read'
  // Admin-only
  | 'users.manage' | 'settings.write' | 'audit.read';

const HR_PERMS: Permission[] = [
  'employees.read', 'employees.write', 'leave.approve', 'attendance.read.all',
  'departments.write', 'projects.read.all', 'users.manage', 'audit.read',
];

const SALES_PERMS: Permission[] = [
  'leads.read', 'leads.write', 'clients.read', 'clients.write',
  'proposals.write', 'contracts.write', 'invoices.write', 'sales.analytics',
];

const MANAGER_PERMS: Permission[] = [
  'projects.read.all', 'projects.write', 'tasks.assign', 'milestones.write',
  'timesheets.approve', 'reviews.write', 'leave.approve',
  'tasks.read.own', 'tasks.update.own', 'timesheets.own', 'leave.own',
];

const EMPLOYEE_PERMS: Permission[] = [
  'tasks.read.own', 'tasks.update.own', 'timesheets.own', 'leave.own',
];

const CLIENT_PERMS: Permission[] = [
  'client.projects.read', 'client.invoices.read',
  'client.tickets', 'client.documents.read',
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: Array.from(new Set<Permission>([
    ...HR_PERMS, ...SALES_PERMS, ...MANAGER_PERMS, ...EMPLOYEE_PERMS, ...CLIENT_PERMS,
    'users.manage', 'settings.write', 'audit.read',
  ])),
  hr: HR_PERMS,
  sales: SALES_PERMS,
  manager: MANAGER_PERMS,
  employee: EMPLOYEE_PERMS,
  client: CLIENT_PERMS,
};

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canAccessApiPath(role: Role, pathname: string): boolean {
  const prefixes = ROLE_API_PREFIXES[role] ?? [];
  return prefixes.some(p => pathname === p || pathname.startsWith(p + '/'));
}
