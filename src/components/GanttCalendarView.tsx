import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Calendar, 
  User, 
  Clock, 
  DollarSign,
  Maximize2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type Quarto = Database['public']['Tables']['quartos']['Row'] & {
  categoria?: Database['public']['Tables']['categorias_quarto']['Row'];
};

type Reserva = Database['public']['Tables']['reservas']['Row'] & {
  hospede?: Database['public']['Tables']['hospedes']['Row'];
  quarto?: Database['public']['Tables']['quartos']['Row'];
};

interface GanttCalendarViewProps {
  quartos: Quarto[];
  categorias: Database['public']['Tables']['categorias_quarto']['Row'][];
  onOpenNovaReservaComDados?: (quartoId: string, dataIso: string) => void;
}

export const GanttCalendarView: React.FC<GanttCalendarViewProps> = ({
  quartos,
  categorias,
  onOpenNovaReservaComDados
}) => {
  // Data inicial fixa no período do Hospedin (26/10/2026) com navegação dinâmica
  const [dataInicio, setDataInicio] = useState(new Date(2026, 9, 26)); // 26 de Outubro de 2026
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [categoriasColapsadas, setCategoriasColapsadas] = useState<Record<string, boolean>>({});
  const [reservaSelecionada, setReservaSelecionada] = useState<Reserva | null>(null);

  const diasExibidos = 24; // 24 dias visíveis na tela

  // Carrega reservas do Supabase
  const carregarReservas = async () => {
    const { data } = await supabase
      .from('reservas')
      .select('*, hospede:hospedes(*), quarto:quartos(*)')
      .neq('status', 'cancelada');
    if (data) setReservas(data as any);
  };

  useEffect(() => {
    carregarReservas();

    const channel = supabase
      .channel('gantt_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservas' }, () => {
        carregarReservas();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Lista de dias da grade
  const dias = Array.from({ length: diasExibidos }).map((_, i) => {
    const d = new Date(dataInicio);
    d.setDate(d.getDate() + i);
    return d;
  });

  const diasSemana = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
  const meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

  // Data final do período exibido
  const dataFim = new Date(dias[dias.length - 1]);
  const formatarDataSimples = (d: Date) => {
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = String(d.getFullYear()).slice(-2);
    return `${dia}/${mes}/${ano}`;
  };

  // Alternar colapso de categoria
  const alternarCategoria = (catId: string) => {
    setCategoriasColapsadas(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  // Ordem idêntica ao Hospedin
  const ordemDesejada = [
    'Apto Ar Condicionado',
    'Apto Vent Solteiro',
    'Apto Ventilador',
    'Simples',
    'Apto Extensao'
  ];

  // Agrupamento de quartos por categoria na ordem oficial
  const categoriasAgrupadas = categorias
    .map(cat => ({
      categoria: cat,
      quartos: quartos.filter(q => q.categoria_id === cat.id)
    }))
    .filter(g => g.quartos.length > 0)
    .sort((a, b) => {
      const idxA = ordemDesejada.indexOf(a.categoria.nome);
      const idxB = ordemDesejada.indexOf(b.categoria.nome);
      return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
    });

  // Calcula taxa de ocupação para cada dia
  const calcularOcupacaoDia = (dia: Date) => {
    const diaStr = dia.toISOString().split('T')[0];
    const quartosOcupados = reservas.filter(r => {
      if (!r.quarto_id) return false;
      const checkinStr = r.data_checkin_previsto.split('T')[0];
      const checkoutStr = r.data_checkout_previsto.split('T')[0];
      return diaStr >= checkinStr && diaStr < checkoutStr;
    }).length;

    const total = quartos.length || 30;
    return Math.round((quartosOcupados / total) * 100);
  };

  // Calcula quartos vagos por categoria em um dia específico
  const calcularVagosCategoriaDia = (catId: string, dia: Date) => {
    const diaStr = dia.toISOString().split('T')[0];
    const quartosDestaCat = quartos.filter(q => q.categoria_id === catId);
    const ocupados = reservas.filter(r => {
      if (!r.quarto_id || r.categoria_id !== catId) return false;
      const checkinStr = r.data_checkin_previsto.split('T')[0];
      const checkoutStr = r.data_checkout_previsto.split('T')[0];
      return diaStr >= checkinStr && diaStr < checkoutStr;
    }).length;

    return Math.max(0, quartosDestaCat.length - ocupados);
  };

  // Retorna a cor da barra de reserva baseado no status/hóspede (paleta fiel ao Hospedin)
  const getCorReserva = (reserva: Reserva) => {
    const nome = (reserva.hospede as any)?.nome_completo?.toLowerCase() || '';
    if (nome.includes('kollac')) {
      return { bg: '#e57373', text: '#ffffff' }; // Coral / Salmão (vermelho do Hospedin)
    }
    if (nome.includes('metalurgica') || nome.includes('m...') || nome.includes('si...') || nome.includes('ra...')) {
      return { bg: '#009ee3', text: '#ffffff' }; // Azul Hospedin
    }
    // Padrão amarelo suave Hospedin
    return { bg: '#fff176', text: '#1e293b' };
  };

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 pb-12 select-none">
      {/* 1. Barra de Navegação Superior Fiel ao Hospedin */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        {/* Espaço da esquerda */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Hotel Tio Luiz • Mapa Geral
          </span>
        </div>

        {/* Seletor Central Verde/Teal < 26/10/26 à 26/11/26 > */}
        <div className="flex items-center bg-[#107c41] hover:bg-[#0e6d39] text-white rounded-md shadow-sm transition-all overflow-hidden">
          <button
            onClick={() => {
              const d = new Date(dataInicio);
              d.setDate(d.getDate() - 7);
              setDataInicio(d);
            }}
            className="px-3 py-2 hover:bg-black/10 transition-colors flex items-center justify-center border-r border-white/20"
            title="7 dias anteriores"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="px-5 py-2 font-bold text-xs tracking-wide">
            {formatarDataSimples(dataInicio)} à {formatarDataSimples(dataFim)}
          </div>

          <button
            onClick={() => {
              const d = new Date(dataInicio);
              d.setDate(d.getDate() + 7);
              setDataInicio(d);
            }}
            className="px-3 py-2 hover:bg-black/10 transition-colors flex items-center justify-center border-l border-white/20"
            title="Próximos 7 dias"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Botão Adicionar v */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenNovaReservaComDados && onOpenNovaReservaComDados('', dataInicio.toISOString())}
            className="flex items-center gap-2 bg-[#107c41] hover:bg-[#0e6d39] text-white font-bold text-xs px-4 py-2 rounded-md shadow-sm transition-all"
          >
            <span>Adicionar</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Grid do Mapa de Reservas (Gantt) */}
      <div className="p-4 overflow-x-auto">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm inline-block min-w-full">
          {/* Linha 1: Cabeçalho das UHs / Mês e Dias com Ocupação */}
          <div className="flex border-b border-slate-200 sticky top-0 bg-white z-20">
            {/* Coluna Fixa: UHs / Mês */}
            <div className="w-56 shrink-0 p-3 flex items-center justify-between border-r border-slate-200 bg-white font-black text-xs text-slate-700 uppercase tracking-tight sticky left-0 z-30">
              <span>UHs / Mês</span>
              <div className="flex flex-col text-slate-400">
                <ChevronUp className="w-3 h-3 -mb-1" />
                <ChevronDown className="w-3 h-3" />
              </div>
            </div>

            {/* Colunas de Dias com Dark Badges */}
            <div className="flex">
              {dias.map((d, index) => {
                const diaNum = String(d.getDate()).padStart(2, '0');
                const diaSem = diasSemana[d.getDay()];
                const mesStr = meses[d.getMonth()];
                const ocupacao = calcularOcupacaoDia(d);
                const isFimDeSemana = d.getDay() === 0 || d.getDay() === 6;

                return (
                  <div
                    key={index}
                    className="w-[58px] shrink-0 p-1 border-r border-slate-200 flex flex-col items-center bg-white"
                  >
                    {/* Bloco Escuro do Dia (Hospedin Dark Pill) */}
                    <div className="w-full bg-[#273a4d] text-white rounded p-1 flex flex-col items-center justify-between shadow-xs">
                      {/* Linha 1: Dia da semana e % Ocupação */}
                      <div className="w-full flex items-center justify-between text-[9px] font-bold leading-tight px-0.5">
                        <span className="text-slate-300">{diaSem}</span>
                        <span className="bg-white text-[#273a4d] px-1 py-0.2 rounded font-black text-[8px]">
                          {ocupacao}%
                        </span>
                      </div>
                      {/* Linha 2: Dia Grande e Mês */}
                      <div className="w-full flex items-baseline justify-between mt-0.5 px-0.5">
                        <span className="text-base font-black leading-none">{diaNum}</span>
                        <span className="text-[9px] font-bold text-slate-400">{mesStr}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Categorias e Quartos */}
          <div className="divide-y divide-slate-200">
            {categoriasAgrupadas.map(({ categoria, quartos: quartosCat }) => {
              const isColapsada = categoriasColapsadas[categoria.id];

              return (
                <div key={categoria.id} className="divide-y divide-slate-100">
                  {/* Linha de Cabeçalho da Categoria com Tarifas e Vagas */}
                  <div className="flex bg-[#f8fafc] border-y border-slate-200">
                    {/* Nome da Categoria (Fixa na rolagem horizontal) */}
                    <div
                      onClick={() => alternarCategoria(categoria.id)}
                      className="w-56 shrink-0 p-2.5 flex items-center justify-between border-r border-slate-200 cursor-pointer hover:bg-slate-200/50 transition-colors sticky left-0 bg-[#f8fafc] z-10"
                    >
                      <span className="font-extrabold text-[11px] text-slate-700 tracking-wider uppercase">
                        {categoria.nome}
                      </span>
                      {isColapsada ? (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronUp className="w-4 h-4 text-slate-500" />
                      )}
                    </div>

                    {/* Vagas e Tarifas por Dia para a Categoria */}
                    <div className="flex">
                      {dias.map((d, dIdx) => {
                        const vagas = calcularVagosCategoriaDia(categoria.id, d);
                        const tarifaFormatada = Number(categoria.tarifa_padrao).toFixed(2).replace('.', ',');

                        return (
                          <div
                            key={dIdx}
                            className="w-[58px] shrink-0 p-1 border-r border-slate-200 flex flex-col items-center justify-center bg-[#f8fafc]"
                          >
                            {/* Caixinha de Vagas: [ 0 ] (vermelho) ou [ N ] (verde) */}
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                                vagas === 0
                                  ? 'border-rose-300 text-rose-700 bg-rose-50'
                                  : 'border-emerald-300 text-[#107c41] bg-emerald-50'
                              }`}
                            >
                              {vagas}
                            </span>
                            {/* Tarifa diária */}
                            <span className="text-[9px] font-bold text-slate-600 mt-0.5 truncate">
                              R$ {tarifaFormatada}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Linhas dos Quartos da Categoria (se não estiver colapsada) */}
                  {!isColapsada && quartosCat.map((quarto) => {
                    const reservasDesteQuarto = reservas.filter(r => r.quarto_id === quarto.id);

                    return (
                      <div key={quarto.id} className="flex hover:bg-slate-50/70 transition-colors h-11 relative">
                        {/* Coluna do Quarto (101, 102...) */}
                        <div className="w-56 shrink-0 px-4 flex items-center border-r border-slate-200 bg-white sticky left-0 z-10 font-bold text-sm text-slate-700">
                          {quarto.numero}
                        </div>

                        {/* Células de Dias para o Quarto */}
                        <div className="flex relative">
                          {dias.map((d, dIdx) => {
                            const diaIso = d.toISOString().split('T')[0];

                            return (
                              <div
                                key={dIdx}
                                onClick={() => {
                                  if (onOpenNovaReservaComDados) {
                                    onOpenNovaReservaComDados(quarto.id, diaIso);
                                  }
                                }}
                                className="w-[58px] shrink-0 border-r border-slate-200 hover:bg-emerald-50/40 cursor-pointer transition-colors relative"
                                title={`Clique para criar reserva no Quarto ${quarto.numero} em ${diaIso}`}
                              >
                              </div>
                            );
                          })}

                          {/* Barras de Reservas (Parallelogram Ribbon) sobrepostas às células */}
                          {reservasDesteQuarto.map((res) => {
                            const checkinDate = new Date(res.data_checkin_previsto);
                            const checkoutDate = new Date(res.data_checkout_previsto);

                            // Calcula índice de início e duração em dias em relação a dataInicio
                            const diffInicioMs = checkinDate.getTime() - dataInicio.getTime();
                            const diaInicioFloat = diffInicioMs / (1000 * 60 * 60 * 24);

                            const duracaoMs = checkoutDate.getTime() - checkinDate.getTime();
                            const duracaoDiasFloat = Math.max(1, duracaoMs / (1000 * 60 * 60 * 24));

                            // Se a reserva estiver dentro da janela visível
                            if (diaInicioFloat + duracaoDiasFloat < 0 || diaInicioFloat > diasExibidos) {
                              return null;
                            }

                            const cellWidth = 58; // pixels por dia
                            const leftPx = Math.max(0, diaInicioFloat * cellWidth);
                            const widthPx = Math.max(cellWidth - 4, duracaoDiasFloat * cellWidth);

                            const cores = getCorReserva(res);
                            const hospedeNome = (res.hospede as any)?.nome_completo || 'Hóspede';

                            return (
                              <div
                                key={res.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReservaSelecionada(res);
                                }}
                                style={{
                                  left: `${leftPx}px`,
                                  width: `${widthPx}px`,
                                  backgroundColor: cores.bg,
                                  color: cores.text,
                                  // Assinatura visual do Hospedin: Parallelogram Ribbon
                                  clipPath: 'polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%)',
                                }}
                                className="absolute top-1.5 h-8 z-10 flex items-center px-4 font-black text-[11px] uppercase tracking-tight shadow-sm hover:brightness-105 cursor-pointer transition-all truncate"
                                title={`${hospedeNome} (${checkinDate.toLocaleDateString('pt-BR')} a ${checkoutDate.toLocaleDateString('pt-BR')})`}
                              >
                                <span className="truncate w-full text-center">
                                  {hospedeNome}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Modal de Detalhes da Reserva ao Clicar na Barra */}
      {reservaSelecionada && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 text-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#107c41] flex items-center justify-center font-bold">
                  UH
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-800">
                    Reserva {(reservaSelecionada.quarto as any)?.numero ? `Quarto ${(reservaSelecionada.quarto as any)?.numero}` : 'Balcão'}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">{reservaSelecionada.codigo_reserva}</p>
                </div>
              </div>
              <button
                onClick={() => setReservaSelecionada(null)}
                className="text-slate-400 hover:text-slate-600 p-1 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 font-semibold">Hóspede:</span>
                  <p className="font-extrabold text-sm text-slate-800 mt-0.5">
                    {(reservaSelecionada.hospede as any)?.nome_completo || 'Hóspede'}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-emerald-100 text-[#107c41]">
                  {reservaSelecionada.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-medium">Check-in:</span>
                  <p className="font-bold text-slate-700 mt-0.5">
                    {new Date(reservaSelecionada.data_checkin_previsto).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-medium">Check-out:</span>
                  <p className="font-bold text-slate-700 mt-0.5">
                    {new Date(reservaSelecionada.data_checkout_previsto).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-slate-500 font-bold">Valor Total das Diárias:</span>
                <span className="text-base font-black text-[#107c41]">
                  R$ {Number(reservaSelecionada.valor_total_geral).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setReservaSelecionada(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
