'use client';

import { RoleLoginPage } from '@/components/auth/RoleLoginPage';

export default function SalesLoginPage() {
  return (
    <RoleLoginPage
      config={{
        role: 'sales',
        suiteLabel: 'Revenue Suite',
        emailLabel: 'Sales Email',
        emailPlaceholder: 'Enter your sales email',
        submitLabel: 'Sign in to Sales Portal',
        roleHome: '/sales',
      }}
    />
  );
}
