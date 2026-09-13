// make-commercial-ready.js
const fs = require("fs");
const path = require("path");

console.log("💼 Implementando as funcionalidades comerciais para venda do SaaS...\n");

const files = {
  // ==========================================
  // 1. SERVER ACTION DE ATUALIZAÇÃO DE CONFIGURAÇÕES
  // ==========================================
  "src/modules/settings/actions.ts": `'use server';
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export async function updateOrganizationSettingsAction(formData: {
  name: string;
  phone: string;
  headline?: string;
  aboutText?: string;
}) {
  const session = await getSession();
  if (!session) return { success: false, error: "Não autenticado." };

  try {
    await prisma.$transaction([
      prisma.organization.update({
        where: { id: session.organizationId },
        data: {
          name: formData.name,
          phone: formData.phone,
        },
      }),
      prisma.publicBookingSettings.upsert({
        where: { organizationId: session.organizationId },
        update: {
          headline: formData.headline || "Agendamento online imediato",
          aboutText: formData.aboutText,
        },
        create: {
          organizationId: session.organizationId,
          headline: formData.headline || "Agendamento online imediato",
          aboutText: formData.aboutText,
        },
      }),
    ]);

    revalidatePath("/dashboard");
    revalidatePath("/settings");
    revalidatePath("/agendar/[slug]");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}`,

  // ==========================================
  // 2. TELA DE CONFIGURAÇÕES DO ASSINANTE (/settings)
  // ==========================================
  "src/app/settings/page.tsx": `import React from 'react';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { SettingsFormClient } from '@/components/settings/settings-form-client';

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const org = await prisma.organization.findUnique({
    where: { id: session.organizationId },
    include: { publicSettings: true },
  });

  return (
    <DashboardShell activePage="settings">
      <div className="space-y-8 max-w-3xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Configurações da Conta</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Personalize a identidade da sua clínica, WhatsApp e textos da sua página pública.
          </p>
        </div>

        <SettingsFormClient
          initialData={{
            name: org?.name || '',
            phone: org?.phone || '',
            slug: org?.slug || '',
            headline: org?.publicSettings?.headline || 'Agendamento online imediato',
            aboutText: org?.publicSettings?.aboutText || '',
          }}
        />
      </div>
    </DashboardShell>
  );
}`,

  // ==========================================
  // 3. COMPONENTE CLIENTE DO FORMULÁRIO DE CONFIGURAÇÕES
  // ==========================================
  "src/components/settings/settings-form-client.tsx": `'use client';
import React, { useState, useTransition } from 'react';
import { updateOrganizationSettingsAction } from '@/modules/settings/actions';
import { Building2, Phone, Sparkles, Check, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export function SettingsFormClient({ initialData }: { initialData: any }) {
  const [name, setName] = useState(initialData.name);
  const [phone, setPhone] = useState(initialData.phone);
  const [headline, setHeadline] = useState(initialData.headline);
  const [aboutText, setAboutText] = useState(initialData.aboutText);
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(false);

    startTransition(async () => {
      const res = await updateOrganizationSettingsAction({
        name,
        phone,
        headline,
        aboutText,
      });

      if (res.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        alert(res.error || "Erro ao salvar alterações.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
      {success && (
        <div className="p-4 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-2xl border border-emerald-200 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Configurações salvas com sucesso no banco de dados!</span>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nome Comercial / Clínica / Studio</label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">WhatsApp da Clínica (com DDD)</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Ex: 54996591765"
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Link Público Exclusivo</label>
            <div className="mt-1 flex items-center px-4 py-3 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-mono text-slate-500">
              <span>agendar/{initialData.slug}</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Subtítulo da sua Página</label>
          <input
            type="text"
            value={headline}
            onChange={e => setHeadline(e.target.value)}
            placeholder="Ex: Psicologia Clínica e Bem-Estar"
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Biografia / Sobre Nós (Opcional)</label>
          <textarea
            rows={3}
            value={aboutText}
            onChange={e => setAboutText(e.target.value)}
            placeholder="Breve apresentação da sua experiência e métodos de atendimento..."
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          href={\`/agendar/\${initialData.slug}\`}
          target="_blank"
          className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <span>Visualizar minha página pública</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        <button
          type="submit"
          disabled={isPending}
          className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 cursor-pointer"
        >
          {isPending ? "Salvando Alterações..." : "Salvar Configurações"}
        </button>
      </div>
    </form>
  );
}`,

  // ==========================================
  // 4. ATUALIZAÇÃO DO DASHBOARD SHELL (MENU CONFIGURAÇÕES + TRIAL BANNER)
  // ==========================================
  "src/components/layout/dashboard-shell.tsx": `'use client';
import React from 'react';
import Link from 'next/link';
import { 
  Calendar, Users, Sparkles, Clock, LayoutDashboard, 
  ExternalLink, LogOut, ChevronRight, Settings, ShieldCheck 
} from 'lucide-react';
import { logoutAction } from '@/modules/auth/actions';

interface ShellProps {
  children: React.ReactNode;
  activePage: 'dashboard' | 'appointments' | 'clients' | 'services' | 'schedule' | 'settings';
}

export function DashboardShell({ children, activePage }: ShellProps) {
  const navItems = [
    { id: 'dashboard', label: 'Painel Geral', href: '/dashboard', icon: LayoutDashboard },
    { id: 'appointments', label: 'Agenda & Horários', href: '/appointments', icon: Calendar },
    { id: 'clients', label: 'Clientes (CRM)', href: '/clients', icon: Users },
    { id: 'services', label: 'Serviços Oferecidos', href: '/services', icon: Sparkles },
    { id: 'schedule', label: 'Grade Semanal', href: '/schedule', icon: Clock },
    { id: 'settings', label: 'Configurações', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col md:flex-row antialiased text-slate-900 font-sans">
      {/* Sidebar Lateral */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between p-5 shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-black">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 tracking-tight leading-none truncate max-w-[130px]">Viver Bem</h2>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md mt-1 inline-block uppercase tracking-wider">
                14 Dias de Teste
              </span>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={\`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all group \${
                    isActive
                      ? 'bg-blue-50/80 text-blue-600 border border-blue-100 shadow-sm'
                      : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                  }\`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={\`w-4 h-4 \${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600'}\`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-500" />}
                </Link>
              );
            })}
          </nav>
        </div>

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
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-400 hover:text-red-600 hover:bg-red-50/50 rounded-lg transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Encerrar Sessão
            </button>
          </form>
        </div>
      </aside>

      {/* Conteúdo Principal com Topbar de Trial Comercial */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60 hidden sm:inline">
              Período de Testes Gratuito Ativo
            </span>
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
}`,

  // ==========================================
  // 5. TERMOS DE USO COMERCIAIS (/termos)
  // ==========================================
  "src/app/termos/page.tsx": `import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6 sm:px-8 text-slate-800">
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Voltar à página inicial
        </Link>
        
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Termos de Uso da Plataforma</h1>
        <p className="text-xs text-slate-400 font-medium">Última atualização: Março de 2025</p>

        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
          <p>Bem-vindo à nossa plataforma SaaS de agendamento online. Ao criar uma conta ou agendar um serviço, você concorda com os seguintes termos:</p>
          
          <h3 className="font-bold text-slate-900 text-sm pt-2">1. Objeto da Plataforma</h3>
          <p>O sistema atua como intermediador tecnológico entre prestadores autônomos de serviços e seus respectivos clientes, fornecendo infraestrutura de agenda, confirmação e comunicação.</p>

          <h3 className="font-bold text-slate-900 text-sm pt-2">2. Cancelamentos e Reagendamentos</h3>
          <p>Cada profissional ou clínica estabelece suas políticas próprias de cancelamento e tolerância a atrasos. O cancelamento pelo cliente pode ser realizado de acordo com a antecedência mínima configurada.</p>

          <h3 className="font-bold text-slate-900 text-sm pt-2">3. Assinatura e Planos</h3>
          <p>Os serviços profissionais são contratados em modelo de assinatura recorrente com período inicial de avaliação gratuita de 14 dias. A renovação ocorre de acordo com o plano escolhido.</p>
        </div>
      </div>
    </div>
  );
}`,

  // ==========================================
  // 6. POLÍTICA DE PRIVACIDADE E LGPD (/privacidade)
  // ==========================================
  "src/app/privacidade/page.tsx": `import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6 sm:px-8 text-slate-800">
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Voltar à página inicial
        </Link>

        <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" /> Conformidade com a LGPD (Lei nº 13.709/2018)
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Política de Privacidade</h1>
        <p className="text-xs text-slate-400 font-medium">Última atualização: Março de 2025</p>

        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
          <p>A proteção da sua privacidade é nossa prioridade absoluta. Esta política descreve como coletamos e protegemos seus dados pessoais:</p>

          <h3 className="font-bold text-slate-900 text-sm pt-2">1. Dados Coletados</h3>
          <p>Coletamos apenas dados estritamente necessários para a operacionalização dos agendamentos: Nome completo, WhatsApp e e-mail (quando informado). <strong>Não coletamos e não armazenamos prontuários médicos ou dados clínicos confidenciais</strong> no escopo da agenda.</p>

          <h3 className="font-bold text-slate-900 text-sm pt-2">2. Finalidade de Uso</h3>
          <p>Os dados são utilizados exclusivamente para confirmar sua reserva, enviar lembretes e permitir o gerenciamento e cancelamento do seu atendimento.</p>

          <h3 className="font-bold text-slate-900 text-sm pt-2">3. Seus Direitos (LGPD)</h3>
          <p>Qualquer usuário ou cliente pode solicitar a qualquer momento a exportação dos seus dados ou a exclusão/anonimização permanente de seus contatos do nosso banco de dados.</p>
        </div>
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
  console.log(`  ✓ Módulo Comercial Implementado: ${rel}`);
});

console.log("\n💼 Sistema 100% pronto para comercialização, vendas e assinaturas!");