import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Trash2, 
  CreditCard, 
  QrCode, 
  Banknote, 
  UserCheck, 
  Package, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Minus
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type Produto = Database['public']['Tables']['produtos_servicos']['Row'];
type Funcionario = Database['public']['Tables']['funcionarios']['Row'];

interface CartItem {
  produto: Produto;
  quantidade: number;
}

export const PosBalcaoView: React.FC = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [carrinho, setCarrinho] = useState<CartItem[]>([]);
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todos');
  const [formaPagamento, setFormaPagamento] = useState<Database['public']['Enums']['forma_pagamento']>('dinheiro');
  const [tipoVenda, setTipoVenda] = useState<'cliente_avulso' | 'vale_funcionario'>('cliente_avulso');
  const [funcionarioSelecionadoId, setFuncionarioSelecionadoId] = useState<string>('');
  const [clienteAvulsoNome, setClienteAvulsoNome] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  // Carrega produtos e funcionários do Supabase
  const carregarDados = async () => {
    const { data: prods } = await supabase
      .from('produtos_servicos')
      .select('*')
      .order('nome');
    if (prods) setProdutos(prods);

    const { data: funcs } = await supabase
      .from('funcionarios')
      .select('*')
      .eq('status', 'ativo')
      .order('nome_completo');
    if (funcs) setFuncionarios(funcs);
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Adicionar ao carrinho
  const adicionarAoCarrinho = (produto: Produto) => {
    setCarrinho(prev => {
      const index = prev.findIndex(item => item.produto.id === produto.id);
      if (index >= 0) {
        const novo = [...prev];
        novo[index].quantidade += 1;
        return novo;
      }
      return [...prev, { produto, quantidade: 1 }];
    });
  };

  const alterarQuantidade = (produtoId: string, delta: number) => {
    setCarrinho(prev => {
      return prev
        .map(item => {
          if (item.produto.id === produtoId) {
            const novaQtd = item.quantidade + delta;
            return novaQtd > 0 ? { ...item, quantidade: novaQtd } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removerDoCarrinho = (produtoId: string) => {
    setCarrinho(prev => prev.filter(item => item.produto.id !== produtoId));
  };

  const totalVenda = carrinho.reduce((acc, item) => acc + (Number(item.produto.preco_venda) * item.quantidade), 0);
  const funcionarioAtivo = funcionarios.find(f => f.id === funcionarioSelecionadoId);

  // Finalizar Venda no Supabase (com trigger de baixa de estoque e vale)
  const finalizarVenda = async () => {
    if (carrinho.length === 0) return;
    if (tipoVenda === 'vale_funcionario' && !funcionarioSelecionadoId) {
      alert('Por favor, selecione o colaborador para debitar o vale.');
      return;
    }

    setLoading(true);
    try {
      const codigoVenda = `VB-${Date.now().toString().slice(-6)}`;

      // 1. Cria a venda de balcão
      const { data: vendaCriada, error: erroVenda } = await supabase
        .from('vendas_balcao')
        .insert({
          codigo_venda: codigoVenda,
          tipo_venda: tipoVenda,
          funcionario_id: tipoVenda === 'vale_funcionario' ? funcionarioSelecionadoId : null,
          cliente_nome_avulso: tipoVenda === 'cliente_avulso' ? (clienteAvulsoNome || 'Cliente Balcão') : null,
          valor_total_bruto: totalVenda,
          valor_total_liquido: totalVenda,
          forma_pagamento: tipoVenda === 'vale_funcionario' ? 'vale_folha' : formaPagamento,
        })
        .select()
        .single();

      if (erroVenda || !vendaCriada) throw erroVenda;

      // 2. Insere os itens da venda (o trigger do PostgreSQL dará baixa no estoque e gerará o vale automaticamente!)
      const itensInsert = carrinho.map(item => ({
        venda_balcao_id: vendaCriada.id,
        produto_id: item.produto.id,
        quantidade: item.quantidade,
        preco_unitario: Number(item.produto.preco_venda),
        preco_custo_unitario: Number(item.produto.preco_custo),
        valor_total: Number(item.produto.preco_venda) * item.quantidade
      }));

      const { error: erroItens } = await supabase
        .from('itens_venda_balcao')
        .insert(itensInsert);

      if (erroItens) throw erroItens;

      // Sucesso!
      const msg = tipoVenda === 'vale_funcionario'
        ? `Vale de R$ ${totalVenda.toFixed(2)} lançado com sucesso para ${funcionarioAtivo?.nome_completo}! Estoque baixado.`
        : `Venda de R$ ${totalVenda.toFixed(2)} concluída com sucesso! Estoque baixado.`;

      setMensagemSucesso(msg);
      setCarrinho([]);
      setClienteAvulsoNome('');
      setFuncionarioSelecionadoId('');
      setTipoVenda('cliente_avulso');
      carregarDados(); // Recarrega os estoques atualizados

      setTimeout(() => setMensagemSucesso(null), 5000);
    } catch (err: any) {
      console.error('Erro ao finalizar venda:', err);
      alert('Erro ao processar venda: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const produtosFiltrados = produtos.filter(p => {
    if (busca && !p.nome.toLowerCase().includes(busca.toLowerCase())) return false;
    if (categoriaFiltro !== 'todos' && p.categoria_produto !== categoriaFiltro) return false;
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-800">
      {/* Banner de Sucesso */}
      {mensagemSucesso && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-[#107c41] flex items-center gap-3 animate-fade-in shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-[#107c41] shrink-0" />
          <span className="font-semibold text-sm">{mensagemSucesso}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Catálogo de Produtos (2 Colunas) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar produto por nome..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#107c41]"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                className="text-xs bg-white border border-slate-300 text-slate-700 rounded-lg px-3 py-2 outline-none focus:border-[#107c41] font-medium"
              >
                <option value="todos">Todas Categorias</option>
                <option value="frigobar">Frigobar</option>
                <option value="conveniencia">Conveniência</option>
                <option value="bar_restaurante">Bar & Bebidas</option>
              </select>
            </div>
          </div>

          {/* Grid de Produtos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {produtosFiltrados.map((prod) => (
              <div
                key={prod.id}
                onClick={() => adicionarAoCarrinho(prod)}
                className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between shadow-2xs"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-500 px-1.5 py-0.5 rounded bg-slate-100">
                      {prod.categoria_produto}
                    </span>
                    <span className={`text-[11px] font-bold ${prod.estoque_atual > 5 ? 'text-[#107c41]' : 'text-amber-700'}`}>
                      {prod.estoque_atual} un
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-800 mt-2 group-hover:text-[#107c41] transition-colors line-clamp-2">
                    {prod.nome}
                  </h3>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-base font-black text-[#107c41]">
                    R$ {Number(prod.preco_venda).toFixed(2)}
                  </span>
                  <button className="p-1.5 rounded-lg bg-emerald-50 text-[#107c41] group-hover:bg-[#107c41] group-hover:text-white transition-all">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carrinho & Checkout PDV (1 Coluna) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-fit sticky top-20">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#107c41]" />
                Comanda de Balcão
              </h2>
              {carrinho.length > 0 && (
                <button
                  onClick={() => setCarrinho([])}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Limpar
                </button>
              )}
            </div>

            {/* Alternância: Venda Avulsa vs Vale Funcionário */}
            <div className="mb-4 p-1 bg-slate-100 rounded-lg border border-slate-200 flex text-xs">
              <button
                onClick={() => setTipoVenda('cliente_avulso')}
                className={`flex-1 py-1.5 rounded-md font-bold transition-all ${
                  tipoVenda === 'cliente_avulso' ? 'bg-white text-[#107c41] shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Venda Balcão
              </button>
              <button
                onClick={() => setTipoVenda('vale_funcionario')}
                className={`flex-1 py-1.5 rounded-md font-bold transition-all ${
                  tipoVenda === 'vale_funcionario' ? 'bg-white text-amber-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Vale Funcionário
              </button>
            </div>

            {/* Seletor de Funcionário para Vale */}
            {tipoVenda === 'vale_funcionario' && (
              <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 space-y-2">
                <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                  Selecione o Colaborador:
                </label>
                <select
                  value={funcionarioSelecionadoId}
                  onChange={(e) => setFuncionarioSelecionadoId(e.target.value)}
                  className="w-full text-xs bg-white border border-amber-300 text-slate-800 rounded-lg p-2 outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                >
                  <option value="">Selecione o funcionário...</option>
                  {funcionarios.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.nome_completo} ({f.cargo})
                    </option>
                  ))}
                </select>

                {funcionarioAtivo && (
                  <div className="text-[11px] text-slate-600 flex items-center justify-between pt-1 border-t border-amber-200">
                    <span>Limite mensal de vales:</span>
                    <strong className="text-amber-800 font-bold">R$ {Number(funcionarioAtivo.limite_mensal_vales).toFixed(2)}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Itens do Carrinho */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {carrinho.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs font-medium">
                  Nenhum produto adicionado à comanda.
                </div>
              ) : (
                carrinho.map(item => (
                  <div
                    key={item.produto.id}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                  >
                    <div className="truncate mr-2">
                      <p className="font-semibold text-slate-800 truncate">{item.produto.nome}</p>
                      <p className="text-[11px] text-slate-500">
                        R$ {Number(item.produto.preco_venda).toFixed(2)} cada
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-white rounded border border-slate-300">
                        <button
                          onClick={() => alterarQuantidade(item.produto.id, -1)}
                          className="p-1 hover:text-slate-900 text-slate-500"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-bold text-slate-800">
                          {item.quantidade}
                        </span>
                        <button
                          onClick={() => alterarQuantidade(item.produto.id, 1)}
                          className="p-1 hover:text-slate-900 text-slate-500"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-bold text-slate-900 w-14 text-right">
                        R$ {(Number(item.produto.preco_venda) * item.quantidade).toFixed(2)}
                      </span>

                      <button
                        onClick={() => removerDoCarrinho(item.produto.id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Rodapé e Fechamento */}
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-500 font-medium">Total da Venda:</span>
              <span className="text-2xl font-black text-[#107c41]">
                R$ {totalVenda.toFixed(2)}
              </span>
            </div>

            {/* Formas de pagamento se for venda normal */}
            {tipoVenda === 'cliente_avulso' && (
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setFormaPagamento('dinheiro')}
                  className={`p-2 rounded-lg border flex flex-col items-center gap-1 font-semibold transition-all ${
                    formaPagamento === 'dinheiro'
                      ? 'bg-emerald-50 border-emerald-400 text-[#107c41]'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Banknote className="w-4 h-4" /> Dinheiro
                </button>
                <button
                  type="button"
                  onClick={() => setFormaPagamento('pix')}
                  className={`p-2 rounded-lg border flex flex-col items-center gap-1 font-semibold transition-all ${
                    formaPagamento === 'pix'
                      ? 'bg-emerald-50 border-emerald-400 text-[#107c41]'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <QrCode className="w-4 h-4" /> Pix
                </button>
                <button
                  type="button"
                  onClick={() => setFormaPagamento('cartao_credito_vista')}
                  className={`p-2 rounded-lg border flex flex-col items-center gap-1 font-semibold transition-all ${
                    formaPagamento.startsWith('cartao')
                      ? 'bg-emerald-50 border-emerald-400 text-[#107c41]'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-4 h-4" /> Cartão
                </button>
              </div>
            )}

            <button
              onClick={finalizarVenda}
              disabled={loading || carrinho.length === 0}
              className={`w-full py-3 rounded-lg font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 ${
                carrinho.length === 0
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : tipoVenda === 'vale_funcionario'
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-[#107c41] hover:bg-[#0e6d39] text-white'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {tipoVenda === 'vale_funcionario' ? 'Confirmar e Debitar Vale' : 'Finalizar Venda'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
