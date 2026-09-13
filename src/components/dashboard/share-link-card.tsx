'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowUpRight, Copy, Check } from 'lucide-react';

export function ShareLinkCard({ slug }: { slug: string }) {
  const [publicUrl, setPublicUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPublicUrl(`${window.location.origin}/agendar/${slug}`);
    }
  }, [slug]);

  function handleCopy() {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl text-white shadow-xl shadow-blue-500/20 space-y-4">
      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
        <Sparkles className="w-5 h-5 text-white" />
      </div>

      <div>
        <h3 className="text-base font-black">Divulgue sua Agenda</h3>
        <p className="text-xs text-blue-100 mt-1 leading-relaxed">
          Compartilhe este link com seus pacientes para que eles agendem diretamente pelo celular.
        </p>
      </div>

      <div className="p-2.5 bg-white/10 rounded-2xl border border-white/20 flex items-center justify-between gap-2">
        <span className="text-xs font-mono text-white truncate pl-1">
          {publicUrl || `https://agenda-saas-five.vercel.app/agendar/${slug}`}
        </span>
        <button
          onClick={handleCopy}
          type="button"
          className="shrink-0 p-2 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="text-[11px]">{copied ? 'Copiado!' : 'Copiar'}</span>
        </button>
      </div>

      <Link
        href={`/agendar/${slug}`}
        target="_blank"
        className="w-full py-3 bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all"
      >
        <span>Testar Página Pública</span>
        <ArrowUpRight className="w-4 h-4" />
      </Link>
    </div>
  );
}