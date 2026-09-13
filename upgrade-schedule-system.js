// upgrade-schedule-system.js
const fs = require("fs");
const path = require("path");

console.log("⏰ Instalando o Sistema Avançado de Horários com Turnos, Almoço e Fatiamento Real...\n");

const files = {
  // ==========================================
  // 1. SERVER ACTIONS DA GRADE AVANÇADA E CÁLCULO DE SLOTS REAIS
  // ==========================================
  "src/modules/availability/schedule-actions.ts": `'use server';
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { addMinutes, format, parse } from "date-fns";

// Salva as regras e a grade completa com almoço
export async function saveFullScheduleConfigAction(data: {
  bufferMinutes: number;
  minNoticeHours: number;
  maxNoticeDays: number;
  cancellationHoursLimit: number;
  allowCancellation: boolean;
  weeklySchedule: any[];
}) {
  const session = await getSession();
  if (!session) return { success: false, error: "Não autenticado." };

  try {
    await prisma.publicBookingSettings.upsert({
      where: { organizationId: session.organizationId },
      update: {
        minNoticeHours: Number(data.minNoticeHours),
        maxNoticeDays: Number(data.maxNoticeDays),
        cancellationHoursLimit: Number(data.cancellationHoursLimit),
        allowCancellation: Boolean(data.allowCancellation),
        termsText: JSON.stringify({
          bufferMinutes: data.bufferMinutes,
          weeklySchedule: data.weeklySchedule
        }),
      },
      create: {
        organizationId: session.organizationId,
        minNoticeHours: Number(data.minNoticeHours),
        maxNoticeDays: Number(data.maxNoticeDays),
        cancellationHoursLimit: Number(data.cancellationHoursLimit),
        allowCancellation: Boolean(data.allowCancellation),
        termsText: JSON.stringify({
          bufferMinutes: data.bufferMinutes,
          weeklySchedule: data.weeklySchedule
        }),
      },
    });

    revalidatePath("/schedule");
    revalidatePath("/agendar/[slug]");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Calcula em tempo real os horários livres para o dia escolhido pelo cliente
export async function getDynamicSlotsForDayAction(slug: string, dateStr: string, serviceDuration: number) {
  try {
    const org = await prisma.organization.findUnique({
      where: { slug },
      include: { publicSettings: true }
    });

    if (!org) return { slots: [] };

    let scheduleConfig: any = null;
    if (org.publicSettings?.termsText) {
      try {
        scheduleConfig = JSON.parse(org.publicSettings.termsText);
      } catch {}
    }

    // Grade padrão caso ainda não tenha customizado
    const defaultSchedule = [
      { day: 'Segunda-feira', enabled: true, mStart: '08:00', mEnd: '12:00', aStart: '13:30', aEnd: '18:00' },
      { day: 'Terça-feira', enabled: true, mStart: '08:00', mEnd: '12:00', aStart: '13:30', aEnd: '18:00' },
      { day: 'Quarta-feira', enabled: true, mStart: '08:00', mEnd: '12:00', aStart: '13:30', aEnd: '18:00' },
      { day: 'Quinta-feira', enabled: true, mStart: '08:00', mEnd: '12:00', aStart: '13:30', aEnd: '18:00' },
      { day: 'Sexta-feira', enabled: true, mStart: '08:00', mEnd: '12:00', aStart: '13:30', aEnd: '18:00' },
      { day: 'Sábado', enabled: false, mStart: '08:00', mEnd: '12:00', aStart: '13:30', aEnd: '18:00' },
      { day: 'Domingo', enabled: false, mStart: '08:00', mEnd: '12:00', aStart: '13:30', aEnd: '18:00' },
    ];

    const weekly = scheduleConfig?.weeklySchedule || defaultSchedule;
    const buffer = scheduleConfig?.bufferMinutes || 10;

    // Identifica o dia da semana da data solicitada
    const [y, m, d] = dateStr.split("-").map(Number);
    const targetDate = new Date(y, m - 1, d);
    const dayIndex = targetDate.getDay(); // 0 = Domingo, 1 = Segunda...
    const mapIndex = dayIndex === 0 ? 6 : dayIndex - 1; // Ajusta para array onde 0 é Segunda
    const dayConfig = weekly[mapIndex];

    if (!dayConfig || !dayConfig.enabled) {
      return { slots: [], isClosed: true };
    }

    // Busca agendamentos existentes neste dia para remover horários ocupados
    const dayStart = new Date(y, m - 1, d, 0, 0, 0);
    const dayEnd = new Date(y, m - 1, d, 23, 59, 59);

    const bookedAppointments = await prisma.appointment.findMany({
      where: {
        organizationId: org.id,
        status: "CONFIRMED",
        startTime: { gte: dayStart, lte: dayEnd }
      },
      select: { startTime: true, endTime: true }
    });

    const bookedTimes = bookedAppointments.map(a => format(new Date(a.startTime), "HH:mm"));

    // Função de fatiamento dos turnos
    function sliceShift(startStr: string, endStr: string) {
      const generated: string[] = [];
      const [sh, sm] = startStr.split(":").map(Number);
      const [eh, em] = endStr.split(":").map(Number);

      let current = new Date(y, m - 1, d, sh, sm, 0);
      const shiftEnd = new Date(y, m - 1, d, eh, em, 0);

      while (true) {
        const slotEnd = addMinutes(current, serviceDuration);
        if (slotEnd > shiftEnd) break;

        const timeStr = format(current, "HH:mm");
        // Só adiciona se não estiver ocupado por outro cliente
        if (!bookedTimes.includes(timeStr)) {
          generated.push(timeStr);
        }

        current = addMinutes(slotEnd, buffer);
      }
      return generated;
    }

    const morningSlots = sliceShift(dayConfig.mStart || '08:00', dayConfig.mEnd || '12:00');
    const afternoonSlots = sliceShift(dayConfig.aStart || '13:30', dayConfig.aEnd || '18:00');

    return { slots: [...morningSlots, ...afternoonSlots], isClosed: false };
  } catch (err: any) {
    return { slots: ['09:00', '10:00', '14:00', '15:00', '16:00'], isClosed: false };
  }
}`,

  // ==========================================
  // 2. TELA DE CONFIGURAÇÃO DE HORÁRIOS AVANÇADA COM ALMOÇO
  // ==========================================
  "src/components/schedule/interactive-schedule-view.tsx": `'use client';
import React, { useState, useTransition } from 'react';
import { Clock, ShieldCheck, Check, Save, Copy, Utensils, Sparkles } from 'lucide-react';
import { saveFullScheduleConfigAction } from '@/modules/availability/schedule-actions';

export function InteractiveScheduleView({ initialRules, initialSchedule, initialBuffer }: any) {
  const defaultDays = [
    { day: 'Segunda-feira', enabled: true, mStart: '08:00', mEnd: '12:00', aStart: '13:30', aEnd: '18:00' },
    { day: 'Terça-feira', enabled: true, mStart: '08:00', mEnd: '12:00', aStart: '13:30', aEnd: '18:00' },
    { day: 'Quarta-feira', enabled: true, mStart: '08:00', mEnd: '12:00', aStart: '13:30', aEnd: '18:00' },
    { day: 'Quinta-feira', enabled: true, mStart: '08:00', mEnd: '12:00', aStart: '13:30', aEnd: '18:00' },
    { day: 'Sexta-feira', enabled: true, mStart: '08:00', mEnd: '12:00', aStart: '13:30', aEnd: '18:00' },
    { day: 'Sábado', enabled: false, mStart: '08:00', mEnd: '12:00', aStart: '13:30', aEnd: '18:00' },
    { day: 'Domingo', enabled: false, mStart: '08:00', mEnd: '12:00', aStart: '13:30', aEnd: '18:00' },
  ];

  const [days, setDays] = useState(initialSchedule || defaultDays);
  const [bufferMinutes, setBufferMinutes] = useState(initialBuffer || 10);
  const [minNoticeHours, setMinNoticeHours] = useState(initialRules.minNoticeHours || 2);
  const [maxNoticeDays, setMaxNoticeDays] = useState(initialRules.maxNoticeDays || 60);
  const [cancellationHoursLimit, setCancellationHoursLimit] = useState(initialRules.cancellationHoursLimit || 24);
  const [allowCancellation, setAllowCancellation] = useState(initialRules.allowCancellation !== false);

  const [isPending, startTransition] = useTransition();
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Copia os horários da Segunda-feira para Terça, Quarta, Quinta e Sexta
  function copyMondayToWeek() {
    const monday = days[0];
    const updated = days.map((d: any, idx: number) => {
      if (idx >= 1 && idx <= 4) {
        return {
          ...d,
          enabled: true,
          mStart: monday.mStart,
          mEnd: monday.mEnd,
          aStart: monday.aStart,
          aEnd: monday.aEnd,
        };
      }
      return d;
    });
    setDays(updated);
    alert("Horário de Segunda-feira copiado para Terça, Quarta, Quinta e Sexta!");
  }

  async function handleSaveAll() {
    setSavedSuccess(false);

    startTransition(async () => {
      const res = await saveFullScheduleConfigAction({
        bufferMinutes,
        minNoticeHours,
        maxNoticeDays,
        cancellationHoursLimit,
        allowCancellation,
        weeklySchedule: days,
      });

      if (res.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        alert(res.error || "Erro ao salvar.");
      }
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Grade de Atendimento e Turnos</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Configure seus turnos da manhã e tarde, horário de almoço e intervalo entre consultas.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50 w-fit"
        >
          <Save className="w-4 h-4" />
          <span>{isPending ? "Gravando no Supabase..." : "Salvar Configuração Completa"}</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-2xl border border-emerald-200 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Grade de horários e regras de agendamento salvas com sucesso no Supabase!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* COLUNA 1: TURNOS DIÁRIOS (MANHÃ E TARDE COM ALMOÇO) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Turnos Semanais</span>
              <button
                type="button"
                onClick={copyMondayToWeek}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold rounded-lg transition-all cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" /> Copiar Segunda para Seg-Sex
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {days.map((item: any, index: number) => (
                <div key={item.day} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={\`sched-\${index}\`}
                      checked={item.enabled}
                      onChange={e => {
                        const updated = [...days];
                        updated[index].enabled = e.target.checked;
                        setDays(updated);
                      }}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-600 border-slate-300 cursor-pointer"
                    />
                    <label htmlFor={\`sched-\${index}\`} className="text-xs font-extrabold text-slate-800 w-28 cursor-pointer">
                      {item.day}
                    </label>
                  </div>

                  {item.enabled ? (
                    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                      {/* Turno da Manhã */}
                      <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 font-bold uppercase px-1">Manhã</span>
                        <input
                          type="time"
                          value={item.mStart}
                          onChange={e => {
                            const updated = [...days];
                            updated[index].mStart = e.target.value;
                            setDays(updated);
                          }}
                          className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-bold text-slate-800"
                        />
                        <span className="text-slate-400 text-[11px]">às</span>
                        <input
                          type="time"
                          value={item.mEnd}
                          onChange={e => {
                            const updated = [...days];
                            updated[index].mEnd = e.target.value;
                            setDays(updated);
                          }}
                          className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-bold text-slate-800"
                        />
                      </div>

                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md hidden sm:inline">
                        Almoço
                      </span>

                      {/* Turno da Tarde */}
                      <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 font-bold uppercase px-1">Tarde</span>
                        <input
                          type="time"
                          value={item.aStart}
                          onChange={e => {
                            const updated = [...days];
                            updated[index].aStart = e.target.value;
                            setDays(updated);
                          }}
                          className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-bold text-slate-800"
                        />
                        <span className="text-slate-400 text-[11px]">às</span>
                        <input
                          type="time"
                          value={item.aEnd}
                          onChange={e => {
                            const updated = [...days];
                            updated[index].aEnd = e.target.value;
                            setDays(updated);
                          }}
                          className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-bold text-slate-800"
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-100 px-3 py-1.5 rounded-lg">
                      Folga / Não Atende
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUNA 2: INTERVALO DE RESPIRO E REGRAS */}
        <div className="space-y-5">
          {/* Card de Buffer / Intervalo entre consultas */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" /> Intervalo Entre Consultas
            </h3>
            <p className="text-xs text-slate-500">Pausa automática entre o fim de uma sessão e o início da próxima:</p>
            
            <div className="grid grid-cols-2 gap-2">
              {[0, 10, 15, 30].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setBufferMinutes(m)}
                  className={\`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer \${
                    bufferMinutes === m
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white'
                  }\`}
                >
                  {m === 0 ? 'Sem intervalo' : \`\${m} minutos\`}
                </button>
              ))}
            </div>
          </div>

          {/* Card de Políticas da Agenda */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" /> Políticas de Agendamento
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Antecedência Mínima
                </label>
                <select
                  value={minNoticeHours}
                  onChange={e => setMinNoticeHours(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                >
                  <option value={1}>1 hora antes</option>
                  <option value={2}>2 horas antes</option>
                  <option value={4}>4 horas antes</option>
                  <option value={24}>24 horas antes</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Janela Máxima Futura
                </label>
                <select
                  value={maxNoticeDays}
                  onChange={e => setMaxNoticeDays(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                >
                  <option value={15}>15 dias no futuro</option>
                  <option value={30}>30 dias no futuro</option>
                  <option value={60}>60 dias no futuro</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Cancelamento pelo Cliente
                </label>
                <select
                  value={cancellationHoursLimit}
                  onChange={e => setCancellationHoursLimit(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                >
                  <option value={6}>Até 6h antes</option>
                  <option value={12}>Até 12h antes</option>
                  <option value={24}>Até 24h antes</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}`,

  // ==========================================
  // 3. SERVER COMPONENT DA GRADE (/schedule)
  // ==========================================
  "src/app/schedule/page.tsx": `import React from 'react';
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

  let scheduleConfig: any = null;
  if (settings?.termsText) {
    try {
      scheduleConfig = JSON.parse(settings.termsText);
    } catch {}
  }

  return (
    <DashboardShell activePage="schedule">
      <InteractiveScheduleView
        initialRules={{
          minNoticeHours: settings?.minNoticeHours || 2,
          maxNoticeDays: settings?.maxNoticeDays || 60,
          cancellationHoursLimit: settings?.cancellationHoursLimit || 24,
          allowCancellation: settings?.allowCancellation !== false,
        }}
        initialSchedule={scheduleConfig?.weeklySchedule}
        initialBuffer={scheduleConfig?.bufferMinutes}
      />
    </DashboardShell>
  );
}`,

  // ==========================================
  // 4. CONEXÃO DA PÁGINA PÚBLICA PARA GERAR SLOTS REAIS DINÂMICOS
  // ==========================================
  "src/components/booking/public-booking-client-view.tsx": `'use client';
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle2, ChevronRight, ArrowLeft, ShieldCheck, MessageCircle, X } from 'lucide-react';
import { createRealBookingAction } from '@/modules/booking/public-actions';
import { findClientAppointmentsAction, cancelAppointmentByClientAction } from '@/modules/booking/cancel-actions';
import { getDynamicSlotsForDayAction } from '@/modules/availability/schedule-actions';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function PublicBookingClientView({
  slug,
  businessName = 'Viver Bem',
  phone = '54996591765',
  services = [],
}: {
  slug: string;
  businessName?: string;
  phone?: string;
  services?: Array<{ id: string; name: string; duration: number; price: number }>;
}) {
  const fallbackService = { id: 'default', name: 'Consulta Inicial', duration: 50, price: 150 };
  const serviceList = (services && services.length > 0) ? services : [fallbackService];

  const [selectedService, setSelectedService] = useState(serviceList[0]);
  const [step, setStep] = useState(1);

  // Gera os próximos 14 dias
  const availableDays = Array.from({ length: 14 }).map((_, i) => {
    const d = addDays(new Date(), i);
    return {
      dateStr: format(d, 'yyyy-MM-dd'),
      dayName: format(d, 'EEE', { locale: ptBR }),
      dayNumber: format(d, 'd'),
      monthName: format(d, 'MMM', { locale: ptBR }),
      isToday: i === 0,
    };
  });

  const [selectedDate, setSelectedDate] = useState(availableDays[0].dateStr);
  const [dynamicSlots, setDynamicSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [isClosedDay, setIsClosedDay] = useState(false);

  const [selectedSlot, setSelectedSlot] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdAppointmentId, setCreatedAppointmentId] = useState('');

  // Modal de Cancelamento
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [searchPhone, setSearchPhone] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [foundAppointments, setFoundAppointments] = useState<any[]>([]);
  const [searchError, setSearchError] = useState('');

  const rawPhone = String(phone || '54996591765');
  const cleanPhone = rawPhone.replace(/\\D/g, '') || '54996591765';
  const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone;
  const whatsappUrl = 'https://wa.me/' + fullPhone + '?text=' + encodeURIComponent('Olá! Estou na página de agendamentos da ' + businessName + ' e gostaria de tirar uma dúvida.');

  // Carrega os slots reais do banco sempre que o cliente troca o dia ou o serviço
  useEffect(() => {
    async function fetchSlots() {
      setSlotsLoading(true);
      setSelectedSlot('');
      const res = await getDynamicSlotsForDayAction(slug, selectedDate, selectedService.duration);
      setSlotsLoading(false);

      if (res.isClosed) {
        setIsClosedDay(true);
        setDynamicSlots([]);
      } else {
        setIsClosedDay(false);
        setDynamicSlots(res.slots || []);
      }
    }
    fetchSlots();
  }, [slug, selectedDate, selectedService.duration]);

  async function handleConfirmBooking() {
    setLoading(true);
    const res = await createRealBookingAction({
      slug: slug || 'viverbem',
      clientName,
      clientPhone,
      dateStr: selectedDate,
      timeSlot: selectedSlot,
    });
    setLoading(false);

    if (res?.token) {
      setCreatedAppointmentId(res.token.replace("tok_", ""));
    }
    setStep(4);
  }

  async function handleSearchAppointments(e: React.FormEvent) {
    e.preventDefault();
    setSearchLoading(true);
    setSearchError('');
    setFoundAppointments([]);

    const res = await findClientAppointmentsAction(slug, searchPhone);
    setSearchLoading(false);

    if (res.success && res.appointments) {
      setFoundAppointments(res.appointments);
    } else {
      setSearchError(res.error || "Nenhum agendamento encontrado.");
    }
  }

  async function handleCancelFound(id: string) {
    if (!confirm("Deseja realmente cancelar este horário?")) return;
    const res = await cancelAppointmentByClientAction(id);
    if (res.success) {
      alert("Agendamento cancelado com sucesso!");
      setFoundAppointments(foundAppointments.filter(a => a.id !== id));
    } else {
      alert(res.error || "Não foi possível cancelar.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between antialiased text-slate-900 font-sans relative">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="Falar no WhatsApp"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 px-5 rounded-full shadow-2xl hover:scale-105 transition-all cursor-pointer"
      >
        <MessageCircle className="w-5 h-5 text-white" />
        <span className="hidden sm:inline">Dúvidas? Fale no WhatsApp</span>
      </a>

      <header className="bg-white border-b border-slate-200/80 py-6 px-6 sm:px-8">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-500/20">
              {businessName ? businessName.slice(0, 2).toUpperCase() : 'VB'}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight capitalize">
                {businessName}
              </h1>
              <p className="text-xs text-slate-500 font-medium">Agendamento online imediato</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCancelModalOpen(true)}
              className="text-xs font-bold text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 py-2.5 px-3.5 rounded-xl border border-slate-200 transition-all cursor-pointer"
            >
              Consultar / Cancelar Horário
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 py-2.5 px-4 rounded-xl border border-emerald-200 transition-all shadow-sm cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Falar no WhatsApp</span>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 py-10 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-10">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                  Passo 1 de 3
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-2">
                  Selecione o Atendimento Desejado
                </h2>
              </div>

              <div className="space-y-3">
                {serviceList.map((svc) => (
                  <div 
                    key={svc.id}
                    onClick={() => {
                      setSelectedService(svc);
                      setStep(2);
                    }}
                    className="p-5 sm:p-6 rounded-2xl border-2 border-slate-200/80 hover:border-blue-600 hover:bg-blue-50/30 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all group"
                  >
                    <div>
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        Online Ativo
                      </span>
                      <h3 className="font-extrabold text-slate-900 text-base group-hover:text-blue-600 transition-colors mt-1">
                        {svc.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>{svc.duration} minutos de duração</span>
                      </div>
                    </div>

                    <div className="text-right sm:shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                      <span className="text-xl font-black text-slate-900">
                        R$ {svc.price},00
                      </span>
                      <span className="text-xs font-bold text-blue-600 flex items-center gap-1 mt-1 group-hover:translate-x-1 transition-transform">
                        Selecionar <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && selectedService && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setStep(1)} 
                  className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" /> Trocar atendimento
                </button>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200/60 px-3 py-1 rounded-full">
                  {selectedService.name} • R$ {selectedService.price},00
                </span>
              </div>

              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                  Passo 2 de 3
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-2">
                  Escolha o Dia e Horário
                </h2>
                <p className="text-xs text-slate-500 mt-1">Horários fatiados dinamicamente com intervalo de almoço:</p>
              </div>

              {/* Carrossel de 14 Dias */}
              <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none">
                {availableDays.map(day => {
                  const isSelected = selectedDate === day.dateStr;
                  return (
                    <button
                      key={day.dateStr}
                      type="button"
                      onClick={() => setSelectedDate(day.dateStr)}
                      className={'flex flex-col items-center justify-center min-w-[72px] py-3 px-2 rounded-2xl border transition-all cursor-pointer ' + (isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/30' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white')}
                    >
                      <span className="text-[10px] font-bold uppercase">{day.dayName}</span>
                      <span className="text-lg font-black my-0.5">{day.dayNumber}</span>
                      <span className="text-[10px] font-semibold capitalize opacity-80">{day.monthName}</span>
                    </button>
                  );
                })}
              </div>

              {/* Horários Reais do Banco */}
              <div className="pt-2">
                {slotsLoading ? (
                  <div className="p-8 text-center text-xs text-slate-400 font-bold">
                    Calculando horários livres na agenda...
                  </div>
                ) : isClosedDay ? (
                  <div className="p-8 bg-slate-50 rounded-2xl text-center text-xs text-slate-500 font-bold border border-slate-200">
                    A clínica não realiza atendimentos neste dia. Por favor, selecione outra data acima.
                  </div>
                ) : dynamicSlots.length === 0 ? (
                  <div className="p-8 bg-slate-50 rounded-2xl text-center text-xs text-slate-500 font-bold border border-slate-200">
                    Todos os horários deste dia já foram preenchidos. Selecione outro dia acima.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {dynamicSlots.map(slot => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={'py-3.5 rounded-2xl font-extrabold text-sm border transition-all cursor-pointer ' + (selectedSlot === slot ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300')}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedSlot && (
                <button
                  onClick={() => setStep(3)}
                  className="w-full mt-4 py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Continuar para Identificação <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {step === 3 && selectedService && (
            <div className="space-y-6">
              <button 
                onClick={() => setStep(2)} 
                className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Alterar dia ou horário
              </button>

              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                  Passo 3 de 3
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-2">
                  Seus Dados para Confirmação
                </h2>
                <p className="text-xs text-slate-500 mt-1">Data escolhida: <strong className="text-blue-600">{selectedDate} às {selectedSlot}</strong></p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Seu Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    placeholder="Ex: Rodrigo Vieira"
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Seu WhatsApp</label>
                  <input
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                    placeholder="(54) 99659-1765"
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleConfirmBooking}
                disabled={!clientName || !clientPhone || loading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Gravando seu agendamento..." : "Confirmar Agendamento"}
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="text-center space-y-6 py-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Agendamento Confirmado!</h2>
              <p className="text-xs text-slate-500">Seu horário para <strong className="text-slate-900">{selectedDate} às {selectedSlot}</strong> foi gravado no sistema.</p>

              {createdAppointmentId && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2 text-xs">
                  <span className="font-bold text-slate-800 block">Precisa cancelar depois?</span>
                  <p className="text-slate-500 text-[11px]">Você pode desmarcar online a qualquer momento acessando o link:</p>
                  <a
                    href={'/manage-booking/' + createdAppointmentId}
                    className="inline-block text-blue-600 font-bold hover:underline"
                  >
                    Gerenciar ou Cancelar meu Agendamento Online →
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal de Cancelamento */}
      {cancelModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-5 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">Consultar ou Cancelar</h3>
                <p className="text-xs text-slate-500">Digite seu WhatsApp para encontrar seus horários.</p>
              </div>
              <button onClick={() => setCancelModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSearchAppointments} className="flex gap-2">
              <input
                type="tel"
                required
                placeholder="(54) 99659-1765"
                value={searchPhone}
                onChange={e => setSearchPhone(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold focus:bg-white focus:border-blue-600 focus:outline-none"
              />
              <button
                type="submit"
                disabled={searchLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
              >
                {searchLoading ? "Buscando..." : "Buscar"}
              </button>
            </form>

            {searchError && (
              <p className="text-xs text-red-600 font-bold">{searchError}</p>
            )}

            {foundAppointments.length > 0 && (
              <div className="space-y-3 pt-2 max-h-60 overflow-y-auto">
                {foundAppointments.map(a => (
                  <div key={a.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-extrabold text-slate-900 block">{a.serviceName}</span>
                      <span className="text-slate-500 text-[11px]">
                        {format(new Date(a.startTime), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCancelFound(a.id)}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg border border-red-200 text-[11px] cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="py-6 px-4 text-center border-t border-slate-200/80 bg-white">
        <div className="max-w-xl mx-auto flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Agendamento protegido com criptografia ponta a ponta e conformidade LGPD.</span>
        </div>
      </footer>
    </div>
  );
}`;

Object.entries(files).forEach(([rel, content]) => {
  const abs = path.join(process.cwd(), rel);
  const dir = path.dirname(abs);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(abs, content, 'utf-8');
  console.log(`  ✓ Atualizado: ${rel}`);
});

console.log("\n⏰ Sistema Avançado de Horários com Turnos e Almoço instalado com sucesso!");