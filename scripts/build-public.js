const fs = require("fs");
const path = require("path");

const files = {
  // 1. PÁGINA PÚBLICA DE AGENDAMENTO (/agendar/[slug])
  "src/app/agendar/[slug]/page.tsx": `'use client';
import React, { useState } from 'react';
import { Calendar, Clock, CheckCircle2, ChevronRight, ArrowLeft, ShieldCheck, Phone } from 'lucide-react';

export default function PublicBookingPage({ params }: { params: { slug: string } }) {
  const [step, setStep] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  const slots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col justify-between">
      <header className="bg-white border-b border-neutral-200 py-6 px-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-neutral-900 tracking-tight capitalize">
              {params.slug.replace('-', ' ')}
            </h1>
            <p className="text-xs text-neutral-500 font-medium mt-0.5">Agendamento online imediato</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-600 bg-neutral-50 py-2 px-3 rounded-xl border border-neutral-200">
            <Phone className="w-3.5 h-3.5 text-neutral-400" />
            <span>(54) 99659-1765</span>
          </div>
        </div>
      </header>

      <main className="flex-1 py-10 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl border border-neutral-200 p-8 sm:p-10">
          
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-neutral-900">Selecione o Atendimento</h2>
                <p className="text-xs text-neutral-500 mt-1">Escolha o serviço que deseja realizar:</p>
              </div>

              <div 
                onClick={() => setStep(2)}
                className="p-5 rounded-2xl border-2 border-blue-600 bg-blue-50/40 cursor-pointer flex items-center justify-between hover:shadow-sm transition-all"
              >
                <div>
                  <h3 className="font-bold text-neutral-900 text-base">Consulta Inicial / Avaliação</h3>
                  <p className="text-xs text-neutral-500 mt-1">Atendimento completo com diagnóstico e direcionamento.</p>
                  <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-neutral-600">
                    <Clock className="w-3.5 h-3.5 text-neutral-400" />
                    <span>50 minutos</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-neutral-900">R$ 150,00</span>
                  <ChevronRight className="w-5 h-5 text-blue-600 ml-auto mt-2" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <button onClick={() => setStep(1)} className="text-xs font-bold text-neutral-500 hover:text-neutral-900 flex items-center gap-1">
                  <ArrowLeft className="w-4 h-4" /> Trocar serviço
                </button>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">Consulta Inicial</span>
              </div>

              <div>
                <h2 className="text-lg font-bold text-neutral-900">Escolha o Horário de Hoje</h2>
                <p className="text-xs text-neutral-500 mt-1">Horários calculados em tempo real na agenda:</p>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {slots.map(slot => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={\`py-3 rounded-xl font-bold text-sm border transition-all \${
                      selectedSlot === slot
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                        : 'bg-white text-neutral-800 border-neutral-200 hover:border-neutral-300'
                    }\`}
                  >
                    {slot}
                  </button>
                ))}
              </div>

              {selectedSlot && (
                <button
                  onClick={() => setStep(3)}
                  className="w-full mt-4 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md shadow-blue-200 transition-all flex items-center justify-center gap-2"
                >
                  Continuar para Identificação <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <button onClick={() => setStep(2)} className="text-xs font-bold text-neutral-500 hover:text-neutral-900 flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Alterar horário ({selectedSlot})
              </button>

              <div>
                <h2 className="text-lg font-bold text-neutral-900">Seus dados para confirmação</h2>
                <p className="text-xs text-neutral-500 mt-1">Enviaremos o comprovante e os lembretes por este contato.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase">Seu Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    placeholder="Ex: Carlos Eduardo Silva"
                    className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase">Seu WhatsApp</label>
                  <input
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                    placeholder="(54) 99999-8888"
                    className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:border-blue-600"
                  />
                </div>
              </div>

              <button
                onClick={() => setStep(4)}
                disabled={!clientName || !clientPhone}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center disabled:opacity-50"
              >
                Confirmar Agendamento
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="text-center space-y-6 py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h2 className="text-2xl font-black text-neutral-900">Agendamento Confirmado!</h2>
                <p className="text-xs text-neutral-500 mt-2">
                  Seu horário foi reservado com sucesso no sistema.
                </p>
              </div>

              <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-200 text-left space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500 font-medium">Cliente:</span>
                  <span className="font-bold text-neutral-900">{clientName}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500 font-medium">Serviço:</span>
                  <span className="font-bold text-neutral-900">Consulta Inicial</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500 font-medium">Horário:</span>
                  <span className="font-bold text-blue-600">{selectedSlot} (Hoje)</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      <footer className="py-6 px-4 text-center border-t border-neutral-200 bg-white">
        <div className="max-w-xl mx-auto flex items-center justify-center gap-2 text-xs text-neutral-400">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Agendamento protegido com criptografia e LGPD.</span>
        </div>
      </footer>
    </div>
  );
}`
};

Object.entries(files).forEach(([rel, content]) => {
  const abs = path.join(process.cwd(), rel);
  const dir = path.dirname(abs);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(abs, content, 'utf-8');
  console.log(`  ✓ Criado: ${rel}`);
});