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
  Maximize2,
  CheckCircle,
  AlertTriangle,
  MoveHorizontal
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

interface DragState {
  type: 'move' | 'resize-left' | 'resize-right';
  reserva: Reserva;
  startX: number;
  startY: number;
  initialCheckin: Date;
  initialCheckout: Date;
  initialQuartoId: string;
  currentDeltaDays: number;
  currentQuartoId: string;
  hasMoved: boolean;
}

interface ToastMessage {
  tipo: 'success' | 'error' | 'info';
  mensagem: string;
}

// Helpers de datas sem problemas de fuso horário
const toDateOnly = (d: Date | string): Date => {
  if (typeof d === 'string') {
    const parts = d.split('T')[0].split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
  }
  const dt = new Date(d);
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
};

const addDays = (d: Date, n: number): Date => {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
};

const diffDays = (d1: Date, d2: Date): number => {
  const t1 = toDateOnly(d1).getTime();
  const t2 = toDateOnly(d2).getTime();
  return Math.round((t1 - t2) / (1000 * 60 * 60 * 24));
};

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

  // Estados de Drag-and-Drop / Resize e Notificação Toast
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const diasExibidos = 24; // 24 dias visíveis na tela
  const cellWidth = 58; // pixels por dia

  const mostrarToast = (tipo: 'success' | 'error' | 'info', mensagem: string) => {
    setToast({ tipo, mensagem });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast]);

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
    const diaTime = toDateOnly(dia).getTime();
    const quartosOcupados = reservas.filter(r => {
      if (!r.quarto_id) return false;
      const checkinTime = toDateOnly(r.data_checkin_previsto).getTime();
      const checkoutTime = toDateOnly(r.data_checkout_previsto).getTime();
      return diaTime >= checkinTime && diaTime < checkoutTime;
    }).length;

    const total = quartos.length || 30;
    return Math.round((quartosOcupados / total) * 100);
  };

  // Calcula quartos vagos por categoria em um dia específico
  const calcularVagosCategoriaDia = (catId: string, dia: Date) => {
    const diaTime = toDateOnly(dia).getTime();
    const quartosDestaCat = quartos.filter(q => q.categoria_id === catId);
    const ocupados = reservas.filter(r => {
      if (!r.quarto_id || r.categoria_id !== catId) return false;
      const checkinTime = toDateOnly(r.data_checkin_previsto).getTime();
      const checkoutTime = toDateOnly(r.data_checkout_previsto).getTime();
      return diaTime >= checkinTime && diaTime < checkoutTime;
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

  // Checagem de Conflito de Reserva
  const verificarConflito = (
    reservaId: string,
    targetQuartoId: string,
    checkin: Date,
    checkout: Date
  ): { temConflito: boolean; reservaConflitante?: Reserva } => {
    const checkinTime = toDateOnly(checkin).getTime();
    const checkoutTime = toDateOnly(checkout).getTime();

    const conflito = reservas.find(r => {
      if (r.id === reservaId || r.quarto_id !== targetQuartoId || r.status === 'cancelada') {
        return false;
      }
      const rIn = toDateOnly(r.data_checkin_previsto).getTime();
      const rOut = toDateOnly(r.data_checkout_previsto).getTime();

      // Intervalo [checkin, checkout) sobrepõe [rIn, rOut)
      return Math.max(checkinTime, rIn) < Math.min(checkoutTime, rOut);
    });

    return {
      temConflito: !!conflito,
      reservaConflitante: conflito
    };
  };

  // Iniciar Drag ou Resize
  const iniciarArraste = (
    e: React.PointerEvent,
    res: Reserva,
    tipo: 'move' | 'resize-left' | 'resize-right'
  ) => {
    e.stopPropagation();
    if (e.button !== 0) return; // Apenas botão principal (esquerdo)

    const dIn = toDateOnly(res.data_checkin_previsto);
    const dOut = toDateOnly(res.data_checkout_previsto);

    setDragState({
      type: tipo,
      reserva: res,
      startX: e.clientX,
      startY: e.clientY,
      initialCheckin: dIn,
      initialCheckout: dOut,
      initialQuartoId: res.quarto_id || '',
      currentDeltaDays: 0,
      currentQuartoId: res.quarto_id || '',
      hasMoved: false
    });
  };

  // Listeners de PointerMove, PointerUp e Esc durante Arraste
  useEffect(() => {
    if (!dragState) return;

    const onPointerMove = (e: PointerEvent) => {
      const deltaX = e.clientX - dragState.startX;
      const deltaDays = Math.round(deltaX / cellWidth);
      const moved = dragState.hasMoved || Math.abs(deltaX) > 4 || Math.abs(e.clientY - dragState.startY) > 4;

      // Detecta quarto sob o cursor se estiver movendo o card
      let targetQuartoId = dragState.initialQuartoId;
      if (dragState.type === 'move') {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const row = el?.closest('[data-quarto-id]');
        if (row) {
          const qId = row.getAttribute('data-quarto-id');
          if (qId) targetQuartoId = qId;
        }
      }

      setDragState(prev => prev ? {
        ...prev,
        currentDeltaDays: deltaDays,
        currentQuartoId: targetQuartoId,
        hasMoved: moved
      } : null);
    };

    const onPointerUp = async () => {
      if (!dragState) return;

      if (!dragState.hasMoved) {
        setDragState(null);
        return;
      }

      const { type, reserva, initialCheckin, initialCheckout, initialQuartoId, currentDeltaDays, currentQuartoId } = dragState;

      // Calcular datas finais
      let finalCheckin = new Date(initialCheckin);
      let finalCheckout = new Date(initialCheckout);
      const finalQuartoId = currentQuartoId;

      if (type === 'move') {
        finalCheckin = addDays(initialCheckin, currentDeltaDays);
        finalCheckout = addDays(initialCheckout, currentDeltaDays);
      } else if (type === 'resize-left') {
        const candIn = addDays(initialCheckin, currentDeltaDays);
        if (candIn >= initialCheckout) {
          finalCheckin = addDays(initialCheckout, -1);
        } else {
          finalCheckin = candIn;
        }
        finalCheckout = initialCheckout;
      } else if (type === 'resize-right') {
        finalCheckin = initialCheckin;
        const candOut = addDays(initialCheckout, currentDeltaDays);
        if (candOut <= initialCheckin) {
          finalCheckout = addDays(initialCheckin, 1);
        } else {
          finalCheckout = candOut;
        }
      }

      // Encerra estado visual do arraste
      setDragState(null);

      // Checa se algo de fato mudou
      const noitesFinais = Math.max(1, diffDays(finalCheckout, finalCheckin));
      const noitesIniciais = Math.max(1, diffDays(initialCheckout, initialCheckin));
      const mesmaData = diffDays(finalCheckin, initialCheckin) === 0 && diffDays(finalCheckout, initialCheckout) === 0;
      const mesmoQuarto = finalQuartoId === initialQuartoId;

      if (mesmaData && mesmoQuarto) {
        return;
      }

      const targetQuarto = quartos.find(q => q.id === finalQuartoId);
      const quartoNome = targetQuarto ? `Quarto ${targetQuarto.numero}` : 'Quarto';

      // Checa conflito
      const { temConflito, reservaConflitante } = verificarConflito(reserva.id, finalQuartoId, finalCheckin, finalCheckout);

      if (temConflito) {
        const hospedeConflito = (reservaConflitante?.hospede as any)?.nome_completo || 'outro hóspede';
        mostrarToast('error', `Não foi possível mover: o ${quartoNome} já possui reserva de ${hospedeConflito} neste período.`);
        return;
      }

      // Recalcula diárias e valores
      const targetCategoria = categorias.find(c => c.id === targetQuarto?.categoria_id);
      const tarifaPadrao = Number(targetCategoria?.tarifa_padrao) || 180;
      const diariaAnterior = Number(reserva.valor_diarias_total) / Math.max(1, noitesIniciais);
      const tarifaAplicada = (targetQuarto?.categoria_id !== reserva.categoria_id) ? tarifaPadrao : (diariaAnterior || tarifaPadrao);
      const novoValorDiarias = Math.round(tarifaAplicada * noitesFinais * 100) / 100;
      const consumo = Number(reserva.valor_consumo_total) || 0;
      const desconto = Number(reserva.valor_desconto) || 0;
      const adiantado = Number(reserva.valor_pago_adiantado) || 0;
      const novoTotalGeral = Math.round((novoValorDiarias + consumo - desconto) * 100) / 100;
      const novoSaldoDevedor = Math.max(0, Math.round((novoTotalGeral - adiantado) * 100) / 100);

      const checkinIso = finalCheckin.toISOString();
      const checkoutIso = finalCheckout.toISOString();

      // Atualização Otimista no React State
      setReservas(prev => prev.map(r => {
        if (r.id === reserva.id) {
          return {
            ...r,
            quarto_id: finalQuartoId,
            categoria_id: targetQuarto?.categoria_id || r.categoria_id,
            data_checkin_previsto: checkinIso,
            data_checkout_previsto: checkoutIso,
            valor_diarias_total: novoValorDiarias,
            valor_total_geral: novoTotalGeral,
            saldo_devedor: novoSaldoDevedor,
            quarto: targetQuarto || r.quarto
          };
        }
        return r;
      }));

      // Persistência no Supabase
      const { error } = await supabase
        .from('reservas')
        .update({
          quarto_id: finalQuartoId,
          categoria_id: targetQuarto?.categoria_id || reserva.categoria_id,
          data_checkin_previsto: checkinIso,
          data_checkout_previsto: checkoutIso,
          valor_diarias_total: novoValorDiarias,
          valor_total_geral: novoTotalGeral,
          saldo_devedor: novoSaldoDevedor
        })
        .eq('id', reserva.id);

      if (error) {
        mostrarToast('error', `Erro ao salvar no banco de dados: ${error.message}`);
        carregarReservas();
      } else {
        const hospedeNome = (reserva.hospede as any)?.nome_completo || 'Hóspede';
        mostrarToast('success', `Reserva de ${hospedeNome} atualizada: ${quartoNome} • ${formatarDataSimples(finalCheckin)} à ${formatarDataSimples(finalCheckout)} (${noitesFinais} ${noitesFinais === 1 ? 'diária' : 'diárias'})`);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDragState(null);
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [dragState, reservas, quartos, categorias]);

  // Renderiza a barra da reserva com handles de arraste e esticar
  const renderReservaBar = (
    res: Reserva,
    quartoId: string,
    isGhost: boolean = false
  ) => {
    const isSendoArrastada = dragState?.reserva.id === res.id;
    
    let dCheckin = toDateOnly(res.data_checkin_previsto);
    let dCheckout = toDateOnly(res.data_checkout_previsto);

    if (isSendoArrastada && !isGhost) {
      if (dragState.type === 'move') {
        dCheckin = addDays(dragState.initialCheckin, dragState.currentDeltaDays);
        dCheckout = addDays(dragState.initialCheckout, dragState.currentDeltaDays);
      } else if (dragState.type === 'resize-left') {
        const candIn = addDays(dragState.initialCheckin, dragState.currentDeltaDays);
        dCheckin = candIn >= dragState.initialCheckout ? addDays(dragState.initialCheckout, -1) : candIn;
        dCheckout = dragState.initialCheckout;
      } else if (dragState.type === 'resize-right') {
        dCheckin = dragState.initialCheckin;
        const candOut = addDays(dragState.initialCheckout, dragState.currentDeltaDays);
        dCheckout = candOut <= dragState.initialCheckin ? addDays(dragState.initialCheckin, 1) : candOut;
      }
    }

    const diffInicioDias = diffDays(dCheckin, dataInicio);
    const duracaoDias = Math.max(1, diffDays(dCheckout, dCheckin));

    // Se estiver fora da janela visível
    if (diffInicioDias + duracaoDias < 0 || diffInicioDias > diasExibidos) {
      return null;
    }

    const leftPx = Math.max(0, diffInicioDias * cellWidth);
    const widthPx = Math.max(cellWidth - 4, duracaoDias * cellWidth);

    const cores = getCorReserva(res);
    const hospedeNome = (res.hospede as any)?.nome_completo || 'Hóspede';

    // Verificação de conflito ao vivo durante o arraste
    let temConflitoLive = false;
    if (isSendoArrastada && !isGhost) {
      const conflito = verificarConflito(res.id, quartoId, dCheckin, dCheckout);
      temConflitoLive = conflito.temConflito;
    }

    if (isGhost) {
      return (
        <div
          key={`ghost-${res.id}`}
          style={{
            left: `${leftPx}px`,
            width: `${widthPx}px`,
          }}
          className="absolute top-1.5 h-8 border-2 border-dashed border-slate-300 bg-slate-100/60 rounded-md z-5 pointer-events-none flex items-center justify-center opacity-60"
        >
          <span className="text-[10px] text-slate-400 font-bold truncate px-2">
            (Posição original)
          </span>
        </div>
      );
    }

    return (
      <div
        key={res.id}
        style={{
          left: `${leftPx}px`,
          width: `${widthPx}px`,
        }}
        className={`absolute top-1.5 h-8 select-none transition-shadow ${
          isSendoArrastada 
            ? 'z-40 shadow-2xl scale-[1.01]' 
            : 'z-10 shadow-xs hover:shadow-md hover:brightness-105'
        }`}
      >
        {/* Badge flutuante interativo durante o arraste / redimensionamento */}
        {isSendoArrastada && (
          <div className={`absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded shadow-xl text-[10px] font-bold whitespace-nowrap pointer-events-none flex items-center gap-1.5 z-50 ${
            temConflitoLive 
              ? 'bg-rose-600 text-white animate-bounce' 
              : 'bg-slate-900 text-white'
          }`}>
            {temConflitoLive ? (
              <span>⚠️ Quarto indisponível neste período!</span>
            ) : (
              <>
                <span>{formatarDataSimples(dCheckin)} à {formatarDataSimples(dCheckout)}</span>
                <span className="text-emerald-400 font-black">({duracaoDias} {duracaoDias === 1 ? 'noite' : 'noites'})</span>
              </>
            )}
          </div>
        )}

        {/* Corpo Visual da Reserva estilo Hospedin Ribbon */}
        <div
          style={{
            backgroundColor: temConflitoLive ? '#f43f5e' : cores.bg,
            color: cores.text,
            clipPath: 'polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%)',
          }}
          className="relative w-full h-full flex items-center overflow-hidden"
        >
          {/* Alça Esquerda (Esticar Check-in) */}
          <div
            onPointerDown={(e) => iniciarArraste(e, res, 'resize-left')}
            className="absolute left-0 top-0 bottom-0 w-3.5 z-30 cursor-ew-resize hover:bg-black/20 flex items-center justify-center group/handle transition-colors touch-none"
            title="Puxe para antecipar ou adiar o Check-in"
          >
            <div className="w-1 h-3.5 rounded-full bg-white/70 group-hover/handle:bg-white shadow-xs" />
          </div>

          {/* Área Central (Arrastar Reserva) */}
          <div
            onPointerDown={(e) => iniciarArraste(e, res, 'move')}
            onClick={(e) => {
              e.stopPropagation();
              if (!dragState?.hasMoved) {
                setReservaSelecionada(res);
              }
            }}
            className="flex-1 h-full cursor-grab active:cursor-grabbing flex items-center justify-center px-4 touch-none"
            title={`${hospedeNome} • Clique para ver detalhes ou arraste para mover`}
          >
            <span className="truncate w-full text-center select-none font-black text-[11px] uppercase tracking-tight">
              {hospedeNome}
            </span>
          </div>

          {/* Alça Direita (Esticar Check-out) */}
          <div
            onPointerDown={(e) => iniciarArraste(e, res, 'resize-right')}
            className="absolute right-0 top-0 bottom-0 w-3.5 z-30 cursor-ew-resize hover:bg-black/20 flex items-center justify-center group/handle transition-colors touch-none"
            title="Puxe para estender ou diminuir o Check-out"
          >
            <div className="w-1 h-3.5 rounded-full bg-white/70 group-hover/handle:bg-white shadow-xs" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 pb-12 select-none">
      {/* 1. Barra de Navegação Superior Fiel ao Hospedin */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        {/* Identificação e Dica de Interatividade */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Hotel Tio Luiz • Mapa Geral
          </span>
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-[#107c41] border border-emerald-200 rounded-md text-[11px] font-semibold">
            <MoveHorizontal className="w-3.5 h-3.5" />
            <span>Arraste para mover de quarto/data • Puxe as bordas para esticar a estadia</span>
          </div>
        </div>

        {/* Seletor Central Verde < 26/10/26 à 26/11/26 > */}
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

        {/* Botão Adicionar */}
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
                    const isTargetRow = dragState?.currentQuartoId === quarto.id;
                    const isOriginRow = dragState?.initialQuartoId === quarto.id;
                    const isDraggingMovedToAnotherRoom = dragState && isOriginRow && dragState.currentQuartoId !== quarto.id;

                    // Reservas a renderizar nesta linha
                    const reservasDesteQuarto = reservas.filter(r => {
                      if (dragState && dragState.reserva.id === r.id) {
                        return dragState.currentQuartoId === quarto.id;
                      }
                      return r.quarto_id === quarto.id;
                    });

                    // Se uma reserva veio de outro quarto para este durante o arraste
                    const reservaVindoDeOutroQuarto = (dragState && dragState.currentQuartoId === quarto.id && dragState.initialQuartoId !== quarto.id)
                      ? dragState.reserva
                      : null;

                    return (
                      <div 
                        key={quarto.id} 
                        data-quarto-id={quarto.id}
                        className={`flex transition-colors h-11 relative ${
                          isTargetRow 
                            ? 'bg-emerald-50/80 ring-2 ring-[#107c41] ring-inset z-10' 
                            : 'hover:bg-slate-50/70'
                        }`}
                      >
                        {/* Coluna do Quarto (101, 102...) */}
                        <div className="w-56 shrink-0 px-4 flex items-center justify-between border-r border-slate-200 bg-white sticky left-0 z-10 font-bold text-sm text-slate-700">
                          <span>{quarto.numero}</span>
                          {isTargetRow && dragState && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-[#107c41] text-white rounded">
                              Soltar aqui
                            </span>
                          )}
                        </div>

                        {/* Células de Dias para o Quarto */}
                        <div className="flex relative">
                          {dias.map((d, dIdx) => {
                            const diaIso = d.toISOString().split('T')[0];

                            return (
                              <div
                                key={dIdx}
                                onClick={() => {
                                  if (!dragState && onOpenNovaReservaComDados) {
                                    onOpenNovaReservaComDados(quarto.id, diaIso);
                                  }
                                }}
                                className="w-[58px] shrink-0 border-r border-slate-200 hover:bg-emerald-50/40 cursor-pointer transition-colors relative"
                                title={`Clique para criar reserva no Quarto ${quarto.numero} em ${diaIso}`}
                              />
                            );
                          })}

                          {/* Se a reserva está sendo arrastada para outro quarto, deixa fantasma na origem */}
                          {isDraggingMovedToAnotherRoom && renderReservaBar(dragState.reserva, quarto.id, true)}

                          {/* Renderiza as reservas deste quarto */}
                          {reservasDesteQuarto.map((res) => renderReservaBar(res, quarto.id, false))}

                          {/* Renderiza a reserva vinda de outro quarto sobreposta a esta linha */}
                          {reservaVindoDeOutroQuarto && renderReservaBar(reservaVindoDeOutroQuarto, quarto.id, false)}
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

      {/* 3. Modal de Detalhes da Reserva ao Clicar na Barra */}
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
                  R$ {Number(reservaSelecionada.valor_diarias_total).toFixed(2)}
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

      {/* 4. Notificação Toast Material-UI / Microsoft Fluent */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900/95 text-white px-5 py-3.5 rounded-xl shadow-2xl border border-slate-700/50 backdrop-blur-sm animate-in slide-in-from-bottom-4 duration-200">
          {toast.tipo === 'success' ? (
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              <CheckCircle className="w-4 h-4" />
            </div>
          ) : toast.tipo === 'error' ? (
            <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-sm">
              <AlertTriangle className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
              ℹ
            </div>
          )}
          <div className="text-xs font-medium max-w-sm">
            <p className="text-slate-100">{toast.mensagem}</p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-slate-400 hover:text-white text-base leading-none"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
