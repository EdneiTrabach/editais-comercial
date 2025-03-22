<template>
  <div class="layout-resp-admin">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />
    
    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <div class="header-resp-admin">
        <h1 class="title-resp-admin">Administração de Responsáveis</h1>
        <div class="actions-resp-admin">
          <button @click="showAddModal = true" class="btn-add-resp-admin">
            <img src="/icons/adicao.svg" alt="Adicionar" class="icon-resp-admin" />
            Novo Responsável
          </button>
        </div>
      </div>

      <div class="table-container-resp-admin">
        <div v-if="loading" class="loading-resp-admin">Carregando responsáveis...</div>
        
        <table v-else class="excel-table-resp-admin">
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
            <tr v-for="responsavel in responsaveis" :key="responsavel.id" class="tr-resp-admin">
              <td>
                <div class="editable-field">
                  <span v-if="!editingNames[responsavel.id]">{{ responsavel.nome }}</span>
                  <input 
                    v-else 
                    v-model="editingData[responsavel.id].nome" 
                    @blur="handleNameUpdate(responsavel, editingData[responsavel.id].nome)"
                    @keyup.enter="handleNameUpdate(responsavel, editingData[responsavel.id].nome)"
                    type="text" 
                    class="input-resp-admin"
                    ref="nameInput"
                  />
                  <button 
                    v-if="!editingNames[responsavel.id]"
                    @click="startEditingName(responsavel)" 
                    class="btn-edit-inline"
                  >
                    <img src="/icons/edicao.svg" alt="Editar" class="icon-small" />
                  </button>
                </div>
              </td>
              <td>{{ responsavel.email }}</td>
              <td>
                <div class="editable-field">
                  <span v-if="!editingDepts[responsavel.id]">{{ responsavel.departamento || '-' }}</span>
                  <input 
                    v-else 
                    v-model="editingData[responsavel.id].departamento" 
                    @blur="handleDeptUpdate(responsavel, editingData[responsavel.id].departamento)"
                    @keyup.enter="handleDeptUpdate(responsavel, editingData[responsavel.id].departamento)"
                    type="text" 
                    class="input-resp-admin"
                    ref="deptInput"
                  />
                  <button 
                    v-if="!editingDepts[responsavel.id]"
                    @click="startEditingDept(responsavel)" 
                    class="btn-edit-inline"
                  >
                    <img src="/icons/edicao.svg" alt="Editar" class="icon-small" />
                  </button>
                </div>
              </td>
              <td>
                <span :class="['status-badge', responsavel.status.toLowerCase()]">
                  {{ formatStatus(responsavel.status) }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button 
                    class="btn-action-resp-admin" 
                    @click="toggleResponsavelStatus(responsavel)"
                  >
                    <img 
                      :src="responsavel.status === 'ACTIVE' ? '/icons/disable.svg' : '/icons/enable.svg'" 
                      :alt="responsavel.status === 'ACTIVE' ? 'Inativar' : 'Ativar'" 
                      class="icon-action-resp-admin" 
                    />
                  </button>
                  <button 
                    class="btn-action-resp-admin btn-delete-resp-admin"
                    @click="deleteResponsavel(responsavel)"
                  >
                    <img src="/icons/lixeira.svg" alt="Excluir" class="icon-delete-resp-admin" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="responsaveis.length === 0">
              <td colspan="5" class="empty-table">
                Nenhum responsável cadastrado
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Adicionar Responsável -->
    <div v-if="showAddModal" class="modal-resp-admin">
      <div class="modal-content-resp-admin">
        <h2 class="modal-title-resp-admin">Adicionar Novo Responsável</h2>
        <form @submit.prevent="handleAddResponsavel" class="form-resp-admin">
          <div class="form-group-resp-admin">
            <label class="label-resp-admin">Nome*</label>
            <input 
              v-model="newResponsavel.nome" 
              type="text" 
              required 
              class="input-resp-admin"
            />
          </div>
          
          <div class="form-group-resp-admin">
            <label class="label-resp-admin">Email*</label>
            <input 
              v-model="newResponsavel.email" 
              type="email" 
              required 
              class="input-resp-admin"
            />
          </div>
          
          <div class="form-group-resp-admin">
            <label class="label-resp-admin">Departamento</label>
            <input 
              v-model="newResponsavel.departamento" 
              type="text"
              class="input-resp-admin"
            />
          </div>
          
          <div class="modal-actions-resp-admin">
            <button 
              type="button" 
              class="btn-cancel-resp-admin"
              @click="showAddModal = false"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              class="btn-confirm-resp-admin"
              :disabled="loading"
            >
              {{ loading ? 'Salvando...' : 'Salvar' }}
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