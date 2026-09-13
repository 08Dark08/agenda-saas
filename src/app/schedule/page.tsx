import React from 'react';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { InteractiveScheduleView } from '@/components/schedule/interactive-schedule-view';

export default async function SchedulePage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const settings = await prisma.publicBookingSettings.findUnique({
    where: { organizationId: session.organizationId },
  });

  return (
    <DashboardShell activePage="schedule">
      <InteractiveScheduleView
        initialRules={{
          minNoticeHours: settings?.minNoticeHours || 2,
          maxNoticeDays: settings?.maxNoticeDays || 60,
          cancellationHoursLimit: settings?.cancellationHoursLimit || 24,
          allowCancellation: settings?.allowCancellation !== false,
        }}
      />
    </DashboardShell>
  );
}