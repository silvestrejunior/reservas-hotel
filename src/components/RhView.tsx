import React, { useState, useEffect } from 'react';
import { 
  Users2, 
  Receipt, 
  Clock, 
  FileText, 
  Plus, 
  ShieldAlert, 
  DollarSign, 
  CheckCircle2, 
  Calendar, 
  Stethoscope,
  ChevronRight,
  Filter
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type Funcionario = Database['public']['Tables']['funcionarios']['Row'];
type Vale = Database['public']['Tables']['rh_vales_adiantamentos']['Row'] & {
  funcionario?: Funcionario;
};
type HoraExtra = Database['public']['Tables']['rh_horas_extras']['Row'] & {
  funcionario?: Funcionario;
};
type Atestado = Database['public']['Tables']['rh_atestados_afastamentos']['Row'] & {
  funcionario?: Funcionario;
};

export const RhView: React.FC = () => {
  const [subAba, setSubAba] = useState<'colaboradores' | 'vales' | 'horas_extras' | 'atestados' | 'holerites'>('colaboradores');
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [vales, setVales] = useState<Vale[]>([]);
  const [horasExtras, setHorasExtras] = useState<HoraExtra[]>([]);
  const [atestados, setAtestados] = useState<Atestado[]>([]);
  const [modalNovoFuncionario, setModalNovoFuncionario] = useState(false);
  const [modalNovoAtestado, setModalNovoAtestado] = useState(false);
  const [modalNovaHE, setModalNovaHE] = useState(false);

  // Form states
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [cpf, setCpf] = useState('');
  const [cargo, setCargo] = useState('');
  const [departamento, setDepartamento] = useState<Database['public']['Enums']['departamento_funcionario']>('recepcao');
  const [salarioBase, setSalarioBase] = useState('2200.00');
  const [limiteVales, setLimiteVales] = useState('400.00');

  // Form atestado
  const [atestadoFuncId, setAtestadoFuncId] = useState('');
  const [atestadoDias, setAtestadoDias] = useState('2');
  const [atestadoDataInicio, setAtestadoDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [atestadoCid, setAtestadoCid] = useState('J06');
  const [atestadoMedico, setAtestadoMedico] = useState('');

  // Carrega dados do RH
  const carregarDadosRh = async () => {
    // 1. Funcionários
    const { data: funcs } = await supabase
      .from('funcionarios')
      .select('*')
      .order('nome_completo');
    if (funcs) setFuncionarios(funcs);

    // 2. Vales
    const { data: vls } = await supabase
      .from('rh_vales_adiantamentos')
      .select('*, funcionario:funcionarios(*)')
      .order('data_solicitacao', { ascending: false });
    if (vls) setVales(vls as any);

    // 3. Horas extras
    const { data: hes } = await supabase
      .from('rh_horas_extras')
      .select('*, funcionario:funcionarios(*)')
      .order('data_trabalho', { ascending: false });
    if (hes) setHorasExtras(hes as any);

    // 4. Atestados
    const { data: atests } = await supabase
      .from('rh_atestados_afastamentos')
      .select('*, funcionario:funcionarios(*)')
      .order('data_inicio_afastamento', { ascending: false });
    if (atests) setAtestados(atests as any);
  };

  useEffect(() => {
    carregarDadosRh();
  }, []);

  // Cadastrar Novo Colaborador
  const salvarFuncionario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeCompleto || !cpf || !cargo) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    const { error } = await supabase.from('funcionarios').insert({
      nome_completo: nomeCompleto,
      cpf,
      cargo,
      departamento,
      salario_base: parseFloat(salarioBase),
      limite_mensal_vales: parseFloat(limiteVales),
      status: 'ativo'
    });

    if (error) {
      alert('Erro ao cadastrar funcionário: ' + error.message);
      return;
    }

    setModalNovoFuncionario(false);
    setNomeCompleto('');
    setCpf('');
    setCargo('');
    carregarDadosRh();
  };

  // Cadastrar Atestado
  const salvarAtestado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!atestadoFuncId) {
      alert('Selecione o colaborador');
      return;
    }

    const dInicio = new Date(atestadoDataInicio);
    const dRetorno = new Date(dInicio);
    dRetorno.setDate(dRetorno.getDate() + parseInt(atestadoDias));

    const { error } = await supabase.from('rh_atestados_afastamentos').insert({
      funcionario_id: atestadoFuncId,
      dias_afastamento: parseInt(atestadoDias),
      data_inicio_afastamento: atestadoDataInicio,
      data_retorno_prevista: dRetorno.toISOString().split('T')[0],
      cid_codigo: atestadoCid,
      medico_nome: atestadoMedico || 'Dr. Plantonista',
      observacoes: 'Atestado médico homologado no RH'
    });

    if (error) {
      alert('Erro ao lançar atestado: ' + error.message);
      return;
    }

    setModalNovoAtestado(false);
    carregarDadosRh();
  };

  const totalValesDoMes = vales.reduce((acc, v) => acc + Number(v.valor), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-800">
      {/* Aviso de Sigilo */}
      <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-rose-100 text-rose-700">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm text-rose-900">Módulo Confidencial de Recursos Humanos</h2>
            <p className="text-xs text-rose-700">
              Acesso exclusivo da Gerência e RH. Recepção e Governança não têm acesso a salários, atestados ou holerites.
            </p>
          </div>
        </div>
        <button
          onClick={() => setModalNovoFuncionario(true)}
          className="flex items-center gap-2 bg-[#107c41] hover:bg-[#0e6d39] text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Novo Colaborador
        </button>
      </div>

      {/* Sub-Abas do RH */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setSubAba('colaboradores')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            subAba === 'colaboradores'
              ? 'bg-emerald-50 text-[#107c41] border border-emerald-200 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users2 className="w-4 h-4" /> Colaboradores ({funcionarios.length})
        </button>
        <button
          onClick={() => setSubAba('vales')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            subAba === 'vales'
              ? 'bg-emerald-50 text-[#107c41] border border-emerald-200 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-4 h-4" /> Espelho de Vales & Balcão ({vales.length})
        </button>
        <button
          onClick={() => setSubAba('horas_extras')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            subAba === 'horas_extras'
              ? 'bg-emerald-50 text-[#107c41] border border-emerald-200 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" /> Horas Extras ({horasExtras.length})
        </button>
        <button
          onClick={() => setSubAba('atestados')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            subAba === 'atestados'
              ? 'bg-emerald-50 text-[#107c41] border border-emerald-200 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Stethoscope className="w-4 h-4" /> Atestados Médicos ({atestados.length})
        </button>
        <button
          onClick={() => setSubAba('holerites')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            subAba === 'holerites'
              ? 'bg-emerald-50 text-[#107c41] border border-emerald-200 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" /> Holerites & Descontos
        </button>
      </div>

      {/* 1. ABA COLABORADORES */}
      {subAba === 'colaboradores' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {funcionarios.length === 0 ? (
              <div className="col-span-3 py-16 text-center text-slate-400 text-xs font-medium">
                Nenhum colaborador cadastrado ainda. Clique em "Novo Colaborador" acima.
              </div>
            ) : (
              funcionarios.map(func => (
                <div key={func.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">{func.nome_completo}</h3>
                        <p className="text-xs text-[#107c41] font-semibold">{func.cargo}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[#107c41] border border-emerald-200">
                        {func.status}
                      </span>
                    </div>

                    <div className="mt-3 py-2 px-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1 text-xs">
                      <div className="flex justify-between text-slate-500">
                        <span>Departamento:</span>
                        <span className="text-slate-800 font-semibold capitalize">{func.departamento}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>CPF:</span>
                        <span className="font-mono text-slate-700">{func.cpf}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Salário Base:</span>
                        <span className="font-bold text-slate-900">R$ {Number(func.salario_base).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Limite Vales:</span>
                        <span className="font-bold text-amber-700">R$ {Number(func.limite_mensal_vales).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Admissão: {func.data_admissao}</span>
                    <span className="text-[#107c41] font-bold cursor-pointer hover:underline">Ver Histórico</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 2. ABA VALES E ADIANTAMENTOS */}
      {subAba === 'vales' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm flex items-center justify-between bg-amber-50/40">
            <div>
              <span className="text-xs text-amber-900 font-bold">Total de Vales Consumidos no Período</span>
              <p className="text-2xl font-black text-amber-800 mt-1">R$ {totalValesDoMes.toFixed(2)}</p>
            </div>
            <span className="text-xs text-slate-500 max-w-md">
              Esses valores são descontados automaticamente na apuração dos holerites do mês.
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-600 font-bold">
                <tr>
                  <th className="p-3.5">Colaborador</th>
                  <th className="p-3.5">Tipo / Descrição</th>
                  <th className="p-3.5">Data Lançamento</th>
                  <th className="p-3.5">Valor</th>
                  <th className="p-3.5">Competência</th>
                  <th className="p-3.5">Status Desconto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                      Nenhum vale emitido no balcão até o momento.
                    </td>
                  </tr>
                ) : (
                  vales.map(v => (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">
                        {v.funcionario?.nome_completo || 'Colaborador'}
                      </td>
                      <td className="p-3.5 text-slate-600">{v.descricao}</td>
                      <td className="p-3.5 text-slate-500">
                        {v.data_solicitacao ? new Date(v.data_solicitacao).toLocaleString('pt-BR') : '-'}
                      </td>
                      <td className="p-3.5 font-bold text-amber-800">
                        R$ {Number(v.valor).toFixed(2)}
                      </td>
                      <td className="p-3.5 text-slate-600">{v.mes_competencia}/{v.ano_competencia}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {v.status_desconto === 'pendente_desconto' ? 'Pendente Folha' : 'Descontado'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. ABA ATESTADOS */}
      {subAba === 'atestados' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setModalNovoAtestado(true)}
              className="flex items-center gap-2 bg-[#107c41] hover:bg-[#0e6d39] text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Registrar Atestado Médico
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {atestados.length === 0 ? (
              <div className="col-span-2 py-16 text-center text-slate-400 text-xs font-medium">
                Nenhum atestado médico registrado.
              </div>
            ) : (
              atestados.map(at => (
                <div key={at.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{at.funcionario?.nome_completo}</h4>
                      <p className="text-xs text-rose-700 font-semibold flex items-center gap-1 mt-0.5">
                        <Stethoscope className="w-3.5 h-3.5 text-rose-600" /> Afastamento: {at.dias_afastamento} dias (CID {at.cid_codigo})
                      </p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-200">
                      Retorno: {at.data_retorno_prevista}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex justify-between">
                    <span>Início: <strong>{at.data_inicio_afastamento}</strong></span>
                    <span>Médico: <strong>{at.medico_nome}</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 4. ABA HOLERITES E DESCONTOS */}
      {subAba === 'holerites' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900">Espelho Prévia da Folha de Pagamento (Mês Atual)</h3>
            <p className="text-xs text-slate-500">
              Cálculo automático deduzindo os vales e adiantamentos de cada colaborador:
            </p>

            <div className="divide-y divide-slate-100 pt-2">
              {funcionarios.map(f => {
                const valesFunc = vales.filter(v => v.funcionario_id === f.id);
                const totalValesFunc = valesFunc.reduce((acc, v) => acc + Number(v.valor), 0);
                const salarioLiquido = Number(f.salario_base) - totalValesFunc;

                return (
                  <div key={f.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">{f.nome_completo}</span>
                      <p className="text-[11px] text-slate-500">{f.cargo} - Salário Base: R$ {Number(f.salario_base).toFixed(2)}</p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className="text-[11px] text-slate-500">Vales Balcão:</span>
                        <p className="font-bold text-amber-800">- R$ {totalValesFunc.toFixed(2)}</p>
                      </div>

                      <div className="text-right pl-4 border-l border-slate-200">
                        <span className="text-[11px] text-slate-500">Líquido a Pagar:</span>
                        <p className="font-extrabold text-sm text-[#107c41]">R$ {salarioLiquido.toFixed(2)}</p>
                      </div>

                      <button className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#107c41] font-semibold text-xs border border-emerald-200 transition-all">
                        Gerar Holerite PDF
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOVO COLABORADOR */}
      {modalNovoFuncionario && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-6 rounded-2xl border border-slate-200 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">Cadastrar Novo Colaborador</h3>
            <form onSubmit={salvarFuncionario} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-semibold">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={nomeCompleto}
                  onChange={e => setNomeCompleto(e.target.value)}
                  placeholder="ex: Maria da Silva"
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#107c41]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold">CPF *</label>
                  <input
                    type="text"
                    required
                    value={cpf}
                    onChange={e => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#107c41]"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold">Cargo *</label>
                  <input
                    type="text"
                    required
                    value={cargo}
                    onChange={e => setCargo(e.target.value)}
                    placeholder="ex: Recepcionista"
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#107c41]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold">Salário Base (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={salarioBase}
                    onChange={e => setSalarioBase(e.target.value)}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#107c41]"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold">Limite Vales Balcão (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={limiteVales}
                    onChange={e => setLimiteVales(e.target.value)}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#107c41]"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold">Departamento</label>
                <select
                  value={departamento}
                  onChange={e => setDepartamento(e.target.value as any)}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#107c41]"
                >
                  <option value="recepcao">Recepção</option>
                  <option value="governanca">Governança / Camareira</option>
                  <option value="manutencao">Manutenção</option>
                  <option value="financeiro_adm">Financeiro & ADM</option>
                  <option value="gerencia">Gerência</option>
                </select>
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setModalNovoFuncionario(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#107c41] hover:bg-[#0e6d39] text-white font-semibold shadow-sm"
                >
                  Salvar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR ATESTADO */}
      {modalNovoAtestado && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-6 rounded-2xl border border-slate-200 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">Registrar Atestado Médico</h3>
            <form onSubmit={salvarAtestado} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-semibold">Colaborador *</label>
                <select
                  required
                  value={atestadoFuncId}
                  onChange={e => setAtestadoFuncId(e.target.value)}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#107c41]"
                >
                  <option value="">Selecione o colaborador...</option>
                  {funcionarios.map(f => (
                    <option key={f.id} value={f.id}>{f.nome_completo} ({f.cargo})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold">Data Início Afastamento *</label>
                  <input
                    type="date"
                    required
                    value={atestadoDataInicio}
                    onChange={e => setAtestadoDataInicio(e.target.value)}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#107c41]"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold">Qtd Dias *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={atestadoDias}
                    onChange={e => setAtestadoDias(e.target.value)}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#107c41]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold">Código CID</label>
                  <input
                    type="text"
                    value={atestadoCid}
                    onChange={e => setAtestadoCid(e.target.value)}
                    placeholder="ex: J06"
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#107c41]"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold">Médico / CRM</label>
                  <input
                    type="text"
                    value={atestadoMedico}
                    onChange={e => setAtestadoMedico(e.target.value)}
                    placeholder="ex: Dr. Carlos (CRM 12345)"
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#107c41]"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setModalNovoAtestado(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#107c41] hover:bg-[#0e6d39] text-white font-semibold shadow-sm"
                >
                  Confirmar Atestado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
