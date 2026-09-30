'use client';

import { PortalShell } from '@/components/portal/PortalShell';
import { NotificationsPage } from '@/components/portal/NotificationsPage';

export default function Page() {
  return (
    <PortalShell role="hr" title="Notifications" subtitle="Assignments, approvals, and system updates.">
      <NotificationsPage role="hr" />
    </PortalShell>
  );
}
