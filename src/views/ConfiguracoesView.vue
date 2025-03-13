<template>
  <div class="layout-cfg-usuarios">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />
    
    <div class="main-content-cfg-usuarios" :class="{ 'expanded': !isSidebarExpanded }">
      <div class="header-cfg-usuarios">
        <h1 class="title-cfg-usuarios">Administração de Usuários</h1>
        <div class="actions-cfg-usuarios">
          <button @click="showAddUserModal = true" class="btn-add-cfg-usuarios">
            <img src="/icons/adicao.svg" alt="Adicionar" class="icon-cfg-usuarios" />
            Novo Usuário
          </button>
        </div>
      </div>

      <div class="table-container-cfg-usuarios">
        <div v-if="loading" class="loading-cfg-usuarios">Carregando usuários...</div>
        
        <table v-else class="excel-table-cfg-usuarios">
          <thead class="thead-cfg-usuarios">
            <tr class="tr-head-cfg-usuarios">
              <th class="th-cfg-usuarios">Nome</th>
              <th class="th-cfg-usuarios">Email</th>
              <th class="th-cfg-usuarios">Função</th>
              <th class="th-cfg-usuarios">Status</th>
              <th class="th-cfg-usuarios">Criado em</th>
              <th class="th-actions-cfg-usuarios">Ações</th>
            </tr>
          </thead>
          <tbody class="tbody-cfg-usuarios">
            <tr v-for="user in users" :key="user.id" class="tr-body-cfg-usuarios">
              <td class="td-cfg-usuarios">
                <input 
                  :value="user.nome || ''"
                  @blur="handleNameUpdate(user, $event.target.value)"
                  type="text"
                  placeholder="Digite o nome"
                  class="name-input-cfg-usuarios"
                />
              </td>
              <td class="td-cfg-usuarios">
                <input 
                  :value="user.email || ''"
                  @blur="handleEmailUpdate(user, $event.target.value)"
                  type="email"
                  placeholder="Digite o email"
                  class="email-input-cfg-usuarios"
                  :disabled="user.id === currentUser?.id"
                />
              </td>
              <td class="td-cfg-usuarios">
                <select 
                  :value="user.role"
                  @change="handleRoleChange(user, $event.target.value)"
                  :disabled="user.id === currentUser?.id"
                  class="role-select-cfg-usuarios"
                >
                  <option value="user" class="option-cfg-usuarios">Usuário</option>
                  <option value="admin" class="option-cfg-usuarios">Administrador</option>
                </select>
              </td>
              <td class="td-cfg-usuarios status-cell-cfg-usuarios">
                <div class="status-controls-cfg-usuarios">
                  <span :class="['status-badge-cfg-usuarios', user.status?.toLowerCase()]">
                    {{ formatStatus(user.status) }}
                  </span>
                  <button 
                    @click="toggleUserStatus(user)"
                    class="btn-toggle-cfg-usuarios"
                    :disabled="user.id === currentUser?.id"
                    :title="user.status === 'ACTIVE' ? 'Desativar usuário' : 'Ativar usuário'"
                  >
                    <img 
                      :src="user.status === 'ACTIVE' ? '/icons/disable.svg' : '/icons/enable.svg'" 
                      :alt="user.status === 'ACTIVE' ? 'Desativar' : 'Ativar'" 
                      class="icon-status-cfg-usuarios"
                    />
                  </button>
                </div>
              </td>
              <td class="td-cfg-usuarios">{{ formatDate(user.created_at) }}</td>
              <td class="td-actions-cfg-usuarios">
                <div class="actions-container-cfg-usuarios">
                  <button 
                    @click="resetPassword(user)" 
                    class="btn-action-cfg-usuarios btn-reset-cfg-usuarios"
                    :title="'Redefinir senha'"
                  >
                    <img src="../../public/icons/senha.svg" alt="Redefinir senha" class="icon-action-cfg-usuarios" />
                  </button>
                  <button 
                    @click="deleteUser(user)" 
                    class="btn-action-cfg-usuarios btn-delete-cfg-usuarios"
                    :disabled="user.id === currentUser?.id"
                  >
                    <img src="../../public/icons/lixeira.svg" alt="Excluir" class="icon-delete-cfg-usuarios" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Adicionar Usuário -->
    <div v-if="showAddUserModal" class="modal-cfg-usuarios">
      <div class="modal-content-cfg-usuarios">
        <h2 class="modal-title-cfg-usuarios">Adicionar Novo Usuário</h2>
        <form @submit.prevent="handleAddUser" class="form-cfg-usuarios">
          <div class="form-group-cfg-usuarios">
            <label class="label-cfg-usuarios">Email</label>
            <input 
              v-model="newUser.email" 
              type="email" 
              required 
              class="input-cfg-usuarios"
            />
          </div>
          <div class="form-group-cfg-usuarios">
            <label class="label-cfg-usuarios">Senha</label>
            <input 
              v-model="newUser.password" 
              type="password" 
              required 
              minlength="6"
              class="input-cfg-usuarios"
            />
          </div>
          <div class="form-group-cfg-usuarios">
            <label class="label-cfg-usuarios">Nome</label>
            <input 
              v-model="newUser.nome" 
              type="text" 
              required 
              class="input-cfg-usuarios"
            />
          </div>
          <div class="form-group-cfg-usuarios">
            <label class="label-cfg-usuarios">Função</label>
            <select v-model="newUser.role" class="select-cfg-usuarios">
              <option value="user" class="option-cfg-usuarios">Usuário</option>
              <option value="admin" class="option-cfg-usuarios">Administrador</option>
            </select>
          </div>
          <div class="modal-actions-cfg-usuarios">
            <button type="button" @click="showAddUserModal = false" class="btn-cancel-cfg-usuarios">
              Cancelar
            </button>
            <button type="submit" class="btn-confirm-cfg-usuarios" :disabled="loading">
              {{ loading ? 'Criando...' : 'Criar Usuário' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Confirm Dialog -->
    <div v-if="showConfirmDialog" class="dialog-overlay-cfg-usuarios">
      <div class="confirm-dialog-cfg-usuarios">
        <div class="confirm-content-cfg-usuarios">
          <h3 class="dialog-title-cfg-usuarios">{{ dialogConfig.title }}</h3>
          <p class="dialog-message-cfg-usuarios">{{ dialogConfig.message }}</p>
          <p v-if="dialogConfig.warning" class="warning-text-cfg-usuarios">
            {{ dialogConfig.warning }}
          </p>
          <div class="confirm-actions-cfg-usuarios">
            <button class="btn-secondary-cfg-usuarios" @click="hideConfirmDialog">
              Cancelar
            </button>
            <button 
              class="btn-danger-cfg-usuarios" 
              @click="dialogConfig.onConfirm"
            >
              {{ dialogConfig.confirmText || 'Confirmar' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Acesso Negado -->
    <div v-if="showAccessDeniedModal" class="dialog-overlay-cfg-usuarios">
      <div class="confirm-dialog-cfg-usuarios">
        <div class="confirm-content-cfg-usuarios">
          <h3 class="dialog-title-cfg-usuarios">Acesso Restrito</h3>
          <p class="dialog-message-cfg-usuarios">
            Olá, {{currentUserEmail}}
          </p>
          <p class="warning-text-cfg-usuarios">
            Você não tem permissão para acessar esta área. Esta seção é restrita apenas a administradores do sistema.
          </p>
          <div class="confirm-actions-cfg-usuarios">
            <button 
              class="btn-primary-cfg-usuarios" 
              @click="redirectToHome"
            >
              Voltar para o início
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast de feedback -->
    <div 
      v-if="showToast" 
      :class="['toast-cfg-usuarios', `toast-${toastConfig.type}`]"
    >
      {{ toastConfig.message }}
    </div>
  </div>
</template>

<script src="../views/ConfiguracoesView.js"></script>
<style src="../assets/styles/ConfiguracoesView.css"></style>