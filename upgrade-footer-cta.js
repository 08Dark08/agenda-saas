// upgrade-footer-cta.js
const fs = require("fs");
const path = require("path");

console.log("💎 Aplicando o Banner de Fechamento de Vendas e o Rodapé Corporativo de 4 Colunas...\n");

const content = `'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar, CheckCircle2, ArrowRight, ShieldCheck, Clock, 
  Sparkles, MessageCircle, ChevronDown, Check, Zap, Users, Smartphone,
  Lock, Headphones, Mail, ExternalLink
} from 'lucide-react';

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "Meu cliente precisa baixar algum aplicativo ou criar conta?",
      a: "Não! A experiência do seu cliente é 100% web e projetada para celular. Ele apenas abre o seu link, escolhe o dia, o horário e confirma em segundos com nome e WhatsApp."
    },
    {
      q: "Posso usar no meu próprio celular ou tablet?",
      a: "Sim, o painel do profissional e a página pública são 100% responsivos e funcionam com máxima velocidade no iPhone, Android, tablet ou computador."
    },
    {
      q: "Existe taxa de adesão ou contrato de fidelidade?",
      a: "Zero fidelidade e zero taxa de adesão. Você começa com 14 dias totalmente grátis e pode cancelar a qualquer momento sem custos adicionais."
    },
    {
      q: "O sistema respeita a LGPD para profissionais de saúde?",
      a: "Sim! Seguimos rigorosamente a LGPD. Não armazenamos prontuários médicos ou dados sensíveis desnecessários na agenda e o cliente tem total controle de consentimento."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900 font-sans antialiased">
      {/* NAVBAR */}
      <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-black">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="font-black text-lg tracking-tight text-slate-900">AgendaPro</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-600">
            <a href="#como-funciona" className="hover:text-blue-600 transition-colors">Como Funciona</a>
            <a href="#nichos" className="hover:text-blue-600 transition-colors">Para Quem É</a>
            <a href="#precos" className="hover:text-blue-600 transition-colors">Planos & Preços</a>
            <a href="#faq" className="hover:text-blue-600 transition-colors">Dúvidas Frequentes</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-bold text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-xl hover:bg-slate-50 transition-all"
            >
              Acessar Painel
            </Link>
            <Link
              href="/register"
              className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
            >
              <span>Testar 14 Dias Grátis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-20 pb-20 px-6 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-full mb-6 border border-blue-200/60 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          A plataforma definitiva para autônomos e pequenas clínicas
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-slate-950 tracking-tight leading-[1.1]">
          Agendamentos automáticos. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            Menos mensagens no WhatsApp.
          </span> <br className="hidden sm:inline" />
          Mais clientes confirmados.
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
          Tenha sua própria página de agendamento online personalizada, reduza faltas e permita que seus pacientes marquem horários sozinhos pelo celular, 24 horas por dia.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
          >
            Começar 14 Dias Gratuitamente
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#como-funciona"
            className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-sm rounded-2xl transition-all shadow-sm"
          >
            Ver Como Funciona
          </a>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-semibold">
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Sem cartão de crédito</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Configuração em 5 minutos</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Totalmente compatível com LGPD</span>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="py-20 bg-slate-50 border-y border-slate-200/80">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-md border border-blue-200/60">
              Passo a Passo
            </span>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 mt-3">Como funciona para você e seu cliente</h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-2 font-medium">Elimine o tempo perdido trocando dezenas de áudios no WhatsApp.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Defina seus serviços", desc: "Cadastre procedimentos, durações e preços em reais em menos de 2 minutos." },
              { step: "02", title: "Compartilhe seu link", desc: "Coloque seu link exclusivo na bio do Instagram, no WhatsApp ou cartão virtual." },
              { step: "03", title: "O cliente agenda sozinho", desc: "Ele visualiza apenas os horários livres na sua grade e escolhe o melhor dia." },
              { step: "04", title: "Confirmação na hora", desc: "O agendamento cai direto no seu painel com anti-double-booking e histórico no CRM." },
            ].map((card) => (
              <div key={card.step} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm relative hover:border-blue-300 transition-all">
                <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg mb-4 inline-block">{card.step}</span>
                <h3 className="font-extrabold text-slate-900 text-base">{card.title}</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed font-medium">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NICHOS */}
      <section id="nichos" className="py-20 max-w-6xl mx-auto px-6">
        <div className="text-center max-w-xl mx-auto mb-14">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Feito sob medida para o seu negócio</h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-2 font-medium">Adaptável às particularidades de qualquer profissional com agenda de atendimentos.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
          {[
            "Psicólogos", "Nutricionistas", "Fisioterapeutas",
            "Esteticistas", "Personal Trainers", "Consultores"
          ].map((niche) => (
            <div key={niche} className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-blue-500 hover:shadow-md transition-all font-extrabold text-xs text-slate-800">
              {niche}
            </div>
          ))}
        </div>
      </section>

      {/* TABELA DE PREÇOS */}
      <section id="precos" className="py-20 bg-slate-50 border-y border-slate-200/80">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-200">
              Preços Transparentes
            </span>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 mt-3">Planos que cabem no seu bolso</h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-2 font-medium">Comece gratuitamente e faça upgrade apenas quando sua agenda estiver cheia.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto">
            {/* Gratuito */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Plano Gratuito</h3>
                <p className="text-xs text-slate-400 mt-1">Para quem está iniciando os atendimentos agora.</p>
                <div className="mt-6 mb-6">
                  <span className="text-4xl font-black text-slate-950">R$ 0</span>
                  <span className="text-xs text-slate-400 font-bold"> /mês</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-600 font-medium">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600" /> 1 Profissional</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600" /> Até 30 agendamentos/mês</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600" /> Link de agendamento online</li>
                </ul>
              </div>
              <Link href="/register" className="mt-8 block text-center py-3 border border-slate-300 font-extrabold text-xs rounded-xl hover:bg-slate-50 transition-all text-slate-800">
                Criar Conta Gratuita
              </Link>
            </div>

            {/* Básico */}
            <div className="bg-white p-8 rounded-3xl border-2 border-blue-600 shadow-xl shadow-blue-500/15 flex flex-col justify-between relative scale-105">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-0.5 rounded-full shadow-md">
                Mais Escolhido
              </span>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Básico Profissional</h3>
                <p className="text-xs text-slate-400 mt-1">Para o autônomo com agenda ativa.</p>
                <div className="mt-6 mb-6">
                  <span className="text-4xl font-black text-slate-950">R$ 49</span>
                  <span className="text-xs text-slate-400 font-bold"> /mês</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-600 font-medium">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600" /> 1 Profissional</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600" /> Até 150 agendamentos/mês</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600" /> Painel financeiro em tempo real</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600" /> CRM de clientes com LGPD</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600" /> Botão direto de WhatsApp</li>
                </ul>
              </div>
              <Link href="/register" className="mt-8 block text-center py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/25 transition-all">
                Testar 14 Dias Grátis
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Clínica & Studios</h3>
                <p className="text-xs text-slate-400 mt-1">Para equipes e pequenos consultórios.</p>
                <div className="mt-6 mb-6">
                  <span className="text-4xl font-black text-slate-950">R$ 99</span>
                  <span className="text-xs text-slate-400 font-bold"> /mês</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-600 font-medium">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600" /> Até 3 Profissionais</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600" /> Até 500 agendamentos/mês</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600" /> Notificações automatizadas</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600" /> Suporte prioritário</li>
                </ul>
              </div>
              <Link href="/register" className="mt-8 block text-center py-3 border border-slate-300 font-extrabold text-xs rounded-xl hover:bg-slate-50 transition-all text-slate-800">
                Assinar Plano Equipe
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 max-w-4xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Dúvidas Frequentes</h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">Tudo o que você precisa saber antes de começar.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((item, idx) => (
            <div key={idx} className="border border-slate-200/80 rounded-2xl p-5 bg-white shadow-sm">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between text-left text-sm font-extrabold text-slate-900 cursor-pointer"
              >
                <span>{item.q}</span>
                <ChevronDown className={\`w-4 h-4 text-slate-400 transition-transform \${openFaq === idx ? 'rotate-180 text-blue-600' : ''}\`} />
              </button>
              {openFaq === idx && (
                <p className="mt-3 text-xs text-slate-500 leading-relaxed font-medium pt-2 border-t border-slate-100">
                  {item.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ========================================== */}
      {/* 🚀 BANNER FINAL DE FECHAMENTO DE VENDAS */}
      {/* ========================================== */}
      <section className="py-12 px-6 max-w-6xl mx-auto">
        <div className="bg-gradient-to-tr from-slate-950 via-blue-950 to-slate-900 rounded-3xl p-8 sm:p-14 text-white text-center shadow-2xl relative overflow-hidden border border-slate-800">
          <span className="text-[11px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 px-3.5 py-1.5 rounded-full border border-blue-400/20 inline-block mb-4">
            Comece Hoje Mesmo
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight max-w-3xl mx-auto">
            Pronto para economizar tempo e nunca mais perder um cliente?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto mt-4 font-normal leading-relaxed">
            Crie sua conta em menos de 2 minutos e comece seu período de 14 dias de teste gratuito. Sem cartão de crédito e sem pegadinhas.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-blue-500/30 transition-all hover:scale-105"
            >
              Criar Minha Agenda Grátis
            </Link>
            <a
              href="https://wa.me/5554996591765?text=Ol%C3%A1!%20Tenho%20d%C3%BAvidas%20sobre%20a%20plataforma%20AgendaPro."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-2xl border border-white/20 transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" /> Falar no WhatsApp Comercial
            </a>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* 🏢 RODAPÉ CORPORATIVO DE 4 COLUNAS */}
      {/* ========================================== */}
      <footer className="border-t border-slate-200/80 bg-slate-50 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-200/80">
            {/* Coluna 1: Marca e Missão */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-sm">
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="font-black text-lg text-slate-900">AgendaPro SaaS</span>
              </div>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed font-medium">
                A plataforma completa de agendamento online, confirmações automáticas e gestão para profissionais autônomos e clínicas no Brasil.
              </p>
              <div className="flex items-center gap-3 pt-2 text-[11px] font-bold text-slate-500">
                <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5 text-emerald-600" /> Criptografia SSL 256-bit</span>
                <span>•</span>
                <span>Uptime 99.9%</span>
              </div>
            </div>

            {/* Coluna 2: Produto */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Produto</h4>
              <ul className="space-y-2 text-xs text-slate-600 font-medium">
                <li><a href="#como-funciona" className="hover:text-blue-600 transition-colors">Como Funciona</a></li>
                <li><a href="#precos" className="hover:text-blue-600 transition-colors">Planos & Preços</a></li>
                <li><a href="#nichos" className="hover:text-blue-600 transition-colors">Nichos Atendidos</a></li>
                <li><Link href="/login" className="hover:text-blue-600 transition-colors">Acessar Painel</Link></li>
              </ul>
            </div>

            {/* Coluna 3: Nichos */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Profissões</h4>
              <ul className="space-y-2 text-xs text-slate-600 font-medium">
                <li><Link href="/register" className="hover:text-blue-600 transition-colors">Para Psicólogos</Link></li>
                <li><Link href="/register" className="hover:text-blue-600 transition-colors">Para Nutricionistas</Link></li>
                <li><Link href="/register" className="hover:text-blue-600 transition-colors">Para Fisioterapeutas</Link></li>
                <li><Link href="/register" className="hover:text-blue-600 transition-colors">Estética & Studios</Link></li>
              </ul>
            </div>

            {/* Coluna 4: Jurídico & Segurança */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Segurança & Legal</h4>
              <ul className="space-y-2 text-xs text-slate-600 font-medium">
                <li><Link href="/termos" className="hover:text-blue-600 transition-colors">Termos de Uso</Link></li>
                <li><Link href="/privacidade" className="hover:text-blue-600 transition-colors">Política de Privacidade</Link></li>
                <li><Link href="/privacidade" className="hover:text-blue-600 transition-colors flex items-center gap-1 text-emerald-600 font-bold"><ShieldCheck className="w-3.5 h-3.5" /> Conformidade LGPD</Link></li>
                <li><a href="https://wa.me/5554996591765" target="_blank" className="hover:text-blue-600 transition-colors">Suporte ao Assinante</a></li>
              </ul>
            </div>
          </div>

          {/* Linha Final de Copyright */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-medium">
            <p>© {new Date().getFullYear()} AgendaPro Tecnologia SaaS. Todos os direitos reservados.</p>
            <p className="flex items-center gap-1 text-[11px]">
              Desenvolvido com tecnologia de ponta • Hospedado com alta disponibilidade no Brasil.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}`;

fs.writeFileSync(path.join(process.cwd(), "src/app/page.tsx"), content, "utf-8");
console.log("✓ Fechamento comercial e Rodapé Corporativo aplicados com sucesso!");