import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab, UserRole } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { GanttCalendarView } from './components/GanttCalendarView';
import { PosBalcaoView } from './components/PosBalcaoView';
import { RhView } from './components/RhView';
import { FinanceiroDreView } from './components/FinanceiroDreView';
import { GovernancaView } from './components/GovernancaView';
import { NovaReservaModal } from './components/NovaReservaModal';
import { LancamentoConsumoModal } from './components/LancamentoConsumoModal';
import { supabase } from './lib/supabase';
import type { Database } from './types/database.types';

type Quarto = Database['public']['Tables']['quartos']['Row'] & {
  categoria?: Database['public']['Tables']['categorias_quarto']['Row'];
  reserva_ativa?: {
    id: string;
    hospede_nome: string;
    data_checkout: string;
    saldo_devedor: number;
    placa_veiculo?: string;
  };
};

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Dados Hoteleiros
  const [quartos, setQuartos] = useState<Quarto[]>([]);
  const [categorias, setCategorias] = useState<Database['public']['Tables']['categorias_quarto']['Row'][]>([]);
  const [loading, setLoading] = useState(true);

  // Modais
  const [modalNovaReserva, setModalNovaReserva] = useState(false);
  const [quartoSelecionado, setQuartoSelecionado] = useState<Quarto | null>(null);
  const [modalConsumo, setModalConsumo] = useState(false);

  // Carrega Quartos e Reservas do Supabase
  const carregarDadosHoteleiros = async () => {
    try {
      // 1. Categorias
      const { data: cats } = await supabase.from('categorias_quarto').select('*').order('nome');
      if (cats) setCategorias(cats);

      // 2. Quartos
      const { data: qts } = await supabase
        .from('quartos')
        .select('*, categoria:categorias_quarto(*)')
        .order('numero');

      // 3. Reservas ativas (checkin realizado)
      const { data: reservasAtivas } = await supabase
        .from('reservas')
        .select('*, hospede:hospedes(*)')
        .eq('status', 'hospedado_checkin');

      if (qts) {
        const quartosMapeados: Quarto[] = qts.map(q => {
          const res = reservasAtivas?.find(r => r.quarto_id === q.id);
          return {
            ...q,
            reserva_ativa: res ? {
              id: res.id,
              hospede_nome: (res.hospede as any)?.nome_completo || 'Hóspede',
              data_checkout: new Date(res.data_checkout_previsto).toLocaleDateString('pt-BR'),
              saldo_devedor: Number(res.saldo_devedor),
              placa_veiculo: (res.hospede as any)?.placa_veiculo || undefined
            } : undefined
          };
        });

        setQuartos(quartosMapeados);
      }
    } catch (err) {
      console.error('Erro ao buscar dados do Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  // Configuração do Supabase Realtime
  useEffect(() => {
    carregarDadosHoteleiros();

    // Inscreve no canal Realtime
    const channel = supabase
      .channel('pms_realtime_hotel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quartos' }, () => {
        carregarDadosHoteleiros();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservas' }, () => {
        carregarDadosHoteleiros();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsRealtimeConnected(true);
        } else {
          setIsRealtimeConnected(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Atualizar Status Limpeza
  const atualizarStatusLimpeza = async (
    quartoId: string, 
    novoStatus: Database['public']['Enums']['status_limpeza_quarto']
  ) => {
    // Atualização otimista na tela
    setQuartos(prev => prev.map(q => q.id === quartoId ? { ...q, status_limpeza: novoStatus } : q));

    // Grava no Supabase
    await supabase.from('quartos').update({ status_limpeza: novoStatus }).eq('id', quartoId);
  };

  // Atualizar Status Operacional (ex: Bloqueio Manutenção)
  const atualizarStatusOperacional = async (
    quartoId: string, 
    novoStatus: Database['public']['Enums']['status_operacional_quarto']
  ) => {
    setQuartos(prev => prev.map(q => q.id === quartoId ? { ...q, status_operacional: novoStatus } : q));
    await supabase.from('quartos').update({ status_operacional: novoStatus }).eq('id', quartoId);
  };

  // Realizar Check-out
  const realizarCheckout = async (quarto: Quarto) => {
    if (!quarto.reserva_ativa) return;
    const confirm = window.confirm(`Deseja encerrar a estadia e realizar o check-out do Quarto ${quarto.numero}?`);
    if (!confirm) return;

    // 1. Atualiza status da reserva para finalizada
    await supabase.from('reservas').update({
      status: 'finalizada_checkout',
      data_checkout_real: new Date().toISOString()
    }).eq('id', quarto.reserva_ativa.id);

    // 2. Libera o quarto e marca como sujo
    await supabase.from('quartos').update({
      status_operacional: 'livre',
      status_limpeza: 'sujo_checkin_pendente'
    }).eq('id', quarto.id);

    carregarDadosHoteleiros();
  };

  const quartosLivres = quartos.filter(q => q.status_operacional === 'livre');

  // Filtro de Busca Global
  const quartosFiltradosBusca = quartos.filter(q => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const matchNumero = q.numero.toLowerCase().includes(term);
    const matchHospede = q.reserva_ativa?.hospede_nome.toLowerCase().includes(term);
    const matchPlaca = q.reserva_ativa?.placa_veiculo?.toLowerCase().includes(term);
    return matchNumero || matchHospede || matchPlaca;
  });

  const dataAtualFormatada = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* 1. Barra Lateral */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        userRole={userRole}
        onChangeRole={setUserRole}
        isRealtimeConnected={isRealtimeConnected}
      />

      {/* 2. Área Central de Conteúdo */}
      <main className="flex-1 flex flex-col min-w-0">
        <Header
          onOpenNovaReserva={() => {
            setQuartoSelecionado(null);
            setModalNovaReserva(true);
          }}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          currentDateText={dataAtualFormatada}
        />

        <div className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              quartos={quartosFiltradosBusca}
              categorias={categorias}
              loading={loading}
              onOpenCheckin={(q) => {
                setQuartoSelecionado(q);
                setModalNovaReserva(true);
              }}
              onOpenConsumo={(q) => {
                setQuartoSelecionado(q);
                setModalConsumo(true);
              }}
              onOpenCheckout={realizarCheckout}
              onAtualizarStatusLimpeza={atualizarStatusLimpeza}
              onAtualizarStatusOperacional={atualizarStatusOperacional}
            />
          )}

          {currentTab === 'calendario' && (
            <GanttCalendarView
              quartos={quartos}
              categorias={categorias}
            />
          )}

          {currentTab === 'pos' && (
            <PosBalcaoView />
          )}

          {currentTab === 'governanca' && (
            <GovernancaView
              quartos={quartos}
              onAtualizarStatusLimpeza={atualizarStatusLimpeza}
            />
          )}

          {currentTab === 'financeiro' && (
            <FinanceiroDreView />
          )}

          {currentTab === 'rh' && (
            <RhView />
          )}
        </div>
      </main>

      {/* MODAL NOVA RESERVA / CHECK-IN */}
      {modalNovaReserva && (
        <NovaReservaModal
          quartoPreSelecionado={quartoSelecionado}
          quartosLivres={quartosLivres}
          categorias={categorias}
          onClose={() => setModalNovaReserva(false)}
          onSuccess={() => {
            setModalNovaReserva(false);
            carregarDadosHoteleiros();
          }}
        />
      )}

      {/* MODAL LANÇAR CONSUMO NO QUARTO */}
      {modalConsumo && quartoSelecionado && (
        <LancamentoConsumoModal
          quarto={quartoSelecionado}
          onClose={() => setModalConsumo(false)}
          onSuccess={() => {
            setModalConsumo(false);
            carregarDadosHoteleiros();
          }}
        />
      )}
    </div>
  );
}

export default App;
