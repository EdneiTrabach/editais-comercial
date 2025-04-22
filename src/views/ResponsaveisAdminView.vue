<template>
  <div class="layout-resp-admin">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />
    
    <!-- Modal de acesso negado -->
    <div v-if="showAccessDeniedModal" class="dialog-overlay-resp-admin">
      <div class="confirm-dialog-resp-admin">
        <h2 class="dialog-title-resp-admin">Acesso Negado</h2>
        <p class="dialog-message-resp-admin">
          Você não tem permissão para acessar esta página. 
          É necessário ter privilégios de administrador.
        </p>
        <div class="confirm-actions-resp-admin">
          <button @click="redirectToHome" class="btn-confirm-resp-admin">
            Voltar para Home
          </button>
        </div>
      </div>
    </div>
    
    <div class="main-content-resp-admin" :class="{ 'expanded': !isSidebarExpanded }">
      <div class="header-resp-admin">
        <h1 class="title-resp-admin">Gestão de Responsáveis</h1>
        <div class="actions-resp-admin">
          <button @click="showAddModal = true" class="btn-add-resp-admin">
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='none' stroke='%23fff' stroke-width='2' d='M12 4v16m-8-8h16'/%3E%3C/svg%3E" alt="Adicionar" class="icon-resp-admin">
            Adicionar Responsável
          </button>
        </div>
      </div>

      <div class="table-container-resp-admin">
        <table class="excel-table-resp-admin">
          <thead class="thead-resp-admin">
            <tr class="tr-head-resp-admin">
              <th>Nome</th>
              <th>Email</th>
              <th>Departamento</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody class="tbody-resp-admin">
            <tr v-if="loading" class="tr-resp-admin">
              <td colspan="5" class="loading-resp-admin">
                Carregando responsáveis...
              </td>
            </tr>
            <tr v-else-if="responsaveis.length === 0" class="tr-resp-admin">
              <td colspan="5" class="empty-table">
                Nenhum responsável cadastrado
              </td>
            </tr>
            <tr v-else v-for="responsavel in responsaveis" :key="responsavel.id" class="tr-resp-admin">
              <!-- Coluna Nome -->
              <td>
                <div v-if="editingNames[responsavel.id]" class="editing-field">
                  <input 
                    v-model="editingData[responsavel.id].nome"
                    class="input-resp-admin"
                    ref="nameInput"
                    @keyup.enter="handleNameUpdate(responsavel, editingData[responsavel.id].nome)"
                    @blur="handleNameUpdate(responsavel, editingData[responsavel.id].nome)"
                    type="text"
                  />
                </div>
                <div v-else class="editable-field">
                  {{ responsavel.nome || '—' }}
                </div>
              </td>
              
              <!-- Coluna Email -->
              <td>{{ responsavel.email || '—' }}</td>
              
              <!-- Coluna Departamento -->
              <td>
                <div v-if="editingDepts[responsavel.id]" class="editing-field">
                  <input 
                    v-model="editingData[responsavel.id].departamento"
                    class="input-resp-admin"
                    ref="deptInput"
                    @keyup.enter="handleDeptUpdate(responsavel, editingData[responsavel.id].departamento)"
                    @blur="handleDeptUpdate(responsavel, editingData[responsavel.id].departamento)"
                    type="text"
                  />
                </div>
                <div v-else class="editable-field">
                  {{ responsavel.departamento || '—' }}
                </div>
              </td>
              
              <!-- Coluna Status -->
              <td>
                <span :class="'status-badge ' + responsavel.status.toLowerCase()">
                  {{ formatStatus(responsavel.status) }}
                </span>
              </td>
              
              <!-- Coluna de Ações -->
              <td>
                <div class="acoes-column-responsaveis">
                  <!-- Botão Editar -->
                  <button 
                    class="btn-icon edit" 
                    @click="openEditModal(responsavel)"
                    title="Editar responsável">
                    <img src="/icons/edicao.svg" alt="Editar" class="icon-small">
                  </button>
                  
                  <!-- Botão Ativar/Inativar -->
                  <button 
                    class="btn-icon" 
                    :class="responsavel.status === 'ACTIVE' ? 'deactivate' : 'activate'" 
                    @click="toggleResponsavelStatus(responsavel)"
                    :title="responsavel.status === 'ACTIVE' ? 'Inativar responsável' : 'Ativar responsável'">
                    <img 
                      :src="responsavel.status === 'ACTIVE' ? '/icons/disable.svg' : '/icons/enable.svg'" 
                      alt="Status" 
                      class="icon-small">
                  </button>
                  
                  <!-- Botão Excluir -->
                  <button 
                    class="btn-icon delete" 
                    v-if="!isResponsavelEmUso(responsavel)"
                    @click="deleteResponsavel(responsavel)"
                    title="Excluir responsável">
                    <img src="/icons/lixeira.svg" alt="Excluir" class="icon-small">
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Adicionar/Editar Responsável -->
    <div v-if="showAddModal" class="modal-resp-admin">
      <div class="modal-content-resp-admin">
        <h2 class="modal-title-resp-admin">{{ isEditing ? 'Editar Responsável' : 'Novo Responsável' }}</h2>
        
        <form @submit.prevent="handleSaveResponsavel" class="form-resp-admin">
          <div class="form-group-resp-admin">
            <label for="nome">Nome</label>
            <input 
              id="nome" 
              v-model="formData.nome" 
              type="text" 
              class="input-resp-admin" 
              required 
              placeholder="Nome completo"
            >
          </div>
          
          <div class="form-group-resp-admin">
            <label for="email">Email</label>
            <input 
              id="email" 
              v-model="formData.email" 
              type="email" 
              class="input-resp-admin" 
              required 
              placeholder="email@exemplo.com"
              :disabled="isEditing"
            >
            <small v-if="isEditing" class="form-helper-text">O email não pode ser alterado após o cadastro.</small>
          </div>
          
          <div class="form-group-resp-admin">
            <label for="departamento">Departamento</label>
            <input 
              id="departamento" 
              v-model="formData.departamento" 
              type="text" 
              class="input-resp-admin" 
              placeholder="Departamento (opcional)"
            >
          </div>

          <div class="form-group-resp-admin" v-if="isEditing">
            <label for="status">Status</label>
            <select id="status" v-model="formData.status" class="input-resp-admin">
              <option value="ACTIVE">Ativo</option>
              <option value="INACTIVE">Inativo</option>
            </select>
          </div>
          
          <div class="modal-actions-resp-admin">
            <button type="button" class="btn-cancel-resp-admin" @click="closeModal">
              Cancelar
            </button>
            <button type="submit" class="btn-confirm-resp-admin" :disabled="loading">
              {{ isEditing ? 'Atualizar' : 'Salvar' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de Confirmação -->
    <div v-if="showConfirmDialog" class="dialog-overlay-resp-admin">
      <div class="confirm-dialog-resp-admin">
        <div class="confirm-content-resp-admin">
          <h3 class="dialog-title-resp-admin">{{ dialogConfig.title }}</h3>
          <p class="dialog-message-resp-admin">{{ dialogConfig.message }}</p>
          <p v-if="dialogConfig.warning" class="warning-text-resp-admin">
            {{ dialogConfig.warning }}
          </p>
          
          <div class="confirm-actions-resp-admin">
            <button 
              class="btn-secondary-resp-admin" 
              @click="showConfirmDialog = false"
            >
              Cancelar
            </button>
            <button 
              class="btn-danger-resp-admin" 
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
      :class="['toast-resp-admin', `toast-${toastConfig.type}`]"
    >
      {{ toastConfig.message }}
    </div>
  </div>
</template>

<script src="./ResponsaveisAdminView.js"></script>
<style src="../assets/styles/ResponsaveisAdminView.css"></style>