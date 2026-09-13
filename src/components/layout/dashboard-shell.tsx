'use client';
import React from 'react';
import Link from 'next/link';
import { 
  Calendar, Users, Sparkles, Clock, LayoutDashboard, 
  ExternalLink, LogOut, ChevronRight, ShieldCheck 
} from 'lucide-react';
import { logoutAction } from '@/modules/auth/actions';

interface ShellProps {
  children: React.ReactNode;
  activePage: 'dashboard' | 'appointments' | 'clients' | 'services' | 'schedule';
}

export function DashboardShell({ children, activePage }: ShellProps) {
  const navItems = [
    { id: 'dashboard', label: 'Painel Geral', href: '/dashboard', icon: LayoutDashboard },
    { id: 'appointments', label: 'Agenda & Horários', href: '/appointments', icon: Calendar },
    { id: 'clients', label: 'Clientes (CRM)', href: '/clients', icon: Users },
    { id: 'services', label: 'Serviços Oferecidos', href: '/services', icon: Sparkles },
    { id: 'schedule', label: 'Grade Semanal', href: '/schedule', icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col md:flex-row antialiased text-slate-900 font-sans">
      {/* Sidebar Lateral Fixa */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between p-5 shrink-0">
        <div className="space-y-6">
          {/* Logo da Clínica */}
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

          {/* Links de Navegação com Indicador Ativo */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all group ${
                    isActive
                      ? 'bg-blue-50/80 text-blue-600 border border-blue-100 shadow-sm'
                      : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-500" />}
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

      {/* Conteúdo Principal com Topbar */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span>SaaS Agendamento</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-bold capitalize">Viver Bem</span>
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

        <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}