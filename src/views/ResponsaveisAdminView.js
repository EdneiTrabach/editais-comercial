import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { SupabaseManager } from '@/lib/supabaseManager'
import { useConnectionManager } from '@/composables/useConnectionManager'
import TheSidebar from '@/components/TheSidebar.vue' // Adicione esta linha

export default {
  components: {
    TheSidebar // Adicione esta declaração de componente
  },
  setup() {
    const router = useRouter()
    const loading = ref(false)
    const responsaveis = ref([])
    const currentUser = ref(null)
    const isSidebarExpanded = ref(true)
    const showAddModal = ref(false)
    const showConfirmDialog = ref(false)
    const showAccessDeniedModal = ref(false)
    const dialogConfig = ref({})
    const showToast = ref(false)
    const toastConfig = ref({
      message: '',
      type: 'success'
    })
    
    // Para edição inline
    const editingNames = ref({})
    const editingDepts = ref({})
    const editingData = ref({})
    const nameInput = ref(null)
    const deptInput = ref(null)
    
    // Para controlar o modo do formulário (adição ou edição)
    const isEditing = ref(false)
    const editingId = ref(null)

    // Renomear newResponsavel para formData para melhor consistência
    const formData = ref({
      nome: '',
      email: '',
      departamento: '',
      status: 'ACTIVE'
    })

    // Função para abrir o modal no modo de edição
    const openEditModal = (responsavel) => {
      // Primeiro limpa o formulário e configura os modos
      resetModalState();
      
      isEditing.value = true;
      editingId.value = responsavel.id;
      
      // Preencher o formulário com os dados do responsável
      formData.value = {
        nome: responsavel.nome,
        email: responsavel.email,
        departamento: responsavel.departamento || '',
        status: responsavel.status
      };
      
      showAddModal.value = true;
    };

    // Função para abrir o modal no modo de adição
    const openAddModal = () => {
      // Sempre resetar o estado do modal antes de abrir
      resetModalState();
      
      showAddModal.value = true;
    };

    // Função para resetar o estado do modal
    const resetModalState = () => {
      isEditing.value = false;
      editingId.value = null;
      
      // Limpar o formulário
      formData.value = {
        nome: '',
        email: '',
        departamento: '',
        status: 'ACTIVE'
      };
    };

    // Função para fechar o modal e limpar os dados
    const closeModal = () => {
      showAddModal.value = false;
      resetModalState();
    };

    // Função unificada para salvar (adicionar ou atualizar)
    const handleSaveResponsavel = async () => {
      if (isEditing.value) {
        await updateResponsavel()
      } else {
        await addResponsavel()
      }
    }

    // Função para carregar responsáveis
    const loadResponsaveis = async () => {
      try {
        loading.value = true
        
        const { data, error } = await supabase
          .from('responsaveis_processos')
          .select('*')
          .order('nome')
        
        if (error) throw error
        responsaveis.value = data
      } catch (error) {
        console.error('Erro ao carregar responsáveis:', error)
        showToastMessage('Erro ao carregar dados', 'error')
      } finally {
        loading.value = false
      }
    }

    // Função para formatar status
    const formatStatus = (status) => {
      const statusMap = {
        'ACTIVE': 'Ativo',
        'INACTIVE': 'Inativo',
        'PENDING': 'Pendente'
      }
      return statusMap[status] || status
    }

    // Função para iniciar edição do nome
    const startEditingName = (responsavel) => {
      // Limpa edições ativas
      editingNames.value = {}
      editingDepts.value = {}
      
      // Configura dados para edição
      if (!editingData.value[responsavel.id]) {
        editingData.value[responsavel.id] = { ...responsavel }
      }
      
      // Ativa edição para este item
      editingNames.value[responsavel.id] = true
      
      // Foca no input após renderização
      nextTick(() => {
        if (nameInput.value) {
          nameInput.value.focus()
        }
      })
    }

    // Função para iniciar edição do departamento
    const startEditingDept = (responsavel) => {
      // Limpa edições ativas
      editingNames.value = {}
      editingDepts.value = {}
      
      // Configura dados para edição
      if (!editingData.value[responsavel.id]) {
        editingData.value[responsavel.id] = { ...responsavel }
      }
      
      // Ativa edição para este item
      editingDepts.value[responsavel.id] = true
      
      // Foca no input após renderização
      nextTick(() => {
        if (deptInput.value) {
          deptInput.value.focus()
        }
      })
    }

    // Função para atualizar nome
    const handleNameUpdate = async (responsavel, newName) => {
      // Cancela se não houve alteração
      if (responsavel.nome === newName || !newName.trim()) {
        editingNames.value[responsavel.id] = false
        return
      }
      
      try {
        loading.value = true
        
        const { error } = await supabase
          .from('responsaveis_processos')
          .update({ 
            nome: newName.trim(),
            updated_at: new Date().toISOString() 
          })
          .eq('id', responsavel.id)
        
        if (error) throw error
        
        showToastMessage('Nome atualizado com sucesso!')
        await loadResponsaveis()
      } catch (error) {
        console.error('Erro ao atualizar nome:', error)
        showToastMessage('Erro ao atualizar nome', 'error')
      } finally {
        editingNames.value[responsavel.id] = false
        loading.value = false
      }
    }

    // Função para atualizar departamento
    const handleDeptUpdate = async (responsavel, newDept) => {
      // Cancela se não houve alteração
      if (responsavel.departamento === newDept) {
        editingDepts.value[responsavel.id] = false
        return
      }
      
      try {
        loading.value = true
        
        const { error } = await supabase
          .from('responsaveis_processos')
          .update({ 
            departamento: newDept.trim() || null,
            updated_at: new Date().toISOString() 
          })
          .eq('id', responsavel.id)
        
        if (error) throw error
        
        showToastMessage('Departamento atualizado com sucesso!')
        await loadResponsaveis()
      } catch (error) {
        console.error('Erro ao atualizar departamento:', error)
        showToastMessage('Erro ao atualizar departamento', 'error')
      } finally {
        editingDepts.value[responsavel.id] = false
        loading.value = false
      }
    }

    // Função para ativar/inativar responsável
    const toggleResponsavelStatus = (responsavel) => {
      const newStatus = responsavel.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
      const actionText = responsavel.status === 'ACTIVE' ? 'inativar' : 'ativar'
      
      showConfirmDialog.value = true
      dialogConfig.value = {
        title: `Confirmar ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
        message: `Deseja realmente ${actionText} o responsável ${responsavel.nome}?`,
        confirmText: actionText.charAt(0).toUpperCase() + actionText.slice(1),
        onConfirm: async () => {
          try {
            const { error } = await supabase
              .from('responsaveis_processos')
              .update({
                status: newStatus,
                updated_at: new Date().toISOString()
              })
              .eq('id', responsavel.id)
            
            if (error) throw error
            
            showConfirmDialog.value = false
            showToastMessage(`Responsável ${actionText === 'ativar' ? 'ativado' : 'inativado'} com sucesso!`)
            await loadResponsaveis()
          } catch (error) {
            console.error(`Erro ao ${actionText} responsável:`, error)
            showToastMessage(`Erro ao ${actionText} responsável`, 'error')
          }
        }
      }
    }

    // Função para adicionar responsável (anteriormente handleAddResponsavel)
    const addResponsavel = async () => {
      try {
        // Validação básica
        if (!formData.value.nome.trim() || !formData.value.email.trim()) {
          showToastMessage('Nome e email são obrigatórios', 'error')
          return
        }
        
        loading.value = true
        
        // 1. Verifica se email já existe na tabela responsaveis_processos
        const { data: existingUserResp, error: checkErrorResp } = await supabase
          .from('responsaveis_processos')
          .select('id')
          .eq('email', formData.value.email.trim())
        
        if (checkErrorResp) throw checkErrorResp
        
        if (existingUserResp && existingUserResp.length > 0) {
          showToastMessage('Este email já está cadastrado como responsável', 'error')
          return
        }
        
        // 2. Verifica também se o email existe na tabela profiles
        const { data: existingUserProfile, error: checkErrorProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', formData.value.email.trim())
        
        if (checkErrorProfile) throw checkErrorProfile
        
        if (existingUserProfile && existingUserProfile.length > 0) {
          showToastMessage('Este email já está em uso por outro usuário do sistema', 'error')
          return
        }
        
        // 3. Insere apenas na tabela de responsáveis, sem usar RLS ou triggers
        const { error } = await supabase
          .rpc('adicionar_responsavel', {
            p_nome: formData.value.nome.trim(),
            p_email: formData.value.email.trim(),
            p_departamento: formData.value.departamento.trim() || null
          })
        
        if (error) throw error
        
        // Feedback e reset
        showToastMessage('Responsável adicionado com sucesso!');
        closeModal(); // Usar closeModal em vez de showAddModal.value = false
        await loadResponsaveis();
      } catch (error) {
        console.error('Erro ao adicionar responsável:', error)
        showToastMessage('Erro ao adicionar responsável', 'error')
      } finally {
        loading.value = false
      }
    }

    // Função para atualizar responsável
    const updateResponsavel = async () => {
      try {
        // Validação básica
        if (!formData.value.nome.trim()) {
          showToastMessage('Nome é obrigatório', 'error')
          return
        }
        
        loading.value = true
        
        // Atualiza o responsável
        const { error } = await supabase
          .from('responsaveis_processos')
          .update({ 
            nome: formData.value.nome.trim(),
            departamento: formData.value.departamento.trim() || null,
            status: formData.value.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId.value)
        
        if (error) throw error
        
        // Feedback e reset
        showToastMessage('Responsável atualizado com sucesso!');
        closeModal(); // Usar closeModal em vez de showAddModal.value = false
        await loadResponsaveis();
      } catch (error) {
        console.error('Erro ao atualizar responsável:', error)
        showToastMessage('Erro ao atualizar responsável', 'error')
      } finally {
        loading.value = false
      }
    }

    // Função para excluir responsável
    const deleteResponsavel = (responsavel) => {
      showConfirmDialog.value = true
      dialogConfig.value = {
        title: 'Confirmar Exclusão',
        message: `Deseja realmente excluir o responsável ${responsavel.nome}?`,
        warning: 'Esta ação não poderá ser desfeita!',
        confirmText: 'Excluir',
        onConfirm: async () => {
          try {
            // Verifica se responsável está associado a processos
            const { data: processos, error: checkError } = await supabase
              .from('processos')
              .select('id')
              .eq('responsavel_id', responsavel.id)
              .limit(1)
            
            if (checkError) throw checkError
            
            if (processos && processos.length > 0) {
              showConfirmDialog.value = false
              showToastMessage(
                `Não é possível excluir. O responsável está associado a ${processos.length} processo(s).`,
                'error'
              )
              return
            }
            
            // Procede com a exclusão
            const { error } = await supabase
              .from('responsaveis_processos')
              .delete()
              .eq('id', responsavel.id)
            
            if (error) throw error
            
            showConfirmDialog.value = false
            showToastMessage('Responsável excluído com sucesso!')
            await loadResponsaveis()
          } catch (error) {
            console.error('Erro ao excluir responsável:', error)
            showToastMessage('Erro ao excluir responsável', 'error')
          }
        }
      }
    }

    // Função para mostrar mensagens toast
    const showToastMessage = (message, type = 'success') => {
      toastConfig.value = {
        message,
        type
      }
      showToast.value = true
      setTimeout(() => {
        showToast.value = false
      }, 3000)
    }

    // Função para verificar permissão de admin
    const checkAdminAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/login');
          return false;
        }
        
        // Buscar perfil do usuário
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Erro ao buscar perfil:', error);
          showAccessDeniedModal.value = true;
          return false;
        }
        
        // Verificar se é admin
        const isAdmin = profile?.role === 'admin';
        
        if (!isAdmin) {
          showAccessDeniedModal.value = true;
          return false;
        }
        
        return true;
      } catch (error) {
        console.error('Erro ao verificar acesso:', error);
        return false;
      }
    };

    // Função para lidar com toggle do sidebar - Corrigir para o mesmo padrão das outras páginas
    const handleSidebarToggle = (expanded) => {
      console.log('Sidebar toggle:', expanded);
      isSidebarExpanded.value = expanded;
    }

    // Função para redirecionar ao detectar acesso negado
    const redirectToHome = () => {
      router.push('/processos')
    }

    // Função para recarregar dados
    const loadData = async () => {
      await loadResponsaveis()
    }
    
    // Usar o composable para gerenciar reconexões
    useConnectionManager(loadData)

    // Função para verificar se o responsável está vinculado a algum processo
    const isUsuarioVinculado = async (responsavel) => {
      try {
        // Verifica se o responsável está vinculado a algum processo
        const { data, error } = await supabase
          .from('processos')
          .select('id')
          .eq('responsavel_id', responsavel.id)
          .limit(1);
        
        if (error) throw error;
        
        // Se encontrou algum processo, o responsável está vinculado
        return data && data.length > 0;
      } catch (error) {
        console.error('Erro ao verificar vínculo do responsável:', error);
        return false; // Em caso de erro, permitimos a exclusão
      }
    };

    // Cache para responsáveis em uso (para não fazer muitas chamadas ao banco)
    const responsaveisEmUso = ref({});

    // Verifica se o responsável está em uso em algum processo
    const isResponsavelEmUso = async (responsavel) => {
      // Se já temos o resultado em cache, retorna direto
      if (responsaveisEmUso.value[responsavel.id] !== undefined) {
        return responsaveisEmUso.value[responsavel.id];
      }
      
      try {
        const { data, error } = await supabase
          .from('processos')
          .select('id')
          .eq('responsavel_id', responsavel.id)
          .limit(1);
        
        if (error) throw error;
        
        // Armazena o resultado em cache
        const emUso = data && data.length > 0;
        responsaveisEmUso.value[responsavel.id] = emUso;
        return emUso;
      } catch (error) {
        console.error('Erro ao verificar uso do responsável:', error);
        return false; // Em caso de erro, permitimos exclusão
      }
    };

    // Lifecycle hooks
    onMounted(async () => {
      try {
        const hasAccess = await checkAdminAccess()
        if (!hasAccess) {
          return
        }

        const { data: { user } } = await supabase.auth.getUser()
        currentUser.value = user
        await loadResponsaveis()
        
        // Verificar o estado inicial do sidebar
        const savedState = localStorage.getItem('sidebarState')
        if (savedState !== null) {
          isSidebarExpanded.value = savedState === 'true'
          
          // Ajustar o layout imediatamente baseado no estado do sidebar
          nextTick(() => {
            const mainContent = document.querySelector('.main-content-resp-admin')
            if (mainContent) {
              if (isSidebarExpanded.value) {
                mainContent.classList.remove('expanded')
              } else {
                mainContent.classList.add('expanded')
              }
            }
          })
        }
        
      } catch (error) {
        console.error('Erro ao inicializar página:', error)
      }

      // Configurando canal Realtime para atualizações de dados
      const channel = supabase.channel('responsaveis-updates')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'responsaveis_processos' }, 
          () => loadData()
        )
        .subscribe()
      
      // Registrar canal no gerenciador
      SupabaseManager.addSubscription('responsaveis-updates', channel)
      
      // Verificar o estado inicial do sidebar
      const savedState = localStorage.getItem('sidebarState')
      if (savedState !== null) {
        isSidebarExpanded.value = savedState === 'true'
      }
      
      // Adicionar listener para eventos de armazenamento
      window.addEventListener('storage', (event) => {
        if (event.key === 'sidebarState') {
          isSidebarExpanded.value = event.newValue === 'true'
        }
      })

      // Adicionar um listener para eventos de click globais - NOVO CÓDIGO
      document.addEventListener('click', (e) => {
        const sidebar = document.querySelector('.sidebar')
        const trigger = document.querySelector('.sidebar-trigger')
        
        if (sidebar && trigger && 
            !sidebar.contains(e.target) && 
            !trigger.contains(e.target)) {
          // Se clicar fora do sidebar e ele não estiver fixado
          const isPinned = localStorage.getItem('sidebarPinned') === 'true'
          if (!isPinned) {
            isSidebarExpanded.value = false
          }
        }
      })
    })

    onUnmounted(() => {
      const channel = SupabaseManager.getSubscription('responsaveis-updates')
      if (channel) {
        supabase.removeChannel(channel)
        SupabaseManager.removeSubscription('responsaveis-updates')
      }

      // Remover os event listeners
      window.removeEventListener('storage', (event) => {
        if (event.key === 'sidebarState') {
          isSidebarExpanded.value = event.newValue === 'true'
        }
      })
      
      // Remover o listener de clique - NOVO CÓDIGO
      document.removeEventListener('click', (e) => {
        const sidebar = document.querySelector('.sidebar')
        const trigger = document.querySelector('.sidebar-trigger')
        if (sidebar && trigger && 
            !sidebar.contains(e.target) && 
            !trigger.contains(e.target)) {
          const isPinned = localStorage.getItem('sidebarPinned') === 'true'
          if (!isPinned) {
            isSidebarExpanded.value = false
          }
        }
      })
    })

    // Monitorar mudanças no sidebar para ajustar layout - Corrigir lógica
    watch(isSidebarExpanded, (newValue) => {
      nextTick(() => {
        const mainContent = document.querySelector('.main-content-resp-admin')
        if (mainContent) {
          if (newValue) {
            mainContent.classList.remove('expanded')
          } else {
            mainContent.classList.add('expanded')
          }
        }
      })
    })

    // Retornar variáveis e funções para o template
    return {
      loading,
      responsaveis,
      currentUser,
      isSidebarExpanded,
      showAddModal,
      showConfirmDialog,
      dialogConfig,
      formData, // Novo nome para newResponsavel
      showToast,
      toastConfig,
      editingNames,
      editingDepts,
      editingData,
      nameInput,
      deptInput,
      handleNameUpdate,
      handleDeptUpdate,
      startEditingName,
      startEditingDept,
      handleSidebarToggle,
      formatStatus,
      handleSaveResponsavel, // Nova função unificada
      openAddModal, // Nova função para abrir modal de adição
      openEditModal, // Nova função para abrir modal de edição
      closeModal,  // Adicionar a nova função
      isEditing, // Flag para controlar o modo do modal
      toggleResponsavelStatus,
      deleteResponsavel,
      showAccessDeniedModal,
      redirectToHome,
      isUsuarioVinculado,
      isResponsavelEmUso
    }
  }
}