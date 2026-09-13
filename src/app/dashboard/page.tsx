import React from 'react';
import Link from 'next/link';
import { Calendar, DollarSign, Users, Clock, ArrowUpRight, Plus, Sparkles, TrendingUp } from 'lucide-react';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [appointments, clientsCount] = await Promise.all([
    prisma.appointment.findMany({
      where: { organizationId: session.organizationId },
      include: { client: true, service: true },
      orderBy: { startTime: 'desc' },
      take: 5,
    }),
    prisma.client.count({ where: { organizationId: session.organizationId } }),
  ]);

  const totalRevenue = appointments
    .filter(a => a.status !== 'CANCELLED')
    .reduce((acc, a) => acc + a.totalPriceCents, 0);

  return (
    <DashboardShell activePage="dashboard">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Olá, Rodrigo 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Aqui está o resumo operacional da sua clínica para hoje.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/services" className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold rounded-xl shadow-sm transition-all">
              <Plus className="w-4 h-4 text-slate-400" /> Novo Serviço
            </Link>
            <Link href="/agendar/viverbem" target="_blank" className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all">
              <span>Página Pública</span> <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Atendimentos</span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{appointments.length}</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">Horários registrados</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Faturamento</span>
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
                {appointments.map((appt) => (
                  <div key={appt.id} className="p-5 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 border border-blue-100 text-blue-700 rounded-xl flex items-center justify-center font-black text-sm">
                        {format(new Date(appt.startTime), 'HH:mm')}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{appt.client.fullName}</h4>
                        <p className="text-xs text-slate-400 mt-0.5 font-medium">{appt.service.name} • {appt.client.phone}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      {appt.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl text-white shadow-xl shadow-blue-500/20 space-y-4">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black">Divulgue sua Agenda</h3>
              <p className="text-xs text-blue-100 mt-1 leading-relaxed">
                Coloque este link na bio do seu Instagram ou envie por WhatsApp para receber agendamentos automáticos.
              </p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl border border-white/20 text-xs font-mono truncate">
              http://localhost:3001/agendar/viverbem
            </div>
            <Link href="/agendar/viverbem" target="_blank" className="w-full py-3 bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all">
              Testar Página Pública <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}