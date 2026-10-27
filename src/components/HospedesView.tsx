import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Car, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  Edit2, 
  CheckCircle2, 
  AlertCircle, 
  Bed, 
  MessageCircle,
  ExternalLink,
  Briefcase,
  Flag,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';
import { 
  validarCPF, 
  validarTelefone, 
  formatarCpfCnpj, 
  formatarTelefone, 
  formatarCep, 
  apenasDigitos 
} from '../utils/validators';

type Hospede = Database['public']['Tables']['hospedes']['Row'];

interface HospedesViewProps {
  onNovaReservaParaHospede?: (hospede: Hospede) => void;
}

export const HospedesView: React.FC<HospedesViewProps> = ({ onNovaReservaParaHospede }) => {
  const [hospedes, setHospedes] = useState<Hospede[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [hospedeEditando, setHospedeEditando] = useState<Hospede | null>(null);

  // Campos do Formulário Completo FNRH
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [cpf, setCpf] = useState('');
  const [documentoTipo, setDocumentoTipo] = useState('RG');
  const [documentoNumero, setDocumentoNumero] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [nacionalidade, setNacionalidade] = useState('Brasileira');
  const [profissao, setProfissao] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [placaVeiculo, setPlacaVeiculo] = useState('');
  const [modeloVeiculo, setModeloVeiculo] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const [buscandoCep, setBuscandoCep] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  // Carregar Hóspedes
  const carregarHospedes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('hospedes')
      .select('*')
      .order('nome_completo', { ascending: true });

    if (data) {
      setHospedes(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    carregarHospedes();

    const channel = supabase
      .channel('hospedes_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hospedes' }, () => {
        carregarHospedes();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Busca de CEP automática via ViaCEP
  const buscarEnderecoPorCep = async (cepVal: string) => {
    const limpo = apenasDigitos(cepVal);
    if (limpo.length !== 8) return;

    setBuscandoCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setLogradouro(data.logradouro || '');
        setBairro(data.bairro || '');
        setCidade(data.localidade || '');
        setUf(data.uf || '');
      }
    } catch (err) {
      console.error('Erro ao consultar ViaCEP:', err);
    } finally {
      setBuscandoCep(false);
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatado = formatarCep(e.target.value);
    setCep(formatado);
    if (apenasDigitos(formatado).length === 8) {
      buscarEnderecoPorCep(formatado);
    }
  };

  const abrirNovoCadastro = () => {
    setHospedeEditando(null);
    setNomeCompleto('');
    setCpf('');
    setDocumentoTipo('RG');
    setDocumentoNumero('');
    setDataNascimento('');
    setNacionalidade('Brasileira');
    setProfissao('');
    setTelefone('');
    setEmail('');
    setCep('');
    setLogradouro('');
    setNumero('');
    setComplemento('');
    setBairro('');
    setCidade('Maringá');
    setUf('PR');
    setPlacaVeiculo('');
    setModeloVeiculo('');
    setObservacoes('');
    setErroForm(null);
    setModalAberto(true);
  };

  const abrirEdicao = (hosp: Hospede) => {
    setHospedeEditando(hosp);
    setNomeCompleto(hosp.nome_completo);
    setCpf(hosp.cpf_cnpj ? formatarCpfCnpj(hosp.cpf_cnpj) : '');
    setDocumentoTipo(hosp.documento_tipo || 'RG');
    setDocumentoNumero(hosp.documento_numero || '');
    setDataNascimento(hosp.data_nascimento || '');
    setNacionalidade(hosp.nacionalidade || 'Brasileira');
    setProfissao(hosp.profissao || '');
    setTelefone(hosp.telefone_whatsapp ? formatarTelefone(hosp.telefone_whatsapp) : '');
    setEmail(hosp.email || '');

    const end = (hosp.endereco_completo as any) || {};
    setCep(end.cep ? formatarCep(end.cep) : '');
    setLogradouro(end.logradouro || '');
    setNumero(end.numero || '');
    setComplemento(end.complemento || '');
    setBairro(end.bairro || '');
    setCidade(end.cidade || '');
    setUf(end.uf || '');

    setPlacaVeiculo(hosp.placa_veiculo || '');
    setModeloVeiculo(hosp.modelo_veiculo || '');
    setObservacoes(hosp.observacoes_preferencias || '');
    setErroForm(null);
    setModalAberto(true);
  };

  const salvarHospede = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroForm(null);

    if (!nomeCompleto.trim()) {
      setErroForm('O Nome Completo do hóspede é obrigatório.');
      return;
    }

    const cpfLimpo = apenasDigitos(cpf);
    if (!cpfLimpo) {
      setErroForm('O CPF do hóspede é OBRIGATÓRIO.');
      return;
    }
    if (!validarCPF(cpfLimpo)) {
      setErroForm('CPF inválido. Verifique os números digitados.');
      return;
    }

    const telLimpo = apenasDigitos(telefone);
    if (!telLimpo) {
      setErroForm('O Telefone / WhatsApp é OBRIGATÓRIO.');
      return;
    }
    if (!validarTelefone(telLimpo)) {
      setErroForm('Telefone inválido. Digite DDD + número com 10 ou 11 dígitos.');
      return;
    }

    setSalvando(true);
    try {
      const cpfFormatado = formatarCpfCnpj(cpfLimpo);
      const telFormatado = formatarTelefone(telLimpo);

      // Checa duplicidade de CPF
      const { data: cpfExiste } = await supabase
        .from('hospedes')
        .select('id, nome_completo')
        .eq('cpf_cnpj', cpfFormatado)
        .neq('id', hospedeEditando?.id || '00000000-0000-0000-0000-000000000000')
        .maybeSingle();

      if (cpfExiste) {
        throw new Error(`Este CPF já está cadastrado para o hóspede "${cpfExiste.nome_completo}".`);
      }

      // Checa duplicidade de Telefone
      const { data: telExiste } = await supabase
        .from('hospedes')
        .select('id, nome_completo')
        .eq('telefone_whatsapp', telFormatado)
        .neq('id', hospedeEditando?.id || '00000000-0000-0000-0000-000000000000')
        .maybeSingle();

      if (telExiste) {
        throw new Error(`Este telefone já está cadastrado para "${telExiste.nome_completo}".`);
      }

      const dados = {
        nome_completo: nomeCompleto.trim().toUpperCase(),
        cpf_cnpj: cpfFormatado,
        documento_tipo: documentoTipo,
        documento_numero: documentoNumero.trim() || null,
        data_nascimento: dataNascimento || null,
        nacionalidade: nacionalidade.trim() || 'Brasileira',
        profissao: profissao.trim() || null,
        telefone_whatsapp: telFormatado,
        email: email.trim().toLowerCase() || null,
        endereco_completo: {
          cep: apenasDigitos(cep),
          logradouro: logradouro.trim(),
          numero: numero.trim(),
          complemento: complemento.trim(),
          bairro: bairro.trim(),
          cidade: cidade.trim(),
          uf: uf.trim().toUpperCase()
        },
        placa_veiculo: placaVeiculo ? placaVeiculo.toUpperCase().trim() : null,
        modelo_veiculo: modeloVeiculo.trim() || null,
        observacoes_preferencias: observacoes.trim() || null
      };

      if (hospedeEditando) {
        const { error } = await supabase
          .from('hospedes')
          .update(dados)
          .eq('id', hospedeEditando.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('hospedes')
          .insert(dados);
        if (error) throw error;
      }

      setModalAberto(false);
      carregarHospedes();
    } catch (err: any) {
      setErroForm(err.message || 'Erro ao salvar cadastro do hóspede.');
    } finally {
      setSalvando(false);
    }
  };

  // Filtragem
  const hospedesFiltrados = hospedes.filter(h => {
    const t = busca.toLowerCase();
    const end = (h.endereco_completo as any) || {};
    return (
      h.nome_completo.toLowerCase().includes(t) ||
      (h.cpf_cnpj && h.cpf_cnpj.includes(t)) ||
      (h.telefone_whatsapp && h.telefone_whatsapp.includes(t)) ||
      (h.placa_veiculo && h.placa_veiculo.toLowerCase().includes(t)) ||
      (end.cidade && end.cidade.toLowerCase().includes(t))
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. Header com Métricas e Botão de Cadastro */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#107c41] flex items-center justify-center font-bold">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">Cadastro de Hóspedes & FNRH</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Ficha Nacional de Registro de Hóspedes, documentos, histórico, veículos e prevenção de duplicidades.
            </p>
          </div>
        </div>

        <button
          onClick={abrirNovoCadastro}
          className="flex items-center gap-2 bg-[#107c41] hover:bg-[#0e6d39] text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Hóspede (FNRH Completa)</span>
        </button>
      </div>

      {/* 2. Barra de Busca Rápida */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por Nome, CPF, WhatsApp, Placa ou Cidade..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#107c41] focus:ring-1 focus:ring-[#107c41]"
          />
        </div>

        <span className="text-xs text-slate-500 font-semibold">
          {hospedesFiltrados.length} {hospedesFiltrados.length === 1 ? 'hóspede localizado' : 'hóspedes localizados'}
        </span>
      </div>

      {/* 3. Grid de Cards de Hóspedes */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-bold text-xs">
          Carregando cadastro de hóspedes...
        </div>
      ) : hospedesFiltrados.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-base">Nenhum hóspede encontrado</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Não localizamos hóspedes com os critérios digitados. Clique no botão acima para cadastrar um novo hóspede.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {hospedesFiltrados.map((hosp) => {
            const end = (hosp.endereco_completo as any) || {};
            const telLimpo = apenasDigitos(hosp.telefone_whatsapp);

            return (
              <div
                key={hosp.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
              >
                {/* Topo do Card */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#107c41] font-black text-sm flex items-center justify-center border border-emerald-100">
                        {hosp.nome_completo.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-sm text-slate-900 leading-snug line-clamp-1" title={hosp.nome_completo}>
                          {hosp.nome_completo}
                        </h3>
                        <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          CPF: {hosp.cpf_cnpj ? formatarCpfCnpj(hosp.cpf_cnpj) : 'Não informado'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dados de Contato e Documentação */}
                <div className="space-y-2 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  {hosp.telefone_whatsapp && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-bold text-slate-800">{formatarTelefone(hosp.telefone_whatsapp)}</span>
                      </div>
                      {telLimpo && (
                        <a
                          href={`https://wa.me/55${telLimpo}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-bold text-[#107c41] hover:underline flex items-center gap-1"
                          title="Abrir conversa no WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>
                  )}

                  {hosp.email && (
                    <div className="flex items-center gap-2 truncate" title={hosp.email}>
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{hosp.email}</span>
                    </div>
                  )}

                  {hosp.documento_numero && (
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{hosp.documento_tipo || 'Doc'}: {hosp.documento_numero}</span>
                    </div>
                  )}

                  {end.cidade && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{end.cidade} - {end.uf}</span>
                    </div>
                  )}

                  {hosp.placa_veiculo && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-700 font-mono font-semibold pt-1 border-t border-slate-200/60">
                      <Car className="w-3.5 h-3.5 text-[#107c41] shrink-0" />
                      <span>Placa: {hosp.placa_veiculo}</span>
                      {hosp.modelo_veiculo && <span className="text-slate-400 font-sans">({hosp.modelo_veiculo})</span>}
                    </div>
                  )}
                </div>

                {/* Botões de Ação */}
                <div className="pt-1 flex items-center justify-between gap-2">
                  <button
                    onClick={() => abrirEdicao(hosp)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar FNRH</span>
                  </button>

                  {onNovaReservaParaHospede && (
                    <button
                      onClick={() => onNovaReservaParaHospede(hosp)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#107c41] hover:bg-[#0e6d39] text-white font-bold text-xs transition-colors shadow-xs"
                    >
                      <Bed className="w-3.5 h-3.5" />
                      <span>Nova Reserva</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Modal de Cadastro Completo FNRH */}
      {modalAberto && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-200 my-8 overflow-hidden text-slate-800">
            {/* Topo do Modal */}
            <div className="bg-[#107c41] px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-5 h-5 text-emerald-200" />
                <div>
                  <h2 className="font-bold text-base">
                    {hospedeEditando ? 'Editar FNRH do Hóspede' : 'Ficha Nacional de Registro de Hóspedes (FNRH)'}
                  </h2>
                  <p className="text-[11px] text-emerald-100">Cadastro completo com documentos, endereço e preferências.</p>
                </div>
              </div>
              <button
                onClick={() => setModalAberto(false)}
                className="text-white/80 hover:text-white font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Formulário FNRH */}
            <form onSubmit={salvarHospede} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-xs">
              {erroForm && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{erroForm}</span>
                </div>
              )}

              {/* Seção 1: Identificação Pessoal e Documentação */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#107c41]" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    1. Identificação Pessoal & Documentos
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nome Completo do Hóspede * (Obrigatório)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Eduardo de Oliveira"
                      value={nomeCompleto}
                      onChange={(e) => setNomeCompleto(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-[#107c41]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      CPF * (Obrigatório)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="000.000.000-00"
                      value={cpf}
                      onChange={(e) => setCpf(formatarCpfCnpj(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#107c41]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de Documento</label>
                    <select
                      value={documentoTipo}
                      onChange={(e) => setDocumentoTipo(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#107c41]"
                    >
                      <option value="RG">RG</option>
                      <option value="CNH">CNH</option>
                      <option value="PASSAPORTE">Passaporte</option>
                      <option value="OUTRO">Outro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Número do Documento</label>
                    <input
                      type="text"
                      placeholder="Ex: 12.345.678-9 SSP"
                      value={documentoNumero}
                      onChange={(e) => setDocumentoNumero(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#107c41]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Data de Nascimento</label>
                    <input
                      type="date"
                      value={dataNascimento}
                      onChange={(e) => setDataNascimento(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#107c41]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nacionalidade</label>
                    <input
                      type="text"
                      placeholder="Brasileira"
                      value={nacionalidade}
                      onChange={(e) => setNacionalidade(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#107c41]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Profissão / Ocupação</label>
                    <input
                      type="text"
                      placeholder="Ex: Engenheiro Civil, Representante Comercial..."
                      value={profissao}
                      onChange={(e) => setProfissao(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#107c41]"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 2: Contatos */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
                  <Phone className="w-4 h-4 text-[#107c41]" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    2. Contatos & Comunicação
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      WhatsApp / Celular * (Obrigatório)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="(44) 99999-0000"
                      value={telefone}
                      onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-[#107c41]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      E-mail Pessoal / Faturamento
                    </label>
                    <input
                      type="email"
                      placeholder="hospede@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#107c41]"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 3: Endereço Residencial Permanente (FNRH) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#107c41]" />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                      3. Endereço Residencial Permanente (FNRH)
                    </h3>
                  </div>
                  {buscandoCep && (
                    <span className="text-[10px] text-emerald-600 font-bold animate-pulse">
                      Consultando ViaCEP...
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">CEP</label>
                    <input
                      type="text"
                      placeholder="87000-000"
                      value={cep}
                      onChange={handleCepChange}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:border-[#107c41]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Logradouro (Rua/Av)</label>
                    <input
                      type="text"
                      placeholder="Rua das Palmeiras"
                      value={logradouro}
                      onChange={(e) => setLogradouro(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#107c41]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Número</label>
                    <input
                      type="text"
                      placeholder="123"
                      value={numero}
                      onChange={(e) => setNumero(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#107c41]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Complemento / Apto</label>
                    <input
                      type="text"
                      placeholder="Apto 402 Bloco B"
                      value={complemento}
                      onChange={(e) => setComplemento(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#107c41]"
                    />
                  </div>

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

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
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
              </div>

              {/* Seção 4: Veículo & Estacionamento */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
                  <Car className="w-4 h-4 text-[#107c41]" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    4. Veículo & Estacionamento do Hotel
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Placa do Veículo</label>
                    <input
                      type="text"
                      placeholder="ABC-1234 ou ABC1D23"
                      maxLength={8}
                      value={placaVeiculo}
                      onChange={(e) => setPlacaVeiculo(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono uppercase font-bold text-slate-800 focus:outline-none focus:border-[#107c41]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Modelo / Cor</label>
                    <input
                      type="text"
                      placeholder="Ex: Toyota Hilux Prata, Onix Preto..."
                      value={modeloVeiculo}
                      onChange={(e) => setModeloVeiculo(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#107c41]"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 5: Observações & Preferências */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600">
                  Preferências de Acomodação, Restrições ou Notas Internas
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Hóspede prefere quarto silencioso nos fundos; alérgico a penas..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#107c41]"
                />
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
                      <span>{hospedeEditando ? 'Salvar Alterações FNRH' : 'Confirmar Cadastro Completo'}</span>
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
