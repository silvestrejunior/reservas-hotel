import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserCheck, 
  Calendar, 
  Bed, 
  Car, 
  CheckCircle2, 
  Building2, 
  User, 
  Phone, 
  CreditCard, 
  AlertCircle,
  FileCheck,
  ChevronDown,
  ChevronUp,
  MapPin,
  Mail,
  FileText,
  RotateCcw,
  Search,
  Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';
import { 
  validarCPF, 
  validarCNPJ, 
  validarTelefone, 
  formatarCpfCnpj, 
  formatarTelefone, 
  formatarCep,
  apenasDigitos 
} from '../utils/validators';

type Quarto = Database['public']['Tables']['quartos']['Row'] & {
  categoria?: Database['public']['Tables']['categorias_quarto']['Row'];
};

type Empresa = Database['public']['Tables']['empresas_conveniadas']['Row'];
type Hospede = Database['public']['Tables']['hospedes']['Row'];

interface NovaReservaModalProps {
  quartoPreSelecionado?: Quarto | null;
  quartosLivres: Quarto[];
  categorias: Database['public']['Tables']['categorias_quarto']['Row'][];
  empresaPreSelecionadaId?: string | null;
  hospedePreSelecionado?: Hospede | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const NovaReservaModal: React.FC<NovaReservaModalProps> = ({
  quartoPreSelecionado,
  quartosLivres,
  categorias,
  empresaPreSelecionadaId,
  hospedePreSelecionado,
  onClose,
  onSuccess
}) => {
  // Tipo da Reserva: Particular ou Empresa Corporativa
  const [tipoReserva, setTipoReserva] = useState<'particular' | 'empresa'>(
    empresaPreSelecionadaId ? 'empresa' : 'particular'
  );

  // Lista de empresas conveniadas
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaId, setEmpresaId] = useState<string>(empresaPreSelecionadaId || '');
  const [formaPagamentoReserva, setFormaPagamentoReserva] = useState<string>('balcao');

  // Dados do Quarto e Estadia
  const [quartoId, setQuartoId] = useState(quartoPreSelecionado?.id || (quartosLivres[0]?.id || ''));
  const [dataCheckin, setDataCheckin] = useState(new Date().toISOString().split('T')[0]);
  const [diasEstadia, setDiasEstadia] = useState('1');
  const [origem, setOrigem] = useState<Database['public']['Enums']['origem_reserva']>(
    empresaPreSelecionadaId ? 'empresa' : 'balcao'
  );
  const [isCheckinImediato, setIsCheckinImediato] = useState(true);

  // Dados do Hóspede (Pessoa Física ou Colaborador da Empresa)
  const [nomeHospede, setNomeHospede] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [placaVeiculo, setPlacaVeiculo] = useState('');

  // Dados Complementares (Ficha Completa FNRH)
  const [mostrarCadastroCompleto, setMostrarCadastroCompleto] = useState(false);
  const [documentoTipo, setDocumentoTipo] = useState('RG');
  const [documentoNumero, setDocumentoNumero] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [nacionalidade, setNacionalidade] = useState('Brasileira');
  const [profissao, setProfissao] = useState('');
  const [email, setEmail] = useState('');
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [modeloVeiculo, setModeloVeiculo] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Estados de Busca / Feedback
  const [hospedeExistenteId, setHospedeExistenteId] = useState<string | null>(null);
  const [hospedeLocalizado, setHospedeLocalizado] = useState<Hospede | null>(null);
  const [mensagemLocalizado, setMensagemLocalizado] = useState<string | null>(null);
  const [buscandoHospede, setBuscandoHospede] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);

  const [loading, setLoading] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  // Carregar Empresas Conveniadas
  useEffect(() => {
    const carregarEmpresas = async () => {
      const { data } = await supabase
        .from('empresas_conveniadas')
        .select('*')
        .eq('ativo', true)
        .order('razao_social');

      if (data) {
        setEmpresas(data);
        if (!empresaId && data.length > 0) {
          setEmpresaId(data[0].id);
          const formas = data[0].formas_pagamento_aceitas || [];
          if (formas.length > 0) {
            setFormaPagamentoReserva(formas[0]);
          }
        }
      }
    };
    carregarEmpresas();
  }, []);

  // Quando muda a empresa selecionada, ajusta as formas de pagamento
  useEffect(() => {
    if (empresaId) {
      const emp = empresas.find(e => e.id === empresaId);
      if (emp && emp.formas_pagamento_aceitas && emp.formas_pagamento_aceitas.length > 0) {
        setFormaPagamentoReserva(emp.formas_pagamento_aceitas[0]);
      }
    }
  }, [empresaId, empresas]);

  // Função para preencher o formulário a partir de um Hóspede encontrado
  const carregarDadosHospedeNoForm = (hosp: Hospede) => {
    setHospedeExistenteId(hosp.id);
    setHospedeLocalizado(hosp);
    setNomeHospede(hosp.nome_completo);
    if (hosp.cpf_cnpj) setCpf(formatarCpfCnpj(hosp.cpf_cnpj));
    if (hosp.telefone_whatsapp) setTelefone(formatarTelefone(hosp.telefone_whatsapp));
    if (hosp.placa_veiculo) setPlacaVeiculo(hosp.placa_veiculo);
    if (hosp.modelo_veiculo) setModeloVeiculo(hosp.modelo_veiculo);
    if (hosp.documento_tipo) setDocumentoTipo(hosp.documento_tipo);
    if (hosp.documento_numero) setDocumentoNumero(hosp.documento_numero);
    if (hosp.data_nascimento) setDataNascimento(hosp.data_nascimento);
    if (hosp.nacionalidade) setNacionalidade(hosp.nacionalidade);
    if (hosp.profissao) setProfissao(hosp.profissao);
    if (hosp.email) setEmail(hosp.email);
    if (hosp.observacoes_preferencias) setObservacoes(hosp.observacoes_preferencias);

    const end = (hosp.endereco_completo as any) || {};
    if (end.cep) setCep(formatarCep(end.cep));
    if (end.logradouro) setLogradouro(end.logradouro);
    if (end.numero) setNumero(end.numero);
    if (end.complemento) setComplemento(end.complemento);
    if (end.bairro) setBairro(end.bairro);
    if (end.cidade) setCidade(end.cidade);
    if (end.uf) setUf(end.uf);

    setMensagemLocalizado(`Cadastro localizado: ${hosp.nome_completo}. Dados preenchidos automaticamente!`);
  };

  // Se já veio com hóspede pré-selecionado (ex: vindo da tela de Hóspedes)
  useEffect(() => {
    if (hospedePreSelecionado) {
      carregarDadosHospedeNoForm(hospedePreSelecionado);
    }
  }, [hospedePreSelecionado]);

  // BUSCA AUTOMÁTICA INTELIGENTE AO DIGITAR CPF OU TELEFONE
  useEffect(() => {
    const docLimpo = apenasDigitos(cpf);
    const telLimpo = apenasDigitos(telefone);

    // Se ambos estão vazios ou muito curtos para consulta
    if (docLimpo.length < 11 && telLimpo.length < 10) {
      if (hospedeLocalizado && !hospedePreSelecionado) {
        setHospedeLocalizado(null);
        setHospedeExistenteId(null);
        setMensagemLocalizado(null);
      }
      return;
    }

    // Se o hóspede já localizado corresponde ao que está digitado, não precisa reconsultar
    if (hospedeLocalizado) {
      const hospDocLimpo = apenasDigitos(hospedeLocalizado.cpf_cnpj || '');
      const hospTelLimpo = apenasDigitos(hospedeLocalizado.telefone_whatsapp || '');
      if (
        (docLimpo.length === 11 && hospDocLimpo === docLimpo) ||
        (telLimpo.length >= 10 && hospTelLimpo === telLimpo)
      ) {
        return;
      }
    }

    // Debounce de 300ms para aguardar o fim da digitação
    const timer = setTimeout(async () => {
      const condicoes: string[] = [];
      if (docLimpo.length === 11) {
        condicoes.push(`cpf_cnpj.eq.${docLimpo}`);
        condicoes.push(`cpf_cnpj.eq.${formatarCpfCnpj(docLimpo)}`);
      }
      if (telLimpo.length >= 10) {
        condicoes.push(`telefone_whatsapp.eq.${telLimpo}`);
        condicoes.push(`telefone_whatsapp.eq.${formatarTelefone(telLimpo)}`);
      }

      if (condicoes.length === 0) return;

      setBuscandoHospede(true);
      try {
        const { data: hosp } = await supabase
          .from('hospedes')
          .select('*')
          .or(condicoes.join(','))
          .limit(1)
          .maybeSingle();

        if (hosp) {
          carregarDadosHospedeNoForm(hosp);
        } else {
          setHospedeLocalizado(null);
          setHospedeExistenteId(null);
          setMensagemLocalizado(null);
        }
      } catch (err) {
        console.error('Erro na busca automática de hóspede:', err);
      } finally {
        setBuscandoHospede(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [cpf, telefone]);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatado = formatarCpfCnpj(e.target.value);
    setCpf(formatado);
    setErroForm(null);
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatado = formatarTelefone(e.target.value);
    setTelefone(formatado);
    setErroForm(null);
  };

  // Limpar dados para cadastrar um hóspede diferente
  const limparHospede = () => {
    setHospedeLocalizado(null);
    setHospedeExistenteId(null);
    setMensagemLocalizado(null);
    setNomeHospede('');
    setCpf('');
    setTelefone('');
    setPlacaVeiculo('');
    setModeloVeiculo('');
    setDocumentoNumero('');
    setDataNascimento('');
    setProfissao('');
    setEmail('');
    setCep('');
    setLogradouro('');
    setNumero('');
    setComplemento('');
    setBairro('');
    setCidade('');
    setUf('');
    setObservacoes('');
  };

  // Consulta automática de CEP via ViaCEP
  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatado = formatarCep(e.target.value);
    setCep(formatado);

    const limpo = apenasDigitos(formatado);
    if (limpo.length === 8) {
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
        console.error('Erro ao buscar CEP:', err);
      } finally {
        setBuscandoCep(false);
      }
    }
  };

  const quartoSelecionado = quartosLivres.find(q => q.id === quartoId) || quartoPreSelecionado;
  const tarifaDiaria = Number(quartoSelecionado?.categoria?.tarifa_padrao || 150);
  const valorTotalDiarias = tarifaDiaria * (parseInt(diasEstadia, 10) || 1);
  const empresaAtual = empresas.find(e => e.id === empresaId);

  // Salvar Reserva com Validações Rigorosas e Cadastro Completo
  const salvarReserva = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroForm(null);

    if (!quartoId) {
      setErroForm('Por favor, selecione um quarto disponível.');
      return;
    }

    if (!nomeHospede.trim()) {
      setErroForm('O Nome Completo do hóspede é obrigatório.');
      return;
    }

    // 1. Validação Matemática do CPF
    const cpfLimpo = apenasDigitos(cpf);
    if (!cpfLimpo) {
      setErroForm('O CPF do hóspede é OBRIGATÓRIO.');
      return;
    }
    if (!validarCPF(cpfLimpo)) {
      setErroForm('CPF inválido. Verifique os dígitos verificadores informados.');
      return;
    }

    // 2. Validação do Telefone
    const telLimpo = apenasDigitos(telefone);
    if (!telLimpo) {
      setErroForm('O Telefone / WhatsApp do hóspede é OBRIGATÓRIO.');
      return;
    }
    if (!validarTelefone(telLimpo)) {
      setErroForm('Telefone inválido. Digite o DDD + número com 10 ou 11 dígitos.');
      return;
    }

    // 3. Validação de Empresa (se corporativo)
    if (tipoReserva === 'empresa' && !empresaId) {
      setErroForm('Selecione a empresa conveniada responsável pelo faturamento.');
      return;
    }

    setLoading(true);

    try {
      const cpfFormatado = formatarCpfCnpj(cpfLimpo);
      const telFormatado = formatarTelefone(telLimpo);

      // 4. Prevenção de Duplicidade no banco
      // Procura se já existe hóspede com esse CPF (tanto formatado quanto dígitos puros)
      const { data: hospedePorCpf } = await supabase
        .from('hospedes')
        .select('*')
        .or(`cpf_cnpj.eq.${cpfFormatado},cpf_cnpj.eq.${cpfLimpo}`)
        .maybeSingle();

      // Procura se já existe hóspede com esse telefone (formatado ou limpo)
      const { data: hospedePorTel } = await supabase
        .from('hospedes')
        .select('*')
        .or(`telefone_whatsapp.eq.${telFormatado},telefone_whatsapp.eq.${telLimpo}`)
        .maybeSingle();

      // Se o telefone pertence a outro hóspede com CPF diferente:
      if (hospedePorTel && hospedePorCpf && hospedePorTel.id !== hospedePorCpf.id) {
        throw new Error(
          `Conflito: o telefone "${telFormatado}" já pertence a outro hóspede (${hospedePorTel.nome_completo}). Verifique os dados.`
        );
      }

      let hospedeIdFinal: string;

      // Monta dados cadastrais completos FNRH
      const dadosHospede = {
        nome_completo: nomeHospede.trim().toUpperCase(),
        cpf_cnpj: cpfFormatado,
        telefone_whatsapp: telFormatado,
        documento_tipo: documentoTipo,
        documento_numero: documentoNumero.trim() || null,
        data_nascimento: dataNascimento || null,
        nacionalidade: nacionalidade.trim() || 'Brasileira',
        profissao: profissao.trim() || null,
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

      if (hospedePorCpf) {
        // Hóspede já existe pelo CPF: reutiliza o ID e atualiza os dados completos
        hospedeIdFinal = hospedePorCpf.id;
        await supabase
          .from('hospedes')
          .update(dadosHospede)
          .eq('id', hospedeIdFinal);
      } else if (hospedePorTel) {
        // Encontrou pelo telefone mas CPF ainda não estava vinculado
        hospedeIdFinal = hospedePorTel.id;
        await supabase
          .from('hospedes')
          .update(dadosHospede)
          .eq('id', hospedeIdFinal);
      } else {
        // Novo Hóspede: cadastra completo sem duplicar
        const { data: novoHosp, error: erroNovoHosp } = await supabase
          .from('hospedes')
          .insert(dadosHospede)
          .select('id')
          .single();

        if (erroNovoHosp || !novoHosp) throw erroNovoHosp;
        hospedeIdFinal = novoHosp.id;
      }

      // 5. Calcula data de check-out
      const dIn = new Date(dataCheckin);
      const dOut = new Date(dIn);
      dOut.setDate(dOut.getDate() + (parseInt(diasEstadia, 10) || 1));

      // 6. Cria a Reserva
      const codigoReserva = `RES-${Date.now().toString().slice(-6)}`;
      const origemFinal: Database['public']['Enums']['origem_reserva'] = 
        tipoReserva === 'empresa' ? 'empresa' : origem;

      const { error: erroReserva } = await supabase
        .from('reservas')
        .insert({
          codigo_reserva: codigoReserva,
          hospede_principal_id: hospedeIdFinal,
          quarto_id: quartoId,
          categoria_id: quartoSelecionado?.categoria_id || categorias[0].id,
          empresa_id: tipoReserva === 'empresa' ? empresaId : null,
          tipo_reserva: tipoReserva,
          forma_pagamento_reserva: tipoReserva === 'empresa' ? formaPagamentoReserva : 'balcao',
          status: isCheckinImediato ? 'hospedado_checkin' : 'confirmada',
          data_checkin_previsto: dIn.toISOString(),
          data_checkout_previsto: dOut.toISOString(),
          data_checkin_real: isCheckinImediato ? new Date().toISOString() : null,
          origem_reserva: origemFinal,
          valor_diarias_total: valorTotalDiarias,
          valor_total_geral: valorTotalDiarias,
          saldo_devedor: valorTotalDiarias
        });

      if (erroReserva) throw erroReserva;

      // 7. Se check-in imediato, atualiza quarto para ocupado
      if (isCheckinImediato) {
        await supabase
          .from('quartos')
          .update({ status_operacional: 'ocupado' })
          .eq('id', quartoId);
      }

      onSuccess();
    } catch (err: any) {
      console.error(err);
      setErroForm(err.message || 'Erro ao processar reserva.');
    } finally {
      setLoading(false);
    }
  };

  const getFormaLabel = (forma: string) => {
    switch (forma) {
      case 'faturado_boleto_30d': return 'Boleto 30 Dias (Faturado)';
      case 'faturado_boleto_15d': return 'Boleto 15 Dias (Faturado)';
      case 'pix_faturado': return 'PIX Faturado (Consolidado)';
      case 'cartao_credito_corporativo': return 'Cartão de Crédito Corporativo';
      case 'deposito_antecipado': return 'Depósito Bancário Antecipado';
      default: return forma;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl p-6 rounded-2xl border border-slate-200 shadow-2xl space-y-4 text-slate-800 my-8 max-h-[92vh] overflow-y-auto">
        {/* Header do Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#107c41] flex items-center justify-center font-bold">
              <Bed className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <span>{isCheckinImediato ? 'Check-in Expresso no Balcão' : 'Nova Pré-Reserva'}</span>
                <span className="text-[10px] bg-emerald-50 text-[#107c41] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  Busca Automática Ativa
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Digite o CPF ou Telefone para preenchimento automático sem duplicidade.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alternador de Tipo de Reserva: Particular vs Empresa */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => {
              setTipoReserva('particular');
              setOrigem('balcao');
            }}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              tipoReserva === 'particular'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4 text-[#107c41]" />
            <span>Particular (Pessoa Física)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTipoReserva('empresa');
              setOrigem('empresa');
            }}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              tipoReserva === 'empresa'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4 text-[#107c41]" />
            <span>Corporativo (Empresa Conveniada)</span>
          </button>
        </div>

        {erroForm && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{erroForm}</span>
          </div>
        )}

        <form onSubmit={salvarReserva} className="space-y-4 text-xs">
          {/* Se for Corporativo: Seleção da Empresa Conveniada */}
          {tipoReserva === 'empresa' && (
            <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#107c41]" />
                  Empresa Conveniada Responsável *
                </span>
                <span className="text-[10px] font-bold text-[#107c41] bg-white px-2 py-0.5 rounded border border-emerald-200">
                  Cartão CNPJ Vinculado
                </span>
              </div>

              <select
                value={empresaId}
                onChange={e => setEmpresaId(e.target.value)}
                required
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-[#107c41]"
              >
                {empresas.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.razao_social} {emp.nome_fantasia ? `(${emp.nome_fantasia})` : ''} • CNPJ: {emp.cnpj}
                  </option>
                ))}
              </select>

              {empresaAtual && (
                <div className="space-y-2 pt-1 text-[11px] text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>
                      <strong>CNPJ:</strong> {empresaAtual.cnpj}
                    </span>
                    <span>
                      <strong>Prazo:</strong> {empresaAtual.dias_prazo_faturamento} dias
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Forma de Pagamento Cadastrada da Empresa:
                    </label>
                    <select
                      value={formaPagamentoReserva}
                      onChange={e => setFormaPagamentoReserva(e.target.value)}
                      className="w-full p-1.5 bg-white border border-slate-300 rounded-md text-xs font-semibold text-[#107c41] focus:outline-none focus:border-[#107c41]"
                    >
                      {(empresaAtual.formas_pagamento_aceitas || ['faturado_boleto_30d']).map((forma, idx) => (
                        <option key={idx} value={forma}>
                          {getFormaLabel(forma)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Seleção do Quarto */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-slate-500 font-semibold">Quarto Selecionado:</span>
              <p className="text-sm font-black text-slate-900 mt-0.5">
                {quartoPreSelecionado ? `UH ${quartoPreSelecionado.numero} (${quartoPreSelecionado.categoria?.nome})` : (
                  <select
                    value={quartoId}
                    onChange={e => setQuartoId(e.target.value)}
                    className="bg-transparent text-slate-900 font-bold outline-none cursor-pointer"
                  >
                    {quartosLivres.map(q => (
                      <option key={q.id} value={q.id} className="bg-white text-slate-800">
                        UH {q.numero} - {q.categoria?.nome}
                      </option>
                    ))}
                  </select>
                )}
              </p>
            </div>
            <div className="text-right">
              <span className="text-slate-500 font-medium">Diária Padrão:</span>
              <p className="text-sm font-extrabold text-[#107c41]">R$ {tarifaDiaria.toFixed(2)}</p>
            </div>
          </div>

          {/* CARD DE HÓSPEDE CADASTRADO ENCONTRADO AUTOMATICAMENTE */}
          {hospedeLocalizado && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between animate-fadeIn shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#107c41] text-white flex items-center justify-center font-extrabold text-sm shadow-xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-emerald-950">
                      Hóspede Localizado no Cadastro!
                    </span>
                    <span className="text-[10px] font-bold bg-white text-[#107c41] px-2 py-0.5 rounded border border-emerald-200">
                      Cadastro Ativo
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-900 mt-0.5">
                    <strong>{hospedeLocalizado.nome_completo}</strong> • CPF: {hospedeLocalizado.cpf_cnpj || 'Sem CPF'} • Tel: {hospedeLocalizado.telefone_whatsapp || 'Sem telefone'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMostrarCadastroCompleto(true)}
                  className="px-2.5 py-1 text-[11px] bg-white hover:bg-emerald-100 text-[#107c41] border border-emerald-300 rounded-lg font-bold transition-colors"
                >
                  Ver Ficha (FNRH)
                </button>
                <button
                  type="button"
                  onClick={limparHospede}
                  title="Limpar campos para outro hóspede"
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Dados Obrigatórios do Hóspede */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-[#107c41]" />
                {tipoReserva === 'empresa' ? 'Dados do Colaborador Ocupante (Hóspede)' : 'Identificação do Hóspede'}
              </span>
              {buscandoHospede ? (
                <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Buscando cadastro automaticamente...
                </span>
              ) : (
                <span className="text-[10px] text-slate-400">
                  Busca em tempo real por CPF ou Telefone
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-700 font-bold flex items-center justify-between">
                  <span>CPF do Hóspede * (Obrigatório)</span>
                  {cpf && apenasDigitos(cpf).length === 11 && (
                    <span className="text-[10px] text-emerald-600 font-semibold">11 dígitos</span>
                  )}
                </label>
                <div className="relative mt-1">
                  <input
                    type="text"
                    required
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={handleCpfChange}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono font-bold outline-none focus:bg-white focus:border-[#107c41] focus:ring-1 focus:ring-[#107c41]"
                  />
                  {buscandoHospede && (
                    <div className="absolute right-3 top-3 w-4 h-4 border-2 border-[#107c41] border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold flex items-center justify-between">
                  <span>WhatsApp / Celular * (Obrigatório)</span>
                  {telefone && apenasDigitos(telefone).length >= 10 && (
                    <span className="text-[10px] text-emerald-600 font-semibold">Válido</span>
                  )}
                </label>
                <input
                  type="text"
                  required
                  placeholder="(00) 00000-0000"
                  value={telefone}
                  onChange={handleTelefoneChange}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-bold outline-none focus:bg-white focus:border-[#107c41] focus:ring-1 focus:ring-[#107c41]"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-700 font-bold">Nome Completo do Hóspede *</label>
              <input
                type="text"
                required
                value={nomeHospede}
                onChange={e => setNomeHospede(e.target.value)}
                placeholder="Ex: Carlos Eduardo de Oliveira"
                className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-bold outline-none focus:bg-white focus:border-[#107c41] focus:ring-1 focus:ring-[#107c41]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-700 font-medium flex items-center gap-1">
                  <Car className="w-3.5 h-3.5 text-[#107c41]" /> Placa do Veículo (Opcional)
                </label>
                <input
                  type="text"
                  value={placaVeiculo}
                  onChange={e => setPlacaVeiculo(e.target.value.toUpperCase())}
                  placeholder="ABC-1234"
                  maxLength={8}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 uppercase font-mono outline-none focus:bg-white focus:border-[#107c41]"
                />
              </div>

              <div>
                <label className="text-slate-700 font-medium">Canal de Origem</label>
                <select
                  value={origem}
                  onChange={e => setOrigem(e.target.value as any)}
                  disabled={tipoReserva === 'empresa'}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 outline-none focus:bg-white focus:border-[#107c41]"
                >
                  <option value="balcao">Balcão / Passante</option>
                  <option value="whatsapp">WhatsApp Oficial</option>
                  <option value="telefone">Telefone Fixo</option>
                  <option value="empresa">Faturado Empresa</option>
                  <option value="booking">Booking.com</option>
                </select>
              </div>
            </div>
          </div>

          {/* BOTÃO EXPANSÍVEL: CADASTRO COMPLETO (FNRH) */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setMostrarCadastroCompleto(!mostrarCadastroCompleto)}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100/70 hover:from-slate-100 hover:to-slate-200/60 transition-all text-slate-800 shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#107c41]" />
                <div className="text-left">
                  <span className="font-extrabold text-xs block text-slate-900">
                    Ficha Completa de Hóspede (FNRH & Endereço)
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {mostrarCadastroCompleto 
                      ? 'Clique para recolher os detalhes cadastrais' 
                      : 'RG, Data de Nascimento, Endereço com busca ViaCEP e Veículo'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-[#107c41] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  {mostrarCadastroCompleto ? 'Recolher' : '+ Expandir Cadastro'}
                </span>
                {mostrarCadastroCompleto ? (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </div>
            </button>

            {/* SEÇÃO EXPANDIDA DO CADASTRO COMPLETO FNRH */}
            {mostrarCadastroCompleto && (
              <div className="mt-3 p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3.5 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#107c41]" />
                    Documentação & Dados Pessoais
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Padrão Ministério do Turismo (FNRH)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-700 font-semibold text-[11px]">Tipo de Documento</label>
                    <select
                      value={documentoTipo}
                      onChange={e => setDocumentoTipo(e.target.value)}
                      className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:border-[#107c41] outline-none"
                    >
                      <option value="RG">RG (Carteira de Identidade)</option>
                      <option value="CNH">CNH (Habilitação)</option>
                      <option value="Passaporte">Passaporte (Estrangeiro)</option>
                      <option value="RNE">RNE / CRNM</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold text-[11px]">Número do Documento</label>
                    <input
                      type="text"
                      placeholder="Ex: 12.345.678-9 SSP/SP"
                      value={documentoNumero}
                      onChange={e => setDocumentoNumero(e.target.value)}
                      className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:border-[#107c41] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold text-[11px]">Data de Nascimento</label>
                    <input
                      type="date"
                      value={dataNascimento}
                      onChange={e => setDataNascimento(e.target.value)}
                      className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:border-[#107c41] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-700 font-semibold text-[11px]">Nacionalidade</label>
                    <input
                      type="text"
                      value={nacionalidade}
                      onChange={e => setNacionalidade(e.target.value)}
                      placeholder="Brasileira"
                      className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:border-[#107c41] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold text-[11px]">Profissão</label>
                    <input
                      type="text"
                      value={profissao}
                      onChange={e => setProfissao(e.target.value)}
                      placeholder="Ex: Engenheiro, Representante"
                      className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:border-[#107c41] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold text-[11px]">E-mail</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="hospede@email.com"
                      className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:border-[#107c41] outline-none"
                    />
                  </div>
                </div>

                {/* Endereço Residencial com busca ViaCEP */}
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#107c41]" />
                      Endereço Residencial
                    </span>
                    {buscandoCep && (
                      <span className="text-[10px] text-emerald-600 font-bold animate-pulse">
                        Consultando ViaCEP...
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-slate-700 font-semibold text-[11px]">CEP</label>
                      <input
                        type="text"
                        placeholder="00000-000"
                        value={cep}
                        onChange={handleCepChange}
                        className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold focus:border-[#107c41] outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-slate-700 font-semibold text-[11px]">Logradouro (Rua / Av)</label>
                      <input
                        type="text"
                        placeholder="Ex: Rua das Flores"
                        value={logradouro}
                        onChange={e => setLogradouro(e.target.value)}
                        className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:border-[#107c41] outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-slate-700 font-semibold text-[11px]">Número</label>
                      <input
                        type="text"
                        placeholder="Ex: 123"
                        value={numero}
                        onChange={e => setNumero(e.target.value)}
                        className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:border-[#107c41] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2.5">
                    <div>
                      <label className="text-slate-700 font-semibold text-[11px]">Bairro</label>
                      <input
                        type="text"
                        placeholder="Ex: Centro"
                        value={bairro}
                        onChange={e => setBairro(e.target.value)}
                        className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:border-[#107c41] outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-slate-700 font-semibold text-[11px]">Cidade</label>
                      <input
                        type="text"
                        placeholder="Ex: Curitiba"
                        value={cidade}
                        onChange={e => setCidade(e.target.value)}
                        className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:border-[#107c41] outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-slate-700 font-semibold text-[11px]">UF (Estado)</label>
                      <input
                        type="text"
                        placeholder="PR"
                        maxLength={2}
                        value={uf}
                        onChange={e => setUf(e.target.value.toUpperCase())}
                        className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold uppercase focus:border-[#107c41] outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Veículo & Observações */}
                <div className="pt-2 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 font-semibold text-[11px]">Modelo / Marca do Veículo</label>
                    <input
                      type="text"
                      placeholder="Ex: Toyota Corolla Branco"
                      value={modeloVeiculo}
                      onChange={e => setModeloVeiculo(e.target.value)}
                      className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:border-[#107c41] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold text-[11px]">Observações / Preferências</label>
                    <input
                      type="text"
                      placeholder="Ex: Prefere quarto silencioso, travesseiro extra"
                      value={observacoes}
                      onChange={e => setObservacoes(e.target.value)}
                      className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:border-[#107c41] outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dados da Estadia */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 font-bold">Data de Entrada *</label>
              <input
                type="date"
                required
                value={dataCheckin}
                onChange={e => setDataCheckin(e.target.value)}
                className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-semibold outline-none focus:bg-white focus:border-[#107c41]"
              />
            </div>
            <div>
              <label className="text-slate-700 font-bold">Qtd de Diárias *</label>
              <input
                type="number"
                min="1"
                required
                value={diasEstadia}
                onChange={e => setDiasEstadia(e.target.value)}
                className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-bold outline-none focus:bg-white focus:border-[#107c41]"
              />
            </div>
          </div>

          {/* Resumo do Total */}
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-600 font-semibold">Total Estimado de Diárias:</span>
              <p className="text-[11px] text-slate-500">
                {diasEstadia} {parseInt(diasEstadia, 10) === 1 ? 'diária' : 'diárias'} x R$ {tarifaDiaria.toFixed(2)}
              </p>
            </div>
            <span className="text-lg font-black text-[#107c41]">R$ {valorTotalDiarias.toFixed(2)}</span>
          </div>

          {/* Botões do Rodapé */}
          <div className="pt-2 flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-lg bg-[#107c41] hover:bg-[#0e6d39] text-white font-bold shadow-sm transition-all flex items-center gap-1.5"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isCheckinImediato ? 'Confirmar Check-in Expresso' : 'Salvar Reserva'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
