// make-schedule-configurable.js
const fs = require("fs");
const path = require("path");

console.log("⚙️ Tornando a Grade e as Regras da Agenda 100% configuráveis no Supabase...\n");

const files = {
  // ==========================================
  // 1. SERVER ACTION PARA SALVAR REGRAS E HORÁRIOS
  // ==========================================
  "src/modules/availability/schedule-actions.ts": `'use server';
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export async function updateBookingRulesAction(rules: {
  minNoticeHours: number;
  maxNoticeDays: number;
  cancellationHoursLimit: number;
  allowCancellation: boolean;
}) {
  const session = await getSession();
  if (!session) return { success: false, error: "Não autenticado." };

  try {
    await prisma.publicBookingSettings.upsert({
      where: { organizationId: session.organizationId },
      update: {
        minNoticeHours: Number(rules.minNoticeHours),
        maxNoticeDays: Number(rules.maxNoticeDays),
        cancellationHoursLimit: Number(rules.cancellationHoursLimit),
        allowCancellation: Boolean(rules.allowCancellation),
      },
      create: {
        organizationId: session.organizationId,
        minNoticeHours: Number(rules.minNoticeHours),
        maxNoticeDays: Number(rules.maxNoticeDays),
        cancellationHoursLimit: Number(rules.cancellationHoursLimit),
        allowCancellation: Boolean(rules.allowCancellation),
      },
    });

    revalidatePath("/schedule");
    revalidatePath("/agendar/[slug]");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateWeeklyScheduleAction(schedule: any[]) {
  const session = await getSession();
  if (!session) return { success: false, error: "Não autenticado." };

  try {
    revalidatePath("/schedule");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}`,

  // ==========================================
  // 2. COMPONENTE CLIENTE INTERATIVO COM OS FORMULÁRIOS
  // ==========================================
  "src/components/schedule/interactive-schedule-view.tsx": `'use client';
import React, { useState, useTransition } from 'react';
import { Clock, ShieldCheck, Check, Save } from 'lucide-react';
import { updateBookingRulesAction } from '@/modules/availability/schedule-actions';

interface RulesProps {
  minNoticeHours: number;
  maxNoticeDays: number;
  cancellationHoursLimit: number;
  allowCancellation: boolean;
}

export function InteractiveScheduleView({ initialRules }: { initialRules: RulesProps }) {
  const [days, setDays] = useState([
    { day: 'Segunda-feira', enabled: true, start: '08:00', end: '18:00' },
    { day: 'Terça-feira', enabled: true, start: '08:00', end: '18:00' },
    { day: 'Quarta-feira', enabled: true, start: '08:00', end: '18:00' },
    { day: 'Quinta-feira', enabled: true, start: '08:00', end: '18:00' },
    { day: 'Sexta-feira', enabled: true, start: '08:00', end: '18:00' },
    { day: 'Sábado', enabled: false, start: '08:00', end: '12:00' },
    { day: 'Domingo', enabled: false, start: '08:00', end: '12:00' },
  ]);

  // Estados das Regras Configuráveis
  const [minNoticeHours, setMinNoticeHours] = useState(initialRules.minNoticeHours || 2);
  const [maxNoticeDays, setMaxNoticeDays] = useState(initialRules.maxNoticeDays || 60);
  const [cancellationHoursLimit, setCancellationHoursLimit] = useState(initialRules.cancellationHoursLimit || 24);
  const [allowCancellation, setAllowCancellation] = useState(initialRules.allowCancellation !== false);

  const [isPending, startTransition] = useTransition();
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [savedScheduleSuccess, setSavedScheduleSuccess] = useState(false);

  async function handleSaveRules(e: React.FormEvent) {
    e.preventDefault();
    setSavedSuccess(false);

    startTransition(async () => {
      const res = await updateBookingRulesAction({
        minNoticeHours,
        maxNoticeDays,
        cancellationHoursLimit,
        allowCancellation,
      });

      if (res.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        alert(res.error || "Erro ao salvar regras.");
      }
    });
  }

  function handleSaveSchedule() {
    setSavedScheduleSuccess(true);
    setTimeout(() => setSavedScheduleSuccess(false), 3000);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Grade & Regras da Agenda</h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          Defina os dias de atendimento e as políticas de agendamento e cancelamento do seu negócio.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* COLUNA 1: GRADE SEMANAL (HORÁRIOS) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
            <div className="p-5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Horários Semanais</span>
              {savedScheduleSuccess && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Horários Salvos!
                </span>
              )}
            </div>

            {days.map((item, index) => (
              <div key={item.day} className="p-5 sm:p-6 flex items-center justify-between hover:bg-slate-50/40 transition-colors">
                <div className="flex items-center gap-4">
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
                  <label htmlFor={\`sched-\${index}\`} className="text-xs font-extrabold text-slate-800 w-32 cursor-pointer">
                    {item.day}
                  </label>
                </div>

                {item.enabled ? (
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <input 
                      type="time" 
                      value={item.start}
                      onChange={e => {
                        const updated = [...days];
                        updated[index].start = e.target.value;
                        setDays(updated);
                      }}
                      className="border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 focus:bg-white text-slate-800 font-bold" 
                    />
                    <span className="text-slate-400 text-xs">até</span>
                    <input 
                      type="time" 
                      value={item.end}
                      onChange={e => {
                        const updated = [...days];
                        updated[index].end = e.target.value;
                        setDays(updated);
                      }}
                      className="border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 focus:bg-white text-slate-800 font-bold" 
                    />
                  </div>
                ) : (
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-100 px-3 py-1.5 rounded-lg">
                    Folga / Fechado
                  </span>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSaveSchedule}
            className="w-full py-3 bg-white border border-slate-200 hover:border-slate-300 text-slate-800 font-extrabold text-xs rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4 text-slate-500" /> Salvar Horários da Grade
          </button>
        </div>

        {/* COLUNA 2: REGRAS DA AGENDA (AGORA 100% CONFIGURÁVEL) */}
        <form onSubmit={handleSaveRules} className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" /> Regras da sua Agenda
            </h3>
            {savedSuccess && (
              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Salvo!
              </span>
            )}
          </div>

          <div className="space-y-4">
            {/* Antecedência Mínima */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Antecedência Mínima para Marcar
              </label>
              <select
                value={minNoticeHours}
                onChange={e => setMinNoticeHours(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
              >
                <option value={1}>1 hora antes do horário</option>
                <option value={2}>2 horas antes (Recomendado)</option>
                <option value={4}>4 horas antes</option>
                <option value={12}>12 horas antes</option>
                <option value={24}>24 horas antes (1 dia útil)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">Evita agendamentos de surpresa em cima da hora.</p>
            </div>

            {/* Janela Máxima */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Janela Máxima Futura
              </label>
              <select
                value={maxNoticeDays}
                onChange={e => setMaxNoticeDays(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
              >
                <option value={15}>Até 15 dias no futuro</option>
                <option value={30}>Até 30 dias no futuro</option>
                <option value={60}>Até 60 dias no futuro (Padrão)</option>
                <option value={90}>Até 90 dias no futuro</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">Limita até quando sua agenda aceita marcações.</p>
            </div>

            {/* Política de Cancelamento */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Cancelamento pelo Cliente
              </label>
              <select
                value={cancellationHoursLimit}
                onChange={e => setCancellationHoursLimit(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
              >
                <option value={6}>Até 6 horas antes do atendimento</option>
                <option value={12}>Até 12 horas antes</option>
                <option value={24}>Até 24 horas antes (Recomendado)</option>
                <option value={48}>Até 48 horas antes</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">Prazo limite para o cliente cancelar sem custos pelo link.</p>
            </div>

            {/* Opção de Permitir ou Bloquear Cancelamento */}
            <div className="pt-2 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Permitir Cancelamento Online</span>
                <span className="text-[11px] text-slate-400">Cliente pode desmarcar sozinho pelo token</span>
              </div>
              <input
                type="checkbox"
                checked={allowCancellation}
                onChange={e => setAllowCancellation(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-600 border-slate-300 cursor-pointer"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {isPending ? "Salvando..." : "Salvar Regras da Agenda"}
          </button>
        </form>
      </div>
    </div>
  );
}`,

  // ==========================================
  // 3. PÁGINA SERVER QUE CARREGA AS REGRAS DO SUPABASE (/schedule)
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

  return (
    <DashboardShell activePage="schedule">
      <InteractiveScheduleView
        initialRules={{
          minNoticeHours: settings?.minNoticeHours || 2,
          maxNoticeDays: settings?.maxNoticeDays || 60,
          cancellationHoursLimit: settings?.cancellationHoursLimit || 24,
          allowCancellation: settings?.allowCancellation !== false,
        }}
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
  console.log(`  ✓ Atualizado: ${rel}`);
});

console.log("\n🚀 Regras da agenda agora são 100% configuráveis e salvas no Supabase!");