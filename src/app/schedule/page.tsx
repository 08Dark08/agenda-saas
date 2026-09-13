'use client';
import React, { useState } from 'react';
import { Clock, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export default function SchedulePage() {
  const [days, setDays] = useState([
    { day: 'Segunda-feira', enabled: true, start: '08:00', end: '18:00' },
    { day: 'Terça-feira', enabled: true, start: '08:00', end: '18:00' },
    { day: 'Quarta-feira', enabled: true, start: '08:00', end: '18:00' },
    { day: 'Quinta-feira', enabled: true, start: '08:00', end: '18:00' },
    { day: 'Sexta-feira', enabled: true, start: '08:00', end: '18:00' },
    { day: 'Sábado', enabled: false, start: '08:00', end: '12:00' },
    { day: 'Domingo', enabled: false, start: '08:00', end: '12:00' },
  ]);

  return (
    <DashboardShell activePage="schedule">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Grade de Atendimento Semanal</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Defina quais dias e turnos a engine de cálculo liberará vagas para os clientes.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Seletor Semanal */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
            {days.map((item, index) => (
              <div key={item.day} className="p-5 sm:p-6 flex items-center justify-between hover:bg-slate-50/40 transition-colors">
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    id={`sched-${index}`}
                    checked={item.enabled}
                    onChange={e => {
                      const updated = [...days];
                      updated[index].enabled = e.target.checked;
                      setDays(updated);
                    }}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-600 border-slate-300"
                  />
                  <label htmlFor={`sched-${index}`} className="text-xs font-extrabold text-slate-800 w-32 cursor-pointer">
                    {item.day}
                  </label>
                </div>

                {item.enabled ? (
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <input 
                      type="time" 
                      defaultValue={item.start} 
                      className="border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 focus:bg-white text-slate-800 font-bold" 
                    />
                    <span className="text-slate-400 text-xs">até</span>
                    <input 
                      type="time" 
                      defaultValue={item.end} 
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

          {/* Card Lateral de Regras do Negócio */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" /> Regras da sua Agenda
            </h3>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="font-bold text-slate-800 block">Antecedência Mínima</span>
                <span className="text-slate-500">2 horas antes do atendimento</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="font-bold text-slate-800 block">Janela Máxima</span>
                <span className="text-slate-500">Até 60 dias no futuro</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="font-bold text-slate-800 block">Cancelamento</span>
                <span className="text-slate-500">Permitido até 24h antes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}