import React from 'react';
import { Users, Phone, ShieldCheck, Search, MessageSquare, ArrowUpRight } from 'lucide-react';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export default async function ClientsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const clients = await prisma.client.findMany({
    where: { organizationId: session.organizationId },
    include: { _count: { select: { appointments: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <DashboardShell activePage="clients">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Base de Clientes (CRM)</h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Contatos registrados automaticamente pelas reservas com conformidade LGPD.
            </p>
          </div>

          <div className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm">
            Total: <span className="text-blue-600 font-black">{clients.length}</span> clientes
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {clients.length === 0 ? (
            <div className="p-16 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-800">Nenhum cliente registrado ainda</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Conforme seus clientes marcarem horários na sua página, a lista do seu CRM será preenchida automaticamente.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="py-4 px-6">Cliente</th>
                    <th className="py-4 px-6">WhatsApp</th>
                    <th className="py-4 px-6">Consultas</th>
                    <th className="py-4 px-6">Privacidade LGPD</th>
                    <th className="py-4 px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {clients.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 text-blue-700 font-black text-xs flex items-center justify-center">
                            {c.fullName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{c.fullName}</p>
                            <span className="text-[10px] text-slate-400">Cliente Ativo</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-700">{c.phone}</td>
                      <td className="py-4 px-6">
                        <span className="bg-blue-50 text-blue-700 font-extrabold px-3 py-1 rounded-full text-[11px]">
                          {c._count.appointments} atendimento(s)
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                          <ShieldCheck className="w-3.5 h-3.5" /> Consentimento Aceito
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <a
                          href={`https://wa.me/55${c.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition-all shadow-sm"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                        </a>
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