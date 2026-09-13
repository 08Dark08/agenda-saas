// install-module-4-team.js
const fs = require("fs");
const path = require("path");

console.log("👥 Instalando o Módulo 4: Gestão de Equipe e Múltiplos Profissionais (/team)...\n");

const files = {
  // ==========================================
  // 1. SERVER ACTIONS DE EQUIPE: src/modules/team/actions.ts
  // ==========================================
  "src/modules/team/actions.ts": `'use server';
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export async function createProfessionalAction(data: {
  name: string;
  specialty: string;
  phone: string;
}) {
  const session = await getSession();
  if (!session || !session.organizationId) {
    return { success: false, error: "Não autenticado." };
  }

  try {
    // Cria o membro na organização e o perfil do profissional no Supabase
    const member = await prisma.organizationMember.create({
      data: {
        organizationId: session.organizationId,
        userId: session.userId,
        role: "PROFESSIONAL",
      },
    });

    await prisma.professional.create({
      data: {
        organizationId: session.organizationId,
        memberId: member.id,
        name: data.name,
        specialty: data.specialty,
        phone: data.phone,
        isActive: true,
      },
    });

    revalidatePath("/team");
    revalidatePath("/dashboard");
    revalidatePath("/agendar/[slug]");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteProfessionalAction(professionalId: string) {
  const session = await getSession();
  if (!session || !session.organizationId) {
    return { success: false, error: "Não autenticado." };
  }

  try {
    await prisma.professional.deleteMany({
      where: {
        id: professionalId,
        organizationId: session.organizationId,
      },
    });

    revalidatePath("/team");
    revalidatePath("/dashboard");
    revalidatePath("/agendar/[slug]");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}`,

  // ==========================================
  // 2. COMPONENTE CLIENTE DE EQUIPE: src/components/team/interactive-team-view.tsx
  // ==========================================
  "src/components/team/interactive-team-view.tsx": `'use client';
import React, { useState, useTransition } from 'react';
import { Users, UserPlus, Trash2, CheckCircle2, Shield, X, Phone } from 'lucide-react';
import { createProfessionalAction, deleteProfessionalAction } from '@/modules/team/actions';

interface ProItem {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  isActive: boolean;
}

export function InteractiveTeamView({ initialProfessionals }: { initialProfessionals: ProItem[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [phone, setPhone] = useState('');
  const [isPending, startTransition] = useTransition();

  async function handleAddPro(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;

    startTransition(async () => {
      const res = await createProfessionalAction({ name, specialty, phone });
      if (res.success) {
        setModalOpen(false);
        setName('');
        setSpecialty('');
        setPhone('');
      } else {
        alert(res.error || "Erro ao adicionar profissional.");
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja realmente remover este profissional da equipe?")) return;

    startTransition(async () => {
      await deleteProfessionalAction(id);
    });
  }

  return (
    <div className="space-y-8">
      {/* Header com Botão de Adicionar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Equipe & Profissionais</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Cadastre os especialistas que atendem na sua clínica para que os clientes escolham na página pública.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer w-fit"
        >
          <UserPlus className="w-4 h-4" />
          <span>Novo Profissional</span>
        </button>
      </div>

      {/* Grade de Cards de Profissionais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {initialProfessionals.map((pro) => {
          const initials = pro.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
          return (
            <div key={pro.id} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-all group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-blue-500/20">
                    {initials}
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Ativo na Agenda
                  </span>
                </div>

                <h3 className="font-extrabold text-base text-slate-900">{pro.name}</h3>
                <p className="text-xs text-blue-600 font-bold mt-0.5">{pro.specialty || 'Especialista'}</p>
                {pro.phone && (
                  <p className="text-xs text-slate-400 font-medium mt-2 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> {pro.phone}
                  </p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px] font-medium">Agenda vinculada</span>
                {initialProfessionals.length > 1 && (
                  <button
                    onClick={() => handleDelete(pro.id)}
                    title="Remover profissional"
                    className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DE ADICIONAR PROFISSIONAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-5 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">Novo Membro da Equipe</h3>
                <p className="text-xs text-slate-500">Adicione um médico, terapeuta ou atendente.</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPro} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Dra. Mariana Ferreira"
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Especialidade / Cargo</label>
                <input
                  type="text"
                  required
                  value={specialty}
                  onChange={e => setSpecialty(e.target.value)}
                  placeholder="Ex: Psicóloga Clínica / TCC"
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">WhatsApp Comercial</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="(54) 99999-8888"
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-1/3 py-3 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-2/3 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? "Gravando..." : "Salvar Profissional"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}`,

  // ==========================================
  // 3. PÁGINA SERVER DE EQUIPE: src/app/team/page.tsx
  // ==========================================
  "src/app/team/page.tsx": `import React from 'react';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { InteractiveTeamView } from '@/components/team/interactive-team-view';

export const dynamic = 'force-dynamic';

export default async function TeamPage() {
  const session = await getSession();
  if (!session || !session.organizationId) redirect('/login');

  const [professionals, org] = await Promise.all([
    prisma.professional.findMany({
      where: { organizationId: session.organizationId },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.organization.findUnique({ where: { id: session.organizationId } }),
  ]);

  const serialized = professionals.map(p => ({
    id: p.id,
    name: p.name,
    specialty: p.specialty || 'Especialista',
    phone: p.phone || '',
    isActive: p.isActive,
  }));

  return (
    <DashboardShell 
      activePage="team" 
      businessName={org?.name || 'Minha Clínica'} 
      slug={org?.slug || 'viverbem'}
    >
      <InteractiveTeamView initialProfessionals={serialized} />
    </DashboardShell>
  );
}`
};

// Escreve os 3 novos arquivos
Object.entries(files).forEach(([rel, code]) => {
  const abs = path.join(process.cwd(), rel);
  const dir = path.dirname(abs);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(abs, code, "utf-8");
  console.log("  ✓ Criado: " + rel);
});

// 4. ATUALIZA A SIDEBAR PARA INCLUIR A ABA "EQUIPE"
const shellPath = path.join(process.cwd(), "src/components/layout/dashboard-shell.tsx");
let shellCode = fs.readFileSync(shellPath, "utf-8");

if (!shellCode.includes("UserCheck")) {
  shellCode = shellCode.replace(
    "import { \n  DollarSign,",
    "import { \n  UserCheck, \n  DollarSign,"
  );
}

if (!shellCode.includes("'team'")) {
  shellCode = shellCode.replace(
    "activePage: 'dashboard' | 'appointments' | 'clients' | 'services' | 'schedule' | 'settings' | 'financial';",
    "activePage: 'dashboard' | 'appointments' | 'clients' | 'services' | 'schedule' | 'settings' | 'financial' | 'team';"
  );

  shellCode = shellCode.replace(
    "{ id: 'clients', label: 'Clientes (CRM)', href: '/clients', icon: Users },",
    "{ id: 'clients', label: 'Clientes (CRM)', href: '/clients', icon: Users },\n    { id: 'team', label: 'Equipe', href: '/team', icon: Users },"
  );

  fs.writeFileSync(shellPath, shellCode, "utf-8");
  console.log("  ✓ Aba 'Equipe' adicionada à Sidebar com sucesso!");
}

console.log("\n👥 Módulo 4: Gestão de Equipe instalado com sucesso!");