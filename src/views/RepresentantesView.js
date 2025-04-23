import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { SupabaseManager } from '@/lib/supabaseManager'
import TheSidebar from '@/components/TheSidebar.vue'
import { useConnectionManager } from '@/composables/useConnectionManager'

export default {
  name: 'RepresentantesView',
  components: {
    TheSidebar
  },
  
  setup() {
    const isSidebarExpanded = ref(true)
    const representantes = ref([])
    const showModal = ref(false)
    const isLoading = ref(true)
    const editingId = ref(null)
    const formData = ref({
      nome: '',
      email: '',
      telefone: '',
      regiao: '',
      status: 'ATIVO'
    })

    const deleteConfirmDialog = ref({
      show: false,
      id: null,
      nome: ''
    })

    const toast = ref({
      show: false,
      message: '',
      type: 'success'
    })

    const showToast = (message, type = 'success') => {
      toast.value = {
        show: true,
        message,
        type
      }

      setTimeout(() => {
        toast.value.show = false
      }, 3000)
    }
    
    const loadRepresentantes = async () => {
      try {
        isLoading.value = true
        // Modificando para buscar todos os representantes (incluindo inativos)
        const { data, error } = await supabase
          .from('representantes')
          .select('*')
          .order('nome')
        
        if (error) throw error
        representantes.value = data || []
      } catch (error) {
        console.error('Erro ao carregar representantes:', error)
        showToast('Erro ao carregar representantes', 'error')
      } finally {
        isLoading.value = false
      }
    }
    
    const handleSubmit = async () => {
      try {
        // Se estiver editando
        if (editingId.value) {
          const { error } = await supabase
            .from('representantes')
            .update({
              ...formData.value,
              updated_at: new Date().toISOString()
            })
            .eq('id', editingId.value)

          if (error) throw error
          
          showToast('Representante atualizado com sucesso')
        } 
        // Se estiver criando novo
        else {
          const { error } = await supabase
            .from('representantes')
            .insert({
              ...formData.value,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          if (error) throw error
          
          showToast('Representante adicionado com sucesso')
        }

        // Recarregar representantes e fechar modal
        await loadRepresentantes()
        closeModal()
      } catch (error) {
        console.error('Erro ao salvar representante:', error)
        showToast('Erro ao salvar. Por favor, tente novamente.', 'error')
      }
    }

    const editRepresentante = (representante) => {
      editingId.value = representante.id
      formData.value = { 
        nome: representante.nome,
        email: representante.email || '',
        telefone: representante.telefone || '',
        regiao: representante.regiao || '',
        status: representante.status || 'ATIVO'
      }
      showModal.value = true
    }

    const deleteRepresentante = (representante) => {
      deleteConfirmDialog.value = {
        show: true,
        id: representante.id,
        nome: representante.nome
      }
    }

    const confirmDelete = async () => {
      try {
        const { error } = await supabase
          .from('representantes')
          .update({ 
            status: 'INATIVO',
            updated_at: new Date().toISOString()
          })
          .eq('id', deleteConfirmDialog.value.id)

        if (error) throw error

        showToast(`Representante inativado com sucesso`)
        hideDeleteDialog()
        await loadRepresentantes()
      } catch (error) {
        console.error('Erro ao inativar representante:', error)
        showToast('Erro ao inativar representante', 'error')
      }
    }

    const hideDeleteDialog = () => {
      deleteConfirmDialog.value = {
        show: false,
        id: null,
        nome: ''
      }
    }

    const closeModal = () => {
      showModal.value = false
      editingId.value = null
      formData.value = {
        nome: '',
        email: '',
        telefone: '',
        regiao: '',
        status: 'ATIVO'
      }
    }

    const handleSidebarToggle = () => {
      isSidebarExpanded.value = !isSidebarExpanded.value
    }

    // Carregar representantes quando componente é montado
    onMounted(() => {
      loadRepresentantes()
    })

    return {
      isSidebarExpanded,
      representantes,
      showModal,
      isLoading,
      editingId,
      formData,
      deleteConfirmDialog,
      toast,
      editRepresentante,
      deleteRepresentante,
      confirmDelete,
      hideDeleteDialog,
      handleSubmit,
      closeModal,
      handleSidebarToggle
    }
  }
}