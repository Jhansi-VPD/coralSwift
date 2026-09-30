'use client';

import { RoleLoginPage } from '@/components/auth/RoleLoginPage';

export default function AdminLoginPage() {
  return (
    <RoleLoginPage
      config={{
        role: 'admin',
        suiteLabel: 'Enterprise Administration Suite',
        emailLabel: 'Administrator Email',
        emailPlaceholder: 'Enter administrator email',
        submitLabel: 'Authenticate Session',
        roleHome: '/admin',
      }}
    />
  );
}
