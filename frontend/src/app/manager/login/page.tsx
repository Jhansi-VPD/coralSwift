'use client';

import { RoleLoginPage } from '@/components/auth/RoleLoginPage';

export default function ManagerLoginPage() {
  return (
    <RoleLoginPage
      config={{
        role: 'manager',
        suiteLabel: 'Delivery Command',
        emailLabel: 'Manager Email',
        emailPlaceholder: 'Enter your manager email',
        submitLabel: 'Sign in to Manager Portal',
        roleHome: '/manager',
      }}
    />
  );
}
