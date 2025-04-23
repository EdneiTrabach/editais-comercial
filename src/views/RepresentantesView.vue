<template>
  <div class="layout">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />
    
    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <div class="header">
        <h1>Gerenciamento de Representantes</h1>
        <div class="header-buttons">
          <button class="btn-add" @click="showModal = true">
            <img src="/icons/adicao.svg" alt="Adicionar" class="icon-add" />
            Novo Representante
          </button>
        </div>
      </div>

      <div class="table-container">
        <table class="representante-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Telefone</th>
              <th>Região</th>
              <th>Status</th>
              <th class="actions-column">Ações</th>
            </tr>
          </thead>
          <tbody v-if="isLoading">
            <tr>
              <td colspan="6" class="loading-cell">
                <div class="loading-indicator">Carregando representantes...</div>
              </td>
            </tr>
          </tbody>
          <tbody v-else-if="representantes.length === 0">
            <tr>
              <td colspan="6" class="no-data-cell">
                Nenhum representante encontrado
              </td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr v-for="representante in representantes" :key="representante.id">
              <td>{{ representante.nome }}</td>
              <td>{{ representante.email }}</td>
              <td>{{ representante.telefone }}</td>
              <td>{{ representante.regiao }}</td>
              <td>
                <span :class="['status-badge', `status-${representante.status?.toLowerCase()}`]">
                  {{ representante.status || 'ATIVO' }}
                </span>
              </td>
              <td class="actions-cell">
                <div class="acoes-container">
                  <button class="btn-icon edit" title="Editar representante" @click="editRepresentante(representante)">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn-icon delete" title="Excluir representante" @click="deleteRepresentante(representante)">
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal de Cadastro/Edição com Layout melhorado em grid -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingId ? 'Editar' : 'Novo' }} Representante</h3>
          <button class="btn-close" @click="closeModal">&times;</button>
        </div>
        <form @submit.prevent="handleSubmit" class="form-grid">
          <!-- Nome e Região -->
          <div class="form-row">
            <div class="form-group">
              <label>Nome*</label>
              <input 
                v-model="formData.nome"
                type="text"
                required
                placeholder="Nome completo"
                class="form-control"
              />
            </div>
            <div class="form-group">
              <label>Região</label>
              <input 
                v-model="formData.regiao"
                type="text"
                placeholder="Região de atuação"
                class="form-control"
              />
            </div>
          </div>
          
          <!-- Email e Telefone -->
          <div class="form-row">
            <div class="form-group">
              <label>Email</label>
              <input 
                v-model="formData.email"
                type="email"
                placeholder="email@exemplo.com"
                class="form-control"
              />
            </div>
            <div class="form-group">
              <label>Telefone</label>
              <input 
                v-model="formData.telefone"
                type="tel"
                placeholder="(00) 00000-0000"
                class="form-control"
              />
            </div>
          </div>
          
          <!-- Status -->
          <div class="form-row">
            <div class="form-group">
              <label>Status</label>
              <select v-model="formData.status" class="form-control">
                <option value="ATIVO">Ativo</option>
                <option value="INATIVO">Inativo</option>
                <option value="PENDENTE">Pendente</option>
              </select>
            </div>
          </div>
          
          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="closeModal">
              Cancelar
            </button>
            <button type="submit" class="btn-salvar">
              {{ editingId ? 'Atualizar' : 'Salvar' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de confirmação de exclusão -->
    <div v-if="deleteConfirmDialog.show" class="modal-overlay">
      <div class="confirm-dialog">
        <div class="confirm-content">
          <h3>Confirmar Inativação</h3>
          <p>Tem certeza que deseja inativar <span class="confirm-highlight">{{ deleteConfirmDialog.nome }}</span>?</p>
          <p class="warning-text">Esta ação poderá ser revertida pelo administrador!</p>
          
          <div class="confirm-actions">
            <button class="btn-cancel" @click="hideDeleteDialog">
              Cancelar
            </button>
            <button class="btn-confirm delete" @click="confirmDelete">
              Inativar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast notification -->
    <div 
      v-if="toast.show" 
      :class="['toast', `toast-${toast.type}`]"
    >
      {{ toast.message }}
    </div>
  </div>
</template>

<script src="../views/RepresentantesView.js"></script>
<style src="../assets/styles/RepresentantesView.css"></style>
