'use client';

import { RoleLoginPage } from '@/components/auth/RoleLoginPage';

export default function HrLoginPage() {
  return (
    <RoleLoginPage
      config={{
        role: 'hr',
        suiteLabel: 'People Operations',
        emailLabel: 'HR Email',
        emailPlaceholder: 'Enter your HR email',
        submitLabel: 'Sign in to HR Portal',
        roleHome: '/hr',
      }}
    />
  );
}
