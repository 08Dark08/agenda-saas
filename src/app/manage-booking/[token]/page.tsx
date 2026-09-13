'use client';
import React, { useState } from 'react';
import { Calendar, CheckCircle2, XCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ManageBookingPage({ params }: { params: { token: string } }) {
  const [cancelled, setCancelled] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col justify-center py-12 px-4 sm:px-6">
      <div className="max-w-md mx-auto w-full bg-white rounded-3xl shadow-xl border border-neutral-200 p-8 text-center space-y-6">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
          <Calendar className="w-6 h-6" />
        </div>

        <div>
          <h2 className="text-xl font-black text-neutral-900">Gestão do seu Agendamento</h2>
          <p className="text-xs text-neutral-500 mt-1">Acesso seguro por token exclusivo (sem necessidade de senha).</p>
        </div>

        {cancelled ? (
          <div className="p-4 bg-red-50 text-red-700 text-xs rounded-2xl border border-red-200 font-bold">
            Agendamento cancelado com sucesso no sistema.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-500">Status:</span>
                <span className="font-bold text-emerald-600">CONFIRMADO</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Serviço:</span>
                <span className="font-bold text-neutral-900">Consulta Inicial</span>
              </div>
            </div>

            <button
              onClick={() => {
                if (confirm("Deseja realmente cancelar este horário?")) {
                  setCancelled(true);
                }
              }}
              className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <XCircle className="w-4 h-4" /> Cancelar meu Atendimento
            </button>
          </div>
        )}
      </div>
    </div>
  );
}