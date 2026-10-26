import React, { useState } from 'react';
import { X, UserCheck, Calendar, Bed, Car, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type Quarto = Database['public']['Tables']['quartos']['Row'] & {
  categoria?: Database['public']['Tables']['categorias_quarto']['Row'];
};

interface NovaReservaModalProps {
  quartoPreSelecionado?: Quarto | null;
  quartosLivres: Quarto[];
  categorias: Database['public']['Tables']['categorias_quarto']['Row'][];
  onClose: () => void;
  onSuccess: () => void;
}

export const NovaReservaModal: React.FC<NovaReservaModalProps> = ({
  quartoPreSelecionado,
  quartosLivres,
  categorias,
  onClose,
  onSuccess
}) => {
  const [quartoId, setQuartoId] = useState(quartoPreSelecionado?.id || (quartosLivres[0]?.id || ''));
  const [nomeHospede, setNomeHospede] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [placaVeiculo, setPlacaVeiculo] = useState('');
  const [dataCheckin, setDataCheckin] = useState(new Date().toISOString().split('T')[0]);
  const [diasEstadia, setDiasEstadia] = useState('1');
  const [origem, setOrigem] = useState<Database['public']['Enums']['origem_reserva']>('balcao');
  const [isCheckinImediato, setIsCheckinImediato] = useState(true);
  const [loading, setLoading] = useState(false);

  const quartoSelecionado = quartosLivres.find(q => q.id === quartoId) || quartoPreSelecionado;
  const tarifaDiaria = Number(quartoSelecionado?.categoria?.tarifa_padrao || 150);
  const valorTotalDiarias = tarifaDiaria * (parseInt(diasEstadia) || 1);

  const salvarReserva = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeHospede || !quartoId) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      // 1. Cadastra ou localiza o hóspede
      let hospedeId: string;
      const { data: hospExistente } = await supabase
        .from('hospedes')
        .select('id')
        .eq('cpf_cnpj', cpf || 'SEM_CPF_' + Date.now())
        .maybeSingle();

      if (hospExistente) {
        hospedeId = hospExistente.id;
      } else {
        const { data: novoHospede, error: erroHosp } = await supabase
          .from('hospedes')
          .insert({
            nome_completo: nomeHospede,
            cpf_cnpj: cpf || null,
            telefone_whatsapp: telefone || null,
            placa_veiculo: placaVeiculo ? placaVeiculo.toUpperCase() : null
          })
          .select('id')
          .single();

        if (erroHosp || !novoHospede) throw erroHosp;
        hospedeId = novoHospede.id;
      }

      // 2. Calcula data de check-out
      const dIn = new Date(dataCheckin);
      const dOut = new Date(dIn);
      dOut.setDate(dOut.getDate() + (parseInt(diasEstadia) || 1));

      // 3. Cria a reserva
      const codigoReserva = `RES-${Date.now().toString().slice(-6)}`;
      const { error: erroReserva } = await supabase
        .from('reservas')
        .insert({
          codigo_reserva: codigoReserva,
          hospede_principal_id: hospedeId,
          quarto_id: quartoId,
          categoria_id: quartoSelecionado?.categoria_id || categorias[0].id,
          status: isCheckinImediato ? 'hospedado_checkin' : 'confirmada',
          data_checkin_previsto: dIn.toISOString(),
          data_checkout_previsto: dOut.toISOString(),
          data_checkin_real: isCheckinImediato ? new Date().toISOString() : null,
          origem_reserva: origem,
          valor_diarias_total: valorTotalDiarias,
          valor_total_geral: valorTotalDiarias,
          saldo_devedor: valorTotalDiarias
        });

      if (erroReserva) throw erroReserva;

      // 4. Se for check-in imediato, atualiza o status do quarto para ocupado
      if (isCheckinImediato) {
        await supabase
          .from('quartos')
          .update({ status_operacional: 'ocupado' })
          .eq('id', quartoId);
      }

      onSuccess();
    } catch (err: any) {
      console.error(err);
      alert('Erro ao criar reserva: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border border-slate-700 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Bed className="w-5 h-5 text-blue-500" />
            <h3 className="font-extrabold text-base text-white">
              {isCheckinImediato ? 'Check-in Expresso no Balcão' : 'Nova Pré-Reserva'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={salvarReserva} className="space-y-4 text-xs">
          {/* Seleção do Quarto */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 font-medium">Quarto Selecionado:</span>
              <p className="text-base font-black text-white">
                {quartoPreSelecionado ? `UH ${quartoPreSelecionado.numero} (${quartoPreSelecionado.categoria?.nome})` : (
                  <select
                    value={quartoId}
                    onChange={e => setQuartoId(e.target.value)}
                    className="bg-transparent text-white font-bold outline-none cursor-pointer"
                  >
                    {quartosLivres.map(q => (
                      <option key={q.id} value={q.id} className="bg-slate-900">
                        UH {q.numero} - {q.categoria?.nome}
                      </option>
                    ))}
                  </select>
                )}
              </p>
            </div>
            <div className="text-right">
              <span className="text-slate-400">Diária Padrão:</span>
              <p className="text-sm font-extrabold text-emerald-400">R$ {tarifaDiaria.toFixed(2)}</p>
            </div>
          </div>

          {/* Dados do Hóspede */}
          <div className="space-y-3">
            <div>
              <label className="text-slate-300 font-semibold">Nome Completo do Hóspede *</label>
              <input
                type="text"
                required
                value={nomeHospede}
                onChange={e => setNomeHospede(e.target.value)}
                placeholder="ex: João Pereira da Silva"
                className="w-full mt-1 p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-semibold">CPF</label>
                <input
                  type="text"
                  value={cpf}
                  onChange={e => setCpf(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold">WhatsApp / Celular</label>
                <input
                  type="text"
                  value={telefone}
                  onChange={e => setTelefone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-semibold flex items-center gap-1">
                  <Car className="w-3.5 h-3.5 text-blue-400" /> Placa do Veículo
                </label>
                <input
                  type="text"
                  value={placaVeiculo}
                  onChange={e => setPlacaVeiculo(e.target.value)}
                  placeholder="ABC-1234"
                  className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-xl text-white uppercase font-mono outline-none"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold">Canal / Origem</label>
                <select
                  value={origem}
                  onChange={e => setOrigem(e.target.value as any)}
                  className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none"
                >
                  <option value="balcao">Balcão / Passante</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="telefone">Telefone</option>
                  <option value="booking">Booking.com</option>
                  <option value="empresa">Faturado Empresa</option>
                </select>
              </div>
            </div>

            {/* Estadia */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-semibold">Data Entrada *</label>
                <input
                  type="date"
                  required
                  value={dataCheckin}
                  onChange={e => setDataCheckin(e.target.value)}
                  className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold">Qtd Diárias *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={diasEstadia}
                  onChange={e => setDiasEstadia(e.target.value)}
                  className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Estimado de Diárias:</span>
            <span className="text-lg font-black text-emerald-400">R$ {valorTotalDiarias.toFixed(2)}</span>
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
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/30 flex items-center gap-1.5"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isCheckinImediato ? 'Confirmar Check-in' : 'Salvar Reserva'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
