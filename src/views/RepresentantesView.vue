<template>
  <div class="layout">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />
    
    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <div class="header">
        <h1>Gerenciamento de Representantes</h1>
        <div class="actions">
          <button class="btn-add" @click="showModal = true">
            <img src="/icons/adicao.svg" alt="Adicionar" class="icon icon-add" />
            Novo Representante
          </button>
        </div>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Documento</th>
              <th>Email</th>
              <th>Telefone</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="representante in representantes" :key="representante.id">
              <td>{{ representante.nome }}</td>
              <td>{{ representante.documento }}</td>
              <td>{{ representante.email }}</td>
              <td>{{ representante.telefone }}</td>
              <td class="actions-cell">
                <div class="actions-buttons">
                  <button class="btn-action edit" @click="editRepresentante(representante)">
                    <img src="/icons/edicao.svg" alt="Editar" class="icon" />
                  </button>
                  <button class="btn-action delete" @click="deleteRepresentante(representante)">
                    <img src="/icons/lixeira.svg" alt="Excluir" class="icon" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal de Cadastro/Edição com as classes padronizadas -->
    <div v-if="showModal" class="modal-cfg-usuarios">
      <div class="modal-content-cfg-usuarios">
        <h2 class="modal-title-cfg-usuarios">{{ editingId ? 'Editar' : 'Novo' }} Representante</h2>
        <form @submit.prevent="handleSubmit" class="form-cfg-usuarios">
          <div class="form-group-cfg-usuarios">
            <label class="label-cfg-usuarios">Nome*</label>
            <input 
              v-model="formData.nome"
              type="text"
              required
              placeholder="Nome completo"
              class="input-cfg-usuarios"
            />
          </div>
          <div class="form-group-cfg-usuarios">
            <label class="label-cfg-usuarios">Documento</label>
            <input 
              v-model="formData.documento"
              type="text"
              placeholder="CPF/CNPJ"
              class="input-cfg-usuarios"
            />
          </div>
          <div class="form-group-cfg-usuarios">
            <label class="label-cfg-usuarios">Email</label>
            <input 
              v-model="formData.email"
              type="email"
              placeholder="email@exemplo.com"
              class="input-cfg-usuarios"
            />
          </div>
          <div class="form-group-cfg-usuarios">
            <label class="label-cfg-usuarios">Telefone</label>
            <input 
              v-model="formData.telefone"
              type="tel"
              placeholder="(00) 00000-0000"
              class="input-cfg-usuarios"
            />
          </div>
          
          <div class="modal-actions-cfg-usuarios">
            <button type="button" class="btn-cancel-cfg-usuarios" @click="closeModal">
              Cancelar
            </button>
            <button type="submit" class="btn-confirm-cfg-usuarios">
              {{ editingId ? 'Atualizar' : 'Salvar' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de confirmação de exclusão -->
    <div v-if="deleteConfirmDialog.show" class="dialog-overlay-cfg-usuarios">
      <div class="confirm-dialog-cfg-usuarios">
        <div class="confirm-content-cfg-usuarios">
          <h3 class="dialog-title-cfg-usuarios">Confirmar Inativação</h3>
          <p class="dialog-message-cfg-usuarios">Tem certeza que deseja inativar este representante?</p>
          <p class="warning-text-cfg-usuarios">Esta ação poderá ser revertida pelo administrador!</p>
          
          <div class="confirm-actions-cfg-usuarios">
            <button class="btn-secondary-cfg-usuarios" @click="hideDeleteDialog">
              Cancelar
            </button>
            <button class="btn-danger-cfg-usuarios" @click="confirmDelete">
              Inativar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast notification padronizado -->
    <div 
      v-if="toast.show" 
      :class="['toast-cfg-usuarios', `toast-${toast.type}`]"
    >
      {{ toast.message }}
    </div>
  </div>
</template>

<script src="../views/RepresentantesView.js"></script>
<style src="../assets/styles/RepresentantesView.css"></style>
