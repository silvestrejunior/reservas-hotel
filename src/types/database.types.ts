export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      categorias_quarto: {
        Row: {
          capacidade_adultos: number
          capacidade_criancas: number
          cor_identificacao: string
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          tarifa_padrao: number
        }
        Insert: {
          capacidade_adultos?: number
          capacidade_criancas?: number
          cor_identificacao?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          tarifa_padrao?: number
        }
        Update: {
          capacidade_adultos?: number
          capacidade_criancas?: number
          cor_identificacao?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          tarifa_padrao?: number
        }
        Relationships: []
      }
      consumo_reserva: {
        Row: {
          created_at: string | null
          custo_total: number
          id: string
          lancado_por: string | null
          produto_id: string
          quantidade: number
          reserva_id: string
          valor_total: number
          valor_unitario: number
        }
        Insert: {
          created_at?: string | null
          custo_total?: number
          id?: string
          lancado_por?: string | null
          produto_id: string
          quantidade?: number
          reserva_id: string
          valor_total: number
          valor_unitario: number
        }
        Update: {
          created_at?: string | null
          custo_total?: number
          id?: string
          lancado_por?: string | null
          produto_id?: string
          quantidade?: number
          reserva_id?: string
          valor_total?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "consumo_reserva_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_servicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumo_reserva_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: false
            referencedRelation: "reservas"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_pagar_receber: {
        Row: {
          created_at: string | null
          data_emissao: string
          data_liquidacao: string | null
          data_vencimento: string
          descricao: string
          documento_fiscal_url: string | null
          fornecedor_cliente: string | null
          id: string
          plano_contas_id: string
          status: Database["public"]["Enums"]["status_conta"]
          tipo: Database["public"]["Enums"]["tipo_conta"]
          valor_desconto: number | null
          valor_juros_multa: number | null
          valor_liquidado: number | null
          valor_nominal: number
        }
        Insert: {
          created_at?: string | null
          data_emissao?: string
          data_liquidacao?: string | null
          data_vencimento: string
          descricao: string
          documento_fiscal_url?: string | null
          fornecedor_cliente?: string | null
          id?: string
          plano_contas_id: string
          status?: Database["public"]["Enums"]["status_conta"]
          tipo: Database["public"]["Enums"]["tipo_conta"]
          valor_desconto?: number | null
          valor_juros_multa?: number | null
          valor_liquidado?: number | null
          valor_nominal: number
        }
        Update: {
          created_at?: string | null
          data_emissao?: string
          data_liquidacao?: string | null
          data_vencimento?: string
          descricao?: string
          documento_fiscal_url?: string | null
          fornecedor_cliente?: string | null
          id?: string
          plano_contas_id?: string
          status?: Database["public"]["Enums"]["status_conta"]
          tipo?: Database["public"]["Enums"]["tipo_conta"]
          valor_desconto?: number | null
          valor_juros_multa?: number | null
          valor_liquidado?: number | null
          valor_nominal?: number
        }
        Relationships: [
          {
            foreignKeyName: "contas_pagar_receber_plano_contas_id_fkey"
            columns: ["plano_contas_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas_conveniadas: {
        Row: {
          ativo: boolean | null
          cnae_principal: string | null
          cnpj: string
          contato_responsavel: string | null
          created_at: string | null
          data_abertura: string | null
          dias_prazo_faturamento: number | null
          email_financeiro_faturamento: string
          endereco_completo: Json | null
          formas_pagamento_aceitas: string[] | null
          id: string
          inscricao_estadual: string | null
          inscricao_municipal: string | null
          limite_credito: number | null
          nome_fantasia: string | null
          observacoes_faturamento: string | null
          razao_social: string
          situacao_cadastral: string | null
          telefone_comercial: string
          telefone_responsavel: string | null
        }
        Insert: {
          ativo?: boolean | null
          cnae_principal?: string | null
          cnpj: string
          contato_responsavel?: string | null
          created_at?: string | null
          data_abertura?: string | null
          dias_prazo_faturamento?: number | null
          email_financeiro_faturamento: string
          endereco_completo?: Json | null
          formas_pagamento_aceitas?: string[] | null
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          limite_credito?: number | null
          nome_fantasia?: string | null
          observacoes_faturamento?: string | null
          razao_social: string
          situacao_cadastral?: string | null
          telefone_comercial: string
          telefone_responsavel?: string | null
        }
        Update: {
          ativo?: boolean | null
          cnae_principal?: string | null
          cnpj?: string
          contato_responsavel?: string | null
          created_at?: string | null
          data_abertura?: string | null
          dias_prazo_faturamento?: number | null
          email_financeiro_faturamento?: string
          endereco_completo?: Json | null
          formas_pagamento_aceitas?: string[] | null
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          limite_credito?: number | null
          nome_fantasia?: string | null
          observacoes_faturamento?: string | null
          razao_social?: string
          situacao_cadastral?: string | null
          telefone_comercial?: string
          telefone_responsavel?: string | null
        }
        Relationships: []
      }
      fechamento_caixa: {
        Row: {
          data_abertura: string
          data_fechamento: string | null
          diferenca_dinheiro: number | null
          entradas_dinheiro: number
          id: string
          observacoes: string | null
          saidas_dinheiro: number
          saldo_final_dinheiro_apurado: number
          saldo_final_dinheiro_informado: number | null
          saldo_inicial_dinheiro: number
          status: Database["public"]["Enums"]["status_caixa"]
          total_cartao_credito: number
          total_cartao_debito: number
          total_pix: number
          total_vales_emitidos: number
          usuario_responsavel_id: string | null
        }
        Insert: {
          data_abertura?: string
          data_fechamento?: string | null
          diferenca_dinheiro?: number | null
          entradas_dinheiro?: number
          id?: string
          observacoes?: string | null
          saidas_dinheiro?: number
          saldo_final_dinheiro_apurado?: number
          saldo_final_dinheiro_informado?: number | null
          saldo_inicial_dinheiro?: number
          status?: Database["public"]["Enums"]["status_caixa"]
          total_cartao_credito?: number
          total_cartao_debito?: number
          total_pix?: number
          total_vales_emitidos?: number
          usuario_responsavel_id?: string | null
        }
        Update: {
          data_abertura?: string
          data_fechamento?: string | null
          diferenca_dinheiro?: number | null
          entradas_dinheiro?: number
          id?: string
          observacoes?: string | null
          saidas_dinheiro?: number
          saldo_final_dinheiro_apurado?: number
          saldo_final_dinheiro_informado?: number | null
          saldo_inicial_dinheiro?: number
          status?: Database["public"]["Enums"]["status_caixa"]
          total_cartao_credito?: number
          total_cartao_debito?: number
          total_pix?: number
          total_vales_emitidos?: number
          usuario_responsavel_id?: string | null
        }
        Relationships: []
      }
      funcionarios: {
        Row: {
          cargo: string
          cpf: string
          created_at: string | null
          dados_bancarios: Json | null
          data_admissao: string
          data_demissao: string | null
          departamento: Database["public"]["Enums"]["departamento_funcionario"]
          email: string | null
          id: string
          limite_mensal_vales: number
          nome_completo: string
          rg: string | null
          salario_base: number
          status: Database["public"]["Enums"]["status_funcionario"]
          telefone_whatsapp: string | null
        }
        Insert: {
          cargo: string
          cpf: string
          created_at?: string | null
          dados_bancarios?: Json | null
          data_admissao?: string
          data_demissao?: string | null
          departamento?: Database["public"]["Enums"]["departamento_funcionario"]
          email?: string | null
          id?: string
          limite_mensal_vales?: number
          nome_completo: string
          rg?: string | null
          salario_base?: number
          status?: Database["public"]["Enums"]["status_funcionario"]
          telefone_whatsapp?: string | null
        }
        Update: {
          cargo?: string
          cpf?: string
          created_at?: string | null
          dados_bancarios?: Json | null
          data_admissao?: string
          data_demissao?: string | null
          departamento?: Database["public"]["Enums"]["departamento_funcionario"]
          email?: string | null
          id?: string
          limite_mensal_vales?: number
          nome_completo?: string
          rg?: string | null
          salario_base?: number
          status?: Database["public"]["Enums"]["status_funcionario"]
          telefone_whatsapp?: string | null
        }
        Relationships: []
      }
      hospedes: {
        Row: {
          cpf_cnpj: string | null
          created_at: string | null
          documento_numero: string | null
          documento_tipo: string | null
          email: string | null
          endereco_completo: Json | null
          id: string
          modelo_veiculo: string | null
          nome_completo: string
          observacoes_preferencias: string | null
          placa_veiculo: string | null
          telefone_whatsapp: string | null
        }
        Insert: {
          cpf_cnpj?: string | null
          created_at?: string | null
          documento_numero?: string | null
          documento_tipo?: string | null
          email?: string | null
          endereco_completo?: Json | null
          id?: string
          modelo_veiculo?: string | null
          nome_completo: string
          observacoes_preferencias?: string | null
          placa_veiculo?: string | null
          telefone_whatsapp?: string | null
        }
        Update: {
          cpf_cnpj?: string | null
          created_at?: string | null
          documento_numero?: string | null
          documento_tipo?: string | null
          email?: string | null
          endereco_completo?: Json | null
          id?: string
          modelo_veiculo?: string | null
          nome_completo?: string
          observacoes_preferencias?: string | null
          placa_veiculo?: string | null
          telefone_whatsapp?: string | null
        }
        Relationships: []
      }
      itens_venda_balcao: {
        Row: {
          id: string
          preco_custo_unitario: number
          preco_unitario: number
          produto_id: string
          quantidade: number
          valor_total: number
          venda_balcao_id: string
        }
        Insert: {
          id?: string
          preco_custo_unitario?: number
          preco_unitario: number
          produto_id: string
          quantidade?: number
          valor_total: number
          venda_balcao_id: string
        }
        Update: {
          id?: string
          preco_custo_unitario?: number
          preco_unitario?: number
          produto_id?: string
          quantidade?: number
          valor_total?: number
          venda_balcao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itens_venda_balcao_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_servicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_venda_balcao_venda_balcao_id_fkey"
            columns: ["venda_balcao_id"]
            isOneToOne: false
            referencedRelation: "vendas_balcao"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes_estoque: {
        Row: {
          custo_unitario: number
          data_movimentacao: string | null
          estoque_anterior: number
          estoque_posterior: number
          id: string
          produto_id: string
          quantidade: number
          referencia_origem_id: string | null
          tipo_movimentacao: Database["public"]["Enums"]["tipo_movimentacao_estoque"]
          usuario_responsavel_id: string | null
        }
        Insert: {
          custo_unitario?: number
          data_movimentacao?: string | null
          estoque_anterior: number
          estoque_posterior: number
          id?: string
          produto_id: string
          quantidade: number
          referencia_origem_id?: string | null
          tipo_movimentacao: Database["public"]["Enums"]["tipo_movimentacao_estoque"]
          usuario_responsavel_id?: string | null
        }
        Update: {
          custo_unitario?: number
          data_movimentacao?: string | null
          estoque_anterior?: number
          estoque_posterior?: number
          id?: string
          produto_id?: string
          quantidade?: number
          referencia_origem_id?: string | null
          tipo_movimentacao?: Database["public"]["Enums"]["tipo_movimentacao_estoque"]
          usuario_responsavel_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_estoque_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      plano_contas: {
        Row: {
          ativo: boolean
          codigo_estruturado: string
          created_at: string | null
          id: string
          nome: string
          tipo: Database["public"]["Enums"]["tipo_plano_contas"]
        }
        Insert: {
          ativo?: boolean
          codigo_estruturado: string
          created_at?: string | null
          id?: string
          nome: string
          tipo: Database["public"]["Enums"]["tipo_plano_contas"]
        }
        Update: {
          ativo?: boolean
          codigo_estruturado?: string
          created_at?: string | null
          id?: string
          nome?: string
          tipo?: Database["public"]["Enums"]["tipo_plano_contas"]
        }
        Relationships: []
      }
      produtos_servicos: {
        Row: {
          ativo: boolean
          categoria_produto: Database["public"]["Enums"]["categoria_produto"]
          codigo_barras_ou_ref: string | null
          created_at: string | null
          estoque_atual: number
          estoque_minimo: number
          id: string
          nome: string
          preco_custo: number
          preco_funcionario: number | null
          preco_venda: number
          unidade_medida: string
        }
        Insert: {
          ativo?: boolean
          categoria_produto?: Database["public"]["Enums"]["categoria_produto"]
          codigo_barras_ou_ref?: string | null
          created_at?: string | null
          estoque_atual?: number
          estoque_minimo?: number
          id?: string
          nome: string
          preco_custo?: number
          preco_funcionario?: number | null
          preco_venda?: number
          unidade_medida?: string
        }
        Update: {
          ativo?: boolean
          categoria_produto?: Database["public"]["Enums"]["categoria_produto"]
          codigo_barras_ou_ref?: string | null
          created_at?: string | null
          estoque_atual?: number
          estoque_minimo?: number
          id?: string
          nome?: string
          preco_custo?: number
          preco_funcionario?: number | null
          preco_venda?: number
          unidade_medida?: string
        }
        Relationships: []
      }
      quartos: {
        Row: {
          andar: number
          categoria_id: string
          created_at: string | null
          id: string
          numero: string
          observacoes_manutencao: string | null
          status_limpeza: Database["public"]["Enums"]["status_limpeza_quarto"]
          status_operacional: Database["public"]["Enums"]["status_operacional_quarto"]
        }
        Insert: {
          andar?: number
          categoria_id: string
          created_at?: string | null
          id?: string
          numero: string
          observacoes_manutencao?: string | null
          status_limpeza?: Database["public"]["Enums"]["status_limpeza_quarto"]
          status_operacional?: Database["public"]["Enums"]["status_operacional_quarto"]
        }
        Update: {
          andar?: number
          categoria_id?: string
          created_at?: string | null
          id?: string
          numero?: string
          observacoes_manutencao?: string | null
          status_limpeza?: Database["public"]["Enums"]["status_limpeza_quarto"]
          status_operacional?: Database["public"]["Enums"]["status_operacional_quarto"]
        }
        Relationships: [
          {
            foreignKeyName: "quartos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_quarto"
            referencedColumns: ["id"]
          },
        ]
      }
      reservas: {
        Row: {
          categoria_id: string
          codigo_reserva: string
          created_at: string | null
          data_checkin_previsto: string
          data_checkin_real: string | null
          data_checkout_previsto: string
          data_checkout_real: string | null
          empresa_id: string | null
          forma_pagamento_reserva: string | null
          hospede_principal_id: string
          id: string
          notas_internas: string | null
          origem_reserva: Database["public"]["Enums"]["origem_reserva"]
          quantidade_adultos: number
          quantidade_criancas: number
          quarto_id: string | null
          saldo_devedor: number
          status: Database["public"]["Enums"]["status_reserva"]
          tipo_reserva: string | null
          valor_consumo_total: number
          valor_desconto: number
          valor_diarias_total: number
          valor_pago_adiantado: number
          valor_total_geral: number
        }
        Insert: {
          categoria_id: string
          codigo_reserva: string
          created_at?: string | null
          data_checkin_previsto: string
          data_checkin_real?: string | null
          data_checkout_previsto: string
          data_checkout_real?: string | null
          empresa_id?: string | null
          forma_pagamento_reserva?: string | null
          hospede_principal_id: string
          id?: string
          notas_internas?: string | null
          origem_reserva?: Database["public"]["Enums"]["origem_reserva"]
          quantidade_adultos?: number
          quantidade_criancas?: number
          quarto_id?: string | null
          saldo_devedor?: number
          status?: Database["public"]["Enums"]["status_reserva"]
          tipo_reserva?: string | null
          valor_consumo_total?: number
          valor_desconto?: number
          valor_diarias_total?: number
          valor_pago_adiantado?: number
          valor_total_geral?: number
        }
        Update: {
          categoria_id?: string
          codigo_reserva?: string
          created_at?: string | null
          data_checkin_previsto?: string
          data_checkin_real?: string | null
          data_checkout_previsto?: string
          data_checkout_real?: string | null
          empresa_id?: string | null
          forma_pagamento_reserva?: string | null
          hospede_principal_id?: string
          id?: string
          notas_internas?: string | null
          origem_reserva?: Database["public"]["Enums"]["origem_reserva"]
          quantidade_adultos?: number
          quantidade_criancas?: number
          quarto_id?: string | null
          saldo_devedor?: number
          status?: Database["public"]["Enums"]["status_reserva"]
          tipo_reserva?: string | null
          valor_consumo_total?: number
          valor_desconto?: number
          valor_diarias_total?: number
          valor_pago_adiantado?: number
          valor_total_geral?: number
        }
        Relationships: [
          {
            foreignKeyName: "reservas_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_quarto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_conveniadas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_hospede_principal_id_fkey"
            columns: ["hospede_principal_id"]
            isOneToOne: false
            referencedRelation: "hospedes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_quarto_id_fkey"
            columns: ["quarto_id"]
            isOneToOne: false
            referencedRelation: "quartos"
            referencedColumns: ["id"]
          },
        ]
      }
      rh_atestados_afastamentos: {
        Row: {
          anexo_atestado_url: string | null
          cid_codigo: string | null
          created_at: string | null
          crm_numero: string | null
          data_emissao: string
          data_inicio_afastamento: string
          data_retorno_prevista: string
          dias_afastamento: number
          funcionario_id: string
          id: string
          medico_nome: string | null
          observacoes: string | null
        }
        Insert: {
          anexo_atestado_url?: string | null
          cid_codigo?: string | null
          created_at?: string | null
          crm_numero?: string | null
          data_emissao?: string
          data_inicio_afastamento: string
          data_retorno_prevista: string
          dias_afastamento: number
          funcionario_id: string
          id?: string
          medico_nome?: string | null
          observacoes?: string | null
        }
        Update: {
          anexo_atestado_url?: string | null
          cid_codigo?: string | null
          created_at?: string | null
          crm_numero?: string | null
          data_emissao?: string
          data_inicio_afastamento?: string
          data_retorno_prevista?: string
          dias_afastamento?: number
          funcionario_id?: string
          id?: string
          medico_nome?: string | null
          observacoes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rh_atestados_afastamentos_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      rh_holerites: {
        Row: {
          ano_competencia: number
          arquivo_holerite_url: string | null
          created_at: string | null
          data_pagamento: string | null
          funcionario_id: string
          id: string
          mes_competencia: number
          salario_base: number
          salario_liquido_receber: number
          status_pagamento: string
          total_descontos_legais: number
          total_proventos: number
          total_vales_descontados: number
        }
        Insert: {
          ano_competencia: number
          arquivo_holerite_url?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          funcionario_id: string
          id?: string
          mes_competencia: number
          salario_base: number
          salario_liquido_receber: number
          status_pagamento?: string
          total_descontos_legais?: number
          total_proventos: number
          total_vales_descontados?: number
        }
        Update: {
          ano_competencia?: number
          arquivo_holerite_url?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          funcionario_id?: string
          id?: string
          mes_competencia?: number
          salario_base?: number
          salario_liquido_receber?: number
          status_pagamento?: string
          total_descontos_legais?: number
          total_proventos?: number
          total_vales_descontados?: number
        }
        Relationships: [
          {
            foreignKeyName: "rh_holerites_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      rh_horas_extras: {
        Row: {
          aprovado_por: string | null
          created_at: string | null
          data_trabalho: string
          funcionario_id: string
          hora_fim: string | null
          hora_inicio: string | null
          id: string
          motivo: string | null
          percentual: Database["public"]["Enums"]["percentual_hora_extra"]
          status_aprovacao: Database["public"]["Enums"]["status_aprovacao_he"]
          total_horas: number
        }
        Insert: {
          aprovado_por?: string | null
          created_at?: string | null
          data_trabalho: string
          funcionario_id: string
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          motivo?: string | null
          percentual?: Database["public"]["Enums"]["percentual_hora_extra"]
          status_aprovacao?: Database["public"]["Enums"]["status_aprovacao_he"]
          total_horas: number
        }
        Update: {
          aprovado_por?: string | null
          created_at?: string | null
          data_trabalho?: string
          funcionario_id?: string
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          motivo?: string | null
          percentual?: Database["public"]["Enums"]["percentual_hora_extra"]
          status_aprovacao?: Database["public"]["Enums"]["status_aprovacao_he"]
          total_horas?: number
        }
        Relationships: [
          {
            foreignKeyName: "rh_horas_extras_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      rh_vales_adiantamentos: {
        Row: {
          ano_competencia: number
          autorizado_por: string | null
          data_solicitacao: string | null
          descricao: string
          funcionario_id: string
          id: string
          mes_competencia: number
          status_desconto: Database["public"]["Enums"]["status_desconto_vale"]
          tipo_vale: Database["public"]["Enums"]["tipo_vale"]
          valor: number
          venda_balcao_id: string | null
        }
        Insert: {
          ano_competencia: number
          autorizado_por?: string | null
          data_solicitacao?: string | null
          descricao: string
          funcionario_id: string
          id?: string
          mes_competencia: number
          status_desconto?: Database["public"]["Enums"]["status_desconto_vale"]
          tipo_vale?: Database["public"]["Enums"]["tipo_vale"]
          valor: number
          venda_balcao_id?: string | null
        }
        Update: {
          ano_competencia?: number
          autorizado_por?: string | null
          data_solicitacao?: string | null
          descricao?: string
          funcionario_id?: string
          id?: string
          mes_competencia?: number
          status_desconto?: Database["public"]["Enums"]["status_desconto_vale"]
          tipo_vale?: Database["public"]["Enums"]["tipo_vale"]
          valor?: number
          venda_balcao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rh_vales_adiantamentos_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rh_vales_adiantamentos_venda_balcao_id_fkey"
            columns: ["venda_balcao_id"]
            isOneToOne: false
            referencedRelation: "vendas_balcao"
            referencedColumns: ["id"]
          },
        ]
      }
      transacoes_financeiras: {
        Row: {
          comprovante_autorizacao_nsu: string | null
          conta_id: string | null
          created_at: string | null
          fechamento_caixa_id: string | null
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"]
          id: string
          plano_contas_id: string | null
          reserva_id: string | null
          taxa_operadora: number
          tipo: Database["public"]["Enums"]["tipo_transacao"]
          valor_bruto: number
          valor_liquido: number
          venda_balcao_id: string | null
        }
        Insert: {
          comprovante_autorizacao_nsu?: string | null
          conta_id?: string | null
          created_at?: string | null
          fechamento_caixa_id?: string | null
          forma_pagamento?: Database["public"]["Enums"]["forma_pagamento"]
          id?: string
          plano_contas_id?: string | null
          reserva_id?: string | null
          taxa_operadora?: number
          tipo: Database["public"]["Enums"]["tipo_transacao"]
          valor_bruto: number
          valor_liquido: number
          venda_balcao_id?: string | null
        }
        Update: {
          comprovante_autorizacao_nsu?: string | null
          conta_id?: string | null
          created_at?: string | null
          fechamento_caixa_id?: string | null
          forma_pagamento?: Database["public"]["Enums"]["forma_pagamento"]
          id?: string
          plano_contas_id?: string | null
          reserva_id?: string | null
          taxa_operadora?: number
          tipo?: Database["public"]["Enums"]["tipo_transacao"]
          valor_bruto?: number
          valor_liquido?: number
          venda_balcao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transacoes_financeiras_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas_pagar_receber"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_financeiras_fechamento_caixa_id_fkey"
            columns: ["fechamento_caixa_id"]
            isOneToOne: false
            referencedRelation: "fechamento_caixa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_financeiras_plano_contas_id_fkey"
            columns: ["plano_contas_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_financeiras_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: false
            referencedRelation: "reservas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_financeiras_venda_balcao_id_fkey"
            columns: ["venda_balcao_id"]
            isOneToOne: false
            referencedRelation: "vendas_balcao"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas_balcao: {
        Row: {
          cliente_nome_avulso: string | null
          codigo_venda: string
          data_venda: string | null
          fechamento_caixa_id: string | null
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"]
          funcionario_id: string | null
          id: string
          operador_id: string | null
          tipo_venda: Database["public"]["Enums"]["tipo_venda_balcao"]
          valor_desconto: number
          valor_total_bruto: number
          valor_total_liquido: number
        }
        Insert: {
          cliente_nome_avulso?: string | null
          codigo_venda: string
          data_venda?: string | null
          fechamento_caixa_id?: string | null
          forma_pagamento?: Database["public"]["Enums"]["forma_pagamento"]
          funcionario_id?: string | null
          id?: string
          operador_id?: string | null
          tipo_venda?: Database["public"]["Enums"]["tipo_venda_balcao"]
          valor_desconto?: number
          valor_total_bruto?: number
          valor_total_liquido?: number
        }
        Update: {
          cliente_nome_avulso?: string | null
          codigo_venda?: string
          data_venda?: string | null
          fechamento_caixa_id?: string | null
          forma_pagamento?: Database["public"]["Enums"]["forma_pagamento"]
          funcionario_id?: string | null
          id?: string
          operador_id?: string | null
          tipo_venda?: Database["public"]["Enums"]["tipo_venda_balcao"]
          valor_desconto?: number
          valor_total_bruto?: number
          valor_total_liquido?: number
        }
        Relationships: [
          {
            foreignKeyName: "vendas_balcao_fechamento_caixa_id_fkey"
            columns: ["fechamento_caixa_id"]
            isOneToOne: false
            referencedRelation: "fechamento_caixa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_balcao_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      categoria_produto:
        | "frigobar"
        | "bar_restaurante"
        | "lavanderia"
        | "conveniencia"
        | "taxas"
      departamento_funcionario:
        | "recepcao"
        | "governanca"
        | "manutencao"
        | "financeiro_adm"
        | "gerencia"
      forma_pagamento:
        | "dinheiro"
        | "pix"
        | "cartao_debito"
        | "cartao_credito_vista"
        | "cartao_credito_parcelado"
        | "vale_folha"
        | "faturado_boleto"
      origem_reserva:
        | "balcao"
        | "whatsapp"
        | "telefone"
        | "booking"
        | "airbnb"
        | "site_proprio"
        | "empresa"
      percentual_hora_extra: "50%" | "100%_domingo_feriado" | "noturno"
      status_aprovacao_he: "pendente" | "aprovado" | "pago_folha" | "rejeitado"
      status_caixa: "aberto" | "fechado" | "auditado"
      status_conta: "pendente" | "pago_recebido" | "parcial" | "cancelado"
      status_desconto_vale:
        | "pendente_desconto"
        | "descontado_em_folha"
        | "cancelado"
      status_funcionario: "ativo" | "ferias" | "afastado_medico" | "desligado"
      status_limpeza_quarto:
        | "limpo"
        | "sujo_checkin_pendente"
        | "em_limpeza"
        | "inspecionado"
      status_operacional_quarto:
        | "livre"
        | "ocupado"
        | "bloqueado_manutencao"
        | "fora_de_servico"
      status_reserva:
        | "pre_reserva"
        | "confirmada"
        | "hospedado_checkin"
        | "finalizada_checkout"
        | "no_show"
        | "cancelada"
        | "bloqueio"
      tipo_conta: "pagar" | "receber"
      tipo_movimentacao_estoque:
        | "entrada_compra"
        | "saida_consumo_quarto"
        | "saida_venda_balcao"
        | "saida_vale_funcionario"
        | "ajuste_inventario"
        | "perda_quebra"
      tipo_plano_contas:
        | "receita_operacional"
        | "deducao_receita"
        | "custo_operacional"
        | "despesa_administrativa"
        | "despesa_pessoal"
        | "despesa_manutencao"
        | "despesa_financeira"
        | "tributos"
      tipo_transacao: "entrada" | "saida"
      tipo_vale:
        | "vale_produto_balcao"
        | "adiantamento_salarial_dinheiro"
        | "adiantamento_pix"
      tipo_venda_balcao: "cliente_avulso" | "vale_funcionario"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      categoria_produto: [
        "frigobar",
        "bar_restaurante",
        "lavanderia",
        "conveniencia",
        "taxas",
      ],
      departamento_funcionario: [
        "recepcao",
        "governanca",
        "manutencao",
        "financeiro_adm",
        "gerencia",
      ],
      forma_pagamento: [
        "dinheiro",
        "pix",
        "cartao_debito",
        "cartao_credito_vista",
        "cartao_credito_parcelado",
        "vale_folha",
        "faturado_boleto",
      ],
      origem_reserva: [
        "balcao",
        "whatsapp",
        "telefone",
        "booking",
        "airbnb",
        "site_proprio",
        "empresa",
      ],
      percentual_hora_extra: ["50%", "100%_domingo_feriado", "noturno"],
      status_aprovacao_he: ["pendente", "aprovado", "pago_folha", "rejeitado"],
      status_caixa: ["aberto", "fechado", "auditado"],
      status_conta: ["pendente", "pago_recebido", "parcial", "cancelado"],
      status_desconto_vale: [
        "pendente_desconto",
        "descontado_em_folha",
        "cancelado",
      ],
      status_funcionario: ["ativo", "ferias", "afastado_medico", "desligado"],
      status_limpeza_quarto: [
        "limpo",
        "sujo_checkin_pendente",
        "em_limpeza",
        "inspecionado",
      ],
      status_operacional_quarto: [
        "livre",
        "ocupado",
        "bloqueado_manutencao",
        "fora_de_servico",
      ],
      status_reserva: [
        "pre_reserva",
        "confirmada",
        "hospedado_checkin",
        "finalizada_checkout",
        "no_show",
        "cancelada",
        "bloqueio",
      ],
      tipo_conta: ["pagar", "receber"],
      tipo_movimentacao_estoque: [
        "entrada_compra",
        "saida_consumo_quarto",
        "saida_venda_balcao",
        "saida_vale_funcionario",
        "ajuste_inventario",
        "perda_quebra",
      ],
      tipo_plano_contas: [
        "receita_operacional",
        "deducao_receita",
        "custo_operacional",
        "despesa_administrativa",
        "despesa_pessoal",
        "despesa_manutencao",
        "despesa_financeira",
        "tributos",
      ],
      tipo_transacao: ["entrada", "saida"],
      tipo_vale: [
        "vale_produto_balcao",
        "adiantamento_salarial_dinheiro",
        "adiantamento_pix",
      ],
      tipo_venda_balcao: ["cliente_avulso", "vale_funcionario"],
    },
  },
} as const
