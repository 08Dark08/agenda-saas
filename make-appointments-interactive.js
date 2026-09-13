// make-appointments-interactive.js
const fs = require("fs");
const path = require("path");

console.log("⚡ Adicionando interatividade, filtros e modal na Agenda...\n");

const files = {
  // ==========================================
  // 1. SERVER ACTIONS DE STATUS E AGENDAMENTO MANUAL
  // ==========================================
  "src/modules/appointments/interactive-actions.ts": `'use server';
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

export async function updateAppointmentStatusAction(appointmentId: string, newStatus: any) {
  try {
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: newStatus },
    });

    revalidatePath("/appointments");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function createManualAppointmentAction(formData: {
  clientName: string;
  clientPhone: string;
  serviceId: string;
  time: string;
}) {
  try {
    const service = await prisma.service.findUnique({ where: { id: formData.serviceId } });
    if (!service) return { success: false, error: "Serviço não encontrado." };

    const professional = await prisma.professional.findFirst({
      where: { organizationId: service.organizationId },
    });

    const [hours, minutes] = formData.time.split(":").map(Number);
    const startTime = new Date();
    startTime.setHours(hours, minutes, 0, 0);
    const endTime = new Date(startTime.getTime() + service.durationMinutes * 60000);

    const client = await prisma.client.upsert({
      where: {
        organizationId_phone: {
          organizationId: service.organizationId,
          phone: formData.clientPhone,
        },
      },
      update: { fullName: formData.clientName },
      create: {
        organizationId: service.organizationId,
        fullName: formData.clientName,
        phone: formData.clientPhone,
      },
    });

    const slotKey = \`manual_\${professional?.id || 'pro'}_\${startTime.toISOString()}_\${Date.now()}\`;

    await prisma.appointment.create({
      data: {
        organizationId: service.organizationId,
        professionalId: professional!.id,
        serviceId: service.id,
        clientId: client.id,
        startTime,
        endTime,
        slotKey,
        status: "CONFIRMED",
        totalPriceCents: service.priceCents,
      },
    });

    revalidatePath("/appointments");
    revalidatePath("/dashboard");
    revalidatePath("/clients");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}`,

  // ==========================================
  // 2. COMPONENTE CLIENT INTERATIVO (FILTROS + AÇÕES + MODAL)
  // ==========================================
  "src/components/appointments/interactive-appointments-view.tsx": `'use client';
import React, { useState, useTransition } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, Plus, CheckCircle2, UserX, XCircle, X, Search, Phone } from 'lucide-react';
import { updateAppointmentStatusAction, createManualAppointmentAction } from '@/modules/appointments/interactive-actions';

interface AppointmentItem {
  id: string;
  startTime: string;
  status: string;
  client: { fullName: string; phone: string };
  service: { id: string; name: string; durationMinutes: number };
}

interface ServiceItem {
  id: string;
  name: string;
  priceCents: number;
}

export function InteractiveAppointmentsView({ 
  initialAppointments, 
  services 
}: { 
  initialAppointments: AppointmentItem[];
  services: ServiceItem[];
}) {
  const [filter, setFilter] = useState<'ALL' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'>('ALL');
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);

  // Form de novo agendamento manual
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id || '');
  const [time, setTime] = useState('14:00');
  const [submitting, setSubmitting] = useState(false);

  // Filtra dinamicamente na tela
  const filteredAppointments = initialAppointments.filter(appt => {
    if (filter === 'ALL') return true;
    return appt.status === filter;
  });

  async function handleStatusChange(id: string, status: string) {
    startTransition(async () => {
      await updateAppointmentStatusAction(id, status);
    });
  }

  async function handleCreateManual(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await createManualAppointmentAction({
      clientName,
      clientPhone,
      serviceId: selectedServiceId,
      time,
    });
    setSubmitting(false);

    if (res.success) {
      setModalOpen(false);
      setClientName('');
      setClientPhone('');
    } else {
      alert(res.error || "Falha ao criar agendamento.");
    }
  }

  return (
    <div className="space-y-8">
      {/* Header com Botão Ativo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Agenda Consolidada</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Filtre por status e gerencie a presença dos clientes em tempo real.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer w-fit"
        >
          <span>Novo Agendamento</span> <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Botões de Filtros Ativos e Clicáveis */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-2 overflow-x-auto">
        {[
          { id: 'ALL', label: 'Todos os Horários' },
          { id: 'CONFIRMED', label: 'Confirmados' },
          { id: 'COMPLETED', label: 'Concluídos / Atendidos' },
          { id: 'NO_SHOW', label: 'Não Compareceu' },
          { id: 'CANCELLED', label: 'Cancelados' },
        ].map((tab) => {
          const isActive = filter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={\`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer \${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }\`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Lista de Atendimentos com Botões de Ação */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {filteredAppointments.length === 0 ? (
          <div className="p-16 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-800">Nenhum atendimento neste filtro</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Alterne entre as abas acima ou cadastre um novo agendamento no botão superior.
            </p>
          </div>
        ) : (
          filteredAppointments.map(appt => (
            <div key={appt.id} className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 text-blue-700 flex flex-col items-center justify-center font-black">
                  <span className="text-base leading-none">{format(new Date(appt.startTime), 'HH:mm')}</span>
                  <span className="text-[10px] font-bold text-blue-500 uppercase mt-1">Hoje</span>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider">
                    {format(new Date(appt.startTime), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </span>
                  <h3 className="text-base font-black text-slate-900 mt-0.5">{appt.client.fullName}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mt-0.5">
                    <span className="font-semibold text-slate-700">{appt.service.name}</span>
                    <span>•</span>
                    <span>{appt.client.phone}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                {/* Badge de Status Atual */}
                <span className={\`text-[11px] font-extrabold px-3 py-1 rounded-full \${
                  appt.status === 'CONFIRMED'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                    : appt.status === 'COMPLETED'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                    : appt.status === 'NO_SHOW'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                    : 'bg-red-50 text-red-700 border border-red-200/60'
                }\`}>
                  {appt.status}
                </span>

                {/* Botões Operacionais Ativos */}
                {appt.status === 'CONFIRMED' && (
                  <div className="flex items-center gap-1">
                    <button
                      title="Marcar como Atendido / Concluído"
                      disabled={isPending}
                      onClick={() => handleStatusChange(appt.id, 'COMPLETED')}
                      className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="hidden md:inline">Atendido</span>
                    </button>

                    <button
                      title="Cliente Não Compareceu (Falta)"
                      disabled={isPending}
                      onClick={() => handleStatusChange(appt.id, 'NO_SHOW')}
                      className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <UserX className="w-4 h-4" />
                      <span className="hidden md:inline">Faltou</span>
                    </button>

                    <button
                      title="Cancelar Horário"
                      disabled={isPending}
                      onClick={() => {
                        if (confirm("Deseja realmente cancelar este horário?")) {
                          handleStatusChange(appt.id, 'CANCELLED');
                        }
                      }}
                      className="p-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL DE NOVO AGENDAMENTO MANUAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">Novo Agendamento Manual</h3>
                <p className="text-xs text-slate-500">Adicione uma consulta para um cliente por balcão ou fone.</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManual} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nome Completo do Cliente</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  placeholder="Ex: Mariana Ferreira"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">WhatsApp do Cliente</label>
                <input
                  type="tel"
                  required
                  value={clientPhone}
                  onChange={e => setClientPhone(e.target.value)}
                  placeholder="(54) 99999-8888"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Serviço</label>
                  <select
                    value={selectedServiceId}
                    onChange={e => setSelectedServiceId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold focus:bg-white focus:border-blue-600 focus:outline-none"
                  >
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Horário (Hoje)</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-1/3 py-3 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-2/3 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {submitting ? "Gravando..." : "Confirmar Agendamento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}`,

  // ==========================================
  // 3. PÁGINA SERVER INTEGRADA (/appointments)
  // ==========================================
  "src/app/appointments/page.tsx": `import React from 'react';
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
}`
};

Object.entries(files).forEach(([rel, content]) => {
  const abs = path.join(process.cwd(), rel);
  const dir = path.dirname(abs);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(abs, content, 'utf-8');
  console.log(`  ✓ Interatividade Aplicada: ${rel}`);
});

console.log("\n⚡ Agenda 100% interativa com filtros, botões de ação e modal de agendamento manual!");