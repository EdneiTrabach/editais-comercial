import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export function useSystemsManagement() {
  const sistemasAtivos = ref([])
  const sistemasSelecionados = ref([])
  const loading = ref(false)

  // Função para carregar sistemas ativos
  const loadSistemas = async () => {
    try {
      loading.value = true
      const { data, error } = await supabase
        .from('sistemas')
        .select('id, nome')
        .eq('status', 'ACTIVE')
        .order('nome');

      if (error) throw error;
      sistemasAtivos.value = data || [];
      
      return { success: true, data }
    } catch (error) {
      console.error('Erro ao carregar sistemas:', error);
      return { success: false, error }
    } finally {
      loading.value = false
    }
  }

  // Função para alternar seleção de sistema
  const toggleSistema = (sistemaId) => {
    const index = sistemasSelecionados.value.indexOf(sistemaId)
    if (index === -1) {
      sistemasSelecionados.value.push(sistemaId)
    } else {
      sistemasSelecionados.value.splice(index, 1)
    }
  }

  // Função para verificar se um sistema está selecionado
  const isSistemaSelected = (sistemaId) => {
    return sistemasSelecionados.value.includes(sistemaId)
  }

  // Função para limpar as seleções
  const clearSelections = () => {
    sistemasSelecionados.value = []
  }

  // Função para selecionar todos os sistemas
  const selectAllSistemas = () => {
    sistemasSelecionados.value = sistemasAtivos.value.map(sistema => sistema.id)
  }

  return {
    sistemasAtivos,
    sistemasSelecionados,
    loading,
    loadSistemas,
    toggleSistema,
    isSistemaSelected,
    clearSelections,
    selectAllSistemas
  }
}
