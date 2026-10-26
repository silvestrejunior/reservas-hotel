import React, { useState } from 'react';
import { Sparkles, CheckCircle2, Clock, AlertTriangle, Layers, Smartphone } from 'lucide-react';
import type { Database } from '../types/database.types';

type Quarto = Database['public']['Tables']['quartos']['Row'] & {
  categoria?: Database['public']['Tables']['categorias_quarto']['Row'];
};

interface GovernancaViewProps {
  quartos: Quarto[];
  onAtualizarStatusLimpeza: (quartoId: string, status: Database['public']['Enums']['status_limpeza_quarto']) => void;
}

export const GovernancaView: React.FC<GovernancaViewProps> = ({
  quartos,
  onAtualizarStatusLimpeza
}) => {
  const [filtroAndar, setFiltroAndar] = useState<number | 'todos'>('todos');

  const quartosFiltrados = quartos.filter(q => {
    if (filtroAndar !== 'todos' && q.andar !== filtroAndar) return false;
    return true;
  });

  const limpos = quartos.filter(q => q.status_limpeza === 'limpo').length;
  const sujos = quartos.filter(q => q.status_limpeza === 'sujo_checkin_pendente').length;
  const emAndamento = quartos.filter(q => q.status_limpeza === 'em_limpeza').length;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header Governança */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm text-white flex items-center gap-2">
              Painel de Governança & Camareiras
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30 flex items-center gap-1">
                <Smartphone className="w-3 h-3" /> Mobile Friendly
              </span>
            </h2>
            <p className="text-xs text-slate-400">Toque no quarto para alterar o status de higienização</p>
          </div>
        </div>

        {/* Filtro Andar */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
          <button
            onClick={() => setFiltroAndar('todos')}
            className={`px-3 py-1 rounded-lg font-bold ${filtroAndar === 'todos' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
          >
            Todos
          </button>
          <button
            onClick={() => setFiltroAndar(1)}
            className={`px-3 py-1 rounded-lg font-bold ${filtroAndar === 1 ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
          >
            1º Andar
          </button>
          <button
            onClick={() => setFiltroAndar(2)}
            className={`px-3 py-1 rounded-lg font-bold ${filtroAndar === 2 ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
          >
            2º Andar
          </button>
        </div>
      </div>

      {/* Resumo Rápido */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-panel p-3 rounded-xl border-emerald-500/20 text-center">
          <span className="text-[11px] text-emerald-400 font-semibold">Limpos / Prontos</span>
          <p className="text-xl font-black text-white mt-0.5">{limpos}</p>
        </div>
        <div className="glass-panel p-3 rounded-xl border-amber-500/20 text-center">
          <span className="text-[11px] text-amber-400 font-semibold">Em Limpeza</span>
          <p className="text-xl font-black text-white mt-0.5">{emAndamento}</p>
        </div>
        <div className="glass-panel p-3 rounded-xl border-rose-500/20 text-center">
          <span className="text-[11px] text-rose-400 font-semibold">Sujos / Pendentes</span>
          <p className="text-xl font-black text-white mt-0.5">{sujos}</p>
        </div>
      </div>

      {/* Botões Grandes dos 32 Quartos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-3">
        {quartosFiltrados.map(quarto => {
          const isLimpo = quarto.status_limpeza === 'limpo';
          const isEmAndamento = quarto.status_limpeza === 'em_limpeza';

          return (
            <div
              key={quarto.id}
              className={`glass-card p-4 rounded-2xl border transition-all text-center flex flex-col justify-between ${
                isLimpo
                  ? 'border-emerald-500/30 bg-emerald-950/10'
                  : isEmAndamento
                  ? 'border-amber-500/40 bg-amber-950/20 animate-pulse'
                  : 'border-rose-500/30 bg-rose-950/10'
              }`}
            >
              <div>
                <span className="text-2xl font-black text-white">{quarto.numero}</span>
                <p className="text-xs text-slate-400 mt-0.5">{quarto.categoria?.nome?.replace('Apto ', '')}</p>
              </div>

              <div className="my-3">
                <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                  isLimpo
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : isEmAndamento
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  {isLimpo ? 'Limpo' : isEmAndamento ? 'Higienizando' : 'Sujo'}
                </span>
              </div>

              {/* Botão de Troca Rápida */}
              <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-800">
                <button
                  onClick={() => onAtualizarStatusLimpeza(quarto.id, 'sujo_checkin_pendente')}
                  className={`p-1.5 rounded-lg text-[10px] font-bold ${
                    quarto.status_limpeza === 'sujo_checkin_pendente'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Sujo
                </button>
                <button
                  onClick={() => onAtualizarStatusLimpeza(quarto.id, 'em_limpeza')}
                  className={`p-1.5 rounded-lg text-[10px] font-bold ${
                    isEmAndamento
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Limpando
                </button>
                <button
                  onClick={() => onAtualizarStatusLimpeza(quarto.id, 'limpo')}
                  className={`p-1.5 rounded-lg text-[10px] font-bold ${
                    isLimpo
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Limpo
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
