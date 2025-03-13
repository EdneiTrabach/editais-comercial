import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export function usePlatforms() {
  const plataformas = ref([])
  const showPlataformaModal = ref(false)
  const novaPlatforma = ref({ nome: '', url: '' })
  const loading = ref(false)

  // Função para carregar plataformas
  const loadPlataformas = async () => {
    try {
      loading.value = true
      const { data, error } = await supabase
        .from('plataformas')
        .select('*')
        .order('nome')

      if (error) throw error
      plataformas.value = data || []
    } catch (error) {
      console.error('Erro ao carregar plataformas:', error)
    } finally {
      loading.value = false
    }
  }

  // Função para adicionar plataforma
  const handleAddPlataforma = async () => {
    try {
      const { error } = await supabase
        .from('plataformas')
        .insert({
          nome: novaPlatforma.value.nome,
          url: novaPlatforma.value.url
        })

      if (error) throw error

      // Recarrega as plataformas
      await loadPlataformas()

      // Limpa e fecha o modal
      novaPlatforma.value = { nome: '', url: '' }
      showPlataformaModal.value = false
      
      return { success: true }
    } catch (error) {
      console.error('Erro ao adicionar plataforma:', error)
      return { success: false, error }
    }
  }

  return {
    plataformas,
    showPlataformaModal,
    novaPlatforma,
    loadPlataformas,
    handleAddPlataforma
  }
}
