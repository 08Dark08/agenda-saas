'use client';
import React from 'react';
import Link from 'next/link';
import { Calendar, CheckCircle2, ArrowRight, ShieldCheck, Clock, HelpCircle } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <nav className="border-b border-neutral-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg tracking-tight">AgendaPro</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-bold text-neutral-700 hover:text-neutral-900 px-3 py-2 rounded-xl">
              Entrar
            </Link>
            <Link href="/register" className="text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow-md shadow-blue-200 transition-all flex items-center gap-1.5">
              Criar Conta Grátis
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      <section className="pt-20 pb-20 px-6 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full mb-6 border border-blue-200/60">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          Para psicólogos, nutricionistas, clínicas e autônomos
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-neutral-950 tracking-tight leading-[1.1]">
          Agendamentos automáticos. <br />
          <span className="text-blue-600">Menos mensagens.</span> Mais clientes.
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-neutral-600 max-w-2xl mx-auto">
          Tenha sua própria página de agendamento online, receba confirmações automáticas e permita que seus clientes marquem horários pelo celular, 24 horas por dia.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register" className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-base rounded-2xl shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-2">
            Começar Gratuitamente
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}