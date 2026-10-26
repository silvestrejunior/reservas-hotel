-- ==============================================================================
-- SCHEMA INICIAL: NOVO PMS E ERP HOTEL TIO LUIZ
-- Hotelaria, PDV Balcão, Estoque, RH Confidencial, Financeiro & DRE Gerencial
-- ==============================================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TIPOS CUSTOMIZADOS (ENUMS)
DO $$ BEGIN
    CREATE TYPE status_operacional_quarto AS ENUM ('livre', 'ocupado', 'bloqueado_manutencao', 'fora_de_servico');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE status_limpeza_quarto AS ENUM ('limpo', 'sujo_checkin_pendente', 'em_limpeza', 'inspecionado');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE status_reserva AS ENUM ('pre_reserva', 'confirmada', 'hospedado_checkin', 'finalizada_checkout', 'no_show', 'cancelada', 'bloqueio');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE origem_reserva AS ENUM ('balcao', 'whatsapp', 'telefone', 'booking', 'airbnb', 'site_proprio', 'empresa');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE categoria_produto AS ENUM ('frigobar', 'bar_restaurante', 'lavanderia', 'conveniencia', 'taxas');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE tipo_movimentacao_estoque AS ENUM ('entrada_compra', 'saida_consumo_quarto', 'saida_venda_balcao', 'saida_vale_funcionario', 'ajuste_inventario', 'perda_quebra');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE tipo_venda_balcao AS ENUM ('cliente_avulso', 'vale_funcionario');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE forma_pagamento AS ENUM ('dinheiro', 'pix', 'cartao_debito', 'cartao_credito_vista', 'cartao_credito_parcelado', 'vale_folha', 'faturado_boleto');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE departamento_funcionario AS ENUM ('recepcao', 'governanca', 'manutencao', 'financeiro_adm', 'gerencia');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE status_funcionario AS ENUM ('ativo', 'ferias', 'afastado_medico', 'desligado');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE tipo_vale AS ENUM ('vale_produto_balcao', 'adiantamento_salarial_dinheiro', 'adiantamento_pix');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE status_desconto_vale AS ENUM ('pendente_desconto', 'descontado_em_folha', 'cancelado');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE percentual_hora_extra AS ENUM ('50%', '100%_domingo_feriado', 'noturno');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE status_aprovacao_he AS ENUM ('pendente', 'aprovado', 'pago_folha', 'rejeitado');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE tipo_conta AS ENUM ('pagar', 'receber');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE status_conta AS ENUM ('pendente', 'pago_recebido', 'parcial', 'cancelado');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE status_caixa AS ENUM ('aberto', 'fechado', 'auditado');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE tipo_transacao AS ENUM ('entrada', 'saida');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE tipo_plano_contas AS ENUM (
        'receita_operacional',
        'deducao_receita',
        'custo_operacional',
        'despesa_administrativa',
        'despesa_pessoal',
        'despesa_manutencao',
        'despesa_financeira',
        'tributos'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. TABELAS DE HOTELARIA
CREATE TABLE IF NOT EXISTS categorias_quarto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    capacidade_adultos INT NOT NULL DEFAULT 2,
    capacidade_criancas INT NOT NULL DEFAULT 1,
    tarifa_padrao NUMERIC(10,2) NOT NULL DEFAULT 150.00,
    cor_identificacao VARCHAR(20) NOT NULL DEFAULT '#3B82F6',
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quartos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero VARCHAR(20) NOT NULL UNIQUE,
    categoria_id UUID NOT NULL REFERENCES categorias_quarto(id) ON DELETE RESTRICT,
    andar INT NOT NULL DEFAULT 1,
    status_operacional status_operacional_quarto NOT NULL DEFAULT 'livre',
    status_limpeza status_limpeza_quarto NOT NULL DEFAULT 'limpo',
    observacoes_manutencao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hospedes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_completo VARCHAR(255) NOT NULL,
    cpf_cnpj VARCHAR(30) UNIQUE,
    documento_tipo VARCHAR(20),
    documento_numero VARCHAR(30),
    telefone_whatsapp VARCHAR(30),
    email VARCHAR(150),
    endereco_completo JSONB DEFAULT '{}'::jsonb,
    placa_veiculo VARCHAR(20),
    modelo_veiculo VARCHAR(50),
    observacoes_preferencias TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reservas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_reserva VARCHAR(30) NOT NULL UNIQUE,
    hospede_principal_id UUID NOT NULL REFERENCES hospedes(id) ON DELETE RESTRICT,
    quarto_id UUID REFERENCES quartos(id) ON DELETE SET NULL,
    categoria_id UUID NOT NULL REFERENCES categorias_quarto(id) ON DELETE RESTRICT,
    status status_reserva NOT NULL DEFAULT 'confirmada',
    data_checkin_previsto TIMESTAMP WITH TIME ZONE NOT NULL,
    data_checkout_previsto TIMESTAMP WITH TIME ZONE NOT NULL,
    data_checkin_real TIMESTAMP WITH TIME ZONE,
    data_checkout_real TIMESTAMP WITH TIME ZONE,
    quantidade_adultos INT NOT NULL DEFAULT 1,
    quantidade_criancas INT NOT NULL DEFAULT 0,
    origem_reserva origem_reserva NOT NULL DEFAULT 'balcao',
    valor_diarias_total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    valor_consumo_total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    valor_desconto NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    valor_total_geral NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    valor_pago_adiantado NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    saldo_devedor NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    notas_internas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. PRODUTOS, ESTOQUE E CONSUMO
CREATE TABLE IF NOT EXISTS produtos_servicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_barras_ou_ref VARCHAR(50),
    nome VARCHAR(150) NOT NULL,
    categoria_produto categoria_produto NOT NULL DEFAULT 'frigobar',
    preco_custo NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    preco_venda NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    preco_funcionario NUMERIC(10,2),
    estoque_atual NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    estoque_minimo NUMERIC(10,2) NOT NULL DEFAULT 5.00,
    unidade_medida VARCHAR(10) NOT NULL DEFAULT 'UN',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    produto_id UUID NOT NULL REFERENCES produtos_servicos(id) ON DELETE CASCADE,
    tipo_movimentacao tipo_movimentacao_estoque NOT NULL,
    quantidade NUMERIC(10,2) NOT NULL,
    estoque_anterior NUMERIC(10,2) NOT NULL,
    estoque_posterior NUMERIC(10,2) NOT NULL,
    custo_unitario NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    referencia_origem_id UUID,
    usuario_responsavel_id UUID,
    data_movimentacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consumo_reserva (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reserva_id UUID NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
    produto_id UUID NOT NULL REFERENCES produtos_servicos(id) ON DELETE RESTRICT,
    quantidade INT NOT NULL DEFAULT 1,
    valor_unitario NUMERIC(10,2) NOT NULL,
    valor_total NUMERIC(10,2) NOT NULL,
    custo_total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    lancado_por UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. RH & DEPARTAMENTO PESSOAL (CONFIDENCIAL)
CREATE TABLE IF NOT EXISTS funcionarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_completo VARCHAR(255) NOT NULL,
    cpf VARCHAR(20) NOT NULL UNIQUE,
    rg VARCHAR(30),
    cargo VARCHAR(100) NOT NULL,
    departamento departamento_funcionario NOT NULL DEFAULT 'recepcao',
    salario_base NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    data_admissao DATE NOT NULL DEFAULT CURRENT_DATE,
    data_demissao DATE,
    telefone_whatsapp VARCHAR(30),
    email VARCHAR(150),
    status status_funcionario NOT NULL DEFAULT 'ativo',
    limite_mensal_vales NUMERIC(10,2) NOT NULL DEFAULT 300.00,
    dados_bancarios JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rh_vales_adiantamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funcionario_id UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
    tipo_vale tipo_vale NOT NULL DEFAULT 'vale_produto_balcao',
    venda_balcao_id UUID,
    descricao VARCHAR(255) NOT NULL,
    valor NUMERIC(10,2) NOT NULL,
    mes_competencia INT NOT NULL,
    ano_competencia INT NOT NULL,
    status_desconto status_desconto_vale NOT NULL DEFAULT 'pendente_desconto',
    data_solicitacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    autorizado_por UUID
);

CREATE TABLE IF NOT EXISTS rh_horas_extras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funcionario_id UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
    data_trabalho DATE NOT NULL,
    hora_inicio TIME,
    hora_fim TIME,
    total_horas NUMERIC(5,2) NOT NULL,
    percentual percentual_hora_extra NOT NULL DEFAULT '50%',
    motivo TEXT,
    status_aprovacao status_aprovacao_he NOT NULL DEFAULT 'pendente',
    aprovado_por UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rh_atestados_afastamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funcionario_id UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
    data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
    data_inicio_afastamento DATE NOT NULL,
    data_retorno_prevista DATE NOT NULL,
    dias_afastamento INT NOT NULL,
    medico_nome VARCHAR(150),
    crm_numero VARCHAR(50),
    cid_codigo VARCHAR(20),
    observacoes TEXT,
    anexo_atestado_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rh_holerites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funcionario_id UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
    mes_competencia INT NOT NULL,
    ano_competencia INT NOT NULL,
    salario_base NUMERIC(10,2) NOT NULL,
    total_proventos NUMERIC(10,2) NOT NULL,
    total_vales_descontados NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_descontos_legais NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    salario_liquido_receber NUMERIC(10,2) NOT NULL,
    arquivo_holerite_url TEXT,
    status_pagamento VARCHAR(30) NOT NULL DEFAULT 'gerado',
    data_pagamento DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(funcionario_id, mes_competencia, ano_competencia)
);

-- 6. FINANCEIRO, CAIXA, DRE & PDV BALCÃO
CREATE TABLE IF NOT EXISTS fechamento_caixa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_abertura TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    data_fechamento TIMESTAMP WITH TIME ZONE,
    usuario_responsavel_id UUID,
    saldo_inicial_dinheiro NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    entradas_dinheiro NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    saidas_dinheiro NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    saldo_final_dinheiro_apurado NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    saldo_final_dinheiro_informado NUMERIC(10,2),
    diferenca_dinheiro NUMERIC(10,2) DEFAULT 0.00,
    total_pix NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_cartao_debito NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_cartao_credito NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_vales_emitidos NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    status status_caixa NOT NULL DEFAULT 'aberto',
    observacoes TEXT
);

CREATE TABLE IF NOT EXISTS plano_contas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_estruturado VARCHAR(30) NOT NULL UNIQUE,
    nome VARCHAR(150) NOT NULL,
    tipo tipo_plano_contas NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contas_pagar_receber (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo tipo_conta NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    plano_contas_id UUID NOT NULL REFERENCES plano_contas(id) ON DELETE RESTRICT,
    fornecedor_cliente VARCHAR(150),
    valor_nominal NUMERIC(10,2) NOT NULL,
    data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
    data_vencimento DATE NOT NULL,
    data_liquidacao DATE,
    valor_liquidado NUMERIC(10,2) DEFAULT 0.00,
    valor_juros_multa NUMERIC(10,2) DEFAULT 0.00,
    valor_desconto NUMERIC(10,2) DEFAULT 0.00,
    status status_conta NOT NULL DEFAULT 'pendente',
    documento_fiscal_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendas_balcao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_venda VARCHAR(30) NOT NULL UNIQUE,
    tipo_venda tipo_venda_balcao NOT NULL DEFAULT 'cliente_avulso',
    funcionario_id UUID REFERENCES funcionarios(id) ON DELETE SET NULL,
    cliente_nome_avulso VARCHAR(150),
    valor_total_bruto NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    valor_desconto NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    valor_total_liquido NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    forma_pagamento forma_pagamento NOT NULL DEFAULT 'dinheiro',
    fechamento_caixa_id UUID REFERENCES fechamento_caixa(id) ON DELETE SET NULL,
    operador_id UUID,
    data_venda TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS itens_venda_balcao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venda_balcao_id UUID NOT NULL REFERENCES vendas_balcao(id) ON DELETE CASCADE,
    produto_id UUID NOT NULL REFERENCES produtos_servicos(id) ON DELETE RESTRICT,
    quantidade INT NOT NULL DEFAULT 1,
    preco_unitario NUMERIC(10,2) NOT NULL,
    preco_custo_unitario NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    valor_total NUMERIC(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS transacoes_financeiras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fechamento_caixa_id UUID REFERENCES fechamento_caixa(id) ON DELETE SET NULL,
    reserva_id UUID REFERENCES reservas(id) ON DELETE SET NULL,
    venda_balcao_id UUID REFERENCES vendas_balcao(id) ON DELETE SET NULL,
    conta_id UUID REFERENCES contas_pagar_receber(id) ON DELETE SET NULL,
    plano_contas_id UUID REFERENCES plano_contas(id) ON DELETE SET NULL,
    tipo tipo_transacao NOT NULL,
    valor_bruto NUMERIC(10,2) NOT NULL,
    taxa_operadora NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    valor_liquido NUMERIC(10,2) NOT NULL,
    forma_pagamento forma_pagamento NOT NULL DEFAULT 'dinheiro',
    comprovante_autorizacao_nsu VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 7. TRIGGER AUTOMÁTICO DE BAIXA DE ESTOQUE
-- ==============================================================================
CREATE OR REPLACE FUNCTION trg_baixa_estoque_venda_balcao()
RETURNS TRIGGER AS $$
DECLARE
    v_estoque_atual NUMERIC;
    v_tipo_mov tipo_movimentacao_estoque;
    v_tipo_venda tipo_venda_balcao;
    v_funcionario_id UUID;
    v_cod_venda VARCHAR;
BEGIN
    SELECT tipo_venda, funcionario_id, codigo_venda INTO v_tipo_venda, v_funcionario_id, v_cod_venda 
    FROM vendas_balcao WHERE id = NEW.venda_balcao_id;

    SELECT estoque_atual INTO v_estoque_atual FROM produtos_servicos WHERE id = NEW.produto_id;
    
    IF v_tipo_venda = 'vale_funcionario' THEN
        v_tipo_mov := 'saida_vale_funcionario';
    ELSE
        v_tipo_mov := 'saida_venda_balcao';
    END IF;

    -- Atualiza produto
    UPDATE produtos_servicos 
    SET estoque_atual = estoque_atual - NEW.quantidade
    WHERE id = NEW.produto_id;

    -- Registra movimentação detalhada
    INSERT INTO movimentacoes_estoque (
        produto_id,
        tipo_movimentacao,
        quantidade,
        estoque_anterior,
        estoque_posterior,
        custo_unitario,
        referencia_origem_id
    ) VALUES (
        NEW.produto_id,
        v_tipo_mov,
        NEW.quantidade,
        v_estoque_atual,
        v_estoque_atual - NEW.quantidade,
        NEW.preco_custo_unitario,
        NEW.venda_balcao_id
    );

    -- Se for vale para funcionário, cria lançamento no módulo de RH
    IF v_tipo_venda = 'vale_funcionario' AND v_funcionario_id IS NOT NULL THEN
        INSERT INTO rh_vales_adiantamentos (
            funcionario_id,
            tipo_vale,
            venda_balcao_id,
            descricao,
            valor,
            mes_competencia,
            ano_competencia
        ) VALUES (
            v_funcionario_id,
            'vale_produto_balcao',
            NEW.venda_balcao_id,
            'Consumo Balcão (' || v_cod_venda || ')',
            NEW.valor_total,
            EXTRACT(MONTH FROM CURRENT_DATE)::INT,
            EXTRACT(YEAR FROM CURRENT_DATE)::INT
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_after_insert_item_venda ON itens_venda_balcao;
CREATE TRIGGER trg_after_insert_item_venda
AFTER INSERT ON itens_venda_balcao
FOR EACH ROW EXECUTE FUNCTION trg_baixa_estoque_venda_balcao();

-- ==============================================================================
-- 8. CARGA INICIAL (SEEDS) DO HOTEL TIO LUIZ
-- ==============================================================================

-- Categorias Reais
INSERT INTO categorias_quarto (id, nome, capacidade_adultos, capacidade_criancas, tarifa_padrao, cor_identificacao, descricao)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Apto Ar Condicionado', 2, 1, 180.00, '#2563EB', 'Apartamento equipado com Ar Condicionado Split, TV e Frigobar'),
    ('22222222-2222-2222-2222-222222222222', 'Apto Ventilador', 2, 1, 140.00, '#059669', 'Apartamento aconchegante com Ventilador de Teto e TV'),
    ('33333333-3333-3333-3333-333333333333', 'Apto Vent Solteiro', 1, 0, 110.00, '#D97706', 'Apartamento individual compacto com Ventilador')
ON CONFLICT (id) DO NOTHING;

-- As 32 UHs (101 a 132)
INSERT INTO quartos (numero, categoria_id, andar, status_operacional, status_limpeza)
VALUES
    ('101', '11111111-1111-1111-1111-111111111111', 1, 'livre', 'limpo'),
    ('102', '11111111-1111-1111-1111-111111111111', 1, 'livre', 'limpo'),
    ('103', '11111111-1111-1111-1111-111111111111', 1, 'livre', 'limpo'),
    ('104', '11111111-1111-1111-1111-111111111111', 1, 'livre', 'limpo'),
    ('105', '11111111-1111-1111-1111-111111111111', 1, 'livre', 'limpo'),
    ('106', '11111111-1111-1111-1111-111111111111', 1, 'livre', 'limpo'),
    ('107', '11111111-1111-1111-1111-111111111111', 1, 'livre', 'limpo'),
    ('108', '11111111-1111-1111-1111-111111111111', 1, 'livre', 'limpo'),
    ('109', '11111111-1111-1111-1111-111111111111', 1, 'livre', 'limpo'),
    ('110', '11111111-1111-1111-1111-111111111111', 1, 'livre', 'limpo'),
    ('111', '11111111-1111-1111-1111-111111111111', 1, 'livre', 'limpo'),
    ('112', '11111111-1111-1111-1111-111111111111', 1, 'livre', 'limpo'),
    ('113', '11111111-1111-1111-1111-111111111111', 1, 'livre', 'limpo'),
    ('114', '11111111-1111-1111-1111-111111111111', 1, 'livre', 'limpo'),
    ('115', '11111111-1111-1111-1111-111111111111', 1, 'livre', 'limpo'),
    ('116', '22222222-2222-2222-2222-222222222222', 2, 'livre', 'limpo'),
    ('117', '22222222-2222-2222-2222-222222222222', 2, 'livre', 'limpo'),
    ('118', '22222222-2222-2222-2222-222222222222', 2, 'livre', 'limpo'),
    ('119', '22222222-2222-2222-2222-222222222222', 2, 'livre', 'limpo'),
    ('120', '22222222-2222-2222-2222-222222222222', 2, 'livre', 'limpo'),
    ('121', '22222222-2222-2222-2222-222222222222', 2, 'livre', 'limpo'),
    ('122', '22222222-2222-2222-2222-222222222222', 2, 'livre', 'limpo'),
    ('123', '22222222-2222-2222-2222-222222222222', 2, 'livre', 'limpo'),
    ('124', '22222222-2222-2222-2222-222222222222', 2, 'livre', 'limpo'),
    ('125', '22222222-2222-2222-2222-222222222222', 2, 'livre', 'limpo'),
    ('126', '22222222-2222-2222-2222-222222222222', 2, 'livre', 'limpo'),
    ('127', '22222222-2222-2222-2222-222222222222', 2, 'livre', 'limpo'),
    ('128', '22222222-2222-2222-2222-222222222222', 2, 'livre', 'limpo'),
    ('129', '33333333-3333-3333-3333-333333333333', 2, 'livre', 'limpo'),
    ('130', '33333333-3333-3333-3333-333333333333', 2, 'livre', 'limpo'),
    ('131', '33333333-3333-3333-3333-333333333333', 2, 'livre', 'limpo'),
    ('132', '33333333-3333-3333-3333-333333333333', 2, 'livre', 'limpo')
ON CONFLICT (numero) DO NOTHING;

-- Plano de Contas Estruturado para o DRE
INSERT INTO plano_contas (codigo_estruturado, nome, tipo)
VALUES
    ('1.01', 'Receita de Hospedagem / Diárias', 'receita_operacional'),
    ('1.02', 'Receita de Vendas de Balcão e Frigobar', 'receita_operacional'),
    ('1.03', 'Receita de Serviços (Lavanderia, Taxas)', 'receita_operacional'),
    ('2.01', 'Deduções e Descontos Concedidos', 'deducao_receita'),
    ('2.02', 'Comissões de Canais e Plataformas (OTAs)', 'deducao_receita'),
    ('3.01', 'Insumos do Café da Manhã e Alimentos', 'custo_operacional'),
    ('3.02', 'Custo de Mercadorias Vendidas (CMV Balcão/Frigobar)', 'custo_operacional'),
    ('3.03', 'Lavanderia Terceirizada e Amenities', 'custo_operacional'),
    ('4.01', 'Folha de Pagamento Salários', 'despesa_pessoal'),
    ('4.02', 'Horas Extras e Adicionais', 'despesa_pessoal'),
    ('4.03', 'Encargos Trabalhistas (FGTS/INSS)', 'despesa_pessoal'),
    ('4.04', 'Energia Elétrica', 'despesa_administrativa'),
    ('4.05', 'Água e Esgoto', 'despesa_administrativa'),
    ('4.06', 'Internet, Telefonia e TI', 'despesa_administrativa'),
    ('4.07', 'Manutenção Predial e Reparos', 'despesa_manutencao'),
    ('4.08', 'Softwares e Licenças', 'despesa_administrativa'),
    ('5.01', 'Taxas de Maquininha de Cartão de Crédito/Débito', 'despesa_financeira'),
    ('5.02', 'Tarifas Bancárias e Custas', 'despesa_financeira'),
    ('6.01', 'Impostos e Tributos (Simples Nacional / ISS)', 'tributos')
ON CONFLICT (codigo_estruturado) DO NOTHING;

-- Produtos de Exemplo com Estoque
INSERT INTO produtos_servicos (codigo_barras_ou_ref, nome, categoria_produto, preco_custo, preco_venda, estoque_atual, estoque_minimo)
VALUES
    ('AG-01', 'Água Mineral sem Gás 500ml', 'frigobar', 1.80, 5.00, 48, 12),
    ('AG-02', 'Água Mineral com Gás 500ml', 'frigobar', 2.00, 5.50, 36, 12),
    ('REF-01', 'Refrigerante Coca-Cola Lata 350ml', 'frigobar', 3.20, 7.00, 30, 10),
    ('CER-01', 'Cerveja Heineken Long Neck 330ml', 'frigobar', 6.50, 12.00, 24, 8),
    ('GL-01', 'Pacote de Gelo 5kg', 'conveniencia', 5.00, 12.00, 10, 4)
ON CONFLICT DO NOTHING;

-- 9. CONFIGURAÇÃO DE REALTIME PARA SINCRONIZAÇÃO INSTANTÂNEA
ALTER PUBLICATION supabase_realtime ADD TABLE quartos;
ALTER PUBLICATION supabase_realtime ADD TABLE reservas;
ALTER PUBLICATION supabase_realtime ADD TABLE fechamento_caixa;
ALTER PUBLICATION supabase_realtime ADD TABLE vendas_balcao;
