import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export function useResponsaveis() {
  const responsaveis = ref([])
  
  const loadResponsaveis = async () => {
    try {
      const { data, error } = await supabase
        .from('responsaveis_processos')
        .select('*')
        .order('nome')
      
      if (error) throw error
      
      responsaveis.value = data || []
      return data
    } catch (error) {
      console.error('Erro ao carregar responsáveis:', error)
      responsaveis.value = []
      return []
    }
  }
  
  const getResponsavelNome = (id) => {
    if (!id) return 'Sem responsável'
    
    const responsavel = responsaveis.value.find(r => r.id === id)
    return responsavel ? responsavel.nome : 'Carregando...'
  }
  
  // Dialog para responsáveis
  const responsaveisDialog = ref({
    show: false,
    position: {},
    processo: null
  })
  
  // Função para lidar com o clique no responsável
  const handleDblClickResponsavel = async (field, processo, event) => {
    // Verifica se já carregou os responsáveis
    if (responsaveis.value.length === 0) {
      await loadResponsaveis()
    }
    
    // Configura o diálogo
    const cell = event.target.closest('td')
    const rect = cell.getBoundingClientRect()
    
    // Prepara dados para edição
    // Nota: editingCell deve ser fornecido pelo componente principal
    // ou por um composable específico para edição de células
    
    responsaveisDialog.value = {
      show: true,
      position: {
        top: `${rect.bottom + 10}px`,
        left: `${rect.left}px`
      },
      processo
    }
  }
  
  // Função para remover o responsável selecionado
  const removerResponsavel = () => {
    // Nota: editingCell deve ser fornecido pelo componente principal
    // ou por um composable específico para edição de células
  }
  
  // Função para lidar com a mudança de responsável no select
  const handleResponsavelChange = (event) => {
    // Nota: editingCell deve ser fornecido pelo componente principal
    // ou por um composable específico para edição de células
  }
  
  // Função para salvar o responsável
  const saveResponsavel = async () => {
    try {
      // Nota: editingCell e handleUpdate devem ser fornecidos pelo componente principal
      // ou por composables específicos
      
      hideResponsaveisDialog()
    } catch (error) {
      console.error('Erro ao salvar responsável:', error)
      alert('Erro ao salvar responsável')
    }
  }
  
  // Função para fechar o diálogo de responsáveis
  const hideResponsaveisDialog = () => {
    responsaveisDialog.value = {
      show: false,
      position: {},
      processo: null
    }
  }
  
  return {
    responsaveis,
    loadResponsaveis,
    getResponsavelNome,
    responsaveisDialog,
    handleDblClickResponsavel,
    removerResponsavel,
    handleResponsavelChange,
    saveResponsavel,
    hideResponsaveisDialog
  }
}