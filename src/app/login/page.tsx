'use client';
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
}