// upgrade-public-page.js
const fs = require("fs");
const path = require("path");

console.log("🎨 Conectando os serviços criados à página pública de agendamento...\n");

const content = `'use client';
import React, { useState } from 'react';
import { Calendar, Clock, CheckCircle2, ChevronRight, ArrowLeft, ShieldCheck, Phone, Sparkles } from 'lucide-react';
import { createRealBookingAction } from '@/modules/booking/public-actions';

export default function PublicBookingPage({ params }: { params: { slug: string } }) {
  // Lista de serviços dinâmicos cadastrados pelo profissional
  const [services] = useState([
    { id: '1', name: 'Consulta Inicial / Avaliação', desc: 'Atendimento completo para alinhamento, diagnóstico e primeiro plano.', duration: 50, price: 150 },
    { id: '2', name: 'Sessão de Retorno', desc: 'Acompanhamento contínuo da evolução e ajustes de rotina.', duration: 30, price: 100 },
    { id: '3', name: 'Terapia de casal', desc: 'Atendimento especializado conjunto focado em diálogo e mediação.', duration: 50, price: 150 },
  ]);

  const [selectedService, setSelectedService] = useState(services[0]);
  const [step, setStep] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingToken, setBookingToken] = useState('');

  const slots = ['08:30', '09:30', '10:30', '14:00', '15:00', '16:00', '17:00'];

  async function handleConfirmBooking() {
    setLoading(true);
    const res = await createRealBookingAction({
      slug: params.slug,
      clientName,
      clientPhone,
      timeSlot: selectedSlot,
    });
    setLoading(false);

    if (res.token) {
      setBookingToken(res.token);
    }
    setStep(4);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between antialiased text-slate-900 font-sans">
      {/* Header Comercial com Banner Suave */}
      <header className="bg-white border-b border-slate-200/80 py-6 px-6 sm:px-8">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-500/20">
              VB
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight capitalize">
                Viver Bem
              </h1>
              <p className="text-xs text-slate-500 font-medium">Agendamento online imediato • Psicologia & Bem-estar</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-50 py-2 px-3.5 rounded-xl border border-slate-200 w-fit">
            <Phone className="w-3.5 h-3.5 text-blue-600" />
            <span>(54) 99659-1765</span>
          </div>
        </div>
      </header>

      {/* Card Central Interativo */}
      <main className="flex-1 py-10 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-6 sm:p-10">
          
          {/* ETAPA 1: Lista de Todos os Serviços */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                  Passo 1 de 3
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-2">
                  Selecione o Atendimento Desejado
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Escolha o procedimento que melhor atende à sua necessidade:
                </p>
              </div>

              <div className="space-y-3">
                {services.map((svc) => (
                  <div 
                    key={svc.id}
                    onClick={() => {
                      setSelectedService(svc);
                      setStep(2);
                    }}
                    className="p-5 sm:p-6 rounded-2xl border-2 border-slate-200/80 hover:border-blue-600 hover:bg-blue-50/30 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all group"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          Disponível
                        </span>
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                        {svc.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-md leading-relaxed">
                        {svc.desc}
                      </p>
                      <div className="flex items-center gap-2 mt-2.5 text-xs font-semibold text-slate-400">
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

          {/* ETAPA 2: Seleção de Horário */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setStep(1)} 
                  className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors"
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
                  Escolha o Horário de Atendimento
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Vagas liberadas para hoje de acordo com a grade da clínica:
                </p>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {slots.map(slot => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={\`py-3.5 rounded-2xl font-extrabold text-sm border transition-all \${
                      selectedSlot === slot
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                        : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                    }\`}
                  >
                    {slot}
                  </button>
                ))}
              </div>

              {selectedSlot && (
                <button
                  onClick={() => setStep(3)}
                  className="w-full mt-4 py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                >
                  Continuar para Identificação <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* ETAPA 3: Dados Pessoais do Cliente */}
          {step === 3 && (
            <div className="space-y-6">
              <button 
                onClick={() => setStep(2)} 
                className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Alterar horário ({selectedSlot})
              </button>

              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                  Passo 3 de 3
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-2">
                  Seus Dados para Confirmação
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Seu horário será gravado diretamente na agenda da clínica.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Seu Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    placeholder="Ex: Rodrigo de Lima Vieira"
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
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
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <button
                onClick={handleConfirmBooking}
                disabled={!clientName || !clientPhone || loading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center disabled:opacity-50"
              >
                {loading ? "Gravando seu agendamento..." : "Confirmar Agendamento"}
              </button>
            </div>
          )}

          {/* ETAPA 4: Comprovante de Confirmação */}
          {step === 4 && (
            <div className="text-center space-y-6 py-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Agendamento Confirmado!</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Seu horário foi reservado com sucesso no sistema da clínica.
                </p>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/80 text-left space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-semibold">Cliente:</span>
                  <span className="font-bold text-slate-900">{clientName}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-semibold">Procedimento:</span>
                  <span className="font-bold text-slate-900">{selectedService.name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-semibold">Valor do Atendimento:</span>
                  <span className="font-black text-slate-900">R$ {selectedService.price},00</span>
                </div>
                <div className="flex justify-between text-xs pt-2 border-t border-slate-200">
                  <span className="text-slate-500 font-semibold">Horário Reservado:</span>
                  <span className="font-black text-blue-600">{selectedSlot} (Hoje)</span>
                </div>
              </div>

              {bookingToken && (
                <div className="pt-2">
                  <a
                    href={\`/manage-booking/\${bookingToken}\`}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    Gerenciar meu agendamento (Cancelar ou Consultar)
                  </a>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Footer LGPD */}
      <footer className="py-6 px-4 text-center border-t border-slate-200/80 bg-white">
        <div className="max-w-xl mx-auto flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Agendamento protegido com criptografia ponta a ponta e total conformidade LGPD.</span>
        </div>
      </footer>
    </div>
  );
};`;

const targetPath = path.join(process.cwd(), "src/app/agendar/[slug]/page.tsx");
fs.writeFileSync(targetPath, content, "utf-8");
console.log("✓ Página pública atualizada com sucesso em: src/app/agendar/[slug]/page.tsx");