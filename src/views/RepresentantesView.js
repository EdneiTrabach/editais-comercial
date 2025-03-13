import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import TheSidebar from '@/components/TheSidebar.vue'
import { useConnectionManager } from '@/composables/useConnectionManager'

export default {
  components: {
    TheSidebar
  },
  setup() {
    const isSidebarExpanded = ref(true)
    const showModal = ref(false)
    const editingId = ref(null)
    const representantes = ref([])
    
    const formData = ref({
      nome: '',
      documento: '',
      email: '',
      telefone: ''
    })
    
    // Adicione o ref para o toast
    const toast = ref({
      show: false,
      message: '',
      type: 'success'
    })
    
    // Adicione este ref junto com os outros
    const deleteConfirmDialog = ref({
      show: false,
      representante: null
    })
    
    // Função para mostrar toast
    const showToast = (message, type = 'success') => {
      toast.value = { show: true, message, type }
      setTimeout(() => {
        toast.value.show = false
      }, 3000)
    }
    
    const loadRepresentantes = async () => {
      try {
        const { data, error } = await supabase
          .from('representantes')
          .select('*')
          .not('status', 'eq', 'INATIVO') // Filtra representantes inativos
          .order('nome')
        
        if (error) throw error
        representantes.value = data || []
      } catch (error) {
        console.error('Erro ao carregar representantes:', error)
        showToast('Erro ao carregar representantes', 'error')
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
          showToast('Representante atualizado com sucesso!')
        } 
        // Novo cadastro
        else {
          const { error } = await supabase
            .from('representantes')
            .insert({
              ...formData.value,
              status: 'ACTIVE',
              created_at: new Date().toISOString()
            })
          
          if (error) throw error
          showToast('Representante cadastrado com sucesso!')
        }
        
        await loadRepresentantes()
        closeModal()
      } catch (error) {
        console.error('Erro ao salvar:', error)
        showToast(error.message || 'Erro ao salvar representante', 'error')
      }
    }
    
    const editRepresentante = (representante) => {
      editingId.value = representante.id
      formData.value = { ...representante }
      showModal.value = true
    }
    
    const deleteRepresentante = (representante) => {
      deleteConfirmDialog.value = {
        show: true,
        representante
      }
    }
    
    const hideDeleteDialog = () => {
      deleteConfirmDialog.value = {
        show: false,
        representante: null
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
          .eq('id', deleteConfirmDialog.value.representante.id)
        
        if (error) throw error
        
        await loadRepresentantes()
        showToast('Representante inativado com sucesso!')
        hideDeleteDialog()
      } catch (error) {
        console.error('Erro ao inativar:', error)
        showToast(error.message || 'Erro ao inativar representante', 'error')
      }
    }
    
    const closeModal = () => {
      showModal.value = false
      editingId.value = null
      formData.value = {
        nome: '',
        documento: '',
        email: '',
        telefone: ''
      }
    }
    
    const handleSidebarToggle = (expanded) => {
      isSidebarExpanded.value = expanded
    }
    
    const loadData = async () => {
      await loadRepresentantes()
    }
    
    // Use o composable
    useConnectionManager(loadData)
    
    onMounted(() => {
      loadRepresentantes()
    })

    return {
      isSidebarExpanded,
      showModal,
      editingId,
      representantes,
      formData,
      toast,
      deleteConfirmDialog,
      loadRepresentantes,
      handleSubmit,
      editRepresentante,
      deleteRepresentante,
      hideDeleteDialog,
      confirmDelete,
      closeModal,
      handleSidebarToggle,
      showToast
    }
  }
}