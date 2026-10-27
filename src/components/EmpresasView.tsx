import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  FileText, 
  CreditCard, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ExternalLink,
  Edit2,
  Trash2,
  ShieldCheck,
  Building
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';
import { 
  validarCNPJ, 
  formatarCpfCnpj, 
  formatarTelefone, 
  formatarCep, 
  apenasDigitos 
} from '../utils/validators';

type Empresa = Database['public']['Tables']['empresas_conveniadas']['Row'];

interface EmpresasViewProps {
  onNovaReservaParaEmpresa?: (empresaId: string) => void;
}

export const EmpresasView: React.FC<EmpresasViewProps> = ({ onNovaReservaParaEmpresa }) => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroFormaPagto, setFiltroFormaPagto] = useState<string>('todos');
  const [modalAberto, setModalAberto] = useState(false);
  const [empresaEditando, setEmpresaEditando] = useState<Empresa | null>(null);

  // Formulário Modal de Empresa
  const [cnpj, setCnpj] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [inscricaoEstadual, setInscricaoEstadual] = useState('');
  const [inscricaoMunicipal, setInscricaoMunicipal] = useState('');
  const [cnaePrincipal, setCnaePrincipal] = useState('');
  const [situacaoCadastral, setSituacaoCadastral] = useState('ATIVA');
  const [dataAbertura, setDataAbertura] = useState('');
  const [telefoneComercial, setTelefoneComercial] = useState('');
  const [emailFinanceiro, setEmailFinanceiro] = useState('');
  const [contatoResponsavel, setContatoResponsavel] = useState('');
  const [telefoneResponsavel, setTelefoneResponsavel] = useState('');
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [formasPagamento, setFormasPagamento] = useState<string[]>(['faturado_boleto_30d']);
  const [limiteCredito, setLimiteCredito] = useState('10000');
  const [prazoFaturamento, setPrazoFaturamento] = useState('30');
  const [observacoes, setObservacoes] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  // Carregar Empresas
  const carregarEmpresas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('empresas_conveniadas')
      .select('*')
      .order('razao_social', { ascending: true });

    if (data) {
      setEmpresas(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    carregarEmpresas();

    const channel = supabase
      .channel('empresas_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'empresas_conveniadas' }, () => {
        carregarEmpresas();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const abrirNovoCadastro = () => {
    setEmpresaEditando(null);
    setCnpj('');
    setRazaoSocial('');
    setNomeFantasia('');
    setInscricaoEstadual('');
    setInscricaoMunicipal('');
    setCnaePrincipal('');
    setSituacaoCadastral('ATIVA');
    setDataAbertura('');
    setTelefoneComercial('');
    setEmailFinanceiro('');
    setContatoResponsavel('');
    setTelefoneResponsavel('');
    setCep('');
    setLogradouro('');
    setNumero('');
    setComplemento('');
    setBairro('');
    setCidade('Maringá');
    setUf('PR');
    setFormasPagamento(['faturado_boleto_30d']);
    setLimiteCredito('10000');
    setPrazoFaturamento('30');
    setObservacoes('');
    setErroForm(null);
    setModalAberto(true);
  };

  const abrirEdicao = (emp: Empresa) => {
    setEmpresaEditando(emp);
    setCnpj(formatarCpfCnpj(emp.cnpj));
    setRazaoSocial(emp.razao_social);
    setNomeFantasia(emp.nome_fantasia || '');
    setInscricaoEstadual(emp.inscricao_estadual || '');
    setInscricaoMunicipal(emp.inscricao_municipal || '');
    setCnaePrincipal(emp.cnae_principal || '');
    setSituacaoCadastral(emp.situacao_cadastral || 'ATIVA');
    setDataAbertura(emp.data_abertura || '');
    setTelefoneComercial(formatarTelefone(emp.telefone_comercial));
    setEmailFinanceiro(emp.email_financeiro_faturamento);
    setContatoResponsavel(emp.contato_responsavel || '');
    setTelefoneResponsavel(emp.telefone_responsavel ? formatarTelefone(emp.telefone_responsavel) : '');
    
    const end = (emp.endereco_completo as any) || {};
    setCep(end.cep ? formatarCep(end.cep) : '');
    setLogradouro(end.logradouro || '');
    setNumero(end.numero || '');
    setComplemento(end.complemento || '');
    setBairro(end.bairro || '');
    setCidade(end.cidade || '');
    setUf(end.uf || '');

    setFormasPagamento(emp.formas_pagamento_aceitas || ['faturado_boleto_30d']);
    setLimiteCredito(String(emp.limite_credito || 10000));
    setPrazoFaturamento(String(emp.dias_prazo_faturamento || 30));
    setObservacoes(emp.observacoes_faturamento || '');
    setErroForm(null);
    setModalAberto(true);
  };

  const toggleFormaPagamento = (forma: string) => {
    setFormasPagamento(prev => 
      prev.includes(forma) ? prev.filter(f => f !== forma) : [...prev, forma]
    );
  };

  const salvarEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroForm(null);

    // Validações Obrigatórias
    const cnpjLimpo = apenasDigitos(cnpj);
    if (!validarCNPJ(cnpjLimpo)) {
      setErroForm('CNPJ inválido. Verifique os números digitados.');
      return;
    }

    if (!razaoSocial.trim()) {
      setErroForm('A Razão Social é obrigatória.');
      return;
    }

    const telLimpo = apenasDigitos(telefoneComercial);
    if (telLimpo.length < 10) {
      setErroForm('Telefone comercial inválido. Digite DDD + número.');
      return;
    }

    if (!emailFinanceiro.trim() || !emailFinanceiro.includes('@')) {
      setErroForm('E-mail financeiro para faturamento e NF-e inválido.');
      return;
    }

    if (formasPagamento.length === 0) {
      setErroForm('Selecione pelo menos uma forma de pagamento cadastrada.');
      return;
    }

    setSalvando(true);

    try {
      // 1. Checa duplicidade de CNPJ no Supabase
      const { data: cnpjExistente } = await supabase
        .from('empresas_conveniadas')
        .select('id, razao_social')
        .eq('cnpj', formatarCpfCnpj(cnpjLimpo))
        .neq('id', empresaEditando?.id || '00000000-0000-0000-0000-000000000000')
        .maybeSingle();

      if (cnpjExistente) {
        throw new Error(`CNPJ já cadastrado para a empresa "${cnpjExistente.razao_social}".`);
      }

      // 2. Checa duplicidade de Telefone Comercial
      const { data: telExistente } = await supabase
        .from('empresas_conveniadas')
        .select('id, razao_social')
        .eq('telefone_comercial', formatarTelefone(telefoneComercial))
        .neq('id', empresaEditando?.id || '00000000-0000-0000-0000-000000000000')
        .maybeSingle();

      if (telExistente) {
        throw new Error(`Este telefone comercial já está cadastrado para "${telExistente.razao_social}".`);
      }

      const dadosEmpresa = {
        cnpj: formatarCpfCnpj(cnpjLimpo),
        razao_social: razaoSocial.trim().toUpperCase(),
        nome_fantasia: nomeFantasia.trim() ? nomeFantasia.trim().toUpperCase() : null,
        inscricao_estadual: inscricaoEstadual.trim() || null,
        inscricao_municipal: inscricaoMunicipal.trim() || null,
        cnae_principal: cnaePrincipal.trim() || null,
        situacao_cadastral: situacaoCadastral,
        data_abertura: dataAbertura || null,
        telefone_comercial: formatarTelefone(telefoneComercial),
        email_financeiro_faturamento: emailFinanceiro.trim().toLowerCase(),
        contato_responsavel: contatoResponsavel.trim() || null,
        telefone_responsavel: telefoneResponsavel ? formatarTelefone(telefoneResponsavel) : null,
        endereco_completo: {
          cep: apenasDigitos(cep),
          logradouro: logradouro.trim(),
          numero: numero.trim(),
          complemento: complemento.trim(),
          bairro: bairro.trim(),
          cidade: cidade.trim(),
          uf: uf.trim().toUpperCase()
        },
        formas_pagamento_aceitas: formasPagamento,
        limite_credito: parseFloat(limiteCredito) || 0,
        dias_prazo_faturamento: parseInt(prazoFaturamento, 10) || 30,
        observacoes_faturamento: observacoes.trim() || null,
        ativo: true
      };

      if (empresaEditando) {
        const { error } = await supabase
          .from('empresas_conveniadas')
          .update(dadosEmpresa)
          .eq('id', empresaEditando.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('empresas_conveniadas')
          .insert(dadosEmpresa);
        if (error) throw error;
      }

      setModalAberto(false);
      carregarEmpresas();
    } catch (err: any) {
      setErroForm(err.message || 'Erro ao salvar empresa.');
    } finally {
      setSalvando(false);
    }
  };

  // Filtragem
  const empresasFiltradas = empresas.filter(emp => {
    const texto = busca.toLowerCase();
    const bateTexto = 
      emp.razao_social.toLowerCase().includes(texto) ||
      (emp.nome_fantasia && emp.nome_fantasia.toLowerCase().includes(texto)) ||
      emp.cnpj.includes(texto) ||
      emp.telefone_comercial.includes(texto);

    const bateForma = filtroFormaPagto === 'todos' || 
      (emp.formas_pagamento_aceitas && emp.formas_pagamento_aceitas.includes(filtroFormaPagto));

    return bateTexto && bateForma;
  });

  const getFormaLabel = (forma: string) => {
    switch (forma) {
      case 'faturado_boleto_30d': return 'Boleto 30 Dias';
      case 'faturado_boleto_15d': return 'Boleto 15 Dias';
      case 'pix_faturado': return 'PIX Faturado';
      case 'cartao_credito_corporativo': return 'Cartão Corporativo';
      case 'deposito_antecipado': return 'Depósito Antecipado';
      default: return forma;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. Header com Métricas e Botão de Cadastro */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#107c41] flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">Empresas & Convênios Corporativos</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestão de clientes PJ, dados do Cartão CNPJ, faturamento e formas de pagamento cadastradas.
            </p>
          </div>
        </div>

        <button
          onClick={abrirNovoCadastro}
          className="flex items-center gap-2 bg-[#107c41] hover:bg-[#0e6d39] text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Empresa PJ</span>
        </button>
      </div>

      {/* 2. Barra de Busca e Filtros */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por Razão Social, Fantasia ou CNPJ..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#107c41] focus:ring-1 focus:ring-[#107c41]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Forma de Pagto:</span>
          <select
            value={filtroFormaPagto}
            onChange={(e) => setFiltroFormaPagto(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-[#107c41]"
          >
            <option value="todos">Todas as Formas</option>
            <option value="faturado_boleto_30d">Boleto 30 Dias</option>
            <option value="faturado_boleto_15d">Boleto 15 Dias</option>
            <option value="pix_faturado">PIX Faturado</option>
            <option value="cartao_credito_corporativo">Cartão Corporativo</option>
          </select>
        </div>
      </div>

      {/* 3. Grid de Cartões de Empresas Conveniadas */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-bold text-xs">
          Carregando empresas cadastradas...
        </div>
      ) : empresasFiltradas.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <Building className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-base">Nenhuma empresa encontrada</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Não há empresas conveniadas com os filtros aplicados. Clique no botão acima para cadastrar a primeira empresa.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {empresasFiltradas.map((emp) => {
            const end = (emp.endereco_completo as any) || {};

            return (
              <div
                key={emp.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4 relative"
              >
                {/* Cabeçalho do Card */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                      {emp.cnpj}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-[#107c41] border border-emerald-200">
                      {emp.situacao_cadastral || 'ATIVA'}
                    </span>
                  </div>

                  <h3 className="font-black text-sm text-slate-800 leading-snug line-clamp-1" title={emp.razao_social}>
                    {emp.razao_social}
                  </h3>
                  {emp.nome_fantasia && (
                    <p className="text-xs font-semibold text-[#107c41] truncate">
                      Fantasia: {emp.nome_fantasia}
                    </p>
                  )}
                </div>

                {/* Dados de Contato e Faturamento */}
                <div className="space-y-2 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 truncate">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-700">{emp.telefone_comercial}</span>
                  </div>

                  <div className="flex items-center gap-2 truncate" title={emp.email_financeiro_faturamento}>
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{emp.email_financeiro_faturamento}</span>
                  </div>

                  {emp.contato_responsavel && (
                    <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                      <span className="font-bold text-slate-700">Responsável: </span>
                      {emp.contato_responsavel} {emp.telefone_responsavel ? `(${emp.telefone_responsavel})` : ''}
                    </div>
                  )}

                  {end.cidade && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{end.cidade} - {end.uf}</span>
                    </div>
                  )}
                </div>

                {/* Formas de Pagamento Cadastradas */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Formas de Pagamento Aceitas:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(emp.formas_pagamento_aceitas || []).map((forma, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-[#107c41] border border-emerald-200/80 flex items-center gap-1"
                      >
                        <CreditCard className="w-3 h-3" />
                        {getFormaLabel(forma)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Limite de Crédito e Prazo */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium">Prazo:</span>
                    <p className="font-bold text-slate-700">{emp.dias_prazo_faturamento || 30} dias</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-medium">Limite Aprovado:</span>
                    <p className="font-extrabold text-[#107c41]">
                      R$ {Number(emp.limite_credito || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="pt-1 flex items-center justify-between gap-2">
                  <button
                    onClick={() => abrirEdicao(emp)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar CNPJ</span>
                  </button>

                  {onNovaReservaParaEmpresa && (
                    <button
                      onClick={() => onNovaReservaParaEmpresa(emp.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#107c41] hover:bg-[#0e6d39] text-white font-bold text-xs transition-colors shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Nova Reserva</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Modal de Cadastro Completo do Cartão CNPJ */}
      {modalAberto && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-200 my-8 overflow-hidden text-slate-800">
            {/* Topo do Modal */}
            <div className="bg-[#107c41] px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-emerald-200" />
                <h2 className="font-bold text-base">
                  {empresaEditando ? 'Editar Empresa Conveniada' : 'Cadastrar Empresa Conveniada (Cartão CNPJ)'}
                </h2>
              </div>
              <button
                onClick={() => setModalAberto(false)}
                className="text-white/80 hover:text-white font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Conteúdo do Formulário */}
            <form onSubmit={salvarEmpresa} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {erroForm && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{erroForm}</span>
                </div>
              )}

              {/* Seção 1: Dados Oficiais do Cartão CNPJ */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#107c41]" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    1. Dados Oficiais do Cartão CNPJ
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      CNPJ * (Obrigatório)
                    </label>
                    <input
                      type="text"
                      placeholder="00.000.000/0000-00"
                      value={cnpj}
                      onChange={(e) => setCnpj(formatarCpfCnpj(e.target.value))}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-[#107c41]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Razão Social * (Nome Empresarial Oficial)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: METALURGICA DO PARANA LTDA"
                      value={razaoSocial}
                      onChange={(e) => setRazaoSocial(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-[#107c41]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Nome Fantasia
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: METALURGICA S/A"
                      value={nomeFantasia}
                      onChange={(e) => setNomeFantasia(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#107c41]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Inscrição Estadual (IE)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 90123456-78"
                      value={inscricaoEstadual}
                      onChange={(e) => setInscricaoEstadual(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#107c41]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Situação Cadastral
                    </label>
                    <select
                      value={situacaoCadastral}
                      onChange={(e) => setSituacaoCadastral(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#107c41]"
                    >
                      <option value="ATIVA">ATIVA</option>
                      <option value="SUSPENSA">SUSPENSA</option>
                      <option value="INAPTA">INAPTA</option>
                      <option value="BAIXADA">BAIXADA</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Seção 2: Endereço Fiscal do CNPJ */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
                  <MapPin className="w-4 h-4 text-[#107c41]" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    2. Endereço Fiscal do Cartão CNPJ
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">CEP</label>
                    <input
                      type="text"
                      placeholder="87000-000"
                      value={cep}
                      onChange={(e) => setCep(formatarCep(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:border-[#107c41]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Logradouro (Rua/Av)</label>
                    <input
                      type="text"
                      placeholder="Av. Brasil"
                      value={logradouro}
                      onChange={(e) => setLogradouro(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#107c41]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Número</label>
                    <input
                      type="text"
                      placeholder="1234"
                      value={numero}
                      onChange={(e) => setNumero(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#107c41]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Bairro</label>
                    <input
                      type="text"
                      placeholder="Centro"
                      value={bairro}
                      onChange={(e) => setBairro(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#107c41]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Cidade</label>
                    <input
                      type="text"
                      placeholder="Maringá"
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#107c41]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">UF</label>
                    <input
                      type="text"
                      placeholder="PR"
                      maxLength={2}
                      value={uf}
                      onChange={(e) => setUf(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-[#107c41]"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 3: Contatos e Faturamento (NF-e) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
                  <Mail className="w-4 h-4 text-[#107c41]" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    3. Contatos & Faturamento (NF-e e Boletos)
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Telefone / WhatsApp Comercial * (Obrigatório)
                    </label>
                    <input
                      type="text"
                      placeholder="(44) 3000-0000"
                      value={telefoneComercial}
                      onChange={(e) => setTelefoneComercial(formatarTelefone(e.target.value))}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-[#107c41]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      E-mail Financeiro para Envio de NF-e * (Obrigatório)
                    </label>
                    <input
                      type="email"
                      placeholder="financeiro@empresa.com.br"
                      value={emailFinanceiro}
                      onChange={(e) => setEmailFinanceiro(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#107c41]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Nome do Gestor de Contratos / RH
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Marcos Vinicios"
                      value={contatoResponsavel}
                      onChange={(e) => setContatoResponsavel(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#107c41]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Telefone Direto do Responsável
                    </label>
                    <input
                      type="text"
                      placeholder="(44) 99999-0000"
                      value={telefoneResponsavel}
                      onChange={(e) => setTelefoneResponsavel(formatarTelefone(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#107c41]"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 4: Formas de Pagamento Cadastradas e Limites */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
                  <CreditCard className="w-4 h-4 text-[#107c41]" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    4. Formas de Pagamento Cadastradas da Empresa
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label 
                    onClick={() => toggleFormaPagamento('faturado_boleto_30d')}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                      formasPagamento.includes('faturado_boleto_30d')
                        ? 'border-[#107c41] bg-emerald-50/50 text-[#107c41]'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formasPagamento.includes('faturado_boleto_30d')}
                      onChange={() => {}}
                      className="w-4 h-4 text-[#107c41] rounded"
                    />
                    <div>
                      <p className="font-bold text-xs">Faturado Boleto 30 Dias</p>
                      <p className="text-[10px] text-slate-500">Boleto bancário emitido após o checkout com vencimento em 30d</p>
                    </div>
                  </label>

                  <label 
                    onClick={() => toggleFormaPagamento('faturado_boleto_15d')}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                      formasPagamento.includes('faturado_boleto_15d')
                        ? 'border-[#107c41] bg-emerald-50/50 text-[#107c41]'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formasPagamento.includes('faturado_boleto_15d')}
                      onChange={() => {}}
                      className="w-4 h-4 text-[#107c41] rounded"
                    />
                    <div>
                      <p className="font-bold text-xs">Faturado Boleto 15 Dias</p>
                      <p className="text-[10px] text-slate-500">Boleto bancário quinzenal com vencimento em 15 dias</p>
                    </div>
                  </label>

                  <label 
                    onClick={() => toggleFormaPagamento('pix_faturado')}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                      formasPagamento.includes('pix_faturado')
                        ? 'border-[#107c41] bg-emerald-50/50 text-[#107c41]'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formasPagamento.includes('pix_faturado')}
                      onChange={() => {}}
                      className="w-4 h-4 text-[#107c41] rounded"
                    />
                    <div>
                      <p className="font-bold text-xs">PIX Faturado</p>
                      <p className="text-[10px] text-slate-500">Chave PIX da empresa para quitação periódica consolidada</p>
                    </div>
                  </label>

                  <label 
                    onClick={() => toggleFormaPagamento('cartao_credito_corporativo')}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                      formasPagamento.includes('cartao_credito_corporativo')
                        ? 'border-[#107c41] bg-emerald-50/50 text-[#107c41]'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formasPagamento.includes('cartao_credito_corporativo')}
                      onChange={() => {}}
                      className="w-4 h-4 text-[#107c41] rounded"
                    />
                    <div>
                      <p className="font-bold text-xs">Cartão de Crédito Corporativo</p>
                      <p className="text-[10px] text-slate-500">Cartão de crédito da empresa cadastrado para débito das diárias</p>
                    </div>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Limite de Crédito Aprovado (R$)
                    </label>
                    <input
                      type="number"
                      value={limiteCredito}
                      onChange={(e) => setLimiteCredito(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-[#107c41] focus:outline-none focus:border-[#107c41]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Prazo Padrão de Vencimento (Dias)
                    </label>
                    <input
                      type="number"
                      value={prazoFaturamento}
                      onChange={(e) => setPrazoFaturamento(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-[#107c41]"
                    />
                  </div>
                </div>
              </div>

              {/* Botões do Rodapé */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-6 py-2 bg-[#107c41] hover:bg-[#0e6d39] text-white rounded-lg font-bold text-xs transition-all shadow-sm flex items-center gap-2"
                >
                  {salvando ? (
                    <span>Salvando...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{empresaEditando ? 'Salvar Alterações' : 'Confirmar Cadastro'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
