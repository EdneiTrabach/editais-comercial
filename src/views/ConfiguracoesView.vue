<template>
  <div class="layout">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />
    
    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <div class="header">
        <h1>Administração de Usuários</h1>
        <div class="actions">
          <button @click="showAddUserModal = true" class="btn-add">
            <img src="/icons/adicao.svg" alt="Adicionar" class="icon icon-add" />
            Novo Usuário
          </button>
        </div>
      </div>

      <div class="table-container">
        <div v-if="loading" class="loading">Carregando usuários...</div>
        
        <table v-else class="excel-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Função</th>
              <th>Status</th>
              <th>Criado em</th>
              <th class="actions-column">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>
                <input 
                  :value="user.nome || ''"
                  @blur="handleNameUpdate(user, $event.target.value)"
                  type="text"
                  placeholder="Digite o nome"
                  class="name-input"
                />
              </td>
              <td>{{ formatUserDisplay(user) }}</td>
              <td>
                <select 
                  :value="user.role"
                  @change="handleRoleChange(user, $event.target.value)"
                  :disabled="user.id === currentUser?.id"
                  class="role-select"
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
              </td>
              <td>
                <span :class="['status', user.status?.toLowerCase()]">
                  {{ formatStatus(user.status) }}
                </span>
                <button 
                  @click="toggleUserStatus(user)"
                  class="btn-toggle-status"
                  :disabled="user.id === currentUser?.id"
                  :title="user.status === 'ACTIVE' ? 'Desativar usuário' : 'Ativar usuário'"
                >
                  <img 
                    :src="user.status === 'ACTIVE' ? '/icons/disable.svg' : '/icons/enable.svg'" 
                    :alt="user.status === 'ACTIVE' ? 'Desativar' : 'Ativar'" 
                    class="icon-status"
                  />
                </button>
              </td>
              <td>{{ formatDate(user.created_at) }}</td>
              <td class="actions-cell">
                <button 
                  @click="deleteUser(user)" 
                  class="btn-icon delete"
                  :disabled="user.id === currentUser?.id"
                >
                  <img src="/icons/lixeira.svg" alt="Excluir" class="icon" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Adicionar Usuário -->
    <div v-if="showAddUserModal" class="modal">
      <div class="modal-content">
        <h2>Adicionar Novo Usuário</h2>
        <form @submit.prevent="handleAddUser">
          <div class="form-group">
            <label>Email</label>
            <input 
              v-model="newUser.email" 
              type="email" 
              required 
            />
          </div>
          <div class="form-group">
            <label>Senha</label>
            <input 
              v-model="newUser.password" 
              type="password" 
              required 
              minlength="6"
            />
          </div>
          <div class="form-group">
            <label>Nome</label>
            <input 
              v-model="newUser.nome" 
              type="text" 
              required 
            />
          </div>
          <div class="form-group">
            <label>Função</label>
            <select v-model="newUser.role">
              <option value="user">Usuário</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="button" @click="showAddUserModal = false" class="btn-cancel">
              Cancelar
            </button>
            <button type="submit" class="btn-confirm" :disabled="loading">
              {{ loading ? 'Criando...' : 'Criar Usuário' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Confirm Dialog -->
    <div v-if="showConfirmDialog" class="dialog-overlay">
      <div class="confirm-dialog">
        <div class="confirm-content">
          <h3>{{ dialogConfig.title }}</h3>
          <p>{{ dialogConfig.message }}</p>
          <p v-if="dialogConfig.warning" class="warning-text">
            {{ dialogConfig.warning }}
          </p>
          <div class="confirm-actions">
            <button class="btn btn-secondary" @click="hideConfirmDialog">
              Cancelar
            </button>
            <button 
              class="btn btn-danger" 
              @click="dialogConfig.onConfirm"
            >
              {{ dialogConfig.confirmText || 'Confirmar' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast de feedback -->
    <div 
      v-if="showToast" 
      :class="['toast', `toast-${toastConfig.type}`]"
    >
      {{ toastConfig.message }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'
import TheSidebar from '@/components/TheSidebar.vue'
import { useRouter } from 'vue-router'
import { useConnectionManager } from '@/composables/useConnectionManager'
import { SupabaseManager } from '@/lib/supabaseManager'

const router = useRouter()

const loading = ref(false)
const users = ref([])
const currentUser = ref(null)
const isSidebarExpanded = ref(true)
const showAddUserModal = ref(false)
const showConfirmDialog = ref(false)
const dialogConfig = ref({})
const previousRole = ref(null)
const showToast = ref(false)
const toastConfig = ref({
  message: '',
  type: 'success' // ou 'error'
})

const newUser = ref({
  email: '',
  password: '',
  nome: '',
  role: 'user'
})

// Função para atualizar o nome do usuário
const handleNameUpdate = async (user, newName) => {
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

// Modifique a função loadUsers para não depender da API de admin
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

// Função melhorada para deletar usuário
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
        // Chama a função RPC para deletar o usuário
        const { data, error } = await supabase
          .rpc('delete_user_secure', {
            user_id: user.id
          })

        if (error) throw error
        if (!data.success) throw new Error(data.message)

        await loadUsers()
        showConfirmDialog.value = false
        showToastMessage('Usuário excluído com sucesso!')
      } catch (error) {
        console.error('Erro ao excluir usuário:', error)
        showToastMessage('Erro ao excluir usuário', 'error')
      }
    },
    onCancel: () => {
      showConfirmDialog.value = false
    }
  }
  showConfirmDialog.value = true
}

const toggleUserStatus = async (user) => {
  const newStatus = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
  
  try {
    // Atualizar status na tabela profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (profileError) throw profileError;

    // Atualizar status no Auth (desativar/reativar)
    if (newStatus === 'DISABLED') {
      await supabase.auth.admin.updateUserById(user.id, {
        ban_duration: '87600h' // 10 anos
      });
    } else {
      await supabase.auth.admin.updateUserById(user.id, {
        ban_duration: '0h'
      });
    }

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

// Função para formatar nome/email do usuário
const formatUserDisplay = (user) => {
  return user.status === 'DISABLED' 
    ? `${user.email} - DESATIVADO` 
    : user.email
}

// Função para mostrar o toast
const showToastMessage = (message, type = 'success') => {
  toastConfig.value = { message, type }
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// Função para quando o usuário tenta mudar o role
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

const checkAdminAccess = async () => {
  try {
    console.log('Verificando acesso admin...');
    
    // 1. Obter usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('Usuário não autenticado');
      router.push('/login');
      return false;
    }

    // 2. Buscar perfil do usuário
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Erro ao buscar perfil:', error);
      return false;
    }

    // 3. Verificar se é admin
    const isAdmin = profile?.role === 'admin';
    console.log('Role do usuário:', profile?.role);

    if (!isAdmin) {
      console.log('Acesso negado - usuário não é admin');
      router.push('/');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro na verificação de acesso:', error);
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
  await loadProcessos() // ou qualquer outra função que carregue seus dados
}

// Use o composable
useConnectionManager(loadData)

onMounted(async () => {
  const isAdmin = await debugAccess()
  console.log('Usuário é admin?', isAdmin)
  
  if (!isAdmin) {
    router.push('/')
    return
  }
  
  try {
    console.log('Componente montado, verificando acesso...')
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
      { event: '*', schema: 'public', table: 'processos' }, 
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
</script>

<style src="../assets/styles/ConfiguracoesView.css"></style>