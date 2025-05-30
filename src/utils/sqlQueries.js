import { supabase } from '@/lib/supabase'

/**
 * Funções de ajuda para consultas SQL que evitam ambiguidade de colunas
 */

/**
 * Atualiza o status de um processo de forma segura
 * @param {string} processoId - ID do processo
 * @param {string} novoStatus - Novo status
 * @param {string} usuarioId - ID do usuário que faz a atualização
 * @returns {Promise} Resultado da operação
 */
export async function atualizarStatusProcesso(processoId, novoStatus, usuarioId) {
  // Usando uma função RPC do banco para evitar ambiguidade
  const { data, error } = await supabase
    .rpc('atualizar_status_processo', {
      p_processo_id: processoId,
      p_novo_status: novoStatus,
      p_usuario_id: usuarioId
    })
  
  return { data, error }
}

/**
 * Executa uma consulta segura que envolve processo_sistemas e suas tabelas relacionadas
 * @param {string} processoId - ID do processo (opcional)
 * @returns {Promise} Sistemas relacionados ao processo
 */
export async function obterSistemasProcesso(processoId = null) {
  let query = supabase
    .from('processo_sistemas')
    .select(`
      processo_id,
      processo_sistemas.sistema_id,
      sistemas(nome, id)
    `)
  
  if (processoId) {
    query = query.eq('processo_id', processoId)
  }
  
  return await query
}
