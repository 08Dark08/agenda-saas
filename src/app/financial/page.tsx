import React from 'react';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { 
  DollarSign, TrendingUp, Calendar, ArrowDownRight, 
  CheckCircle2, Clock 
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

export default async function FinancialPage() {
  const session = await getSession();
  if (!session || !session.organizationId) redirect('/login');

  const [appointments, org] = await Promise.all([
    prisma.appointment.findMany({
      where: { organizationId: session.organizationId },
      include: { client: true, service: true },
      orderBy: { startTime: 'desc' },
    }),
    prisma.organization.findUnique({ where: { id: session.organizationId } }),
  ]);

  const realizedRevenue = appointments
    .filter(a => a.status === 'COMPLETED')
    .reduce((acc, a) => acc + (a.totalPriceCents || 0), 0);

  const projectedRevenue = appointments
    .filter(a => a.status === 'CONFIRMED')
    .reduce((acc, a) => acc + (a.totalPriceCents || 0), 0);

  const lostRevenue = appointments
    .filter(a => a.status === 'CANCELLED' || a.status === 'NO_SHOW')
    .reduce((acc, a) => acc + (a.totalPriceCents || 0), 0);

  const totalValid = appointments.filter(a => a.status !== 'CANCELLED');
  const totalVolume = realizedRevenue + projectedRevenue;
  const ticketMedio = totalValid.length > 0 ? Math.round(totalVolume / totalValid.length) : 0;

  const serviceStats: Record<string, { name: string; count: number; totalCents: number }> = {};
  for (const a of totalValid) {
    const sName = a.service?.name || 'Consulta Geral';
    if (!serviceStats[sName]) {
      serviceStats[sName] = { name: sName, count: 0, totalCents: 0 };
    }
    serviceStats[sName].count += 1;
    serviceStats[sName].totalCents += a.totalPriceCents || 0;
  }
  const rankingServices = Object.values(serviceStats).sort((a, b) => b.totalCents - a.totalCents);

  return (
    <DashboardShell 
      activePage="financial" 
      businessName={org?.name || 'Minha Clínica'} 
      slug={org?.slug || 'viverbem'}
    >
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Gestão Financeira</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Controle de faturamento realizado, previsão de recebíveis e rentabilidade por procedimento.
          </p>
        </div>

        {/* 4 CARDS KPIS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Receita Realizada</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {(realizedRevenue / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </h3>
            <span className="text-[11px] text-emerald-600 font-bold mt-1 inline-block">Consultas já atendidas</span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Previsão na Agenda</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {(projectedRevenue / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </h3>
            <span className="text-[11px] text-blue-600 font-bold mt-1 inline-block">Horários confirmados a realizar</span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ticket Médio</span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {(ticketMedio / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </h3>
            <span className="text-[11px] text-purple-600 font-bold mt-1 inline-block">Média por atendimento</span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Perda por Desmarcação</span>
              <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-black">
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {(lostRevenue / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </h3>
            <span className="text-[11px] text-red-500 font-bold mt-1 inline-block">Cancelados ou faltas</span>
          </div>
        </div>

        {/* RANKING DE SERVIÇOS */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">Rentabilidade por Procedimento</h2>
              <p className="text-xs text-slate-400 font-medium">Serviços que mais geram faturamento para a sua clínica.</p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200">
              Total: {(totalVolume / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>

          {rankingServices.length === 0 ? (
            <p className="text-xs text-slate-400 font-medium py-4">Nenhum lançamento financeiro registrado ainda.</p>
          ) : (
            <div className="space-y-4">
              {rankingServices.map((item, idx) => {
                const percent = totalVolume > 0 ? Math.round((item.totalCents / totalVolume) * 100) : 0;
                return (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-800">{idx + 1}. {item.name} ({item.count} sessões)</span>
                      <span className="text-slate-900 font-black">
                        {(item.totalCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full" 
                        style={{ width: percent + '%' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* EXTRATO DE LANÇAMENTOS */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">Extrato de Lançamentos</h2>
              <p className="text-xs text-slate-400 font-medium">Histórico cronológico de cada consulta com valor correspondente.</p>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              {appointments.length} lançamentos
            </span>
          </div>

          {appointments.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 font-bold">
              Nenhum lançamento no extrato financeiro.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="py-4 px-6">Data / Hora</th>
                    <th className="py-4 px-6">Paciente</th>
                    <th className="py-4 px-6">Procedimento</th>
                    <th className="py-4 px-6">Valor</th>
                    <th className="py-4 px-6 text-right">Status Financeiro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {appointments.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-700">
                        {format(new Date(a.startTime), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </td>
                      <td className="py-4 px-6 font-black text-slate-900">{a.client?.fullName || 'Cliente'}</td>
                      <td className="py-4 px-6 text-slate-600">{a.service?.name || 'Consulta'}</td>
                      <td className="py-4 px-6 font-black text-slate-900">
                        {((a.totalPriceCents || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className={'inline-block text-[10px] font-extrabold px-3 py-1 rounded-full ' + (
                          a.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : a.status === 'CONFIRMED'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                            : 'bg-red-50 text-red-700 border border-red-200/60'
                        )}>
                          {a.status === 'COMPLETED' ? 'PAGO / RECEBIDO' : a.status === 'CONFIRMED' ? 'A RECEBER' : 'CANCELADO'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}