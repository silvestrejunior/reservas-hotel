import React, { useState, useEffect } from 'react';
import { X, Coffee, Plus, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type Quarto = Database['public']['Tables']['quartos']['Row'] & {
  categoria?: Database['public']['Tables']['categorias_quarto']['Row'];
  reserva_ativa?: {
    id: string;
    hospede_nome: string;
    data_checkout: string;
    saldo_devedor: number;
  };
};

type Produto = Database['public']['Tables']['produtos_servicos']['Row'];

interface LancamentoConsumoModalProps {
  quarto: Quarto;
  onClose: () => void;
  onSuccess: () => void;
}

export const LancamentoConsumoModal: React.FC<LancamentoConsumoModalProps> = ({
  quarto,
  onClose,
  onSuccess
}) => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtoId, setProdutoId] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase
      .from('produtos_servicos')
      .select('*')
      .order('nome')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setProdutos(data);
          setProdutoId(data[0].id);
        }
      });
  }, []);

  const produtoSelecionado = produtos.find(p => p.id === produtoId);
  const totalItem = (produtoSelecionado ? Number(produtoSelecionado.preco_venda) : 0) * (parseInt(quantidade) || 1);

  const salvarConsumo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quarto.reserva_ativa?.id || !produtoSelecionado) return;

    setLoading(true);
    try {
      // 1. Insere consumo na reserva
      const { error: errConsumo } = await supabase
        .from('consumo_reserva')
        .insert({
          reserva_id: quarto.reserva_ativa.id,
          produto_id: produtoId,
          quantidade: parseInt(quantidade),
          valor_unitario: Number(produtoSelecionado.preco_venda),
          valor_total: totalItem,
          custo_total: Number(produtoSelecionado.preco_custo) * parseInt(quantidade)
        });

      if (errConsumo) throw errConsumo;

      // 2. Dá baixa no estoque
      await supabase
        .from('produtos_servicos')
        .update({
          estoque_atual: produtoSelecionado.estoque_atual - parseInt(quantidade)
        })
        .eq('id', produtoId);

      onSuccess();
    } catch (err: any) {
      alert('Erro ao lançar consumo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-700 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-base text-white">
              Lançar Consumo no Quarto {quarto.numero}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={salvarConsumo} className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 font-medium">Hóspede Atual:</span>
            <p className="text-sm font-bold text-white mt-0.5">
              {quarto.reserva_ativa?.hospede_nome || 'Hóspede'}
            </p>
          </div>

          <div>
            <label className="text-slate-300 font-semibold">Produto / Item de Frigobar</label>
            <select
              value={produtoId}
              onChange={e => setProdutoId(e.target.value)}
              className="w-full mt-1 p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none font-medium"
            >
              {produtos.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nome} - R$ {Number(p.preco_venda).toFixed(2)} (Estoque: {p.estoque_atual})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-300 font-semibold">Quantidade</label>
            <input
              type="number"
              min="1"
              required
              value={quantidade}
              onChange={e => setQuantidade(e.target.value)}
              className="w-full mt-1 p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Total do Item a Debitar:</span>
            <span className="text-lg font-black text-emerald-400">R$ {totalItem.toFixed(2)}</span>
          </div>

          <div className="pt-2 flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-lg flex items-center gap-1.5"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar Lançamento</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
