/**
 * Formata um CNPJ para o padrão 00.000.000/0000-00
 * @param {string} cnpj - CNPJ a ser formatado
 * @returns {string} CNPJ formatado
 */
export function formatCNPJ(cnpj) {
  if (!cnpj) return '-'
  
  // Formata o CNPJ no padrão 00.000.000/0000-00
  cnpj = String(cnpj).replace(/[^\d]/g, '')
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

/**
 * Formata um CNPJ enquanto o usuário digita
 * @param {Event|string} e - Evento de input ou valor direto
 * @returns {string} CNPJ formatado
 */
export function formatarCNPJ(e) {
  // Se for um evento (input), pegar o valor
  let value = typeof e === 'object' ? e.target.value.replace(/\D/g, '') : e.replace(/\D/g, '')
  
  if (value.length > 14) value = value.substring(0, 14)
  
  // Formato: 00.000.000/0000-00
  if (value.length > 12) {
    return value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
  } else if (value.length > 8) {
    return value.replace(/^(\d{2})(\d{3})(\d{3})(\d+)$/, "$1.$2.$3/$4")
  } else if (value.length > 5) {
    return value.replace(/^(\d{2})(\d{3})(\d+)$/, "$1.$2.$3")
  } else if (value.length > 2) {
    return value.replace(/^(\d{2})(\d+)$/, "$1.$2")
  }
  return value
}

/**
 * Formata um número de telefone enquanto o usuário digita
 * @param {Event|string} e - Evento de input ou valor direto
 * @returns {string} Telefone formatado
 */
export function formatarTelefone(e) {
  // Se for um evento (input), pegar o valor
  let value = typeof e === 'object' ? e.target.value.replace(/\D/g, '') : e.replace(/\D/g, '')
  
  if (value.length > 11) value = value.substring(0, 11)
  
  if (value.length > 10) {
    return value.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3")
  } else if (value.length > 6) {
    return value.replace(/^(\d{2})(\d{4})(\d+)$/, "($1) $2-$3")
  } else if (value.length > 2) {
    return value.replace(/^(\d{2})(\d+)$/, "($1) $2")
  }
  return value
}