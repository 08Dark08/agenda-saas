import React from 'react';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { InteractiveAppointmentsView } from '@/components/appointments/interactive-appointments-view';

export default async function AppointmentsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [appointments, services] = await Promise.all([
    prisma.appointment.findMany({
      where: { organizationId: session.organizationId },
      include: { client: true, service: true },
      orderBy: { startTime: 'desc' },
    }),
    prisma.service.findMany({
      where: { organizationId: session.organizationId, isActive: true },
    }),
  ]);

  const serializedAppointments = appointments.map(a => ({
    id: a.id,
    startTime: a.startTime.toISOString(),
    status: a.status,
    client: { fullName: a.client.fullName, phone: a.client.phone },
    service: { id: a.service.id, name: a.service.name, durationMinutes: a.service.durationMinutes },
  }));

  return (
    <DashboardShell activePage="appointments">
      <InteractiveAppointmentsView 
        initialAppointments={serializedAppointments} 
        services={services.map(s => ({ id: s.id, name: s.name, priceCents: s.priceCents }))} 
      />
    </DashboardShell>
  );
}