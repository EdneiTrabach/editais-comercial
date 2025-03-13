<template>
  <div class="layout">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />

    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <div class="header">
        <h1>Sistemas</h1>
        <div class="actions">
          <button class="btn-add" @click="showModal = true">
            <img src="/icons/adicao.svg" alt="Adicionar" class="icon icon-add" />
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
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
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
                <div class="action-buttons" :class="{ 'admin': isAdmin }">
                  <!-- Botão editar - disponível para todos -->
                  <button class="btn-action edit" @click="editSistema(sistema)">
                    <img src="/icons/edicao.svg" alt="Editar" class="icon" />
                  </button>

                  <!-- Botão ativar/inativar - apenas para admin -->
                  <button 
                    v-if="isAdmin"  
                    class="btn-action" 
                    :class="sistema.status === 'ACTIVE' ? 'delete' : 'edit'"
                    @click="sistema.status === 'ACTIVE' ? inativarSistema(sistema) : ativarSistema(sistema)"
                    :title="sistema.status === 'ACTIVE' ? 'Inativar Sistema' : 'Ativar Sistema'"
                  >
                    <img 
                      :src="sistema.status === 'ACTIVE' ? '/icons/disable.svg' : '/icons/enable.svg'"
                      :alt="sistema.status === 'ACTIVE' ? 'Inativar' : 'Ativar'" 
                      class="icon" 
                    />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal de Cadastro/Edição com as classes padronizadas -->
      <div v-if="showModal" class="modal-cfg-usuarios">
        <div class="modal-content-cfg-usuarios">
          <h2 class="modal-title-cfg-usuarios">{{ editingId ? 'Editar' : 'Novo' }} Sistema</h2>
          <form @submit.prevent="handleSubmit" class="form-cfg-usuarios">
            <div class="form-group-cfg-usuarios">
              <label class="label-cfg-usuarios">Setor*</label>
              <div class="setor-container">
                <select v-model="formData.setor_id" required class="input-cfg-usuarios">
                  <option value="">Selecione o setor...</option>
                  <option v-for="setor in setores" :key="setor.id" :value="setor.id">
                    {{ setor.nome }}
                  </option>
                </select>
                <button type="button" class="btn-add-cfg-usuarios" @click="showSetorModal = true">
                  <img src="/icons/adicao.svg" alt="Adicionar Setor" class="icon-cfg-usuarios" />
                </button>
              </div>
            </div>

            <div class="form-group-cfg-usuarios">
              <label class="label-cfg-usuarios">Nome do Sistema*</label>
              <input v-model="formData.nome" required type="text" class="input-cfg-usuarios" />
            </div>

            <div class="form-group-cfg-usuarios">
              <label class="label-cfg-usuarios">Descrição</label>
              <textarea v-model="formData.descricao" rows="3" class="input-cfg-usuarios"></textarea>
            </div>

            <div class="form-group-cfg-usuarios">
              <label class="label-cfg-usuarios">URL</label>
              <input v-model="formData.url" type="url" class="input-cfg-usuarios" />
            </div>

            <!-- Seção de Contatos -->
            <div class="form-group-cfg-usuarios">
              <h3 class="sub-title-cfg-usuarios">Contatos</h3>
              <div v-for="(contato, index) in formData.contatos" :key="index" class="contato-form-cfg-usuarios">
                <input v-model="contato.nome" placeholder="Nome" class="input-cfg-usuarios" />
                <input v-model="contato.telefone" placeholder="Telefone" class="input-cfg-usuarios" />
                <button type="button" @click="removeContato(index)" class="btn-action-cfg-usuarios btn-delete-cfg-usuarios">
                  <img src="/icons/lixeira.svg" alt="Remover" class="icon-delete-cfg-usuarios" />
                </button>
              </div>
              <button type="button" @click="addContato" class="btn-add-contato-cfg-usuarios">
                + Adicionar Contato
              </button>
            </div>

            <div class="modal-actions-cfg-usuarios">
              <button type="button" class="btn-cancel-cfg-usuarios" @click="closeModal">
                Cancelar
              </button>
              <button type="submit" class="btn-confirm-cfg-usuarios" :disabled="loading">
                {{ loading ? 'Salvando...' : 'Salvar' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal de Novo Setor com classes padronizadas -->
      <div v-if="showSetorModal" class="modal-cfg-usuarios">
        <div class="modal-content-cfg-usuarios">
          <h2 class="modal-title-cfg-usuarios">Novo Setor</h2>
          <form @submit.prevent="handleAddSetor" class="form-cfg-usuarios">
            <div class="form-group-cfg-usuarios">
              <label class="label-cfg-usuarios">Nome do Setor*</label>
              <input v-model="novoSetor.nome" type="text" required placeholder="Digite o nome do setor" class="input-cfg-usuarios" />
            </div>
            <div class="modal-actions-cfg-usuarios">
              <button type="button" class="btn-cancel-cfg-usuarios" @click="closeSetorModal">
                Cancelar
              </button>
              <button type="submit" class="btn-confirm-cfg-usuarios">
                Salvar
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal de confirmação com classes padronizadas -->
      <div v-if="confirmDialog.show" class="dialog-overlay-cfg-usuarios">
        <div class="confirm-dialog-cfg-usuarios">
          <div class="confirm-content-cfg-usuarios">
            <h3 class="dialog-title-cfg-usuarios">{{ confirmDialog.title }}</h3>
            <p class="dialog-message-cfg-usuarios">{{ confirmDialog.message }}</p>
            <p v-if="confirmDialog.warning" class="warning-text-cfg-usuarios">
              {{ confirmDialog.warning }}
            </p>
            <div class="confirm-actions-cfg-usuarios">
              <button class="btn-secondary-cfg-usuarios" @click="confirmDialog.show = false">
                Cancelar
              </button>
              <button class="btn-danger-cfg-usuarios" @click="confirmDialog.onConfirm">
                {{ confirmDialog.confirmText }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Toast notifications com classes padronizadas -->
      <div v-for="toast in toasts" :key="toast.id" 
           :class="['toast-cfg-usuarios', `toast-${toast.type}`]">
        {{ toast.message }}
      </div>
    </div>
  </div>
</template>

<script src="../views/SistemasView.js"></script>
<style src="../assets/styles/SistemasView.css"></style>
