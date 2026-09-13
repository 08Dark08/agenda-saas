import React from 'react';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { SettingsFormClient } from '@/components/settings/settings-form-client';

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const org = await prisma.organization.findUnique({
    where: { id: session.organizationId },
    include: { publicSettings: true },
  });

  return (
    <DashboardShell activePage="settings">
      <div className="space-y-8 max-w-3xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Configurações da Conta</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Personalize a identidade da sua clínica, WhatsApp e textos da sua página pública.
          </p>
        </div>

        <SettingsFormClient
          initialData={{
            name: org?.name || '',
            phone: org?.phone || '',
            slug: org?.slug || '',
            headline: org?.publicSettings?.headline || 'Agendamento online imediato',
            aboutText: org?.publicSettings?.aboutText || '',
          }}
        />
      </div>
    </DashboardShell>
  );
}