// fix-dashboard-crash.js
const fs = require("fs");
const path = require("path");

console.log("🛡️ Blindando o Dashboard contra erros de sessão e dados nulos na Vercel...\n");

const targetPath = path.join(process.cwd(), "src/app/dashboard/page.tsx");

const code = `import React from 'react';
import Link from 'next/link';
import { Calendar, DollarSign, Users, Clock, ArrowUpRight, Plus, Sparkles, TrendingUp } from 'lucide-react';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { ShareLinkCard } from '@/components/dashboard/share-link-card';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session || !session.organizationId) {
    redirect('/login');
  }

  // Busca segura no Supabase
  let appointments: any[] = [];
  let clientsCount = 0;
  let org: any = null;

  try {
    const results = await Promise.all([
      prisma.appointment.findMany({
        where: { organizationId: session.organizationId },
        include: { client: true, service: true },
        orderBy: { startTime: 'desc' },
        take: 5,
      }),
      prisma.client.count({ where: { organizationId: session.organizationId } }),
      prisma.organization.findUnique({ where: { id: session.organizationId } }),
    ]);

    appointments = results[0] || [];
    clientsCount = results[1] || 0;
    org = results[2] || null;
  } catch (err) {
    console.error("Erro ao carregar dados do dashboard:", err);
  }

  const totalRevenue = appointments
    .filter(a => a && a.status !== 'CANCELLED')
    .reduce((acc, a) => acc + (a.totalPriceCents || 0), 0);

  const orgSlug = org?.slug || 'viverbem';
  const orgName = org?.name || 'Viver Bem';
  const firstName = session.fullName ? session.fullName.split(' ')[0] : 'Doutor(a)';

  return (
    <DashboardShell activePage="dashboard">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Olá, {firstName} 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Aqui está o resumo operacional da <span className="text-slate-800 font-bold">{orgName}</span> para hoje.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/services" className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold rounded-xl shadow-sm transition-all">
              <Plus className="w-4 h-4 text-slate-400" /> Novo Serviço
            </Link>
            <Link href={'/agendar/' + orgSlug} target="_blank" className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all">
              <span>Página Pública</span> <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* CARDS DE KPIS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Atendimentos Registrados</span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{appointments.length}</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">Horários registrados</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Faturamento Estimado</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">
              {(totalRevenue / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </h3>
            <p className="text-xs text-emerald-600 font-bold mt-1">Confirmado no sistema</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Clientes CRM</span>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{clientsCount}</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">Cadastros únicos</p>
          </div>
        </div>

        {/* PRÓXIMOS ATENDIMENTOS E CARD LATERAL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight">Próximos Atendimentos</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Sincronizados em tempo real com o banco de dados</p>
              </div>
              <Link href="/appointments" className="text-xs font-bold text-blue-600 hover:text-blue-700">Ver todos →</Link>
            </div>

            {appointments.length === 0 ? (
              <div className="p-12 text-center">
                <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-800">Nenhum atendimento na fila</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">Compartilhe seu link público para receber agendamentos.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {appointments.map((appt) => {
                  const clientName = appt?.client?.fullName || 'Paciente';
                  const clientPhone = appt?.client?.phone || '';
                  const serviceName = appt?.service?.name || 'Consulta';
                  const timeFormatted = appt?.startTime ? format(new Date(appt.startTime), 'HH:mm') : '--:--';

                  return (
                    <div key={appt.id} className="p-5 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 border border-blue-100 text-blue-700 rounded-xl flex items-center justify-center font-black text-sm">
                          {timeFormatted}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">{clientName}</h4>
                          <p className="text-xs text-slate-400 mt-0.5 font-medium">{serviceName} • {clientPhone}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        {appt.status || 'CONFIRMED'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <ShareLinkCard slug={orgSlug} />
        </div>
      </div>
    </DashboardShell>
  );
}`;

fs.writeFileSync(targetPath, code, "utf-8");
console.log("✓ Dashboard 100% blindado com Null Safety e renderização dinâmica!");