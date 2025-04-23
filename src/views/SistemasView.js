import { ref, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'
import TheSidebar from '@/components/TheSidebar.vue'
import { useConnectionManager } from '@/composables/useConnectionManager'
import { SupabaseManager } from '@/lib/supabaseManager'

export default {
  components: {
    TheSidebar
  },
  setup() {
    const sistemas = ref([])
    const setores = ref([])
    const loading = ref(false)
    const showModal = ref(false)
    const showSetorModal = ref(false)
    const editingId = ref(null)
    const isSidebarExpanded = ref(true)
    const isAdmin = ref(false)

    // Sistema de toast
    const toasts = ref([])

    // Dialog de confirmação
    const confirmDialog = ref({
      show: false,
      title: '',
      message: '',
      warning: '',
      confirmText: '',
      onConfirm: null
    })

    // Refs para os formulários
    const formData = ref({
      setor_id: '',
      nome: '',
      descricao: '',
      url: '',
      contatos: []
    })

    const novoSetor = ref({
      nome: ''
    })

    // Funções de carregamento
    const loadSistemas = async () => {
      try {
        const { data, error } = await supabase
          .from('sistemas')
          .select(`
            *,
            setores (
              nome
            ),
            sistema_contatos (
              id,
              nome,
              telefone
            )
          `)
          .order('status', { ascending: false }) // ACTIVE virá primeiro que INACTIVE
          .order('created_at', { ascending: false })

        if (error) throw error
        sistemas.value = data
      } catch (error) {
        console.error('Erro ao carregar sistemas:', error)
        showToast('Erro ao carregar dados', 'error')
      }
    }

    const loadSetores = async () => {
      try {
        const { data, error } = await supabase
          .from('setores')
          .select('*')
          .order('nome')

        if (error) throw error
        setores.value = data
      } catch (error) {
        console.error('Erro ao carregar setores:', error)
      }
    }

    // Carregar dados ao montar o componente
    const loadData = async () => {
      await Promise.all([
        loadSistemas(),
        loadSetores(),
        checkAdminStatus() 
      ])
    }

    // Use o composable
    useConnectionManager(loadData)

    onMounted(() => {
      loadData()
      
      const channel = supabase.channel('sistemas-updates')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'sistemas' }, 
          () => loadData()
        )
        .subscribe()
      
      SupabaseManager.addSubscription('sistemas-updates', channel)
    })

    onUnmounted(() => {
      const channel = SupabaseManager.getSubscription('sistemas-updates')
      if (channel) {
        supabase.removeChannel(channel)
        SupabaseManager.removeSubscription('sistemas-updates')
      }
    })

    // Outras funções necessárias
    const handleSidebarToggle = (expanded) => {
      isSidebarExpanded.value = expanded
    }

    const getSetorNome = (setorId) => {
      const setor = setores.value.find(s => s.id === setorId)
      return setor?.nome || '-'
    }

    // Funções para gerenciar contatos no formulário
    const addContato = () => {
      formData.value.contatos.push({ nome: '', telefone: '' })
    }

    const removeContato = (index) => {
      formData.value.contatos.splice(index, 1)
    }

    // Função para fechar o modal de setor
    const closeSetorModal = () => {
      showSetorModal.value = false
      novoSetor.value.nome = ''
    }

    // Função para adicionar novo setor
    const handleAddSetor = async () => {
      try {
        const { data, error } = await supabase
          .from('setores')
          .insert({
            nome: novoSetor.value.nome,
            created_at: new Date().toISOString()
          })
          .select()

        if (error) throw error

        // Recarrega os setores
        await loadSetores()

        // Fecha o modal e limpa o form
        closeSetorModal()

        // Feedback
        showToast('Setor criado com sucesso!')
      } catch (error) {
        console.error('Erro ao criar setor:', error)
        showToast('Erro ao criar setor', 'error')
      }
    }

    // Função para fechar o modal
    const closeModal = () => {
      showModal.value = false
      editingId.value = null
      formData.value = {
        setor_id: '',
        nome: '',
        descricao: '',
        url: '',
        contatos: []
      }
    }

    // Função para editar sistema
    const editSistema = (sistema) => {
      editingId.value = sistema.id
      formData.value = {
        setor_id: sistema.setor_id,
        nome: sistema.nome,
        descricao: sistema.descricao,
        url: sistema.url,
        contatos: sistema.sistema_contatos || []
      }
      showModal.value = true
    }

    // Função para deletar sistema
    const deleteSistema = (sistema) => {
      showConfirmDialog({
        title: 'Confirmar Exclusão',
        message: `Deseja realmente excluir o sistema ${sistema.nome}?`,
        warning: 'Esta ação não poderá ser desfeita!',
        confirmText: 'Excluir',
        onConfirm: async () => {
          try {
            const { error } = await supabase
              .from('sistemas')
              .delete()
              .eq('id', sistema.id)

            if (error) throw error

            await loadSistemas()
            showToast('Sistema excluído com sucesso!')
            confirmDialog.value.show = false
          } catch (error) {
            console.error('Erro ao excluir sistema:', error)
            showToast('Erro ao excluir sistema', 'error')
          }
        }
      })
    }

    // Função para inativar sistema
    const inativarSistema = (sistema) => {
      if (!isAdmin.value) {
        showToast('Apenas administradores podem inativar sistemas', 'error')
        return
      }

      showConfirmDialog({
        title: 'Confirmar Inativação',
        message: `Deseja realmente inativar o sistema ${sistema.nome}?`,
        warning: 'O sistema ficará indisponível para novas operações!',
        confirmText: 'Inativar',
        onConfirm: async () => {
          try {
            const { error } = await supabase
              .from('sistemas')
              .update({
                status: 'INACTIVE',
                updated_at: new Date().toISOString()
              })
              .eq('id', sistema.id)

            if (error) throw error

            await loadSistemas()
            showToast('Sistema inativado com sucesso!')
            confirmDialog.value.show = false
          } catch (error) {
            console.error('Erro ao inativar sistema:', error)
            showToast('Erro ao inativar sistema', 'error')
          }
        }
      })
    }

    // Função para ativar sistema
    const ativarSistema = (sistema) => {
      if (!isAdmin.value) {
        showToast('Apenas administradores podem ativar sistemas', 'error')
        return
      }

      showConfirmDialog({
        title: 'Confirmar Ativação',
        message: `Deseja realmente ativar o sistema ${sistema.nome}?`,
        warning: 'O sistema voltará a ficar disponível para operações!',
        confirmText: 'Ativar',
        onConfirm: async () => {
          try {
            const { error } = await supabase
              .from('sistemas')
              .update({
                status: 'ACTIVE',
                updated_at: new Date().toISOString()
              })
              .eq('id', sistema.id)

            if (error) throw error

            await loadSistemas()
            showToast('Sistema ativado com sucesso!')
            confirmDialog.value.show = false
          } catch (error) {
            console.error('Erro ao ativar sistema:', error)
            showToast('Erro ao ativar sistema', 'error')
          }
        }
      })
    }

    // Função atualizada para salvar
    const handleSubmit = async () => {
      try {
        loading.value = true
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          throw new Error('Usuário não autenticado')
        }

        // Dados do sistema
        const sistemaData = {
          setor_id: formData.value.setor_id,
          nome: formData.value.nome,
          descricao: formData.value.descricao,
          url: formData.value.url,
          created_by: user.id,
          status: 'ACTIVE'
        }

        let sistema
        if (editingId.value) {
          const { data, error } = await supabase
            .from('sistemas')
            .update({
              ...sistemaData,
              updated_at: new Date().toISOString()
            })
            .eq('id', editingId.value)
            .select()
            .single()

          if (error) throw error
          sistema = data
        } else {
          const { data, error } = await supabase
            .from('sistemas')
            .insert(sistemaData)
            .select()
            .single()

          if (error) throw error
          sistema = data
        }

        // Atualiza contatos
        if (formData.value.contatos?.length > 0) {
          if (editingId.value) {
            // Remove contatos antigos
            await supabase
              .from('sistema_contatos')
              .delete()
              .eq('sistema_id', editingId.value)
          }

          // Insere novos contatos
          const { error: contatosError } = await supabase
            .from('sistema_contatos')
            .insert(
              formData.value.contatos.map(c => ({
                sistema_id: sistema.id,
                nome: c.nome,
                telefone: c.telefone
              }))
            )

          if (contatosError) throw contatosError
        }

        await loadSistemas()
        closeModal()
        showToast(editingId.value ? 'Sistema atualizado com sucesso!' : 'Sistema criado com sucesso!')

      } catch (error) {
        console.error('Erro ao salvar sistema:', error)
        showToast(`Erro ao salvar sistema: ${error.message}`, 'error')
      } finally {
        loading.value = false
      }
    }

    // Função para mostrar toast
    const showToast = (message, type = 'success') => {
      const id = Date.now()
      toasts.value.push({ id, message, type })
      setTimeout(() => {
        toasts.value = toasts.value.filter(t => t.id !== id)
      }, 3000)
    }

    // Função para mostrar diálogo de confirmação
    const showConfirmDialog = (config) => {
      confirmDialog.value = {
        show: true,
        ...config
      }
    }

    // Função para verificar permissão de admin
    const checkAdminStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return false

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        isAdmin.value = profile?.role === 'admin'
        return isAdmin.value
      } catch (error) {
        console.error('Erro ao verificar status admin:', error)
        return false
      }
    }

    // Classes CSS para fazer a transição de status mais elegante
    const getStatusClass = (status) => {
      return status.toLowerCase() === 'active' ? 'ativo' : 'inativo';
    };

    return {
      sistemas,
      setores,
      loading,
      showModal,
      showSetorModal,
      editingId,
      isSidebarExpanded,
      isAdmin,
      toasts,
      confirmDialog,
      formData,
      novoSetor,
      loadSistemas,
      loadSetores,
      loadData,
      handleSidebarToggle,
      getSetorNome,
      addContato,
      removeContato,
      closeSetorModal,
      handleAddSetor,
      closeModal,
      editSistema,
      deleteSistema,
      inativarSistema,
      ativarSistema,
      handleSubmit,
      showToast,
      showConfirmDialog,
      checkAdminStatus,
      getStatusClass
    }
  }
}