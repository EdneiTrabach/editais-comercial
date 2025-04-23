import { supabase } from '@/lib/supabase'

/**
 * Valida um CNPJ quanto à sua formatação e duplicidade no banco
 * @param {string} cnpj - CNPJ a ser validado
 * @param {boolean} isEditing - Se está editando uma empresa existente
 * @param {string|null} editingId - ID da empresa em edição
 * @returns {Promise<Object>} Resultado da validação {valid: boolean, error: string}
 */
export async function validateCNPJ(cnpj, isEditing = false, editingId = null) {
  if (!cnpj) {
    return { valid: false, error: 'CNPJ é obrigatório' }
  }

  // Remove caracteres especiais para validação
  const cnpjLimpo = cnpj.replace(/[^\d]/g, '')
  
  if (cnpjLimpo.length !== 14) {
    return { valid: false, error: 'CNPJ inválido' }
  }

  // Se estiver editando, verificar duplicidade ignorando o registro atual
  let query = supabase
    .from('empresas')
    .select('id')
    .eq('cnpj', cnpjLimpo)
  
  if (isEditing && editingId) {
    query = query.neq('id', editingId)
  }

  const { data } = await query.single()

  if (data) {
    return { valid: false, error: 'CNPJ já cadastrado' }
  }

  return { valid: true, error: '' }
}