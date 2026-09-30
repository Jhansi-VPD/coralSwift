'use client';

import { RoleLoginPage } from '@/components/auth/RoleLoginPage';

export default function QaLoginPage() {
  return (
    <RoleLoginPage
      config={{
        role: 'qa',
        suiteLabel: 'Quality Assurance',
        emailLabel: 'Work email',
        emailPlaceholder: 'you@coralswift.com',
        submitLabel: 'Sign in to QA Workspace',
        roleHome: '/qa',
      }}
    />
  );
}
