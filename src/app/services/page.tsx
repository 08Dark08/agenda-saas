import React from 'react';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { InteractiveServicesView } from '@/components/services/interactive-services-view';

export default async function ServicesPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const services = await prisma.service.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { createdAt: 'desc' },
  });

  const serialized = services.map(s => ({
    id: s.id,
    name: s.name,
    durationMinutes: s.durationMinutes,
    priceCents: s.priceCents,
  }));

  return (
    <DashboardShell activePage="services">
      <InteractiveServicesView initialServices={serialized} />
    </DashboardShell>
  );
}