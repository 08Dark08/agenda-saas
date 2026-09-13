'use client';
import React, { useState, useTransition } from 'react';
import { Sparkles, Plus, Clock, Trash2, CheckCircle2 } from 'lucide-react';
import { createRealServiceAction, deleteRealServiceAction } from '@/modules/services/real-actions';

interface ServiceItem {
  id: string;
  name: string;
  durationMinutes: number;
  priceCents: number;
}

export function InteractiveServicesView({ initialServices }: { initialServices: ServiceItem[] }) {
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(50);
  const [price, setPrice] = useState(150);
  const [isPending, startTransition] = useTransition();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;

    startTransition(async () => {
      const res = await createRealServiceAction({
        name,
        durationMinutes: duration,
        price,
      });

      if (res.success) {
        setName('');
      } else {
        alert(res.error || "Erro ao salvar serviço no banco.");
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja realmente excluir este serviço da sua agenda?")) return;

    startTransition(async () => {
      await deleteRealServiceAction(id);
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Catálogo de Serviços</h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          Cadastre os procedimentos, durações e valores gravados diretamente no banco de dados.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Formulário Conectado ao Supabase */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-sm">
          <h2 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-600" /> Adicionar Novo Serviço
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nome do Atendimento</label>
              <input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="Ex: Terapia de Casal" 
                required 
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold focus:bg-white focus:border-blue-600 focus:outline-none transition-all" 
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Duração Pré-definida</label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {[30, 50, 60].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      duration === d
                        ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {d} min
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Preço em Reais (R$)</label>
              <input 
                type="number" 
                value={price} 
                onChange={e => setPrice(Number(e.target.value))} 
                required 
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold focus:bg-white focus:border-blue-600 focus:outline-none transition-all" 
              />
            </div>

            <button 
              type="submit" 
              disabled={isPending}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isPending ? "Gravando no Supabase..." : "Salvar Serviço no Banco"}
            </button>
          </form>
        </div>

        {/* Lista de Serviços Direta do Supabase */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {initialServices.length === 0 ? (
            <div className="sm:col-span-2 p-12 bg-white rounded-3xl border border-slate-200 text-center text-xs text-slate-400 font-bold">
              Nenhum serviço cadastrado ainda. Use o formulário ao lado para cadastrar.
            </div>
          ) : (
            initialServices.map(svc => (
              <div key={svc.id} className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-all group">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
                      Online Ativo
                    </span>
                    <span className="text-xl font-black text-slate-900">
                      {(svc.priceCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-base text-slate-900 group-hover:text-blue-600 transition-colors">{svc.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mt-1">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>{svc.durationMinutes} minutos de duração</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-slate-400 text-[11px] font-medium">Gravado no Supabase</span>
                  <button 
                    onClick={() => handleDelete(svc.id)}
                    title="Excluir serviço"
                    className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}