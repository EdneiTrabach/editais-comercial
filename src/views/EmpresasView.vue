<template>
  <div class="layout">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />
    
    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <div class="header">
        <h1>Empresas</h1>
        <div class="header-buttons">
          <button @click="loadEmpresas" class="btn-add btn-reload">
            Recarregar dados
          </button>
          <button class="btn-add" @click="showModal = true">
            <img src="/icons/adicao.svg" alt="Adicionar" class="icon icon-add" />
            Nova Empresa
          </button>
        </div>
      </div>
      
      <div class="table-container">
        <div v-if="isLoading" class="loading-indicator">Carregando empresas...</div>
        <div v-else-if="loadError" class="error-message">{{ loadError }}</div>
        <div v-else-if="empresas.length === 0" class="empty-state">Nenhuma empresa cadastrada</div>
        <table v-else class="excel-table">
          <thead>
            <tr>
              <th>Nome Fantasia</th>
              <th>CNPJ</th>
              <th>Razão Social</th>
              <th>Contato</th>
              <th>Telefone</th>
              <th>Email</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="empresa in empresas" :key="empresa.id">
              <td>{{ empresa.nome }}</td>
              <td>{{ formatCNPJ(empresa.cnpj) }}</td>
              <td>{{ empresa.razao_social }}</td>
              <td>{{ empresa.contato }}</td>
              <td>{{ empresa.telefone }}</td>
              <td>{{ empresa.email }}</td>
              <td>
                <div class="action-buttons">
                  <button class="btn-action edit" @click="editEmpresa(empresa)">
                    <img src="/icons/edicao.svg" alt="Editar" class="icon" />
                  </button>
                  <button class="btn-action delete" @click="handleDelete(empresa)">
                    <img src="/icons/lixeira.svg" alt="Excluir" class="icon" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal de Cadastro (Padronizado) -->
      <div v-if="showModal" class="modal-cfg-usuarios">
        <div class="modal-content-cfg-usuarios">
          <h2 class="modal-title-cfg-usuarios">{{ isEditing ? 'Editar Empresa' : 'Nova Empresa' }}</h2>
          <form @submit.prevent="handleSubmit" class="form-cfg-usuarios">
            <div class="form-grid">
              <div class="form-column">
                <div class="form-group-cfg-usuarios">
                  <label>Nome Fantasia</label>
                  <input v-model="formData.nome" required class="input-cfg-usuarios">
                </div>
                <div class="form-group-cfg-usuarios">
                  <label>CNPJ</label>
                  <input 
                    v-model="formData.cnpj" 
                    @input="formatarCNPJ" 
                    placeholder="00.000.000/0000-00"
                    required
                    @blur="validateCNPJ"
                    :class="{ 'invalid': cnpjError, 'input-cfg-usuarios': true }"
                  >
                  <span v-if="cnpjError" class="error-message">{{ cnpjError }}</span>
                </div>
                <div class="form-group-cfg-usuarios">
                  <label>Razão Social</label>
                  <input v-model="formData.razao_social" required class="input-cfg-usuarios">
                </div>
              </div>
              
              <div class="form-column">
                <div class="form-group-cfg-usuarios">
                  <label>Contato</label>
                  <input v-model="formData.contato" class="input-cfg-usuarios">
                </div>
                <div class="form-group-cfg-usuarios">
                  <label>Telefone</label>
                  <input 
                    v-model="formData.telefone" 
                    @input="formatarTelefone"
                    placeholder="(00) 00000-0000"
                    class="input-cfg-usuarios"
                  >
                </div>
                <div class="form-group-cfg-usuarios">
                  <label>Email</label>
                  <input type="email" v-model="formData.email" class="input-cfg-usuarios">
                </div>
              </div>
            </div>

            <div class="modal-actions-cfg-usuarios">
              <button type="button" class="btn-cancel-cfg-usuarios" @click="resetForm">Cancelar</button>
              <button type="submit" class="btn-confirm-cfg-usuarios">Salvar</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal de confirmação de exclusão (Padronizado) -->
      <div v-if="showDeleteDialog" class="dialog-overlay-cfg-usuarios">
        <div class="confirm-dialog-cfg-usuarios">
          <div class="confirm-content-cfg-usuarios">
            <h3 class="dialog-title-cfg-usuarios">Confirmar Exclusão</h3>
            
            <div v-if="empresaToDelete?.temVinculacoes" class="warning-detail-cfg-usuarios">
              <i class="fas fa-exclamation-triangle"></i>
              <p>Esta empresa possui <strong>{{ empresaToDelete.qtdVinculacoes }}</strong> vinculações com plataformas.</p>
              <p>Todas essas vinculações também serão excluídas.</p>
            </div>
            
            <p class="dialog-message-cfg-usuarios">Deseja realmente excluir a empresa <strong>{{ empresaToDelete?.nome }}</strong>?</p>
            <p class="warning-text-cfg-usuarios">Esta ação não poderá ser desfeita!</p>
            
            <div class="confirm-actions-cfg-usuarios">
              <button type="button" class="btn-secondary-cfg-usuarios" @click="hideDeleteDialog">
                Cancelar
              </button>
              <button type="button" class="btn-danger-cfg-usuarios" @click="confirmDelete">
                Excluir
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Toast notifications (Padronizado) -->
      <div v-if="showToast" class="toast-cfg-usuarios" :class="{ 'toast-success': toastType === 'success', 'toast-error': toastType === 'error' }">
        <i :class="toastType === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"></i>
        {{ toastMessage }}
      </div>
    </div>
  </div>
</template>

<script src="../views/EmpresasView.js"></script>
<style src="../assets/styles/EmpresasView.css"></style>