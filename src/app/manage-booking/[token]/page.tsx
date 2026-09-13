'use client';
import React, { useState } from 'react';
import { Calendar, XCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { cancelAppointmentByClientAction } from '@/modules/booking/cancel-actions';

export default function ManageBookingPage({ params }: { params: { token: string } }) {
  const [loading, setLoading] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleCancel() {
    if (!confirm("Tem certeza de que deseja cancelar seu horário?")) return;

    setLoading(true);
    setErrorMsg('');

    const res = await cancelAppointmentByClientAction(params.token);
    setLoading(false);

    if (res.success) {
      setCancelled(true);
    } else {
      setErrorMsg(res.error || "Não foi possível cancelar.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 antialiased font-sans text-slate-900">
      <div className="max-w-md mx-auto w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center space-y-6">
        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <Calendar className="w-7 h-7" />
        </div>

        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
            Autoatendimento
          </span>
          <h2 className="text-xl font-black text-slate-900 mt-2">Gestão do seu Agendamento</h2>
          <p className="text-xs text-slate-400 mt-1">Consulte ou cancele seu horário de forma online.</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {cancelled ? (
          <div className="space-y-4 py-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">Agendamento Cancelado</h3>
            <p className="text-xs text-slate-500">
              Seu horário foi cancelado e a vaga foi liberada na clínica.
            </p>
            <Link
              href="/agendar/viverbem"
              className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              Marcar Novo Horário
            </Link>
          </div>
        ) : (
          <div className="space-y-5 text-left">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Status:</span>
                <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">CONFIRMADO</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Clínica:</span>
                <span className="font-bold text-slate-900">Viver Bem</span>
              </div>
            </div>

            <button
              onClick={handleCancel}
              disabled={loading}
              className="w-full py-3.5 bg-red-50 hover:bg-red-100 text-red-700 font-extrabold text-xs rounded-xl border border-red-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              {loading ? "Cancelando..." : "Cancelar este Agendamento Online"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}