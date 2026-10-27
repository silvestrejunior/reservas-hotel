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
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 text-slate-800">
      {/* Header Governança */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-[#107c41]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              Painel de Governança & Camareiras
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-[#107c41] font-bold border border-emerald-200 flex items-center gap-1">
                <Smartphone className="w-3 h-3" /> Mobile Friendly
              </span>
            </h2>
            <p className="text-xs text-slate-500">Toque no quarto para alterar o status de higienização</p>
          </div>
        </div>

        {/* Filtro Andar */}
        <div className="flex bg-slate-100 border border-slate-200 p-0.5 rounded-lg text-xs">
          <button
            onClick={() => setFiltroAndar('todos')}
            className={`px-3 py-1 rounded-md font-bold transition-all ${filtroAndar === 'todos' ? 'bg-white text-[#107c41] shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Todos
          </button>
          <button
            onClick={() => setFiltroAndar(1)}
            className={`px-3 py-1 rounded-md font-bold transition-all ${filtroAndar === 1 ? 'bg-white text-[#107c41] shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            1º Andar
          </button>
          <button
            onClick={() => setFiltroAndar(2)}
            className={`px-3 py-1 rounded-md font-bold transition-all ${filtroAndar === 2 ? 'bg-white text-[#107c41] shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            2º Andar
          </button>
        </div>
      </div>

      {/* Resumo Rápido */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-sm text-center">
          <span className="text-[11px] text-[#107c41] font-bold">Limpos / Prontos</span>
          <p className="text-2xl font-black text-[#107c41] mt-0.5">{limpos}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-sm text-center">
          <span className="text-[11px] text-amber-800 font-bold">Em Limpeza</span>
          <p className="text-2xl font-black text-amber-800 mt-0.5">{emAndamento}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-sm text-center">
          <span className="text-[11px] text-rose-700 font-bold">Sujos / Pendentes</span>
          <p className="text-2xl font-black text-rose-700 mt-0.5">{sujos}</p>
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
              className={`bg-white p-4 rounded-xl border transition-all text-center flex flex-col justify-between shadow-sm ${
                isLimpo
                  ? 'border-emerald-200 hover:border-emerald-300'
                  : isEmAndamento
                  ? 'border-amber-300 bg-amber-50/20'
                  : 'border-rose-200 hover:border-rose-300'
              }`}
            >
              <div>
                <span className="text-2xl font-black text-slate-900">{quarto.numero}</span>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{quarto.categoria?.nome?.replace('Apto ', '')}</p>
              </div>

              <div className="my-3">
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  isLimpo
                    ? 'bg-emerald-50 text-[#107c41] border-emerald-200'
                    : isEmAndamento
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {isLimpo ? 'Limpo' : isEmAndamento ? 'Higienizando' : 'Sujo'}
                </span>
              </div>

              {/* Botão de Troca Rápida */}
              <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-100">
                <button
                  onClick={() => onAtualizarStatusLimpeza(quarto.id, 'sujo_checkin_pendente')}
                  className={`p-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    quarto.status_limpeza === 'sujo_checkin_pendente'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Sujo
                </button>
                <button
                  onClick={() => onAtualizarStatusLimpeza(quarto.id, 'em_limpeza')}
                  className={`p-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    isEmAndamento
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Limpando
                </button>
                <button
                  onClick={() => onAtualizarStatusLimpeza(quarto.id, 'limpo')}
                  className={`p-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    isLimpo
                      ? 'bg-[#107c41] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
