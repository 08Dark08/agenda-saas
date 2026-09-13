'use client';
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
}