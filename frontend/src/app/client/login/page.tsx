'use client';

import { RoleLoginPage } from '@/components/auth/RoleLoginPage';

export default function ClientLoginPage() {
  return (
    <RoleLoginPage
      config={{
        role: 'client',
        suiteLabel: 'Client Portal',
        emailLabel: 'Client Email',
        emailPlaceholder: 'Enter your client email',
        submitLabel: 'Sign in to Client Portal',
        roleHome: '/client',
      }}
    />
  );
}
