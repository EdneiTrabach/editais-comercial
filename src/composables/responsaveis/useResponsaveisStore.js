import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { SupabaseManager } from '@/lib/supabaseManager'

export function useResponsaveisStore() {
  const responsaveis = ref([])
  const loading = ref(false)
  const responsaveisEmUso = ref({})
  
  // Carregar responsáveis
  const loadResponsaveis = async () => {
    try {
      loading.value = true
      
      const { data, error } = await supabase
        .from('responsaveis_processos')
        .select('*')
        .order('nome')
      
      if (error) throw error
      responsaveis.value = data || []
      return data
    } catch (error) {
      console.error('Erro ao carregar responsáveis:', error)
      return []
    } finally {
      loading.value = false
    }
  }

  // Formatar status
  const formatStatus = (status) => {
    const statusMap = {
      'ACTIVE': 'Ativo',
      'INACTIVE': 'Inativo',
      'PENDING': 'Pendente'
    }
    return statusMap[status] || status
  }
  
  // Verificar se responsável está em uso
  const isResponsavelEmUso = async (responsavel) => {
    // Se já temos o resultado em cache, retorna direto
    if (responsaveisEmUso.value[responsavel.id] !== undefined) {
      return responsaveisEmUso.value[responsavel.id]
    }
    
    try {
      const { data, error } = await supabase
        .from('processos')
        .select('id')
        .eq('responsavel_id', responsavel.id)
        .limit(1)
      
      if (error) throw error
      
      // Armazena o resultado em cache
      const emUso = data && data.length > 0
      responsaveisEmUso.value[responsavel.id] = emUso
      return emUso
    } catch (error) {
      console.error('Erro ao verificar uso do responsável:', error)
      return false // Em caso de erro, permitir exclusão
    }
  }
  
  // Alternar status do responsável
  const toggleResponsavelStatus = async (responsavel) => {
    try {
      loading.value = true
      
      const newStatus = responsavel.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
      
      const { error } = await supabase
        .from('responsaveis_processos')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', responsavel.id)
      
      if (error) throw error
      
      return { success: true, newStatus }
    } catch (error) {
      console.error(`Erro ao alterar status:`, error)
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }
  
  // Excluir responsável
  const deleteResponsavel = async (responsavel) => {
    try {
      loading.value = true
      
      // Verificar se está em uso
      const emUso = await isResponsavelEmUso(responsavel)
      if (emUso) {
        return { 
          success: false, 
          error: 'O responsável está associado a processos e não pode ser excluído', 
          type: 'IN_USE'
        }
      }
      
      const { error } = await supabase
        .from('responsaveis_processos')
        .delete()
        .eq('id', responsavel.id)
      
      if (error) throw error
      
      return { success: true }
    } catch (error) {
      console.error('Erro ao excluir responsável:', error)
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }
  
  // Configurar canal Realtime para atualizações
  const setupRealtimeSubscription = (callback) => {
    const channel = supabase.channel('responsaveis-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'responsaveis_processos' }, 
        () => {
          if (typeof callback === 'function') {
            callback()
          } else {
            loadResponsaveis()
          }
        }
      )
      .subscribe()
    
    // Registrar canal no gerenciador
    SupabaseManager.addSubscription('responsaveis-updates', channel)
    
    return () => {
      const ch = SupabaseManager.getSubscription('responsaveis-updates')
      if (ch) {
        supabase.removeChannel(ch)
        SupabaseManager.removeSubscription('responsaveis-updates')
      }
    }
  }
  
  // Carregar dados iniciais
  loadResponsaveis()
  
  return {
    responsaveis,
    loading,
    loadResponsaveis,
    isResponsavelEmUso,
    toggleResponsavelStatus,
    deleteResponsavel,
    formatStatus,
    setupRealtimeSubscription
  }
}