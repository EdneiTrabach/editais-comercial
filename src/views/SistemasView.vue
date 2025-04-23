<template>
  <div class="layout">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />

    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <div class="header">
        <h1>Sistemas</h1>
        <div class="header-buttons">
          <button class="btn-add" @click="showModal = true">
            <img src="/icons/adicao.svg" alt="Adicionar" class="icon-add" />
            Novo Sistema
          </button>
        </div>
      </div>

      <!-- Tabela de Sistemas -->
      <div class="table-container">
        <table class="excel-table">
          <thead>
            <tr>
              <th>Setor</th>
              <th>Sistema</th>
              <th>Descrição</th>
              <th>URL</th>
              <th>Contatos</th>
              <th>Status</th>
              <th class="actions-column">Ações</th>
            </tr>
          </thead>
          <tbody v-if="loading">
            <tr>
              <td colspan="7" class="loading-cell">
                <div class="loading-indicator">Carregando sistemas...</div>
              </td>
            </tr>
          </tbody>
          <tbody v-else-if="sistemas.length === 0">
            <tr>
              <td colspan="7" class="no-data-cell">
                Nenhum sistema encontrado
              </td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr v-for="sistema in sistemas" :key="sistema.id">
              <td>{{ getSetorNome(sistema.setor_id) }}</td>
              <td>{{ sistema.nome }}</td>
              <td>{{ sistema.descricao || '-' }}</td>
              <td>
                <a v-if="sistema.url" :href="sistema.url" target="_blank" rel="noopener">
                  {{ sistema.url }}
                </a>
                <span v-else>-</span>
              </td>
              <td>
                <div class="contatos-list">
                  <div v-for="contato in sistema.sistema_contatos" :key="contato.id" class="contato-item">
                    {{ contato.nome }} - {{ contato.telefone }}
                  </div>
                </div>
              </td>
              <td>
                <span :class="['status-badge', sistema.status.toLowerCase()]">
                  {{ sistema.status }}
                </span>
              </td>
              <td class="actions-cell">
                <div class="acoes-container" :class="{ 'is-admin': isAdmin }">
                  <!-- Botão editar - disponível para todos -->
                  <button class="btn-icon edit" title="Editar sistema" @click="editSistema(sistema)">
                    <i class="fas fa-edit"></i>
                  </button>

                  <!-- Botão ativar/inativar - apenas para admin -->
                  <button 
                    class="btn-icon" 
                    :class="sistema.status === 'ACTIVE' ? 'delete' : 'edit'"
                    @click="sistema.status === 'ACTIVE' ? inativarSistema(sistema) : ativarSistema(sistema)"
                    :title="sistema.status === 'ACTIVE' ? 'Inativar Sistema' : 'Ativar Sistema'"
                  >
                    <i class="fas" :class="sistema.status === 'ACTIVE' ? 'fa-ban' : 'fa-check'"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal de Cadastro/Edição -->
      <div v-if="showModal" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ editingId ? 'Editar' : 'Novo' }} Sistema</h3>
            <button class="btn-close" @click="closeModal">&times;</button>
          </div>
          <form @submit.prevent="handleSubmit" class="form-grid">
            <div class="form-row">
              <div class="form-group">
                <label>Setor<span class="required">*</span></label>
                <div class="setor-container">
                  <select 
                    v-model="formData.setor_id" 
                    required 
                    class="form-control"
                    aria-label="Selecione o setor"
                  >
                    <option value="">Selecione o setor...</option>
                    <option v-for="setor in setores" :key="setor.id" :value="setor.id">
                      {{ setor.nome }}
                    </option>
                  </select>
                  <button 
                    type="button" 
                    class="btn-icon edit" 
                    @click="showSetorModal = true"
                    aria-label="Adicionar novo setor"
                  >
                    <i class="fas fa-plus"></i>
                  </button>
                </div>
              </div>
              <div class="form-group">
                <label>Nome do Sistema<span class="required">*</span></label>
                <input 
                  v-model="formData.nome" 
                  required 
                  type="text" 
                  class="form-control" 
                  placeholder="Digite o nome do sistema"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Descrição</label>
                <textarea 
                  v-model="formData.descricao" 
                  rows="3" 
                  class="form-control" 
                  placeholder="Descreva o sistema brevemente"
                ></textarea>
              </div>
              <div class="form-group">
                <label>URL</label>
                <input 
                  v-model="formData.url" 
                  type="url" 
                  class="form-control" 
                  placeholder="https://exemplo.com.br"
                />
              </div>
            </div>

            <!-- Seção de Contatos -->
            <div class="form-group">
              <label>Contatos</label>
              <div v-for="(contato, index) in formData.contatos" :key="index" class="contato-form">
                <input 
                  v-model="contato.nome" 
                  placeholder="Nome" 
                  class="form-control" 
                />
                <input 
                  v-model="contato.telefone" 
                  placeholder="Telefone" 
                  class="form-control" 
                />
                <button 
                  type="button" 
                  class="btn-icon delete" 
                  @click="removeContato(index)"
                  aria-label="Remover contato"
                >
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
              <button 
                type="button" 
                @click="addContato" 
                class="btn-add-contato"
              >
                <i class="fas fa-plus"></i> Adicionar Contato
              </button>
            </div>
            
            <div class="modal-actions">
              <button type="button" class="btn-cancel" @click="closeModal">
                Cancelar
              </button>
              <button type="submit" class="btn-salvar" :disabled="loading">
                {{ loading ? 'Salvando...' : 'Salvar' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal de Novo Setor -->
      <div v-if="showSetorModal" class="modal-overlay">
        <div class="modal-content" style="max-width: 450px;">
          <div class="modal-header">
            <h3>Novo Setor</h3>
            <button class="btn-close" @click="closeSetorModal">&times;</button>
          </div>
          <form @submit.prevent="handleAddSetor" class="form-grid">
            <div class="form-group">
              <label>Nome do Setor*</label>
              <input v-model="novoSetor.nome" type="text" required placeholder="Digite o nome do setor" class="form-control" />
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-cancel" @click="closeSetorModal">
                Cancelar
              </button>
              <button type="submit" class="btn-salvar">
                Salvar
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal de confirmação -->
      <div v-if="confirmDialog.show" class="modal-overlay">
        <div class="confirm-dialog">
          <div class="confirm-content">
            <h3>{{ confirmDialog.title }}</h3>
            <p>{{ confirmDialog.message }}</p>
            <p v-if="confirmDialog.warning" class="warning-text">
              {{ confirmDialog.warning }}
            </p>
            <div class="confirm-actions">
              <button class="btn-cancel" @click="confirmDialog.show = false">
                Cancelar
              </button>
              <button class="btn-confirm delete" @click="confirmDialog.onConfirm">
                {{ confirmDialog.confirmText }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Toast notifications -->
      <div v-for="toast in toasts" :key="toast.id" 
           :class="['toast', `toast-${toast.type}`]">
        {{ toast.message }}
      </div>
    </div>
  </div>
</template>

<script src="../views/SistemasView.js"></script>

<!-- Importações CSS modularizadas -->
<style src="@/assets/styles/base/variables.css"></style>
<style src="@/assets/styles/layout/layout.css"></style>
<style src="@/assets/styles/components/buttons.css"></style>
<style src="@/assets/styles/components/tables.css"></style>
<style src="@/assets/styles/components/modals.css"></style>
<style src="@/assets/styles/components/forms.css"></style>
<style src="@/assets/styles/components/Toast.css"></style>
<style src="@/assets/styles/pages/sistemas.css"></style>
