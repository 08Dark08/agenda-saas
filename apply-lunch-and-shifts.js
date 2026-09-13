// apply-lunch-and-shifts.js
const fs = require("fs");
const path = require("path");

console.log("🍱 Aplicando a tela de Turnos, Almoço e Intervalo de Respiro...\n");

const targetPath = path.join(process.cwd(), "src/components/schedule/interactive-schedule-view.tsx");

const code = `'use client';
import React, { useState, useTransition } from 'react';
import { Clock, ShieldCheck, Check, Save, Copy, Utensils } from 'lucide-react';
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

  // Copia a Segunda para Terça a Sexta
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
    alert("Horários de Segunda-feira copiados para Terça, Quarta, Quinta e Sexta!");
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
          <span>Grade de horários com almoço e regras salvas com sucesso no Supabase!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* COLUNA 1: TURNOS DIÁRIOS (MANHÃ E TARDE COM ALMOÇO) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Turnos Semanais com Almoço</span>
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

                      {/* Badge Visual de Almoço */}
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-1 rounded-md hidden sm:inline">
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
                      Folga / Fechado
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
                  className={'py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ' + (bufferMinutes === m ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white')}
                >
                  {m === 0 ? 'Sem intervalo' : m + ' minutos'}
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
}`;

fs.writeFileSync(targetPath, code, "utf-8");
console.log("✓ Componente atualizado com sucesso em: " + targetPath);