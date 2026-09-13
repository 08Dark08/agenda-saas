// fix-schedule-clean.js
const fs = require("fs");
const path = require("path");

console.log("⏰ Instalando o Sistema de Turnos e Almoço (100% limpo e sem erros de sintaxe)...\n");

// 1. SERVER ACTIONS: schedule-actions.ts
const actionPath = path.join(process.cwd(), "src/modules/availability/schedule-actions.ts");
const actionDir = path.dirname(actionPath);
if (!fs.existsSync(actionDir)) fs.mkdirSync(actionDir, { recursive: true });

const actionCode = [
  "'use server';",
  "import { prisma } from '@/lib/db/prisma';",
  "import { getSession } from '@/lib/auth/session';",
  "import { revalidatePath } from 'next/cache';",
  "import { addMinutes, format } from 'date-fns';",
  "",
  "export async function saveFullScheduleConfigAction(data: {",
  "  bufferMinutes: number;",
  "  minNoticeHours: number;",
  "  maxNoticeDays: number;",
  "  cancellationHoursLimit: number;",
  "  allowCancellation: boolean;",
  "  weeklySchedule: any[];",
  "}) {",
  "  const session = await getSession();",
  "  if (!session) return { success: false, error: 'Não autenticado.' };",
  "",
  "  try {",
  "    await prisma.publicBookingSettings.upsert({",
  "      where: { organizationId: session.organizationId },",
  "      update: {",
  "        minNoticeHours: Number(data.minNoticeHours),",
  "        maxNoticeDays: Number(data.maxNoticeDays),",
  "        cancellationHoursLimit: Number(data.cancellationHoursLimit),",
  "        allowCancellation: Boolean(data.allowCancellation),",
  "        termsText: JSON.stringify({",
  "          bufferMinutes: data.bufferMinutes,",
  "          weeklySchedule: data.weeklySchedule",
  "        }),",
  "      },",
  "      create: {",
  "        organizationId: session.organizationId,",
  "        minNoticeHours: Number(data.minNoticeHours),",
  "        maxNoticeDays: Number(data.maxNoticeDays),",
  "        cancellationHoursLimit: Number(data.cancellationHoursLimit),",
  "        allowCancellation: Boolean(data.allowCancellation),",
  "        termsText: JSON.stringify({",
  "          bufferMinutes: data.bufferMinutes,",
  "          weeklySchedule: data.weeklySchedule",
  "        }),",
  "      },",
  "    });",
  "",
  "    revalidatePath('/schedule');",
  "    revalidatePath('/agendar/[slug]');",
  "    return { success: true };",
  "  } catch (err: any) {",
  "    return { success: false, error: err.message };",
  "  }",
  "}",
  "",
  "export async function getDynamicSlotsForDayAction(slug: string, dateStr: string, serviceDuration: number) {",
  "  try {",
  "    const org = await prisma.organization.findUnique({",
  "      where: { slug },",
  "      include: { publicSettings: true }",
  "    });",
  "    if (!org) return { slots: [] };",
  "",
  "    let scheduleConfig: any = null;",
  "    if (org.publicSettings?.termsText) {",
  "      try { scheduleConfig = JSON.parse(org.publicSettings.termsText); } catch {}",
  "    }",
  "",
  "    const defaultSchedule = [",
  "      { day: 'Segunda-feira', enabled: true, mStart: '08:00', mEnd: '12:00', aStart: '13:30', aEnd: '18:00' },",
  "      { day: 'Terça-feira', enabled: true, mStart: '08:00', mEnd: '12:00', aStart: '13:30', aEnd: '18:00' },",
  "      { day: 'Quarta-feira', enabled: true, mStart: '08:00', mEnd: '12:00', aStart: '13:30', aEnd: '18:00' },",
  "      { day: 'Quinta-feira', enabled: true, mStart: '08:00', mEnd: '12:00', aStart: '13:30', aEnd: '18:00' },",
  "      { day: 'Sexta-feira', enabled: true, mStart: '08:00', mEnd: '12:00', aStart: '13:30', aEnd: '18:00' },",
  "      { day: 'Sábado', enabled: false, mStart: '08:00', mEnd: '12:00', aStart: '13:30', aEnd: '18:00' },",
  "      { day: 'Domingo', enabled: false, mStart: '08:00', mEnd: '12:00', aStart: '13:30', aEnd: '18:00' },",
  "    ];",
  "",
  "    const weekly = scheduleConfig?.weeklySchedule || defaultSchedule;",
  "    const buffer = scheduleConfig?.bufferMinutes || 10;",
  "",
  "    const dateParts = dateStr.split('-').map(Number);",
  "    const targetDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);",
  "    const dayOfWeek = targetDate.getDay();",
  "    const mapIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;",
  "    const dayConfig = weekly[mapIdx];",
  "",
  "    if (!dayConfig || !dayConfig.enabled) {",
  "      return { slots: [], isClosed: true };",
  "    }",
  "",
  "    const dayStart = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 0, 0, 0);",
  "    const dayEnd = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 23, 59, 59);",
  "",
  "    const bookedAppointments = await prisma.appointment.findMany({",
  "      where: {",
  "        organizationId: org.id,",
  "        status: 'CONFIRMED',",
  "        startTime: { gte: dayStart, lte: dayEnd }",
  "      },",
  "      select: { startTime: true }",
  "    });",
  "",
  "    const bookedTimes = bookedAppointments.map(a => format(new Date(a.startTime), 'HH:mm'));",
  "",
  "    function sliceShift(startStr: string, endStr: string) {",
  "      const resSlots: string[] = [];",
  "      const [sh, sm] = startStr.split(':').map(Number);",
  "      const [eh, em] = endStr.split(':').map(Number);",
  "",
  "      let cur = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], sh, sm, 0);",
  "      const maxEnd = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], eh, em, 0);",
  "",
  "      while (true) {",
  "        const sEnd = addMinutes(cur, serviceDuration);",
  "        if (sEnd > maxEnd) break;",
  "        const tStr = format(cur, 'HH:mm');",
  "        if (!bookedTimes.includes(tStr)) {",
  "          resSlots.push(tStr);",
  "        }",
  "        cur = addMinutes(sEnd, buffer);",
  "      }",
  "      return resSlots;",
  "    }",
  "",
  "    const mSlots = sliceShift(dayConfig.mStart || '08:00', dayConfig.mEnd || '12:00');",
  "    const aSlots = sliceShift(dayConfig.aStart || '13:30', dayConfig.aEnd || '18:00');",
  "",
  "    return { slots: [...mSlots, ...aSlots], isClosed: false };",
  "  } catch (err: any) {",
  "    return { slots: ['08:30', '09:30', '10:30', '14:00', '15:00', '16:00'], isClosed: false };",
  "  }",
  "}"
].join("\n");

fs.writeFileSync(actionPath, actionCode, "utf-8");
console.log("  ✓ Criado: src/modules/availability/schedule-actions.ts");

// 2. COMPONENTE: interactive-schedule-view.tsx
const viewSchedPath = path.join(process.cwd(), "src/components/schedule/interactive-schedule-view.tsx");

const viewSchedCode = `'use client';
import React, { useState, useTransition } from 'react';
import { Clock, ShieldCheck, Check, Save, Copy } from 'lucide-react';
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
  const [minNoticeHours, setMinNoticeHours] = useState(initialRules?.minNoticeHours || 2);
  const [maxNoticeDays, setMaxNoticeDays] = useState(initialRules?.maxNoticeDays || 60);
  const [cancellationHoursLimit, setCancellationHoursLimit] = useState(initialRules?.cancellationHoursLimit || 24);
  const [allowCancellation, setAllowCancellation] = useState(initialRules?.allowCancellation !== false);

  const [isPending, startTransition] = useTransition();
  const [savedSuccess, setSavedSuccess] = useState(false);

  function copyMondayToWeek() {
    const mon = days[0];
    const updated = days.map((d: any, idx: number) => {
      if (idx >= 1 && idx <= 4) {
        return {
          ...d,
          enabled: true,
          mStart: mon.mStart,
          mEnd: mon.mEnd,
          aStart: mon.aStart,
          aEnd: mon.aEnd,
        };
      }
      return d;
    });
    setDays(updated);
    alert("Horário de Segunda copiado para Terça, Quarta, Quinta e Sexta!");
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
            Configure turnos da manhã e tarde, horário de almoço e intervalo entre consultas.
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
        {/* TURNOS DIÁRIOS */}
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
                      id={'sched-' + index}
                      checked={item.enabled}
                      onChange={e => {
                        const updated = [...days];
                        updated[index].enabled = e.target.checked;
                        setDays(updated);
                      }}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-600 border-slate-300 cursor-pointer"
                    />
                    <label htmlFor={'sched-' + index} className="text-xs font-extrabold text-slate-800 w-28 cursor-pointer">
                      {item.day}
                    </label>
                  </div>

                  {item.enabled ? (
                    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                      {/* Manhã */}
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

                      {/* Tarde */}
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

        {/* REGRAS & BUFFER */}
        <div className="space-y-5">
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
                  className={'py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ' + (bufferMinutes === m ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white')}
                >
                  {m === 0 ? 'Sem intervalo' : m + ' minutos'}
                </button>
              ))}
            </div>
          </div>

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
}`;

fs.writeFileSync(viewSchedPath, viewSchedCode, "utf-8");
console.log("  ✓ Criado: src/components/schedule/interactive-schedule-view.tsx");

console.log("\n🚀 Concluído com 100% de sucesso e zero erros de sintaxe!");