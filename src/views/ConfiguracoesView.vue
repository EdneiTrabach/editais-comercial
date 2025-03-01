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

<style scoped>
/* Layout principal */
.layout {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
}

.main-content {
  flex: 1;
  padding: 2rem;
  transition: all 0.3s ease;
}


/* Botão Adicionar */
.btn-add {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #193155;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-add:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(25, 49, 85, 0.2);
}

.icon-add {
  width: 20px;
  height: 20px;
  filter: brightness(0) invert(1);
}

/* Tabela de Usuários */
.table-container {
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: auto;
}

.excel-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.excel-table th {
  background: #f8f9fa;
  padding: 1rem;
  font-weight: 600;
  text-align: left;
  color: #495057;
  border-bottom: 2px solid #e9ecef;
}

.excel-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e9ecef;
}

.name-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  font-family: inherit;
}

.role-select {
  width: 100%;
  padding: 0.9rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.9rem;
  color: #495057;
  background: #f8f9fa;
  cursor: pointer;
  transition: all 0.3s ease;
}

.role-select:focus {
  outline: none;
  border-color: #193155;
  box-shadow: 0 0 0 3px rgba(25, 49, 85, 0.1);
  background: white;
}

.role-select:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  background: #e9ecef;
}

.status {
  padding: 0.25rem 0.75rem;
  border-radius: 50px;
  font-size: 0.85rem;
  text-transform: uppercase;
}

.status.active {
  background: #d4edda;
  color: #155724;
}

.status.disabled {
  background: #f8d7da;
  color: #721c24;
}

.status.pending {
  background: #fff3cd;
  color: #856404;
}

.btn-toggle-status {
  background-color: transparent;
  border: none;
}

.icon-status {
  width: 20px;
  height: 20px;

}

.actions-cell {
  width: 80px;
  text-align: center;
}

.btn-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-icon.delete {
  background: #f77777;
}

.btn-icon.delete:hover {
  background: #fecaca;
  transform: translateY(-2px);
}

.btn-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-icon .icon {
  width: 16px;
  height: 16px;
  transition: all 0.3s ease;
}

/* Botões de ação */
.btn-delete {
  padding: 0.5rem;
  background: #fa8888;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-delete:hover:not(:disabled) {
  background: #fecaca;
}

.btn-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-delete .icon {
  width: 18px;
  height: 18px;
  color: #dc2626;
}

/* Modal */
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 100%;
  max-width: 50%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-content h2 {
  color: #1f2937;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

/* Formulário */
.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #4b5563;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Botões do Modal */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel,
.btn-confirm {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f3f4f6;
  color: #4b5563;
  border: none;
}

.btn-confirm {
  background: var(--company-red, #193155);
  color: white;
  border: none;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

.btn-confirm:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.btn-confirm:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Confirm Dialog */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.confirm-dialog {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.confirm-content h3 {
  color: #1f2937;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.confirm-content p {
  color: #4b5563;
  margin-bottom: 1.5rem;
}

.warning-text {
  color: #dc2626;
  font-weight: 500;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn-secondary {
  background: #f3f4f6;
  color: #4b5563;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-danger {
  background: #dc2626;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-danger:hover {
  background: #b91c1c;
}

/* Botões padrão do sistema */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  gap: 0.5rem;
}

.btn-primary {
  background: var(--company-red, #193155);
  color: white;
}

.btn-secondary {
  background: #e5e7eb;
  color: #374151;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Dialog estilizado */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.confirm-dialog {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  width: 90%;
  max-width: 450px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease;
}

.confirm-content {
  text-align: center;
}

.confirm-content h3 {
  color: #1f2937;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.confirm-content p {
  color: #4b5563;
  margin-bottom: 1rem;
}

.warning-text {
  color: #dc2626 !important;
  font-weight: 500;
}

.confirm-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

/* Animações */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Toast */
.toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  z-index: 1000;
  animation: slideInUp 0.3s ease, fadeOut 0.3s ease 2.7s;
  min-width: 300px;
  text-align: center;
}

.toast-success {
  background: #10b981;
  color: white;
  box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);
}

.toast-error {
  background: #ef4444;
  color: white;
  box-shadow: 0 4px 6px rgba(239, 68, 68, 0.2);
}

@keyframes slideInUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

/* Dark mode */
[data-theme="dark"] .role-select {
  background: #1e293b;
  color: #f9fafb;
  border-color: #2d3748;
}

[data-theme="dark"] .role-select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

[data-theme="dark"] .role-select:disabled {
  background: #374151;
  color: #9ca3af;
}

[data-theme="dark"] .btn-icon.delete {
  background: #991b1b;
}

[data-theme="dark"] .btn-icon.delete:hover {
  background: #b91c1c;
}
</style>