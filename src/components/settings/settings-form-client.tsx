'use client';
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
          href={`/agendar/${initialData.slug}`}
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
}