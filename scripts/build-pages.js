// build-pages.js
const fs = require("fs");
const path = require("path");

console.log("🎨 Gerando as páginas e interfaces visuais do SaaS...\n");

const pages = {
  // 1. LANDING PAGE COMERCIAL (ROTA "/")
  "src/app/page.tsx": `'use client';
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
}`,

  // 2. TELA DE CADASTRO
  "src/app/register/page.tsx": `'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, ArrowRight, ShieldCheck } from 'lucide-react';
import { registerAction } from '@/modules/auth/actions';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const res = await registerAction(null, formData);

    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push('/onboarding');
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-200">
          <Calendar className="w-6 h-6" />
        </div>
        <h2 className="mt-4 text-2xl font-black text-neutral-900 tracking-tight">Crie sua conta profissional</h2>
        <p className="text-xs text-neutral-500 mt-1">14 dias grátis para testar. Sem cartão de crédito.</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl sm:px-10 border border-neutral-100">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase">Seu Nome Completo</label>
              <input name="fullName" type="text" required placeholder="Dra. Mariana Santos" className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-blue-600" />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase">Nome Comercial / Clínica</label>
              <input name="businessName" type="text" required placeholder="Clínica Nutrir & Viver" className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-blue-600" />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase">Seu Link Exclusivo (Slug)</label>
              <div className="mt-1 flex rounded-xl border border-neutral-300 overflow-hidden text-sm">
                <span className="bg-neutral-50 px-3 py-2 text-neutral-400 text-xs flex items-center border-r">agendar/</span>
                <input name="slug" type="text" required placeholder="clinica-nutrir" className="w-full px-3 py-2 focus:outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase">WhatsApp Comercial</label>
              <input name="phone" type="tel" required placeholder="(11) 99999-8888" className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-blue-600" />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase">E-mail</label>
              <input name="email" type="email" required placeholder="contato@clinica.com" className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-blue-600" />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase">Senha de Acesso</label>
              <input name="password" type="password" required placeholder="Mínimo 8 caracteres" className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-blue-600" />
            </div>

            <button type="submit" disabled={loading} className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md shadow-blue-200 transition-all flex items-center justify-center gap-2">
              {loading ? "Criando sua conta..." : "Criar Minha Agenda"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-neutral-500">
            Já tem uma conta?{' '}
            <Link href="/login" className="font-bold text-blue-600 hover:underline">Fazer login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}`,

  // 3. TELA DE LOGIN
  "src/app/login/page.tsx": `'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Calendar, ArrowRight } from 'lucide-react';
import { loginAction } from '@/modules/auth/actions';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const res = await loginAction(null, formData);

    if (res?.error) {
      setError(res.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-200">
          <Calendar className="w-6 h-6" />
        </div>
        <h2 className="mt-4 text-2xl font-black text-neutral-900 tracking-tight">Acesse seu Painel</h2>
        <p className="text-xs text-neutral-500 mt-1">Gerencie seus agendamentos, clientes e horários.</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl sm:px-10 border border-neutral-100">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase">E-mail</label>
              <input name="email" type="email" required placeholder="seu@email.com" className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-blue-600" />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase">Senha</label>
              <input name="password" type="password" required placeholder="Sua senha secreta" className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-blue-600" />
            </div>

            <button type="submit" disabled={loading} className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md shadow-blue-200 transition-all flex items-center justify-center gap-2">
              {loading ? "Entrando..." : "Entrar no Sistema"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-neutral-500">
            Não tem uma conta ainda?{' '}
            <Link href="/register" className="font-bold text-blue-600 hover:underline">Cadastre-se grátis</Link>
          </div>
        </div>
      </div>
    </div>
  );
}`,

  // 4. SERVER ACTIONS DE AUTENTICAÇÃO
  "src/modules/auth/actions.ts": `'use server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { createSession, destroySession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { addDays } from 'date-fns';

export async function registerAction(_: any, formData: FormData) {
  const data = Object.fromEntries(formData.entries()) as any;
  const passwordHash = await hashPassword(data.password);

  const defaultPlan = await prisma.plan.findFirst({ where: { tier: 'BASIC' } });
  if (!defaultPlan) return { error: 'Planos não encontrados. Execute o seed.' };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email: data.email, passwordHash, fullName: data.fullName, phone: data.phone },
      });

      const org = await tx.organization.create({
        data: { name: data.businessName, slug: data.slug, phone: data.phone, email: data.email },
      });

      const member = await tx.organizationMember.create({
        data: { organizationId: org.id, userId: user.id, role: 'OWNER' },
      });

      await tx.professional.create({
        data: { organizationId: org.id, memberId: member.id, name: data.fullName, phone: data.phone },
      });

      await tx.subscription.create({
        data: {
          organizationId: org.id,
          planId: defaultPlan.id,
          status: 'TRIALING',
          currentPeriodStart: new Date(),
          currentPeriodEnd: addDays(new Date(), 14),
        },
      });

      await tx.publicBookingSettings.create({
        data: { organizationId: org.id, headline: \`Agendamento com \${data.businessName}\` },
      });

      return { user, org, member };
    });

    await createSession({
      userId: result.user.id,
      email: result.user.email,
      fullName: result.user.fullName,
      organizationId: result.org.id,
      role: result.member.role,
      isSuperAdmin: false,
    });
  } catch (err: any) {
    return { error: 'Falha ao registrar conta. Verifique se o e-mail ou slug já estão em uso.' };
  }

  redirect('/onboarding');
}

export async function loginAction(_: any, formData: FormData) {
  const { email, password } = Object.fromEntries(formData.entries()) as any;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { memberships: true },
  });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: 'E-mail ou senha incorretos.' };
  }

  const primary = user.memberships[0];

  await createSession({
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    organizationId: primary?.organizationId || '',
    role: primary?.role || 'STAFF',
    isSuperAdmin: user.isSuperAdmin,
  });

  redirect('/dashboard');
}

export async function logoutAction() {
  await destroySession();
  redirect('/login');
}`
};

// Escreve os arquivos
Object.entries(pages).forEach(([relPath, content]) => {
  const absPath = path.join(process.cwd(), relPath);
  const dir = path.dirname(absPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(absPath, content, 'utf-8');
  console.log(`  ✓ Criado: ${relPath}`);
});

console.log('\n🎉 Telas geradas com sucesso!');