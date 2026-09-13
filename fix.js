// fix.js
const fs = require("fs");
const path = require("path");

console.log("🔗 Atualizando o card para link da Vercel com botão de copiar...\n");

// 1. Cria o componente do Card com botão Copiar
const cardDir = path.join(process.cwd(), "src/components/dashboard");
if (!fs.existsSync(cardDir)) fs.mkdirSync(cardDir, { recursive: true });

const cardCode = `'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowUpRight, Copy, Check } from 'lucide-react';

export function ShareLinkCard({ slug }: { slug: string }) {
  const [publicUrl, setPublicUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPublicUrl(\`\${window.location.origin}/agendar/\${slug}\`);
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
          {publicUrl || \`https://agenda-saas-five.vercel.app/agendar/\${slug}\`}
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
        href={\`/agendar/\${slug}\`}
        target="_blank"
        className="w-full py-3 bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all"
      >
        <span>Testar Página Pública</span>
        <ArrowUpRight className="w-4 h-4" />
      </Link>
    </div>
  );
}`;

fs.writeFileSync(path.join(cardDir, "share-link-card.tsx"), cardCode, "utf-8");
console.log("  ✓ Componente criado: src/components/dashboard/share-link-card.tsx");

// 2. Atualiza a página do dashboard para renderizar esse card
const dashboardPath = path.join(process.cwd(), "src/app/dashboard/page.tsx");
let dashboardContent = fs.readFileSync(dashboardPath, "utf-8");

if (!dashboardContent.includes("ShareLinkCard")) {
  dashboardContent = `import { ShareLinkCard } from '@/components/dashboard/share-link-card';\\n` + dashboardContent;
}

// Substitui o bloco azul estático pelo componente dinâmico
const regex = /<div className="bg-gradient-to-br from-blue-600 to-indigo-700[\s\S]*?<\/Link>\s*<\/div>/;
if (regex.test(dashboardContent)) {
  dashboardContent = dashboardContent.replace(regex, `<ShareLinkCard slug={org?.slug || 'viverbem'} />`);
  fs.writeFileSync(dashboardPath, dashboardContent, "utf-8");
  console.log("  ✓ Dashboard atualizado com sucesso!");
} else {
  console.log("  ℹ Bloco já atualizado no dashboard.");
}

console.log("\n🚀 Concluído!");