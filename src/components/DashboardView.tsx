import React, { useState } from 'react';
import { 
  Bed, 
  DoorOpen, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Coffee, 
  LogOut, 
  Filter,
  User,
  Calendar,
  Layers
} from 'lucide-react';
import type { Database } from '../types/database.types';

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

interface DashboardViewProps {
  quartos: Quarto[];
  categorias: Database['public']['Tables']['categorias_quarto']['Row'][];
  loading: boolean;
  onOpenCheckin: (quarto: Quarto) => void;
  onOpenConsumo: (quarto: Quarto) => void;
  onOpenCheckout: (quarto: Quarto) => void;
  onAtualizarStatusLimpeza: (quartoId: string, novoStatus: Database['public']['Enums']['status_limpeza_quarto']) => void;
  onAtualizarStatusOperacional: (quartoId: string, novoStatus: Database['public']['Enums']['status_operacional_quarto']) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  quartos,
  categorias,
  loading,
  onOpenCheckin,
  onOpenConsumo,
  onOpenCheckout,
  onAtualizarStatusLimpeza,
  onAtualizarStatusOperacional
}) => {
  const [filtroAndar, setFiltroAndar] = useState<number | 'todos'>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');

  // Cálculos de Indicadores
  const totalUHs = quartos.length || 32;
  const livres = quartos.filter(q => q.status_operacional === 'livre').length;
  const ocupados = quartos.filter(q => q.status_operacional === 'ocupado').length;
  const emLimpeza = quartos.filter(q => q.status_limpeza === 'sujo_checkin_pendente' || q.status_limpeza === 'em_limpeza').length;
  const bloqueados = quartos.filter(q => q.status_operacional === 'bloqueado_manutencao').length;
  const taxaOcupacao = totalUHs > 0 ? Math.round((ocupados / totalUHs) * 100) : 0;

  // Filtragem dos Quartos
  const quartosFiltrados = quartos.filter(q => {
    if (filtroAndar !== 'todos' && q.andar !== filtroAndar) return false;
    if (filtroCategoria !== 'todas' && q.categoria_id !== filtroCategoria) return false;
    if (filtroStatus === 'livre' && q.status_operacional !== 'livre') return false;
    if (filtroStatus === 'ocupado' && q.status_operacional !== 'ocupado') return false;
    if (filtroStatus === 'limpeza' && q.status_limpeza === 'limpo') return false;
    if (filtroStatus === 'bloqueado' && q.status_operacional !== 'bloqueado_manutencao') return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* 1. KPIs Superiores */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total UHs */}
        <div className="glass-panel p-4 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total de UHs</span>
            <span className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
              <Bed className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{totalUHs}</span>
            <span className="text-xs text-slate-400 font-medium">quartos</span>
          </div>
          <div className="mt-1 text-[11px] text-blue-400/80 font-medium">Hotel Tio Luiz</div>
        </div>

        {/* Livres */}
        <div className="glass-panel p-4 rounded-2xl relative overflow-hidden group border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400">Livres / Prontos</span>
            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <DoorOpen className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">{livres}</span>
            <span className="text-xs text-slate-400 font-medium">disponíveis</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-400/80 font-medium">Prontos para check-in</div>
        </div>

        {/* Ocupados */}
        <div className="glass-panel p-4 rounded-2xl relative overflow-hidden group border-blue-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-400">Ocupados</span>
            <span className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
              <User className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{ocupados}</span>
            <span className="text-xs text-slate-400 font-medium">hóspedes</span>
          </div>
          <div className="mt-1 text-[11px] text-blue-400 font-semibold">{taxaOcupacao}% de ocupação</div>
        </div>

        {/* Em Limpeza */}
        <div className="glass-panel p-4 rounded-2xl relative overflow-hidden group border-amber-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400">Em Limpeza</span>
            <span className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400">{emLimpeza}</span>
            <span className="text-xs text-slate-400 font-medium">higienização</span>
          </div>
          <div className="mt-1 text-[11px] text-amber-400/80 font-medium">Governança ativa</div>
        </div>

        {/* Bloqueados / Manutenção */}
        <div className="glass-panel p-4 rounded-2xl relative overflow-hidden group border-slate-700/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Bloqueados</span>
            <span className="p-2 bg-slate-700/30 text-slate-400 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-300">{bloqueados}</span>
            <span className="text-xs text-slate-400 font-medium">manutenção</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400/80 font-medium">Reparos preventivos</div>
        </div>
      </div>

      {/* 2. Barra de Filtros Rápidos */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-blue-400" />
            Filtros:
          </span>

          {/* Filtro por Andar */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-xl border border-slate-700/70 text-xs">
            <button
              onClick={() => setFiltroAndar('todos')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filtroAndar === 'todos' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos Andares
            </button>
            <button
              onClick={() => setFiltroAndar(1)}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filtroAndar === 1 ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              1º Andar (101-115)
            </button>
            <button
              onClick={() => setFiltroAndar(2)}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filtroAndar === 2 ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              2º Andar (116-132)
            </button>
          </div>

          {/* Filtro por Categoria */}
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="text-xs bg-slate-800/80 border border-slate-700/70 text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="todas">Todas Categorias</option>
            {categorias.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>

          {/* Filtro por Status */}
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="text-xs bg-slate-800/80 border border-slate-700/70 text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="todos">Todos Status</option>
            <option value="livre">🟢 Apenas Livres</option>
            <option value="ocupado">🔴 Apenas Ocupados</option>
            <option value="limpeza">🟡 Em Limpeza</option>
            <option value="bloqueado">⚪ Bloqueados</option>
          </select>
        </div>

        <div className="text-xs text-slate-400">
          Exibindo <strong className="text-white">{quartosFiltrados.length}</strong> de {totalUHs} quartos
        </div>
      </div>

      {/* 3. Grade dos 32 Quartos */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-medium">Sincronizando quartos com Supabase...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
          {quartosFiltrados.map((quarto) => {
            const isOcupado = quarto.status_operacional === 'ocupado';
            const isBloqueado = quarto.status_operacional === 'bloqueado_manutencao';
            const isSujo = quarto.status_limpeza !== 'limpo';

            return (
              <div
                key={quarto.id}
                className={`glass-card rounded-2xl p-4 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 border ${
                  isOcupado
                    ? 'border-rose-500/30 hover:border-rose-500/50 bg-slate-900/80'
                    : isBloqueado
                    ? 'border-slate-700 bg-slate-900/40'
                    : 'border-emerald-500/20 hover:border-emerald-500/40 bg-slate-900/60'
                }`}
              >
                {/* Topo do Quarto */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black text-white tracking-tight">
                        {quarto.numero}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                        {quarto.andar}º Andar
                      </span>
                    </div>
                    <p className="text-xs text-blue-400 font-medium mt-0.5 truncate max-w-[150px]">
                      {quarto.categoria?.nome || 'Quarto Standard'}
                    </p>
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        isOcupado
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : isBloqueado
                          ? 'bg-slate-700/30 text-slate-400 border border-slate-600'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {isOcupado ? 'Ocupado' : isBloqueado ? 'Bloqueado' : 'Livre'}
                    </span>

                    {/* Botão de Limpeza com 1 clique */}
                    <button
                      onClick={() => {
                        const prox = quarto.status_limpeza === 'limpo' 
                          ? 'sujo_checkin_pendente' 
                          : quarto.status_limpeza === 'sujo_checkin_pendente'
                          ? 'em_limpeza'
                          : 'limpo';
                        onAtualizarStatusLimpeza(quarto.id, prox);
                      }}
                      title="Clique para alternar status de limpeza"
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 transition-all ${
                        quarto.status_limpeza === 'limpo'
                          ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                          : quarto.status_limpeza === 'em_limpeza'
                          ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 animate-pulse'
                          : 'text-amber-300 bg-amber-500/20 hover:bg-amber-500/30'
                      }`}
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      {quarto.status_limpeza === 'limpo' ? 'Limpo' : quarto.status_limpeza === 'em_limpeza' ? 'Higienizando' : 'Sujo'}
                    </button>
                  </div>
                </div>

                {/* Conteúdo Central */}
                <div className="my-3 py-2.5 px-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs">
                  {isOcupado && quarto.reserva_ativa ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                        <User className="w-3.5 h-3.5 text-blue-400" />
                        <span className="truncate">{quarto.reserva_ativa.hospede_nome}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400 text-[11px]">
                        <span>Saída: {quarto.reserva_ativa.data_checkout}</span>
                        {quarto.reserva_ativa.placa_veiculo && (
                          <span className="font-mono text-slate-300">{quarto.reserva_ativa.placa_veiculo}</span>
                        )}
                      </div>
                    </div>
                  ) : isBloqueado ? (
                    <div className="text-slate-400 italic text-[11px] flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      Manutenção preventiva
                    </div>
                  ) : (
                    <div className="text-slate-400 text-[11px] flex items-center justify-between">
                      <span>Diária padrão:</span>
                      <strong className="text-emerald-400 font-semibold">
                        R$ {quarto.categoria?.tarifa_padrao ? Number(quarto.categoria.tarifa_padrao).toFixed(2) : '150,00'}
                      </strong>
                    </div>
                  )}
                </div>

                {/* Ações do Quarto */}
                <div className="flex items-center gap-1.5 pt-1">
                  {!isOcupado ? (
                    <>
                      <button
                        onClick={() => onOpenCheckin(quarto)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Hospedar</span>
                      </button>
                      <button
                        onClick={() => onAtualizarStatusOperacional(
                          quarto.id, 
                          isBloqueado ? 'livre' : 'bloqueado_manutencao'
                        )}
                        title={isBloqueado ? "Desbloquear quarto" : "Bloquear para manutenção"}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => onOpenConsumo(quarto)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-blue-300 font-medium rounded-lg text-xs transition-colors border border-slate-700"
                      >
                        <Coffee className="w-3.5 h-3.5" />
                        <span>Consumo</span>
                      </button>
                      <button
                        onClick={() => onOpenCheckout(quarto)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-medium rounded-lg text-xs transition-colors border border-rose-500/30"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Check-out</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
