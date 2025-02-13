<template>
  <div class="layout">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />
    
    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <div class="config-header">
        <h1>Administração de Usuários</h1>
        <button @click="showAddUserModal = true" class="btn-add">
          <img src="/icons/adicao.svg" alt="Adicionar" class="icon icon-add" />
          Novo Usuário
        </button>
      </div>

      <div class="users-grid">
        <div v-if="loading" class="loading">Carregando usuários...</div>
        
        <table v-else class="users-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Função</th>
              <th>Status</th>
              <th>Criado em</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ formatUserDisplay(user) }}</td>
              <td>
                <select 
                  :value="user.role"
                  @change="handleRoleChange(user, $event.target.value)"
                  :disabled="user.id === currentUser?.id"
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
              </td>
              <td>
                <span :class="['status-badge', user.status]">
                  {{ formatStatus(user.status) }}
                </span>
              </td>
              <td>{{ formatDate(user.created_at) }}</td>
              <td class="actions">
                <button 
                  @click="deleteUser(user)" 
                  class="btn-delete"
                  :disabled="user.id === currentUser?.id"
                >
                  <img src="/icons/lixeira.svg" alt="Excluir" class="btn-action" />
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
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import TheSidebar from '@/components/TheSidebar.vue'

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
  role: 'user'
})

const loadUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('status', { ascending: true }) // ACTIVE primeiro
      .order('created_at', { ascending: false })
    
    if (error) throw error
    users.value = data
  } catch (error) {
    console.error('Erro ao carregar usuários:', error)
  }
}

const handleAddUser = async () => {
  try {
    loading.value = true
    
    const { data, error } = await supabase.auth.signUp({
      email: newUser.value.email,
      password: newUser.value.password,
      options: {
        data: {
          role: newUser.value.role
        }
      }
    })

    if (error) throw error

    // Criar perfil
    await supabase.from('profiles').insert({
      id: data.user.id,
      email: newUser.value.email,
      role: newUser.value.role
    })

    showAddUserModal.value = false
    await loadUsers()
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
  } finally {
    loading.value = false
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
    showToastMessage('Não é possível desativar seu próprio usuário', 'error')
    return
  }

  dialogConfig.value = {
    title: 'Confirmar Desativação',
    message: `Deseja realmente desativar o usuário ${user.email}?`,
    warning: 'O usuário não poderá mais acessar o sistema!',
    confirmText: 'Desativar',
    onConfirm: async () => {
      try {
        // Atualizar status para desativado
        const { error } = await supabase
          .from('profiles')
          .update({ 
            status: 'DISABLED',
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)
        
        if (error) throw error
        
        await loadUsers()
        showConfirmDialog.value = false
        showToastMessage('Usuário desativado com sucesso!')
      } catch (error) {
        console.error('Erro ao desativar usuário:', error)
        showToastMessage('Erro ao desativar usuário', 'error')
      }
    },
    onCancel: () => {
      showConfirmDialog.value = false
    }
  }
  showConfirmDialog.value = true
}

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

onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  currentUser.value = user
  await loadUsers()
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

/* Cabeçalho */
.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

.config-header h1 {
  font-size: 1.875rem;
  font-weight: 600;
  color: #1f2937;
}

/* Botão Adicionar */
.btn-add {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  background: var(--company-red, #193155);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-add:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.icon {
  width: 20px;
  height: 20px;
  filter: brightness(0) invert(1);
}


.actions-cell {
  width: 100px;
}

.actions-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-action {
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

.btn-action.edit {
  background: #e3f2fd;
}

.btn-action.delete {
  background: #fee2e2;
}

.btn-action:hover {
  transform: translateY(-2px);
}

.btn-action.edit:hover {
  background: #bbdefb;
}

.btn-action.delete:hover {
  background: #fecaca;
}

.icon {
  width: 16px;
  height: 16px;
  transition: all 0.3s ease;
}

.icon-add {
  width: 20px;
  height: 20px;
  filter: brightness(0) invert(1); /* Deixa o ícone branco */
}

/* Tabela de Usuários */
.users-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.users-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  padding: 1rem 1.5rem;
}

.users-table td {
  padding: 1rem 1.5rem;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
}

/* Status badges */
.status-badge {
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: uppercase;
}

.status-badge.ACTIVE {
  background: #dcfce7;
  color: #16a34a;
}

.status-badge.DISABLED {
  background: #fee2e2;
  color: #dc2626;
}

.status-badge.PENDING {
  background: #fef3c7;
  color: #d97706;
}

/* Seletor de função */
select {
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #f8fafc;
  color: #334155;
  font-size: 0.875rem;
  transition: all 0.2s;
}

select:hover:not(:disabled) {
  border-color: #94a3b8;
}

select:disabled {
  background: #f1f5f9;
  cursor: not-allowed;
}

/* Botões de ação */
.btn-delete {
  padding: 0.5rem;
  background: #fee2e2;
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
  max-width: 500px;
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

/* Ajuste do Dark Mode para o Toast */
:deep(.dark-mode) {
  .toast-success {
    background: #059669;
  }
  
  .toast-error {
    background: #dc2626;
  }
}

/* Dark Mode */
:deep(.dark-mode) {
  .main-content {
    background: #111827;
  }

  .config-header h1 {
    color: white;
  }

  .config-header {
    border-color: #374151;
  }

  .users-table {
    background: #1f2937;
  }

  .users-table th {
    background: #111827;
    color: #9ca3af;
  }

  .users-table td {
    color: #e5e7eb;
    border-color: #374151;
  }

  select {
    background: #374151;
    border-color: #4b5563;
    color: white;
  }

  .modal-content {
    background: #1f2937;
  }

  .modal-content h2 {
    color: white;
  }

  .form-group label {
    color: #e5e7eb;
  }

  .form-group input,
  .form-group select {
    background: #374151;
    border-color: #4b5563;
    color: white;
  }

  .btn-cancel {
    background: #374151;
    color: #e5e7eb;
  }

  .btn-cancel:hover {
    background: #4b5563;
  }

  .modal-actions {
    border-color: #374151;
  }

  .confirm-dialog {
    background: #1f2937;
  }

  .confirm-content h3 {
    color: white;
  }

  .confirm-content p {
    color: #e5e7eb;
  }

  .btn-secondary {
    background: #374151;
    color: #e5e7eb;
  }

  .btn-secondary:hover {
    background: #4b5563;
  }

  .btn-danger {
    background: #b91c1c;
  }

  .btn-danger:hover {
    background: #991b1b;
  }
  
  .confirm-dialog {
    background: #1f2937;
  }
  
  .confirm-content h3 {
    color: white;
  }
  
  .confirm-content p {
    color: #e5e7eb;
  }
  
  .btn-secondary {
    background: #374151;
    color: #e5e7eb;
  }
}
</style>