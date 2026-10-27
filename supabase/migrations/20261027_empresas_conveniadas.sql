-- Migration: Cadastro de Empresas Conveniadas e Suporte a Reservas Corporativas B2B
-- Hotel Tio Luiz

CREATE TABLE IF NOT EXISTS public.empresas_conveniadas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    cnpj VARCHAR(30) NOT NULL UNIQUE,
    inscricao_estadual VARCHAR(30),
    inscricao_municipal VARCHAR(30),
    cnae_principal VARCHAR(50),
    situacao_cadastral VARCHAR(30) DEFAULT 'ATIVA',
    data_abertura DATE,
    telefone_comercial VARCHAR(30) NOT NULL,
    email_financeiro_faturamento VARCHAR(150) NOT NULL,
    contato_responsavel VARCHAR(150),
    telefone_responsavel VARCHAR(30),
    endereco_completo JSONB DEFAULT '{"cep":"", "logradouro":"", "numero":"", "complemento":"", "bairro":"", "cidade":"", "uf":""}'::jsonb,
    formas_pagamento_aceitas TEXT[] DEFAULT ARRAY['faturado_boleto_30d']::TEXT[],
    limite_credito NUMERIC(10,2) DEFAULT 5000.00,
    dias_prazo_faturamento INT DEFAULT 30,
    observacoes_faturamento TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.empresas_conveniadas ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'empresas_conveniadas' AND policyname = 'Permitir tudo para empresas_conveniadas publicamente'
    ) THEN
        CREATE POLICY "Permitir tudo para empresas_conveniadas publicamente"
        ON public.empresas_conveniadas FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

ALTER TABLE public.reservas 
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas_conveniadas(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS tipo_reserva VARCHAR(20) DEFAULT 'particular',
ADD COLUMN IF NOT EXISTS forma_pagamento_reserva VARCHAR(50) DEFAULT 'balcao';

INSERT INTO public.empresas_conveniadas (razao_social, nome_fantasia, cnpj, telefone_comercial, email_financeiro_faturamento, contato_responsavel, formas_pagamento_aceitas, limite_credito, dias_prazo_faturamento)
VALUES 
('KOLLAC ENGENHARIA E CONSTRUCOES LTDA', 'KOLLAC ENGENHARIA', '11.111.111/0001-03', '(44) 3028-1100', 'financeiro@kollac.com.br', 'Marcos Vinicios', ARRAY['faturado_boleto_30d', 'pix_faturado'], 15000.00, 30),
('METALURGICA S/A INDUSTRIA E COMERCIO', 'METALURGICA S/A', '11.111.111/0001-07', '(44) 3225-4400', 'contasapagar@metalurgica.com.br', 'Gestor de Contratos', ARRAY['faturado_boleto_30d', 'faturado_boleto_15d'], 25000.00, 30),
('INCOPISOS REVESTIMENTOS CERAMICOS LTDA', 'INCOPISOS', '11.111.111/0001-02', '(44) 3642-7700', 'faturamento@incopisos.com.br', 'Andre Incopisos', ARRAY['faturado_boleto_15d', 'cartao_credito_corporativo'], 10000.00, 15)
ON CONFLICT (cnpj) DO NOTHING;

UPDATE public.reservas r
SET empresa_id = e.id, tipo_reserva = 'empresa'
FROM public.empresas_conveniadas e
JOIN public.hospedes h ON (h.nome_completo ILIKE '%' || e.nome_fantasia || '%' OR (e.nome_fantasia ILIKE 'KOLLAC%' AND h.nome_completo ILIKE '%KOLLAC%'))
WHERE r.hospede_principal_id = h.id AND r.empresa_id IS NULL;
