// fix-login.js
const fs = require("fs");
const path = require("path");

console.log("🔑 Corrigindo o fluxo de login e redirecionamento para a Vercel...\n");

// 1. ATUALIZA A SERVER ACTION: loginAction retorna { success: true }
const actionPath = path.join(process.cwd(), "src/modules/auth/actions.ts");
const actionCode = `'use server';
import { prisma } from '@/lib/db/prisma';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { createSession, destroySession } from '@/lib/auth/session';
import { cookies } from 'next/headers';
import { addDays } from 'date-fns';

export async function loginAction(_: any, formData: FormData) {
  try {
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");

    if (!email || !password) {
      return { error: "Preencha o e-mail e a senha." };
    }

    const user = await prisma.user.findFirst({
      where: { email },
      include: { memberships: true },
    });

    if (!user) {
      return { error: "Nenhuma conta encontrada com este e-mail." };
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return { error: "Senha incorreta. Tente novamente." };
    }

    const primaryMembership = user.memberships[0];
    const organizationId = primaryMembership ? primaryMembership.organizationId : "";

    await createSession({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      organizationId,
      role: primaryMembership?.role || 'OWNER',
      isSuperAdmin: user.isSuperAdmin,
    });

    return { success: true };
  } catch (err: any) {
    return { error: "Erro ao autenticar: " + err.message };
  }
}

export async function registerAction(_: any, formData: FormData) {
  const data = Object.fromEntries(formData.entries()) as any;
  const passwordHash = await hashPassword(data.password);
  const email = String(data.email).trim().toLowerCase();

  const defaultPlan = await prisma.plan.findFirst({ where: { tier: 'BASIC' } });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, passwordHash, fullName: data.fullName, phone: data.phone },
      });

      const org = await tx.organization.create({
        data: { name: data.businessName, slug: data.slug, phone: data.phone, email },
      });

      const member = await tx.organizationMember.create({
        data: { organizationId: org.id, userId: user.id, role: 'OWNER' },
      });

      await tx.professional.create({
        data: { organizationId: org.id, memberId: member.id, name: data.fullName, phone: data.phone },
      });

      if (defaultPlan) {
        await tx.subscription.create({
          data: {
            organizationId: org.id,
            planId: defaultPlan.id,
            status: 'TRIALING',
            currentPeriodStart: new Date(),
            currentPeriodEnd: addDays(new Date(), 14),
          },
        });
      }

      await tx.publicBookingSettings.create({
        data: { organizationId: org.id, headline: "Agendamento com " + data.businessName },
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

    return { success: true };
  } catch (err: any) {
    return { error: 'E-mail ou link já em uso. Tente outro.' };
  }
}

export async function logoutAction() {
  await destroySession();
}`;

fs.writeFileSync(actionPath, actionCode, "utf-8");
console.log("  ✓ Server Actions de autenticação atualizadas!");

// 2. ATUALIZA A TELA DE LOGIN: login/page.tsx com redirecionamento forçado
const loginPath = path.join(process.cwd(), "src/app/login/page.tsx");
const loginCode = `'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Calendar, ArrowRight, AlertCircle } from 'lucide-react';
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
    } else if (res?.success) {
      // Redirecionamento completo do navegador para carregar o cookie na Vercel
      window.location.href = '/dashboard';
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 antialiased font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-500/20 font-black">
          <Calendar className="w-6 h-6" />
        </div>
        <h2 className="mt-4 text-2xl font-black text-slate-900 tracking-tight">Acesse seu Painel</h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">Gerencie sua agenda, clientes e horários em tempo real.</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/60 rounded-3xl sm:px-10 border border-slate-200/80">
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">E-mail Cadastrado</label>
              <input
                name="email"
                type="email"
                required
                placeholder="seu@email.com"
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sua Senha</label>
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? "Verificando credenciais..." : "Entrar no Sistema"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400 font-medium">
            Ainda não tem conta?{' '}
            <Link href="/register" className="font-bold text-blue-600 hover:underline">Cadastre-se grátis</Link>
          </div>
        </div>
      </div>
    </div>
  );
}`;

fs.writeFileSync(loginPath, loginCode, "utf-8");
console.log("  ✓ Tela de Login atualizada com window.location.href!");

console.log("\n🚀 Fluxo de Login corrigido com sucesso!");