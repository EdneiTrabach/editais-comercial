import { ref, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'
import TheSidebar from '@/components/TheSidebar.vue'
import { useRouter } from 'vue-router'
import { useConnectionManager } from '@/composables/useConnectionManager'
import { SupabaseManager } from '@/lib/supabaseManager'

export default {
  components: {
    TheSidebar
  },
  setup() {
    const router = useRouter()
    const loading = ref(false)
    const users = ref([])
    const currentUser = ref(null)
    const isSidebarExpanded = ref(true)
    const showAddUserModal = ref(false)
    const showConfirmDialog = ref(false)
    const showAccessDeniedModal = ref(false)  // Novo estado para o modal de acesso negado
    const dialogConfig = ref({})
    const previousRole = ref(null)
    const showToast = ref(false)
    const toastConfig = ref({
      message: '',
      type: 'success'
    })
    const newUser = ref({
      email: '',
      password: '',
      nome: '',
      role: 'user'
    })
    const currentUserEmail = ref('');

    // Todas as funções existentes...
    const handleNameUpdate = async (user, newName) => {
      // Seu código existente
      if (user.nome === newName) return

      try {
        // Atualiza apenas na tabela profiles
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            nome: newName,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)

        if (profileError) throw profileError

        // Atualiza localmente
        user.nome = newName
        showToastMessage('Nome atualizado com sucesso!')
      } catch (error) {
        console.error('Erro ao atualizar nome:', error)
        showToastMessage('Erro ao atualizar nome', 'error')
      }
    }

    // Adicionar todas as funções existentes aqui...
    // handleAddUser, loadUsers, updateUserRole, deleteUser, etc.

    // Função para criar novo usuário
    const handleAddUser = async () => {
      try {
        loading.value = true
    
        // 1. Criar usuário no Auth
        const { data, error } = await supabase.auth.signUp({
          email: newUser.value.email,
          password: newUser.value.password,
          options: {
            data: {
              nome: newUser.value.nome
            }
          }
        })
    
        if (error) throw error
    
        // 2. Criar perfil do usuário
        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email,
              nome: newUser.value.nome,
              role: newUser.value.role,
              status: 'ACTIVE',
              created_at: new Date().toISOString()
            })
    
          if (profileError) throw profileError
        }
    
        // 3. Feedback e limpeza
        showToastMessage('Usuário criado com sucesso!')
        showAddUserModal.value = false
        await loadUsers()
    
        // 4. Resetar form
        newUser.value = {
          email: '',
          password: '',
          nome: '',
          role: 'user'
        }
    
      } catch (error) {
        console.error('Erro ao criar usuário:', error)
        showToastMessage(error.message || 'Erro ao criar usuário', 'error')
      } finally {
        loading.value = false
      }
    }

    const loadUsers = async () => {
      try {
        console.log('Iniciando carregamento de usuários...')
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('status', { ascending: true })
          .order('created_at', { ascending: false })
        
        console.log('Resposta do servidor:', { profilesData, profilesError })
    
        if (profilesError) throw profilesError
    
        users.value = profilesData.map(profile => ({
          ...profile,
          nome: profile.nome || '',
          email: profile.email || ''
        }))
      } catch (error) {
        console.error('Erro ao carregar usuários:', error)
        showToastMessage('Erro ao carregar usuários', 'error')
      }
    }

    const updateUserRole = async (user) => {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ role: user.role })
          .eq('id', user.id)
        
        if (error) throw error
      } catch (error) {
        console.error('Erro ao atualizar função:', error)
      }
    }

    const deleteUser = async (user) => {
      if (user.id === currentUser.value?.id) {
        showToastMessage('Não é possível excluir seu próprio usuário', 'error')
        return
      }
    
      dialogConfig.value = {
        title: 'Confirmar Exclusão',
        message: `Deseja realmente excluir o usuário ${user.email}?`,
        warning: 'Esta ação é irreversível!',
        confirmText: 'Excluir',
        onConfirm: async () => {
          try {
            // Primeiro, desativa o usuário atualizando o status
            const { error: profileError } = await supabase
              .from('profiles')
              .update({
                status: 'DELETED',
                updated_at: new Date().toISOString()
              })
              .eq('id', user.id)
    
            if (profileError) throw profileError
    
            // Agora podemos atualizar a UI e fechar o diálogo
            await loadUsers() // Recarregar usuários
            showConfirmDialog.value = false
            showToastMessage('Usuário excluído com sucesso!')
          } catch (error) {
            console.error('Erro ao excluir usuário:', error)
            showToastMessage('Erro ao excluir usuário', 'error')
          }
        }
      }
      showConfirmDialog.value = true
    }

    const toggleUserStatus = async (user) => {
      const newStatus = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
      
      try {
        // Atualizar apenas status na tabela profiles
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (profileError) throw profileError;

        // Removido o código que tentava modificar diretamente o usuário via auth.admin
        // Isso seria feito usando funções no backend ou funções RPC seguras

        // Atualizar UI
        user.status = newStatus;
        showToastMessage(`Usuário ${newStatus === 'ACTIVE' ? 'ativado' : 'desativado'} com sucesso!`);
        await loadUsers();

      } catch (error) {
        console.error('Erro ao alterar status:', error);
        showToastMessage('Erro ao alterar status do usuário', 'error');
      }
    };

    const handleSidebarToggle = (expanded) => {
      isSidebarExpanded.value = expanded
    }

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('pt-BR')
    }

    const formatStatus = (status) => {
      const statusMap = {
        ACTIVE: 'Ativo',
        DISABLED: 'Desativado',
        PENDING: 'Pendente'
      }
      return statusMap[status] || status
    }

    const formatUserDisplay = (user) => {
      return user.status === 'DISABLED' 
        ? `${user.email} - DESATIVADO` 
        : user.email
    }

    const showToastMessage = (message, type = 'success') => {
      toastConfig.value = { message, type }
      showToast.value = true
      setTimeout(() => {
        showToast.value = false
      }, 3000)
    }

    const handleRoleChange = (user, newRole) => {
      previousRole.value = user.role // Guarda o valor anterior
      
      dialogConfig.value = {
        title: 'Confirmar Alteração',
        message: `Deseja realmente alterar a função do usuário ${user.email} para ${newRole === 'admin' ? 'Administrador' : 'Usuário'}?`,
        warning: 'Esta ação afetará as permissões do usuário no sistema.',
        confirmText: 'Confirmar',
        onConfirm: async () => {
          try {
            // Atualizar o role no banco
            const { error } = await supabase
              .from('profiles')
              .update({ 
                role: newRole,
                updated_at: new Date().toISOString()
              })
              .eq('id', user.id)
            
            if (error) throw error
            
            // Atualiza o usuário local
            user.role = newRole
            
            // Atualiza a lista de usuários
            await loadUsers()
            showConfirmDialog.value = false
            showToastMessage('Função alterada com sucesso!')
          } catch (error) {
            console.error('Erro ao atualizar função:', error)
            user.role = previousRole.value // Reverte a mudança em caso de erro
            showToastMessage('Erro ao alterar função do usuário', 'error')
          }
        },
        onCancel: () => {
          user.role = previousRole.value // Reverte a mudança se cancelar
          showConfirmDialog.value = false
        }
      }
      showConfirmDialog.value = true
    }

    const syncUserData = async (userId, userData) => {
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            ...userData,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
    
        if (profileError) throw profileError
        
        return true
      } catch (error) {
        console.error('Erro ao sincronizar dados:', error)
        return false
      }
    }

    // Função para redirecionar após fechar o modal
    const redirectToHome = () => {
      showAccessDeniedModal.value = false
      router.push('/')
    }

    // Modificar a verificação de acesso para exibir o modal em vez de redirecionar imediatamente
    const checkAdminAccess = async () => {
      try {
        console.log('Verificando acesso admin...');
        
        // 1. Obter usuário atual
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/login');
          return false;
        }

        // Salvar o email do usuário atual
        currentUserEmail.value = user.email;
        
        // 2. Buscar perfil do usuário
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role, nome')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Erro ao buscar perfil:', error);
          showAccessDeniedModal.value = true;
          return false;
        }
        
        // 3. Verificar se é admin
        const isAdmin = profile?.role === 'admin';
        
        if (!isAdmin) {
          // IMPORTANTE: Mostrar modal em vez de alert ou console.log
          showAccessDeniedModal.value = true;
          return false;
        }
        
        // 4. Usuário é admin, continuar
        currentUser.value = user;
        return true;
      } catch (error) {
        console.error('Erro ao verificar acesso:', error);
        showAccessDeniedModal.value = true;
        return false;
      }
    };

    const debugAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        console.log('Usuário autenticado:', user)
    
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
    
        console.log('Perfil do usuário:', profile)
        console.log('Role do usuário:', profile?.role)
        console.log('Role no localStorage:', localStorage.getItem('userRole'))
    
        return profile?.role === 'admin'
      } catch (error) {
        console.error('Erro ao verificar acesso:', error)
        return false
      }
    }

    const loadData = async () => {
      try {
        await loadUsers() // Substitua loadProcessos por loadUsers
      } catch (error) {
        console.error("Erro carregando dados:", error)
      }
    }

    // Use o composable
    useConnectionManager(loadData)

    onMounted(async () => {
      // Seu código existente...
      try {
        const isAdmin = await debugAccess()
        console.log('Usuário é admin?', isAdmin)
        
        if (!isAdmin) {
          showAccessDeniedModal.value = true;
          return
        }
        
        const hasAccess = await checkAdminAccess()
        console.log('Tem acesso?', hasAccess)
        
        if (!hasAccess) {
          console.log('Sem acesso, retornando...')
          return
        }

        const { data: { user } } = await supabase.auth.getUser()
        currentUser.value = user
        await loadUsers()
      } catch (error) {
        console.error('Erro no onMounted:', error)
        showToastMessage('Erro ao carregar página', 'error')
      }

      const channel = supabase.channel('lances-updates')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'profiles' }, 
          () => loadData()
        )
        .subscribe()
      
      SupabaseManager.addSubscription('lances-updates', channel)
    })

    onUnmounted(() => {
      const channel = SupabaseManager.getSubscription('lances-updates')
      if (channel) {
        supabase.removeChannel(channel)
        SupabaseManager.removeSubscription('lances-updates')
      }
    })

    // Retornar variáveis e funções que serão usadas no template
    return {
      loading,
      users,
      currentUser,
      isSidebarExpanded,
      showAddUserModal,
      showConfirmDialog,
      dialogConfig,
      newUser,
      showToast,
      toastConfig,
      handleNameUpdate,
      handleAddUser,
      handleSidebarToggle,
      formatDate,
      formatStatus,
      formatUserDisplay,
      toggleUserStatus,
      deleteUser,
      handleRoleChange,
      hideConfirmDialog: () => { showConfirmDialog.value = false },
      showAccessDeniedModal, // Exportar nova ref
      redirectToHome, // Exportar nova função
      currentUserEmail
    }
  }
}