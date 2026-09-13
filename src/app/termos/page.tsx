import React from 'react';
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
}