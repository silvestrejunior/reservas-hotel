-- Migration: Campos FNRH para Cadastro Completo de Hóspedes
-- Hotel Tio Luiz

ALTER TABLE public.hospedes 
ADD COLUMN IF NOT EXISTS data_nascimento DATE,
ADD COLUMN IF NOT EXISTS nacionalidade VARCHAR(50) DEFAULT 'Brasileira',
ADD COLUMN IF NOT EXISTS profissao VARCHAR(100);
