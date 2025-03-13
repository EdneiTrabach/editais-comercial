import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export function useRepresentatives() {
  const representantes = ref([])
  const showRepresentanteModal = ref(false)
  const novoRepresentante = ref({
    nome: '',
    documento: '',
    email: '',
    telefone: ''
  })
  const loading = ref(false)

  // Função para carregar representantes
  const loadRepresentantes = async () => {
    try {
      loading.value = true
      const { data, error } = await supabase
        .from('representantes')
        .select('*')
        .order('nome')

      if (error) throw error
      representantes.value = data || []
    } catch (error) {
      console.error('Erro ao carregar representantes:', error)
    } finally {
      loading.value = false
    }
  }

  // Função para adicionar representante
  const handleAddRepresentante = async () => {
    try {
      const { error } = await supabase
        .from('representantes')
        .insert(novoRepresentante.value)

      if (error) throw error

      await loadRepresentantes()
      showRepresentanteModal.value = false
      novoRepresentante.value = { nome: '', documento: '', email: '', telefone: '' }
      
      return { success: true }
    } catch (error) {
      console.error('Erro ao adicionar representante:', error)
      return { success: false, error }
    }
  }

  const handleOpenRepresentanteModal = () => {
    showRepresentanteModal.value = true
  }

  return {
    representantes,
    showRepresentanteModal,
    novoRepresentante,
    loadRepresentantes,
    handleAddRepresentante,
    handleOpenRepresentanteModal
  }
}
