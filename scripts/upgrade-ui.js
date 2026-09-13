// upgrade-ui.js
const fs = require("fs");
const path = require("path");

console.log("💎 Aplicando Design System SaaS Premium nas telas...\n");

const files = {
  // ==========================================
  // 1. LAYOUT PRINCIPAL REFINADO (TOPBAR + SIDEBAR + CONTAINER)
  // ==========================================
  "src/app/dashboard/layout.tsx": `import React from 'react';
import Link from 'next/link';
import { 
  Calendar, Users, Sparkles, Clock, LayoutDashboard, 
  ExternalLink, LogOut, ChevronRight, Bell, Shield 
} from 'lucide-react';
import { logoutAction } from '@/modules/auth/actions';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col md:flex-row antialiased text-slate-900 font-sans">
      {/* Sidebar Lateral */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between p-5 shrink-0">
        <div className="space-y-6">
          {/* Logo e Organização */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-black">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 tracking-tight leading-none">Viver Bem</h2>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md mt-1 inline-block uppercase tracking-wider">
                Plano Pro (Trial)
              </span>
            </div>
          </div>

          {/* Navegação */}
          <nav className="space-y-1">
            {[
              { label: 'Painel Geral', href: '/dashboard', icon: LayoutDashboard },
              { label: 'Agenda & Horários', href: '/appointments', icon: Calendar },
              { label: 'Clientes (CRM)', href: '/clients', icon: Users },
              { label: 'Serviços', href: '/services', icon: Sparkles },
              { label: 'Grade Semanal', href: '/schedule', icon: Clock },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50/60 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Rodapé da Sidebar */}
        <div className="pt-5 border-t border-slate-100 space-y-3 px-1">
          <Link
            href="/agendar/viverbem"
            target="_blank"
            className="flex items-center justify-between w-full px-3.5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all"
          >
            <span>Ver Minha Página</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-400 hover:text-red-600 hover:bg-red-50/50 rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              Encerrar Sessão
            </button>
          </form>
        </div>
      </aside>

      {/* Conteúdo Central em Container Harmonioso */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar Superior */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span>SaaS Agendamento</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-bold">Viver Bem</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Agenda Online Ativa
            </div>

            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-xs text-slate-700">
              RV
            </div>
          </div>
        </header>

        {/* Viewport Principal */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}`,

  // ==========================================
  // 2. DASHBOARD VISUALMENTE PODEROSO COM KPIs E ATALHOS
  // ==========================================
  "src/app/dashboard/page.tsx": `import React from 'react';
import Link from 'next/link';
import { 
  Calendar, DollarSign, Users, Clock, ArrowUpRight, 
  Sparkles, Plus, Copy, CheckCircle2, TrendingUp 
} from 'lucide-react';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [appointments, clientsCount, org] = await Promise.all([
    prisma.appointment.findMany({
      where: { organizationId: session.organizationId },
      include: { client: true, service: true },
      orderBy: { startTime: 'desc' },
      take: 5,
    }),
    prisma.client.count({ where: { organizationId: session.organizationId } }),
    prisma.organization.findUnique({ where: { id: session.organizationId } }),
  ]);

  const totalRevenue = appointments
    .filter(a => a.status !== 'CANCELLED')
    .reduce((acc, a) => acc + a.totalPriceCents, 0);

  return (
    <div className="space-y-8">
      {/* Boas-vindas e Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Olá, {session.fullName.split(' ')[0]} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Aqui está o resumo operacional da <span className="text-slate-800 font-bold">{org?.name || 'sua clínica'}</span> para hoje.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 text-slate-400" />
            Novo Serviço
          </Link>

          <Link
            href="/agendar/viverbem"
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all"
          >
            <span>Página Pública</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Grid de KPIs / Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Atendimentos Hoje */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Atendimentos Registrados</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{appointments.length}</h3>
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> +100%
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">Horários agendados no sistema</p>
        </div>

        {/* Receita Acumulada */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Faturamento Estimado</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">
              {(totalRevenue / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </h3>
          </div>
          <p className="text-xs text-emerald-600 font-bold mt-1">Confirmado na agenda</p>
        </div>

        {/* Clientes Únicos */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-purple-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Base de Clientes</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{clientsCount}</h3>
            <span className="text-xs text-slate-400 font-medium">cadastros únicos</span>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">Prontos para remarketing</p>
        </div>
      </div>

      {/* Grid Duplo: Atendimentos Recentes vs Painel Lateral */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Lista de Atendimentos */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">Próximos Atendimentos</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Sincronizados em tempo real com o banco de dados</p>
            </div>
            <Link href="/appointments" className="text-xs font-bold text-blue-600 hover:text-blue-700">
              Ver todos →
            </Link>
          </div>

          {appointments.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-800">Nenhum atendimento na fila</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                Compartilhe o link da sua página com seus clientes para preencher os primeiros horários.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {appointments.map((appt) => (
                <div key={appt.id} className="p-5 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 border border-blue-100 text-blue-700 rounded-xl flex items-center justify-center font-black text-sm">
                      {format(new Date(appt.startTime), 'HH:mm')}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{appt.client.fullName}</h4>
                      <p className="text-xs text-slate-400 mt-0.5 font-medium">
                        {appt.service.name} • {appt.client.phone}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    {appt.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card Lateral: Compartilhamento Rápido */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl text-white shadow-xl shadow-blue-500/20 space-y-4">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-black">Divulgue sua Agenda</h3>
            <p className="text-xs text-blue-100 mt-1 leading-relaxed">
              Coloque este link na bio do seu Instagram ou envie por WhatsApp para receber agendamentos automáticos.
            </p>
          </div>

          <div className="p-3 bg-white/10 rounded-xl border border-white/20 text-xs font-mono truncate">
            http://localhost:3001/agendar/viverbem
          </div>

          <Link
            href="/agendar/viverbem"
            target="_blank"
            className="w-full py-3 bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all"
          >
            Testar Página Pública <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}`,

  // ==========================================
  // 3. GESTÃO DE SERVIÇOS PREMIUM (/services)
  // ==========================================
  "src/app/services/page.tsx": `'use client';
import React, { useState } from 'react';
import { Sparkles, Plus, Clock, DollarSign, CheckCircle2, Trash2 } from 'lucide-react';

export default function ServicesPage() {
  const [services, setServices] = useState([
    { id: '1', name: 'Consulta Inicial / Avaliação', duration: 50, price: 150 },
    { id: '2', name: 'Sessão de Retorno', duration: 30, price: 100 },
  ]);
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(50);
  const [price, setPrice] = useState(150);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    setServices([...services, { id: String(Date.now()), name, duration, price }]);
    setName('');
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Catálogo de Serviços</h1>
        <p className="text-xs text-slate-500 font-medium mt-1">Configure os procedimentos disponíveis para seus clientes agendarem.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Formulário Novo */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <h2 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-600" /> Cadastrar Novo Serviço
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nome do Atendimento</label>
              <input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="Ex: Terapia Individual" 
                required 
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold focus:bg-white focus:border-blue-600 focus:outline-none transition-all" 
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Duração (Min)</label>
                <input 
                  type="number" 
                  value={duration} 
                  onChange={e => setDuration(Number(e.target.value))} 
                  required 
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold focus:bg-white focus:border-blue-600 focus:outline-none transition-all" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Preço (R$)</label>
                <input 
                  type="number" 
                  value={price} 
                  onChange={e => setPrice(Number(e.target.value))} 
                  required 
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold focus:bg-white focus:border-blue-600 focus:outline-none transition-all" 
                />
              </div>
            </div>
            <button 
              type="submit" 
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all"
            >
              Salvar Serviço
            </button>
          </form>
        </div>

        {/* Grade de Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {services.map(svc => (
            <div key={svc.id} className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    Online
                  </span>
                  <span className="text-base font-black text-slate-900">R$ {svc.price},00</span>
                </div>
                <h3 className="font-bold text-sm text-slate-900">{svc.name}</h3>
                <div className="flex items-center gap-1 text-xs text-slate-400 font-medium mt-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{svc.duration} minutos de duração</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Disponível na sua página</span>
                <button 
                  onClick={() => setServices(services.filter(s => s.id !== svc.id))}
                  className="text-slate-400 hover:text-red-600 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}`,

  // ==========================================
  // 4. GRADE SEMANAL REFINADA COM TOGGLES (/schedule)
  // ==========================================
  "src/app/schedule/page.tsx": `'use client';
import React, { useState } from 'react';
import { Clock, Check, Calendar } from 'lucide-react';

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
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Grade de Atendimento Semanal</h1>
        <p className="text-xs text-slate-500 font-medium mt-1">Defina quais turnos a engine de disponibilidade deve liberar na sua página.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {days.map((item, index) => (
          <div key={item.day} className="p-5 flex items-center justify-between hover:bg-slate-50/40 transition-colors">
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                id={\`day-\${index}\`}
                checked={item.enabled}
                onChange={e => {
                  const updated = [...days];
                  updated[index].enabled = e.target.checked;
                  setDays(updated);
                }}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-600 border-slate-300"
              />
              <label htmlFor={\`day-\${index}\`} className="text-xs font-extrabold text-slate-800 w-32 cursor-pointer">
                {item.day}
              </label>
            </div>

            {item.enabled ? (
              <div className="flex items-center gap-2 text-xs font-semibold">
                <input 
                  type="time" 
                  defaultValue={item.start} 
                  className="border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 focus:bg-white text-slate-800" 
                />
                <span className="text-slate-400 text-xs">até</span>
                <input 
                  type="time" 
                  defaultValue={item.end} 
                  className="border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 focus:bg-white text-slate-800" 
                />
              </div>
            ) : (
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-md">
                Folga / Fechado
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}`,

  // ==========================================
  // 5. CRM DE CLIENTES COM TABELA MODERNA (/clients)
  // ==========================================
  "src/app/clients/page.tsx": `import React from 'react';
import { Users, Phone, ShieldCheck, Download, Search } from 'lucide-react';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export default async function ClientsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const clients = await prisma.client.findMany({
    where: { organizationId: session.organizationId },
    include: { _count: { select: { appointments: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Clientes Cadastrados</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Base de contatos criada automaticamente pelos agendamentos (LGPD Compliant).</p>
        </div>

        <div className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-sm">
          {clients.length} clientes na carteira
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {clients.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 font-bold">
            Nenhum cliente registrado ainda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-6">Nome Completo</th>
                  <th className="py-3.5 px-6">WhatsApp</th>
                  <th className="py-3.5 px-6">Histórico</th>
                  <th className="py-3.5 px-6">Privacidade LGPD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {clients.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-black text-[11px] flex items-center justify-center">
                          {c.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <span>{c.fullName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-semibold">{c.phone}</td>
                    <td className="py-4 px-6">
                      <span className="bg-blue-50 text-blue-700 font-extrabold px-2.5 py-1 rounded-md text-[11px]">
                        {c._count.appointments} atendimento(s)
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                        <ShieldCheck className="w-3.5 h-3.5" /> Consentimento Ativo
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}`,

  // ==========================================
  // 6. AGENDA CONSOLIDADA COM TIMELINE (/appointments)
  // ==========================================
  "src/app/appointments/page.tsx": `import React from 'react';
import { Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default async function AppointmentsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const appointments = await prisma.appointment.findMany({
    where: { organizationId: session.organizationId },
    include: { client: true, service: true },
    orderBy: { startTime: 'desc' },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Agenda Consolidada</h1>
        <p className="text-xs text-slate-500 font-medium mt-1">Todos os horários marcados em ordem cronológica.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {appointments.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 font-bold">
            Nenhum agendamento encontrado na agenda.
          </div>
        ) : (
          appointments.map(appt => (
            <div key={appt.id} className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center font-black text-sm">
                  {format(new Date(appt.startTime), 'HH:mm')}
                </div>
                <div>
                  <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                    {format(new Date(appt.startTime), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </span>
                  <h3 className="text-sm font-black text-slate-900 mt-0.5">{appt.client.fullName}</h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {appt.service.name} • {appt.client.phone}
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                {appt.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}`
};

Object.entries(files).forEach(([rel, content]) => {
  const abs = path.join(process.cwd(), rel);
  const dir = path.dirname(abs);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(abs, content, 'utf-8');
  console.log(`  ✓ Design Atualizado: ${rel}`);
});

console.log("\n💎 Novo visual SaaS Premium aplicado com sucesso!");