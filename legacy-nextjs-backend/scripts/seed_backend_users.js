/**
 * BACKEND SEED — six role users + baseline org data
 *
 * Usage:
 *   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in frontend/.env.local
 *   then:  node scripts/seed_backend_users.js
 *
 * Creates (idempotent — safe to re-run):
 *   admin@coralswift.com     → admin
 *   hr@coralswift.com        → hr
 *   sales@coralswift.com     → sales
 *   manager@coralswift.com   → manager
 *   employee@coralswift.com  → employee
 *   client@clientco.com      → client
 * All passwords: CoralSwift#2026  (CHANGE IN PRODUCTION)
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Minimal .env.local loader
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY || SUPABASE_URL.includes('your-project')) {
  console.error('✗ Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in frontend/.env.local first.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = 'CoralSwift#2026';

const USERS = [
  { email: 'admin@coralswift.com', fullName: 'Ada Admin', role: 'admin' },
  { email: 'hr@coralswift.com', fullName: 'Helen HR', role: 'hr' },
  { email: 'sales@coralswift.com', fullName: 'Sam Sales', role: 'sales' },
  { email: 'manager@coralswift.com', fullName: 'Mira Manager', role: 'manager' },
  { email: 'employee@coralswift.com', fullName: 'Evan Employee', role: 'employee' },
];

async function upsertUser({ email, fullName, role }) {
  const { data: existing } = await supabase.auth.admin.listUsers();
  const found = existing?.users?.find(u => u.email === email);

  let userId;
  if (found) {
    userId = found.id;
    console.log(`  = ${email} exists (${role})`);
  } else {
    const { data: created, error } = await supabase.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
    });
    if (error) throw new Error(`${email}: ${error.message}`);
    userId = created.user.id;
    console.log(`  + ${email} created (${role})`);
  }

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    email,
    full_name: fullName,
    role,
  }, { onConflict: 'id' });
  if (profileError) throw new Error(`profile ${email}: ${profileError.message}`);

  return userId;
}

async function main() {
  console.log('Seeding CoralSwift backend demo data…\n[users]');
  const ids = {};
  for (const u of USERS) {
    ids[u.role] = await upsertUser(u);
  }
  ids.client = await upsertUser({
    email: 'client@clientco.com', fullName: 'Clara Client', role: 'client',
  });

  // Departments
  console.log('\n[departments]');
  const { data: dept, error: deptErr } = await supabase
    .from('departments')
    .upsert({ name: 'Engineering', head_of_department: ids.manager }, { onConflict: 'name' })
    .select('id')
    .single();
  if (deptErr) throw deptErr;
  console.log('  + Engineering');

  // Employees (manager + employee)
  console.log('\n[employees]');
  const { data: mgrEmp, error: mgrErr } = await supabase
    .from('employees')
    .upsert(
      { profile_id: ids.manager, employee_code: 'EMP-001', designation: 'Delivery Manager', department_id: dept.id, status: 'active' },
      { onConflict: 'profile_id' }
    )
    .select('id')
    .single();
  if (mgrErr) throw mgrErr;
  console.log('  + EMP-001 Mira Manager (manager)');

  const { data: empEmp, error: empErr } = await supabase
    .from('employees')
    .upsert(
      { profile_id: ids.employee, employee_code: 'EMP-002', designation: 'Software Engineer', department_id: dept.id, manager_id: mgrEmp.id, status: 'active' },
      { onConflict: 'profile_id' }
    )
    .select('id')
    .single();
  if (empErr) throw empErr;
  console.log('  + EMP-002 Evan Employee (reports to EMP-001)');

  // Client org + contact
  console.log('\n[client organization]');
  const { data: org, error: orgErr } = await supabase
    .from('client_organizations')
    .upsert({ name: 'ClientCo Industries', industry: 'Fintech', status: 'active', account_owner_id: ids.sales }, { onConflict: 'name' })
    .select('id')
    .single();
  if (orgErr) throw orgErr;

  const { error: contactErr } = await supabase
    .from('client_contacts')
    .upsert(
      { organization_id: org.id, profile_id: ids.client, name: 'Clara Client', email: 'client@clientco.com', is_primary: true },
      { onConflict: 'profile_id' }
    );
  if (contactErr) throw contactErr;
  console.log('  + ClientCo Industries (contact: client@clientco.com)');

  // Sample project
  console.log('\n[project]');
  const { data: proj, error: projErr } = await supabase
    .from('projects')
    .upsert(
      { name: 'ClientCo Payments Platform', code: 'CCP-01', organization_id: org.id, manager_id: mgrEmp.id, status: 'active', health: 'on_track' },
      { onConflict: 'code' }
    )
    .select('id')
    .single();
  if (projErr) throw projErr;
  console.log('  + CCP-01 ClientCo Payments Platform');

  await supabase.from('project_members').upsert(
    { project_id: proj.id, employee_id: empEmp.id, allocation_percent: 100, role_on_project: 'Engineer' },
    { onConflict: 'project_id,employee_id' }
  );

  const { data: ms } = await supabase
    .from('milestones').select('id').eq('project_id', proj.id).limit(1);
  if (!ms || ms.length === 0) {
    await supabase.from('milestones').insert([
      { project_id: proj.id, title: 'Architecture Sign-off', status: 'completed', sort_order: 0, completed_at: new Date().toISOString() },
      { project_id: proj.id, title: 'Core Payment Rails', status: 'in_progress', sort_order: 1 },
      { project_id: proj.id, title: 'Compliance Review', status: 'pending', sort_order: 2 },
    ]);
    console.log('  + 3 milestones');
  }

  console.log(`\n✓ Seed complete.\n  All demo passwords: ${PASSWORD}\n  Client portal user: client@clientco.com (org: ClientCo Industries)\n  Manager→Employee chain and project assignments are linked.`);
}

main().catch(err => {
  console.error('✗ Seed failed:', err.message);
  process.exit(1);
});
