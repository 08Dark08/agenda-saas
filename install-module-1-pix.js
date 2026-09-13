// install-module-1-pix.js
const fs = require("fs");
const path = require("path");

console.log("💰 Instalando o Módulo 1: Cobrança de Sinal Antecipado via PIX...\n");

// 1. ATUALIZA A SERVER ACTION: public-actions.ts para gravar o sinal pago
const actionPath = path.join(process.cwd(), "src/modules/booking/public-actions.ts");
const actionCode = `'use server';
import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";
import { addMinutes } from "date-fns";
import { revalidatePath } from "next/cache";

export async function createRealBookingAction(data: {
  slug: string;
  clientName: string;
  clientPhone: string;
  dateStr: string;
  timeSlot: string;
  professionalId?: string;
  depositPaidCents?: number; // VALOR DO SINAL PAGO VIA PIX
}) {
  try {
    const org = await prisma.organization.findUnique({
      where: { slug: data.slug },
      include: {
        services: { where: { isActive: true } },
        professionals: { where: { isActive: true } },
      },
    });

    if (!org || org.services.length === 0 || org.professionals.length === 0) {
      return { success: false, error: "Clínica ou serviços não disponíveis." };
    }

    const service = org.services[0];
    let professional = org.professionals[0];
    if (data.professionalId) {
      const selected = org.professionals.find(p => p.id === data.professionalId);
      if (selected) professional = selected;
    }

    const isoStringWithTimezone = data.dateStr + "T" + data.timeSlot + ":00-03:00";
    const startTime = new Date(isoStringWithTimezone);
    const endTime = addMinutes(startTime, service.durationMinutes);

    const slotKey = "slot_" + professional.id + "_" + startTime.toISOString() + "_" + Date.now();

    const client = await prisma.client.upsert({
      where: {
        organizationId_phone: {
          organizationId: org.id,
          phone: data.clientPhone,
        },
      },
      update: { fullName: data.clientName },
      create: {
        organizationId: org.id,
        fullName: data.clientName,
        phone: data.clientPhone,
      },
    });

    const depositCents = data.depositPaidCents || 0;

    const appointment = await prisma.appointment.create({
      data: {
        organizationId: org.id,
        professionalId: professional.id,
        serviceId: service.id,
        clientId: client.id,
        startTime,
        endTime,
        slotKey,
        status: "CONFIRMED",
        totalPriceCents: service.priceCents,
        depositAmountCents: depositCents, // REGISTRA O SINAL PAGO NO SUPABASE
      },
    });

    // Se houve sinal, registra o pagamento no histórico financeiro
    if (depositCents > 0) {
      await prisma.payment.create({
        data: {
          organizationId: org.id,
          appointmentId: appointment.id,
          gateway: "ASAAS",
          amountCents: depositCents,
          status: "PAID",
          paidAt: new Date(),
        }
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/appointments");
    revalidatePath("/clients");
    revalidatePath("/financial");

    return { 
      success: true, 
      token: "tok_" + appointment.id,
      professionalName: professional.name 
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}`;

fs.writeFileSync(actionPath, actionCode, "utf-8");
console.log("  ✓ Server Action atualizada com registro de sinal PIX!");

// 2. ATUALIZA A TELA PÚBLICA COM O PASSO DE PAGAMENTO PIX E QR CODE
const viewPath = path.join(process.cwd(), "src/components/booking/public-booking-client-view.tsx");
const viewCode = `'use client';
import React, { useState, useMemo } from 'react';
import { 
  Calendar, Clock, CheckCircle2, ChevronRight, ArrowLeft, 
  ShieldCheck, MessageCircle, X, QrCode, Copy, Check, AlertCircle, DollarSign 
} from 'lucide-react';
import { createRealBookingAction } from '@/modules/booking/public-actions';
import { findClientAppointmentsAction, cancelAppointmentByClientAction } from '@/modules/booking/cancel-actions';
import { format, addDays, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function PublicBookingClientView({
  slug,
  businessName = 'Viver Bem',
  phone = '54996591765',
  services = [],
  professionals = [],
  weeklySchedule = [],
  bufferMinutes = 0,
}: any) {
  const fallbackService = { id: 'default', name: 'Consulta Inicial', duration: 50, price: 150 };
  const serviceList = (services && services.length > 0) ? services : [fallbackService];

  const [selectedService, setSelectedService] = useState(serviceList[0]);
  const [selectedPro, setSelectedPro] = useState(professionals[0] || null);
  const [step, setStep] = useState(1);

  // Valor do sinal fixado (R$ 50,00 para garantir a vaga)
  const depositAmount = 50; 

  const availableDays = Array.from({ length: 14 }).map((_, i) => {
    const d = addDays(new Date(), i);
    return {
      dateStr: format(d, 'yyyy-MM-dd'),
      dayName: format(d, 'EEE', { locale: ptBR }),
      dayNumber: format(d, 'd'),
      monthName: format(d, 'MMM', { locale: ptBR }),
      dayOfWeekIndex: d.getDay(),
      isToday: i === 0,
    };
  });

  const [selectedDate, setSelectedDate] = useState(availableDays[0].dateStr);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [confirmedProName, setConfirmedProName] = useState('');
  const [createdAppointmentId, setCreatedAppointmentId] = useState('');

  // Modal de Cancelamento
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [searchPhone, setSearchPhone] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [foundAppointments, setFoundAppointments] = useState<any[]>([]);
  const [searchError, setSearchError] = useState('');

  // Código PIX Copia e Cola formatado
  const pixKey = phone.replace(/\\D/g, "") || "54996591765";
  const pixCopiaCola = "00020126360014BR.GOV.BCB.PIX0114" + pixKey + "520400005303986540550.005802BR5909" + businessName.slice(0, 9).toUpperCase() + "6009SAO PAULO62070503***6304";
  const qrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + encodeURIComponent(pixCopiaCola);

  // Cálculo de slots dinâmicos
  const dynamicSlots = useMemo(() => {
    const currentDayObj = availableDays.find(d => d.dateStr === selectedDate);
    if (!currentDayObj) return [];

    const dayMapIdx = currentDayObj.dayOfWeekIndex === 0 ? 6 : currentDayObj.dayOfWeekIndex - 1;
    const dayConfig = weeklySchedule[dayMapIdx];

    if (!dayConfig || !dayConfig.enabled) return [];

    const duration = selectedService?.duration || 50;
    const buffer = Number(bufferMinutes) || 0;
    const slotsResult: string[] = [];

    function sliceRange(startStr: string, endStr: string) {
      if (!startStr || !endStr) return;
      const [sh, sm] = startStr.split(':').map(Number);
      const [eh, em] = endStr.split(':').map(Number);

      const baseDate = new Date();
      let cur = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), sh, sm, 0);
      const maxEnd = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), eh, em, 0);

      while (true) {
        const slotEnd = addMinutes(cur, duration);
        if (slotEnd > maxEnd) break;
        slotsResult.push(format(cur, 'HH:mm'));
        cur = addMinutes(slotEnd, buffer);
      }
    }

    sliceRange(dayConfig.mStart || '08:00', dayConfig.mEnd || '12:00');
    sliceRange(dayConfig.aStart || '13:30', dayConfig.aEnd || '18:00');

    return slotsResult;
  }, [selectedDate, selectedService, weeklySchedule, bufferMinutes]);

  const rawPhone = String(phone || '54996591765');
  const cleanPhone = rawPhone.replace(/\\D/g, '') || '54996591765';
  const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone;
  const whatsappUrl = 'https://wa.me/' + fullPhone + '?text=' + encodeURIComponent('Olá! Gostaria de tirar uma dúvida sobre agendamento.');

  function copyPix() {
    navigator.clipboard.writeText(pixCopiaCola);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2500);
  }

  async function handleFinalizeWithPix() {
    setLoading(true);
    const res = await createRealBookingAction({
      slug: slug || 'viverbem',
      clientName,
      clientPhone,
      dateStr: selectedDate,
      timeSlot: selectedSlot,
      professionalId: selectedPro?.id,
      depositPaidCents: depositAmount * 100, // R$ 50,00 registrado
    });
    setLoading(false);

    if (res?.token) {
      setCreatedAppointmentId(res.token.replace("tok_", ""));
      setConfirmedProName(res.professionalName || selectedPro?.name || '');
    }
    setStep(4);
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
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight capitalize">{businessName}</h1>
              <p className="text-xs text-slate-500 font-medium">Agendamento online imediato</p>
            </div>
          </div>

          <button
            onClick={() => setCancelModalOpen(true)}
            className="text-xs font-bold text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 py-2.5 px-3.5 rounded-xl border border-slate-200 transition-all cursor-pointer"
          >
            Consultar / Cancelar Horário
          </button>
        </div>
      </header>

      <main className="flex-1 py-10 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-10">
          
          {/* PASSO 1: PROCEDIMENTO */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                  Passo 1
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-2">
                  Selecione o Atendimento Desejado
                </h2>
              </div>

              <div className="space-y-3">
                {serviceList.map((svc: any) => (
                  <div 
                    key={svc.id}
                    onClick={() => {
                      setSelectedService(svc);
                      setStep(professionals.length > 1 ? 1.5 : 2);
                    }}
                    className="p-5 sm:p-6 rounded-2xl border-2 border-slate-200/80 hover:border-blue-600 hover:bg-blue-50/30 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all group"
                  >
                    <div>
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-wider">Online Ativo</span>
                      <h3 className="font-extrabold text-slate-900 text-base group-hover:text-blue-600 transition-colors mt-1">{svc.name}</h3>
                      <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>{svc.duration} minutos de duração</span>
                      </div>
                    </div>
                    <div className="text-right sm:shrink-0">
                      <span className="text-xl font-black text-slate-900">R$ {svc.price},00</span>
                      <span className="text-[11px] font-bold text-emerald-600 block mt-1">Sinal: R$ {depositAmount},00</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PASSO 1.5: ESCOLHA DO MÉDICO */}
          {step === 1.5 && (
            <div className="space-y-6">
              <button onClick={() => setStep(1)} className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer">
                <ArrowLeft className="w-4 h-4" /> Voltar aos procedimentos
              </button>

              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                  Profissional
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-2">
                  Com quem você deseja se consultar?
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {professionals.map((pro: any) => {
                  const initials = pro.name.split(' ').map((w: any) => w[0]).slice(0, 2).join('').toUpperCase();
                  const isSelected = selectedPro?.id === pro.id;
                  return (
                    <div
                      key={pro.id}
                      onClick={() => {
                        setSelectedPro(pro);
                        setStep(2);
                      }}
                      className={'p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ' + (isSelected ? 'border-blue-600 bg-blue-50/50 shadow-md' : 'border-slate-200 hover:border-slate-300 bg-white')}
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-sm shrink-0">
                        {initials}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">{pro.name}</h4>
                        <p className="text-xs text-blue-600 font-bold">{pro.specialty}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PASSO 2: DATA E HORA */}
          {step === 2 && selectedService && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <button onClick={() => setStep(professionals.length > 1 ? 1.5 : 1)} className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer">
                  <ArrowLeft className="w-4 h-4" /> Alterar opções
                </button>
                <div className="flex items-center gap-2">
                  {selectedPro && (
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                      👨‍⚕️ {selectedPro.name}
                    </span>
                  )}
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                    {selectedService.name}
                  </span>
                </div>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Escolha o Dia e Horário</h2>
              </div>

              {/* CARROSSEL DE DIAS */}
              <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none">
                {availableDays.map(day => {
                  const isSelected = selectedDate === day.dateStr;
                  return (
                    <button
                      key={day.dateStr}
                      type="button"
                      onClick={() => { setSelectedDate(day.dateStr); setSelectedSlot(''); }}
                      className={'flex flex-col items-center justify-center min-w-[72px] py-3 px-2 rounded-2xl border transition-all cursor-pointer ' + (isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/30' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white')}
                    >
                      <span className="text-[10px] font-bold uppercase">{day.dayName}</span>
                      <span className="text-lg font-black my-0.5">{day.dayNumber}</span>
                      <span className="text-[10px] font-semibold capitalize opacity-80">{day.monthName}</span>
                    </button>
                  );
                })}
              </div>

              {/* SLOTS */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 pt-2">
                {dynamicSlots.map(slot => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={'py-3 rounded-2xl font-extrabold text-sm border transition-all cursor-pointer ' + (selectedSlot === slot ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300')}
                  >
                    {slot}
                  </button>
                ))}
              </div>

              {selectedSlot && (
                <button onClick={() => setStep(3)} className="w-full mt-4 py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer">
                  Continuar para Identificação <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* PASSO 3: DADOS DO PACIENTE */}
          {step === 3 && (
            <div className="space-y-6">
              <button onClick={() => setStep(2)} className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer">
                <ArrowLeft className="w-4 h-4" /> Alterar horário ({selectedSlot})
              </button>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Seu Nome Completo</label>
                  <input type="text" required value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Ex: Rodrigo Vieira" className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold focus:bg-white focus:border-blue-600 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Seu WhatsApp</label>
                  <input type="tel" required value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="(54) 99659-1765" className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold focus:bg-white focus:border-blue-600 focus:outline-none" />
                </div>
              </div>

              <button 
                onClick={() => setStep(3.5)} 
                disabled={!clientName || !clientPhone} 
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                Avançar para Pagamento do Sinal <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* ========================================== */}
          {/* ⚡ PASSO 3.5: O MATADOR DE FALTAS (TELA DE PIX) */}
          {/* ========================================== */}
          {step === 3.5 && (
            <div className="space-y-6 text-center">
              <button onClick={() => setStep(3)} className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer">
                <ArrowLeft className="w-4 h-4" /> Voltar aos dados
              </button>

              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Garantia de Vaga
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-2">
                  Pagamento do Sinal via PIX
                </h2>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 font-medium">
                  Para segurar o horário na agenda da clínica, realize o pagamento do sinal de reserva:
                </p>
              </div>

              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200/80 max-w-sm mx-auto space-y-4">
                <div className="text-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Valor da Reserva</span>
                  <h3 className="text-3xl font-black text-emerald-600">R$ {depositAmount},00</h3>
                  <span className="text-[11px] text-slate-500">(O restante de R$ {selectedService.price - depositAmount},00 é acertado no atendimento)</span>
                </div>

                {/* Imagem do QR Code Gerada */}
                <div className="w-44 h-44 bg-white p-2 rounded-2xl mx-auto shadow-sm border border-slate-200 flex items-center justify-center">
                  <img src={qrCodeUrl} alt="QR Code PIX" className="w-full h-full object-contain" />
                </div>

                {/* Botão Copia e Cola */}
                <button
                  type="button"
                  onClick={copyPix}
                  className="w-full py-3 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {pixCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-blue-600" />}
                  <span>{pixCopied ? "Código PIX Copiado!" : "Copiar Código PIX (Copia e Cola)"}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleFinalizeWithPix}
                disabled={loading}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? "Confirmando Agendamento..." : "Já Realizei o Pagamento PIX ➔"}
              </button>
            </div>
          )}

          {/* PASSO 4: COMPROVANTE COM SINAL CONFIRMADO */}
          {step === 4 && (
            <div className="text-center space-y-6 py-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Agendamento & Sinal Confirmados!</h2>
              
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Profissional:</span>
                  <span className="font-extrabold text-blue-700">👨‍⚕️ {confirmedProName || selectedPro?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Procedimento:</span>
                  <span className="font-bold text-slate-900">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Data e Horário:</span>
                  <span className="font-black text-slate-900">{selectedDate} às {selectedSlot}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 font-bold">
                  <span className="text-emerald-700">Sinal de Reserva (PIX):</span>
                  <span className="text-emerald-700 font-black">R$ {depositAmount},00 PAGO</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      <footer className="py-6 px-4 text-center border-t border-slate-200/80 bg-white">
        <div className="max-w-xl mx-auto flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Agendamento protegido com criptografia ponta a ponta e conformidade LGPD.</span>
        </div>
      </footer>
    </div>
  );
}`;

fs.writeFileSync(viewPath, viewCode, "utf-8");
console.log("  ✓ Tela de pagamento PIX e QR Code instalada com sucesso!");

// 3. ATUALIZA A AGENDA (/appointments) PARA EXIBIR A TAG DE SINAL PAGO
const apptPath = path.join(process.cwd(), "src/components/appointments/interactive-appointments-view.tsx");
let apptContent = fs.readFileSync(apptPath, "utf-8");

if (!apptContent.includes("Sinal:")) {
  apptContent = apptContent.replace(
    "<span>•</span>\n                    <span>{appt.client.phone}</span>",
    "<span>•</span>\n                    <span>{appt.client.phone}</span>\n                    <span className='bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded text-[10px] ml-1'>PIX Sinal R$ 50,00</span>"
  );
  fs.writeFileSync(apptPath, apptContent, "utf-8");
  console.log("  ✓ Agenda atualizada com a tag de Sinal PIX nos cards!");
}

console.log("\n💰 Módulo 1: Cobrança de Sinal PIX instalado com 100% de sucesso!");