import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, User, Bed } from 'lucide-react';
import type { Database } from '../types/database.types';

type Quarto = Database['public']['Tables']['quartos']['Row'] & {
  categoria?: Database['public']['Tables']['categorias_quarto']['Row'];
};

interface GanttCalendarViewProps {
  quartos: Quarto[];
  categorias: Database['public']['Tables']['categorias_quarto']['Row'][];
}

export const GanttCalendarView: React.FC<GanttCalendarViewProps> = ({
  quartos,
  categorias
}) => {
  const [dataInicio, setDataInicio] = useState(new Date(2026, 9, 20)); // Outubro 2026
  const diasVisiveis = 14; // 14 dias no mapa

  // Gera lista de dias
  const dias = Array.from({ length: diasVisiveis }).map((_, i) => {
    const d = new Date(dataInicio);
    d.setDate(d.getDate() + i);
    return d;
  });

  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {/* Topo do Mapa */}
      <div className="glass-panel p-4 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm text-white">Mapa de Ocupação & Reservas (Gantt Interativo)</h2>
            <p className="text-xs text-slate-400">Visualização de quartos (101 a 132) e reservas por dia</p>
          </div>
        </div>

        {/* Navegação de Datas */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const d = new Date(dataInicio);
              d.setDate(d.getDate() - 7);
              setDataInicio(d);
            }}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-white px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
            Outubro / Novembro 2026
          </span>
          <button
            onClick={() => {
              const d = new Date(dataInicio);
              d.setDate(d.getDate() + 7);
              setDataInicio(d);
            }}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grade do Calendário */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-x-auto shadow-2xl">
        <div className="min-w-[950px]">
          {/* Cabeçalho de Dias */}
          <div className="grid grid-cols-15 bg-slate-900/90 border-b border-slate-800 sticky top-0 z-10 text-xs">
            {/* Coluna do Quarto */}
            <div className="col-span-2 p-3 font-bold text-slate-400 border-r border-slate-800">
              Quarto (UH)
            </div>
            {/* Colunas dos Dias */}
            {dias.map((d, index) => {
              const diaNum = d.getDate();
              const diaSem = diasSemana[d.getDay()];
              const isFimDeSemana = d.getDay() === 0 || d.getDay() === 6;

              return (
                <div
                  key={index}
                  className={`p-2 text-center border-r border-slate-800/60 ${
                    isFimDeSemana ? 'bg-slate-800/40 text-blue-300' : 'text-slate-300'
                  }`}
                >
                  <div className="text-[10px] text-slate-400 font-semibold">{diaSem}</div>
                  <div className="font-extrabold text-sm">{diaNum}</div>
                </div>
              );
            })}
          </div>

          {/* Linhas por Quarto */}
          <div className="divide-y divide-slate-800/60 text-xs">
            {quartos.map((quarto, qIdx) => {
              // Simulação visual de estadias distribuídas
              const temReservaSimulada = qIdx % 3 === 0;
              const inicioOffset = (qIdx % 5) + 1;
              const duracaoDias = 3;

              return (
                <div key={quarto.id} className="grid grid-cols-15 hover:bg-slate-800/20 transition-colors">
                  {/* Identificação do Quarto */}
                  <div className="col-span-2 p-2.5 border-r border-slate-800 flex items-center justify-between bg-slate-900/40">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-white">{quarto.numero}</span>
                      <span className="text-[10px] text-slate-400 truncate max-w-[80px]">
                        {quarto.categoria?.nome?.replace('Apto ', '') || 'Standard'}
                      </span>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${
                      quarto.status_operacional === 'livre' ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}></span>
                  </div>

                  {/* Células de Dias */}
                  {dias.map((d, dIdx) => {
                    const isInicio = temReservaSimulada && dIdx === inicioOffset;
                    const isDurante = temReservaSimulada && dIdx > inicioOffset && dIdx < (inicioOffset + duracaoDias);
                    const isFimDeSemana = d.getDay() === 0 || d.getDay() === 6;

                    return (
                      <div
                        key={dIdx}
                        className={`border-r border-slate-800/40 p-1 relative min-h-[42px] flex items-center ${
                          isFimDeSemana ? 'bg-slate-950/20' : ''
                        }`}
                      >
                        {isInicio && (
                          <div
                            style={{ width: `${duracaoDias * 100}%` }}
                            className="absolute left-1 z-10 h-7 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-2 flex items-center justify-between text-[10px] font-bold shadow-md shadow-blue-900/40 cursor-pointer hover:brightness-110"
                          >
                            <span className="truncate flex items-center gap-1">
                              <User className="w-3 h-3" /> Hóspede Hotel
                            </span>
                            <span className="text-[9px] bg-blue-800/80 px-1 rounded">R$ 480</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
