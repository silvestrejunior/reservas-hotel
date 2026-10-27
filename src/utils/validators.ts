/**
 * Utilitários de Validação e Formatação de Documentos (CPF, CNPJ, Telefone)
 * Hotel Tio Luiz PMS
 */

// Limpa caracteres especiais, deixando apenas dígitos
export const apenasDigitos = (val: string | null | undefined): string => {
  if (!val) return '';
  return val.replace(/\D/g, '');
};

// Validação Matemática Oficial de CPF (Receita Federal)
export const validarCPF = (cpf: string): boolean => {
  const limpo = apenasDigitos(cpf);
  if (limpo.length !== 11) return false;

  // Rejeita sequências conhecidas de dígitos iguais
  if (/^(\d)\1{10}$/.test(limpo)) return false;

  // Primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(limpo.charAt(i), 10) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(limpo.charAt(9), 10)) return false;

  // Segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(limpo.charAt(i), 10) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(limpo.charAt(10), 10)) return false;

  return true;
};

// Validação Matemática Oficial de CNPJ (Receita Federal)
export const validarCNPJ = (cnpj: string): boolean => {
  const limpo = apenasDigitos(cnpj);
  if (limpo.length !== 14) return false;

  // Rejeita sequências de dígitos iguais
  if (/^(\d)\1{13}$/.test(limpo)) return false;

  // Primeiro dígito verificador
  let tamanho = 12;
  let numeros = limpo.substring(0, tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(limpo.charAt(12), 10)) return false;

  // Segundo dígito verificador
  tamanho = 13;
  numeros = limpo.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(limpo.charAt(13), 10)) return false;

  return true;
};

// Valida se o documento é CPF ou CNPJ válido
export const validarCpfCnpj = (
  doc: string
): { valido: boolean; tipo: 'cpf' | 'cnpj' | 'invalido'; mensagem?: string } => {
  const limpo = apenasDigitos(doc);

  if (!limpo) {
    return { valido: false, tipo: 'invalido', mensagem: 'O preenchimento do CPF ou CNPJ é obrigatório.' };
  }

  if (limpo.length <= 11) {
    const valido = validarCPF(limpo);
    return {
      valido,
      tipo: valido ? 'cpf' : 'invalido',
      mensagem: valido ? undefined : 'CPF inválido. Verifique os números digitados.'
    };
  }

  if (limpo.length === 14) {
    const valido = validarCNPJ(limpo);
    return {
      valido,
      tipo: valido ? 'cnpj' : 'invalido',
      mensagem: valido ? undefined : 'CNPJ inválido. Verifique os números digitados.'
    };
  }

  return { valido: false, tipo: 'invalido', mensagem: 'Documento deve conter 11 dígitos (CPF) ou 14 dígitos (CNPJ).' };
};

// Validação de Telefone / WhatsApp (mínimo DDD + 8 ou 9 dígitos)
export const validarTelefone = (tel: string): boolean => {
  const limpo = apenasDigitos(tel);
  return limpo.length >= 10 && limpo.length <= 11;
};

// Máscara Dinâmica de CPF ou CNPJ
export const formatarCpfCnpj = (val: string): string => {
  const limpo = apenasDigitos(val);

  if (limpo.length <= 11) {
    // CPF: 000.000.000-00
    return limpo
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .slice(0, 14);
  }

  // CNPJ: 00.000.000/0000-00
  return limpo
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
    .slice(0, 18);
};

// Máscara de Telefone / WhatsApp: (00) 0000-0000 ou (00) 00000-0000
export const formatarTelefone = (val: string): string => {
  const limpo = apenasDigitos(val);

  if (limpo.length <= 10) {
    return limpo
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2')
      .slice(0, 14);
  }

  return limpo
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2')
    .slice(0, 15);
};

// Máscara de CEP: 00000-000
export const formatarCep = (val: string): string => {
  const limpo = apenasDigitos(val);
  return limpo.replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);
};
