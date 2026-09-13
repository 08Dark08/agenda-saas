import React from 'react';
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
}