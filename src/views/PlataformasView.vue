<template>
  <div class="layout">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />

    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <div class="header">
        <h1>Gerenciamento de Plataformas</h1>
        <div class="actions">
          <button class="btn-add" @click="showModal = true" v-if="!selectedEmpresa">
            <img src="/icons/adicao.svg" alt="Adicionar" class="icon icon-add" />
            Nova Plataforma
          </button>
        </div>
      </div>

      <!-- Área de chips das empresas -->
      <div class="empresas-selector">
        <div class="empresas-header">
          <h3>Selecione uma empresa</h3>
        </div>
        <div class="empresas-list">
          <!-- Mensagem de debug -->
          <p v-if="empresasCadastradas.length === 0" style="color: red;">
            Carregando empresas...
          </p>

          <div v-for="empresa in empresasCadastradas" :key="empresa.id" class="empresa-chip"
            :class="{ 'selected': selectedEmpresa?.id === empresa.id }" @click="selectEmpresa(empresa)">
            {{ empresa.nome }}
            <span class="empresa-cnpj">{{ formatCNPJ(empresa.cnpj) }}</span>
          </div>
        </div>

        <!-- Botão Ver Todas sempre visível -->
        <div class="empresas-actions">
          <button class="btn-view-all" @click="clearEmpresaSelection" :class="{ 'active': !selectedEmpresa }">
            Ver Todas as Plataformas
          </button>
        </div>
      </div>

      <!-- Tabela de plataformas -->
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>URL</th>
              <!-- Colunas extras apenas quando uma empresa estiver selecionada -->
              <template v-if="selectedEmpresa">
                <th>Login</th>
                <th>Senha</th>
                <th>Validade</th>
                <th>Observações</th>
              </template>
              <th class="actions-header" style="position: sticky; right: 0; z-index: 15; background: #f8f9fa;">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="plataforma in plataformasFiltradas" :key="plataforma.id">
              <td>{{ plataforma.nome }}</td>
              <td>
                <a :href="plataforma.url" target="_blank" class="url-link">
                  {{ truncateUrl(plataforma.url) }}
                </a>
              </td>
              <!-- Células extras apenas quando uma empresa estiver selecionada -->
              <template v-if="selectedEmpresa">
                <td>{{ plataforma.dados_especificos?.login || '-' }}</td>
                <td>{{ plataforma.dados_especificos?.senha || '-' }}</td>
                <td>
                  <span :class="getValidadeClass(plataforma.dados_especificos?.data_validade_certificado)">
                    {{ formatDate(plataforma.dados_especificos?.data_validade_certificado) }}
                  </span>
                </td>
                <td>{{ plataforma.dados_especificos?.observacoes || '-' }}</td>
              </template>
              <td>
                <div class="actions-buttons">
                  <button class="btn-action edit" @click="editPlataforma(plataforma)">
                    <img src="/icons/edicao.svg" alt="Editar" class="icon" />
                  </button>
                  <button class="btn-action delete" @click="confirmarExclusao(plataforma)">
                    <img src="/icons/lixeira.svg" alt="Excluir" class="icon" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <!-- Adicione dentro do seu template, antes do fechamento da div.layout -->
    <div class="toast-container">
      <div v-for="toast in toasts" :key="toast.id" :class="['toast-message', `toast-${toast.type}`]">
        <span v-if="toast.type === 'success'">✓</span>
        <span v-else>✕</span>
        {{ toast.message }}
      </div>
    </div>
  </div>

  <!-- Modal de Adicionar/Editar Plataforma -->
  <div v-if="showModal" class="modal-cfg-usuarios">
    <div class="modal-content-cfg-usuarios">
      <h2 class="modal-title-cfg-usuarios">{{ editingId ? 'Editar' : 'Nova' }} Plataforma</h2>
      <form @submit.prevent="handleSubmit" class="form-cfg-usuarios">
        <!-- Dados básicos sempre visíveis -->
        <div class="form-group-cfg-usuarios-plataformas">
          <label class="label-cfg-usuarios">Nome da Plataforma*</label>
          <input v-model="formData.nome" required type="text" class="input-cfg-usuarios" />
        </div>

        <div class="form-group-cfg-usuarios-plataformas">
          <label class="label-cfg-usuarios">URL*</label>
          <input v-model="formData.url" required type="url" class="input-cfg-usuarios" />
        </div>

        <!-- Campos específicos quando tem empresa selecionada -->
        <template v-if="selectedEmpresa">
          <div class="form-group-cfg-usuarios-plataformas">
            <label class="label-cfg-usuarios">Login</label>
            <input v-model="formData.login" type="text" class="input-cfg-usuarios" placeholder="Digite o login para acesso" />
          </div>

          <div class="form-group-cfg-usuarios-plataformas">
            <label class="label-cfg-usuarios">Senha</label>
            <input v-model="formData.senha" type="text" class="input-cfg-usuarios" placeholder="Digite a senha para consulta" />
          </div>

          <div class="form-group-cfg-usuarios-plataformas">
            <label class="label-cfg-usuarios">Validade do Certificado</label>
            <input v-model="formData.data_validade" type="date" class="input-cfg-usuarios" />
          </div>

          <div class="form-group-cfg-usuarios-plataformas">
            <label class="label-cfg-usuarios">Observações</label>
            <textarea v-model="formData.observacoes" rows="3" class="input-cfg-usuarios"></textarea>
          </div>
        </template>

        <!-- Vincular empresas quando não tem empresa selecionada -->
        <template v-else>
          <div class="form-group-cfg-usuarios-plataformas">
            <label class="label-cfg-usuarios">Vincular Empresas</label>
            <div class="empresas-grid">
              <div 
                v-for="empresa in empresasCadastradas" 
                :key="empresa.id"
                @click="toggleEmpresa(empresa)"
                :class="['empresa-chip', { selected: empresasSelecionadas.includes(empresa.id) }]"
              >
                <span class="empresa-nome">{{ empresa.nome }}</span>
                <span class="empresa-cnpj">{{ formatCNPJ(empresa.cnpj) }}</span>
              </div>
            </div>
          </div>
        </template>

        <div class="modal-actions-cfg-usuarios">
          <button type="button" class="btn-cancel-cfg-usuarios" @click="closeModal">
            Cancelar
          </button>
          <button type="button" class="btn-confirm-cfg-usuarios" @click="handleSubmit">
            {{ editingId ? 'Atualizar' : 'Salvar' }}
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Modal de Edição de Dados Específicos -->
  <div v-if="showDadosModal" class="modal-cfg-usuarios">
    <div class="modal-content-cfg-usuarios">
      <h2 class="modal-title-cfg-usuarios">Editar Dados da Plataforma</h2>
      <form @submit.prevent="handleDadosSubmit" class="form-cfg-usuarios">
        <div class="form-group-cfg-usuarios">
          <label class="label-cfg-usuarios">Login</label>
          <input v-model="dadosForm.login" type="text" class="input-cfg-usuarios" />
        </div>

        <div class="form-group-cfg-usuarios">
          <label class="label-cfg-usuarios">Senha</label>
          <input v-model="dadosForm.senha" type="password" class="input-cfg-usuarios" />
        </div>

        <div class="form-group-cfg-usuarios">
          <label class="label-cfg-usuarios">Data de Validade</label>
          <input v-model="dadosForm.data_validade" type="date" class="input-cfg-usuarios" />
        </div>

        <div class="form-group-cfg-usuarios">
          <label class="label-cfg-usuarios">Observações</label>
          <textarea v-model="dadosForm.observacoes" rows="3" class="input-cfg-usuarios"></textarea>
        </div>

        <div class="modal-actions-cfg-usuarios">
          <button type="button" class="btn-cancel-cfg-usuarios" @click="closeDadosModal">
            Cancelar
          </button>
          <button type="button" class="btn-confirm-cfg-usuarios" @click="handleDadosSubmit">
            Salvar
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Adicione ao final do template, antes do fechamento da tag </template> -->
  <div v-if="showDeleteDialog" class="dialog-overlay-cfg-usuarios">
    <div class="confirm-dialog-cfg-usuarios">
      <div class="confirm-content-cfg-usuarios">
        <h3 class="dialog-title-cfg-usuarios">Confirmar Exclusão</h3>
        <p class="dialog-message-cfg-usuarios">
          Deseja realmente excluir a plataforma <strong>{{ plataformaToDelete?.nome }}</strong>?
        </p>
        <p class="warning-text-cfg-usuarios">Esta ação não poderá ser desfeita!</p>
        
        <div class="confirm-actions-cfg-usuarios">
          <button class="btn-secondary-cfg-usuarios" @click="cancelarExclusao">
            Cancelar
          </button>
          <button class="btn-danger-cfg-usuarios" @click="deletePlataforma">
            Excluir
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Toast notifications (Padronizado) -->
  <div 
    v-if="showToast" 
    :class="['toast-cfg-usuarios', `toast-${toastType}`]"
  >
    {{ toastMessage }}
  </div>
</template>

<script src="../views/PlataformasView.js"></script>
<style src="../assets/styles/PlataformasView.css"></style>