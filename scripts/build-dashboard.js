const fs = require("fs");
const path = require("path");

const files = {
  "src/app/dashboard/page.tsx": `'use client';
import React from 'react';
import Link from 'next/link';
import { Calendar, DollarSign, Users, Clock, ExternalLink, LogOut } from 'lucide-react';
import { logoutAction } from '@/modules/auth/actions';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-white border-r border-neutral-200 p-6 flex flex-col justify-between">
        <div className="space-y-6">
          <div>
            <span className="text-[10px] font-bold text-neutral-400 uppercase">Sistema</span>
            <h2 className="text-xl font-black text-neutral-900">AgendaPro</h2>
          </div>
          <nav className="space-y-1">
            <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold bg-blue-50 text-blue-600">
              <Calendar className="w-4 h-4" />
              Dashboard
            </Link>
          </nav>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-neutral-500 hover:text-red-600 transition-colors">
            <LogOut className="w-4 h-4" />
            Sair da Conta
          </button>
        </form>
      </aside>

      <main className="flex-1 p-8 max-w-6xl mx-auto w-full space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Painel de Controle - Viver Bem</h1>
            <p className="text-xs text-neutral-500 font-medium mt-1">Visão geral dos seus atendimentos e métricas.</p>
          </div>
          <Link href="/agendar/viverbem" target="_blank" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-200 hover:bg-blue-700">
            <span>Ver Minha Página Pública</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-bold uppercase">Atendimentos Hoje</span>
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-3xl font-black text-neutral-900">0</h3>
            <span className="text-[11px] text-neutral-400">Nenhum atendimento pendente</span>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-bold uppercase">Faturamento Mês</span>
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-3xl font-black text-neutral-900">R$ 0,00</h3>
            <span className="text-[11px] text-emerald-600 font-semibold">Previsto e confirmado</span>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-bold uppercase">Total de Clientes</span>
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-3xl font-black text-neutral-900">0</h3>
            <span className="text-[11px] text-neutral-400">Cadastrados no seu CRM</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-8 text-center">
          <Clock className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-neutral-800">Sua agenda está ativa e pronta para receber agendamentos!</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-1">
            Compartilhe seu link público com seus clientes para que eles comecem a marcar horários pelo celular.
          </p>
        </div>
      </main>
    </div>
  );
}`
};

Object.entries(files).forEach(([rel, content]) => {
  const abs = path.join(process.cwd(), rel);
  const dir = path.dirname(abs);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(abs, content, 'utf-8');
  console.log(`  ✓ Criado com sucesso: ${rel}`);
});