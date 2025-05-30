import { supabase } from '@/lib/supabase'
import { atualizarStatusProcesso } from '@/utils/sqlQueries'
import { useLogSistema } from '@/composables/desmembramento_processosview_js/useLogSistema'

/**
 * Serviço para gerenciamento de processos
 */
export default {
  /**
   * Atualiza o status de um processo de forma segura
   * @param {string} processoId - ID do processo
   * @param {string} novoStatus - Novo status a ser definido
   * @param {object} dadosAnteriores - Dados anteriores para logging
   * @returns {Promise} Resultado da operação
   */
  async atualizarStatus(processoId, novoStatus, dadosAnteriores = null) {
    try {
      // Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { error: { message: 'Usuário não autenticado' } }
      }
      
      // Utilizar a função segura para atualização
      const { data, error } = await atualizarStatusProcesso(
        processoId, 
        novoStatus, 
        user.id
      )
      
      // Log da operação se bem-sucedida
      if (!error && data) {
        const { logSystemAction } = useLogSistema()
        await logSystemAction({
          tipo: 'atualizacao',
          tabela: 'processos',
          registro_id: processoId,
          campo_alterado: 'status',
          dados_anteriores: dadosAnteriores ? { status: dadosAnteriores } : null,
          dados_novos: { status: novoStatus }
        })
      }
      
      return { data, error }
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
      return { error: { message: 'Erro interno ao atualizar status', details: err.message } }
    }
  },
  
  /**
   * Obtém um processo por ID
   * @param {string} id - ID do processo
   * @returns {Promise} Dados do processo
   */
  async obterPorId(id) {
    return await supabase
      .from('processos')
      .select('*')
      .eq('id', id)
      .single()
  },
  
  /**
   * Lista processos com filtros opcionais
   * @param {object} filtros - Filtros a serem aplicados
   * @returns {Promise} Lista de processos
   */
  async listar(filtros = {}) {
    let query = supabase
      .from('processos')
      .select('*')
    
    // Aplicar filtros se fornecidos
    if (filtros.status) {
      query = query.eq('status', filtros.status)
    }
    
    if (filtros.ano) {
      query = query.eq('ano', filtros.ano)
    }
    
    return await query
  }
}
