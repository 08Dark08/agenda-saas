import React from 'react';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { InteractiveTeamView } from '@/components/team/interactive-team-view';

export const dynamic = 'force-dynamic';

export default async function TeamPage() {
  const session = await getSession();
  if (!session || !session.organizationId) redirect('/login');

  const [professionals, org] = await Promise.all([
    prisma.professional.findMany({
      where: { organizationId: session.organizationId },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.organization.findUnique({ where: { id: session.organizationId } }),
  ]);

  const serialized = professionals.map(p => ({
    id: p.id,
    name: p.name,
    specialty: p.specialty || 'Especialista',
    phone: p.phone || '',
    isActive: p.isActive,
  }));

  return (
    <DashboardShell 
      activePage="team" 
      businessName={org?.name || 'Minha Clínica'} 
      slug={org?.slug || 'viverbem'}
    >
      <InteractiveTeamView initialProfessionals={serialized} />
    </DashboardShell>
  );
}