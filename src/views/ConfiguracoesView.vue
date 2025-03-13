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

<script src="../views/ConfiguracoesView.js"></script>
<style src="../assets/styles/ConfiguracoesView.css"></style>