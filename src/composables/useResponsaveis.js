import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export function useResponsaveis() {
  const responsaveis = ref([])
  const loadingResponsaveis = ref(false)
  
  // Função para carregar os responsáveis
  const loadResponsaveis = async () => {
    try {
      loadingResponsaveis.value = true
      
      const { data, error } = await supabase
        .from('responsaveis_processos')
        .select('*')
        .eq('status', 'ACTIVE')  // Filtrar apenas responsáveis ativos
        .order('nome')
      
      if (error) throw error
      
      responsaveis.value = data || []
      console.log('Responsáveis carregados:', responsaveis.value.length)
      
      return data
    } catch (error) {
      console.error('Erro ao carregar responsáveis:', error)
      return []
    } finally {
      loadingResponsaveis.value = false
    }
  }
  
  // Função para obter o nome do responsável pelo ID
  const getResponsavelNome = (id) => {
    if (!id) return 'Não atribuído'
    
    const responsavel = responsaveis.value.find(r => r.id === id)
    return responsavel ? responsavel.nome : 'Carregando...'
  }
  
  // Função simplificada para atualizar o responsável
  const updateProcessoResponsavel = async (processoId, responsavelId) => {
    try {
      const updateData = {
        responsavel_id: responsavelId,
        updated_at: new Date().toISOString()
      }
      
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.id) {
        updateData.updated_by = user.id
      }
      
      const { error } = await supabase
        .from('processos')
        .update(updateData)
        .eq('id', processoId)
      
      if (error) throw error
      
      return true
    } catch (error) {
      console.error('Erro ao atualizar responsável:', error)
      return false
    }
  }
  
  return {
    responsaveis,
    loadingResponsaveis,
    loadResponsaveis,
    getResponsavelNome,
    updateProcessoResponsavel
  }
}