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
                  <button class="btn-action delete" @click="handleDelete(empresa)">
                    <img src="/icons/lixeira.svg" alt="Excluir" class="icon" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal de Cadastro -->
      <div v-if="showModal" class="modal-overlay">
        <div class="modal-content">
          <h2>Nova Empresa</h2>
          <form @submit.prevent="handleSubmit">
            <div class="form-grid">
              <div class="form-column">
                <div class="form-group">
                  <label>Nome Fantasia</label>
                  <input v-model="formData.nome" required>
                </div>
                <div class="form-group">
                  <label>CNPJ</label>
                  <input 
                    v-model="formData.cnpj" 
                    @input="formatarCNPJ" 
                    placeholder="00.000.000/0000-00"
                    required
                    @blur="validateCNPJ"
                    :class="{ 'invalid': cnpjError }"
                  >
                  <span v-if="cnpjError" class="error-message">{{ cnpjError }}</span>
                </div>
                <div class="form-group">
                  <label>Razão Social</label>
                  <input v-model="formData.razao_social" required>
                </div>
              </div>
              
              <div class="form-column">
                <div class="form-group">
                  <label>Contato</label>
                  <input v-model="formData.contato">
                </div>
                <div class="form-group">
                  <label>Telefone</label>
                  <input 
                    v-model="formData.telefone" 
                    @input="formatarTelefone"
                    placeholder="(00) 00000-0000"
                  >
                </div>
                <div class="form-group">
                  <label>Email</label>
                  <input type="email" v-model="formData.email">
                </div>
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-cancel" @click="showModal = false">Cancelar</button>
              <button type="submit" class="btn-confirm">Salvar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script src="../views/EmpresasView.js"></script>
<style src="../assets/styles/EmpresasView.css"></style>