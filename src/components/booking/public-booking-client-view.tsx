'use client';
import React, { useState, useMemo } from 'react';
import { Calendar, Clock, CheckCircle2, ChevronRight, ArrowLeft, ShieldCheck, MessageCircle, X } from 'lucide-react';
import { createRealBookingAction } from '@/modules/booking/public-actions';
import { findClientAppointmentsAction, cancelAppointmentByClientAction } from '@/modules/booking/cancel-actions';
import { format, addDays, parse, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function PublicBookingClientView({
  slug,
  businessName = 'Viver Bem',
  phone = '54996591765',
  services = [],
  weeklySchedule = [],
  bufferMinutes = 0,
}: any) {
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
      dayOfWeekIndex: d.getDay(), // 0 = Domingo, 1 = Segunda...
      isToday: i === 0,
    };
  });

  const [selectedDate, setSelectedDate] = useState(availableDays[0].dateStr);
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

  // CÁLCULO MATEMÁTICO REAL DOS SLOTS BASEADOS NA GRADE E NO ALMOÇO
  const dynamicSlots = useMemo(() => {
    const currentDayObj = availableDays.find(d => d.dateStr === selectedDate);
    if (!currentDayObj) return [];

    // Mapeia domingo (0) para índice 6, e segunda (1) para 0
    const dayMapIdx = currentDayObj.dayOfWeekIndex === 0 ? 6 : currentDayObj.dayOfWeekIndex - 1;
    const dayConfig = weeklySchedule[dayMapIdx];

    if (!dayConfig || !dayConfig.enabled) {
      return [];
    }

    const duration = selectedService?.duration || 50;
    const buffer = Number(bufferMinutes) || 0;
    const slotsResult: string[] = [];

    // Fatiador do Turno
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

    // Fatia Manhã
    sliceRange(dayConfig.mStart || '08:00', dayConfig.mEnd || '12:00');
    // Fatia Tarde
    sliceRange(dayConfig.aStart || '13:30', dayConfig.aEnd || '18:00');

    return slotsResult;
  }, [selectedDate, selectedService, weeklySchedule, bufferMinutes]);

  const rawPhone = String(phone || '54996591765');
  const cleanPhone = rawPhone.replace(/\D/g, '') || '54996591765';
  const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone;
  const whatsappUrl = 'https://wa.me/' + fullPhone + '?text=' + encodeURIComponent('Olá! Estou na página de agendamentos da ' + businessName + ' e gostaria de tirar uma dúvida.');

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
                {serviceList.map((svc: any) => (
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
                  className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Trocar atendimento
                </button>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200/60 px-3 py-1 rounded-full">
                  {selectedService.name} • {selectedService.duration} min • R$ {selectedService.price},00
                </span>
              </div>

              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                  Passo 2 de 3
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-2">
                  Escolha o Dia e Horário
                </h2>
                <p className="text-xs text-slate-500 mt-1">Horários fatiados pela duração de {selectedService.duration} min e intervalo de almoço:</p>
              </div>

              {/* CARROSSEL DE DIAS */}
              <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none">
                {availableDays.map(day => {
                  const isSelected = selectedDate === day.dateStr;
                  return (
                    <button
                      key={day.dateStr}
                      type="button"
                      onClick={() => {
                        setSelectedDate(day.dateStr);
                        setSelectedSlot('');
                      }}
                      className={'flex flex-col items-center justify-center min-w-[72px] py-3 px-2 rounded-2xl border transition-all cursor-pointer ' + (isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/30' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white')}
                    >
                      <span className="text-[10px] font-bold uppercase">{day.dayName}</span>
                      <span className="text-lg font-black my-0.5">{day.dayNumber}</span>
                      <span className="text-[10px] font-semibold capitalize opacity-80">{day.monthName}</span>
                    </button>
                  );
                })}
              </div>

              {/* HORÁRIOS REAIS GERADOS MATEMATICAMENTE */}
              <div className="pt-2">
                {dynamicSlots.length === 0 ? (
                  <div className="p-8 bg-slate-50 rounded-2xl text-center text-xs text-slate-500 font-bold border border-slate-200">
                    A clínica não realiza atendimentos neste dia da semana. Selecione outra data acima.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-500 block">
                      {dynamicSlots.length} horários disponíveis para o dia selecionado:
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                      {dynamicSlots.map(slot => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={'py-3 rounded-2xl font-extrabold text-sm border transition-all cursor-pointer ' + (selectedSlot === slot ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300')}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
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
                className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
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

              
              {/* BOTAO INTELIGENTE DO GOOGLE CALENDAR */}
              {(() => {
                if (!selectedDate || !selectedSlot) return null;
                const [sh, sm] = selectedSlot.split(':').map(Number);
                const dp = selectedDate.split('-').map(Number);
                const dur = selectedService?.duration || 50;
                const sDate = new Date(dp[0], dp[1] - 1, dp[2], sh, sm, 0);
                const eDate = new Date(sDate.getTime() + dur * 60000);

                const fmtG = (d: Date) => {
                  const pad = (n: number) => String(n).padStart(2, '0');
                  return '' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + 'T' + pad(d.getHours()) + pad(d.getMinutes()) + '00';
                };

                const title = 'Consulta: ' + (selectedService?.name || 'Atendimento') + ' - ' + businessName;
                const details = 'Agendamento confirmado com ' + businessName + '.\nTelefone: ' + phone + '\nGerenciar ou cancelar: ' + (typeof window !== 'undefined' ? window.location.origin : '') + '/manage-booking/' + (createdAppointmentId || '');
                const gUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(title) + '&dates=' + fmtG(sDate) + '/' + fmtG(eDate) + '&details=' + encodeURIComponent(details) + '&location=' + encodeURIComponent(businessName);

                return (
                  <div className='pt-1'>
                    <a
                      href={gUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='w-full py-3.5 px-4 bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-xs rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center gap-2.5 transition-all hover:border-blue-300 group cursor-pointer'
                    >
                      <Calendar className='w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform' />
                      <span>Adicionar à minha Agenda do Google</span>
                    </a>
                  </div>
                );
              })()}

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
}