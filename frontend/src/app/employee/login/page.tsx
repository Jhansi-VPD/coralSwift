'use client';

import { RoleLoginPage } from '@/components/auth/RoleLoginPage';

export default function EmployeeLoginPage() {
  return (
    <RoleLoginPage
      config={{
        role: 'employee',
        suiteLabel: 'My Workspace',
        emailLabel: 'Employee Email',
        emailPlaceholder: 'Enter your employee email',
        submitLabel: 'Sign in to Employee Portal',
        roleHome: '/employee',
      }}
    />
  );
}
