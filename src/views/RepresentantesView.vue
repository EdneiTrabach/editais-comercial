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

    <!-- Modal de Cadastro/Edição -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingId ? 'Editar' : 'Novo' }} Representante</h3>
          <button class="btn-close" @click="closeModal">×</button>
        </div>
        <form @submit.prevent="handleSubmit" class="form-grid">
          <div class="form-group">
            <label>Nome*</label>
            <input 
              v-model="formData.nome"
              type="text"
              required
              placeholder="Nome completo"
            />
          </div>
          <div class="form-group">
            <label>Documento</label>
            <input 
              v-model="formData.documento"
              type="text"
              placeholder="CPF/CNPJ"
            />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input 
              v-model="formData.email"
              type="email"
              placeholder="email@exemplo.com"
            />
          </div>
          <div class="form-group">
            <label>Telefone</label>
            <input 
              v-model="formData.telefone"
              type="tel"
              placeholder="(00) 00000-0000"
            />
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-cancelar" @click="closeModal">
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
          <p>Tem certeza que deseja inativar este representante?</p>
          <p class="warning-text">Esta ação poderá ser revertida pelo administrador!</p>
          <div class="confirm-actions">
            <button class="btn-cancel" @click="hideDeleteDialog">Cancelar</button>
            <button class="btn-confirm delete" @click="confirmDelete">
              Inativar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Adicione o componente de toast -->
    <div class="toast-container">
      <div v-if="toast.show" :class="['toast', `toast-${toast.type}`]">
        {{ toast.message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import TheSidebar from '@/components/TheSidebar.vue'
import { useConnectionManager } from '@/composables/useConnectionManager'

const isSidebarExpanded = ref(true)
const showModal = ref(false)
const editingId = ref(null)
const representantes = ref([])

const formData = ref({
  nome: '',
  documento: '',
  email: '',
  telefone: ''
})

// Adicione o ref para o toast
const toast = ref({
  show: false,
  message: '',
  type: 'success'
})

// Adicione este ref junto com os outros
const deleteConfirmDialog = ref({
  show: false,
  representante: null
})

// Função para mostrar toast
const showToast = (message, type = 'success') => {
  toast.value = { show: true, message, type }
  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

const loadRepresentantes = async () => {
  try {
    const { data, error } = await supabase
      .from('representantes')
      .select('*')
      .eq('status', 'ATIVO') // Adiciona filtro por status
      .order('nome')
    
    if (error) throw error
    representantes.value = data
  } catch (error) {
    console.error('Erro ao carregar representantes:', error)
  }
}

// Modifique a função handleSubmit
const handleSubmit = async () => {
  try {
    const data = { 
      ...formData.value,
      status: 'ATIVO', // Sempre ATIVO ao criar
      updated_at: new Date().toISOString()
    }
    
    if (editingId.value) {
      const { error } = await supabase
        .from('representantes')
        .update(data)
        .eq('id', editingId.value)
      
      if (error) throw error
      showToast('Representante atualizado com sucesso!')
    } else {
      const { error } = await supabase
        .from('representantes')
        .insert({
          ...data,
          created_at: new Date().toISOString()
        })
      
      if (error) throw error
      showToast('Representante cadastrado com sucesso!')
    }

    await loadRepresentantes()
    closeModal()
  } catch (error) {
    console.error('Erro ao salvar:', error)
    showToast(error.message || 'Erro ao salvar representante', 'error')
  }
}

const editRepresentante = (representante) => {
  editingId.value = representante.id
  formData.value = { ...representante }
  showModal.value = true
}

// Modifique a função deleteRepresentante
const deleteRepresentante = (representante) => {
  deleteConfirmDialog.value = {
    show: true,
    representante
  }
}

// Adicione as funções de controle do diálogo
const hideDeleteDialog = () => {
  deleteConfirmDialog.value = {
    show: false,
    representante: null
  }
}

const confirmDelete = async () => {
  try {
    const { error } = await supabase
      .from('representantes')
      .update({ 
        status: 'INATIVO',
        updated_at: new Date().toISOString() 
      })
      .eq('id', deleteConfirmDialog.value.representante.id)
    
    if (error) throw error
    
    await loadRepresentantes()
    showToast('Representante inativado com sucesso!')
    hideDeleteDialog()
  } catch (error) {
    console.error('Erro ao inativar:', error)
    showToast(error.message || 'Erro ao inativar representante', 'error')
  }
}

const closeModal = () => {
  showModal.value = false
  editingId.value = null
  formData.value = {
    nome: '',
    documento: '',
    email: '',
    telefone: ''
  }
}

const handleSidebarToggle = (expanded) => {
  isSidebarExpanded.value = expanded
}

const loadData = async () => {
  await loadRepresentantes() // ou qualquer outra função que carregue seus dados
}

// Use o composable
useConnectionManager(loadData)

onMounted(() => {
  loadRepresentantes()
})
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.main-content {
  /* margin-left: 300px; */
  padding: 2rem;
  transition: margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
}

.main-content.expanded {
  margin-left: 0px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #193155;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-add:hover {
  background: #254677;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background: #f8f9fa;
  color: #193155;
  font-weight: 500;
}

.actions-cell {
  width: 100px;
  text-align: center;
}

.actions-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-action {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-action.edit {
  background: #9fd5fc;
}

.btn-action.delete {
  background: #f77777;
}

.btn-action:hover {
  transform: translateY(-2px);
}

.btn-action.edit:hover {
  background: #bbdefb;
}

.btn-action.delete:hover {
  background: #fecaca;
}

.btn-action .icon {
  width: 16px;
  height: 16px;
  transition: all 0.3s ease;
}

.btn-action.edit:hover .icon {
  filter: brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(210deg);
}

.btn-action.delete:hover .icon {
  filter: brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg);
}

.actions-dropdown {
  position: relative;
  display: inline-block;
}

.btn-actions {
  width: 36px; /* Aumentado para melhor clicabilidade */
  height: 36px;
  border: none;
  border-radius: 6px;
  background: #f3f4f6;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.btn-actions:hover {
  background: #e5e7eb;
}

.btn-actions img {
  width: 16px;
  height: 16px;
}

.dropdown-content {
  display: none;
  position: absolute;
  right: 0;
  background: white;
  min-width: 140px; /* Aumentado para melhor legibilidade */
  padding: 4px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  border-radius: 4px;
  z-index: 1;
}

.actions-dropdown:hover .dropdown-content {
  display: block;
}

.dropdown-content button {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  background: none;
  cursor: pointer;
  text-align: left;
  font-size: 14px;
}

.dropdown-content button:hover {
  background: #f3f4f6;
}

.dropdown-content button.delete {
  color: #dc2626;
}

.dropdown-content button.delete:hover {
  background: #fee2e2;
}

/* Estilos base para ícones */
.icon {
  transition: all 0.3s ease;
}

/* Ícone do botão adicionar */
.icon-add {
  width: 20px;
  height: 20px;
  filter: brightness(0) invert(1); /* Deixa o ícone branco */
}

/* Ícone do botão de mais ações */
.icon-more {
  width: 16px;
  height: 16px;
  opacity: 0.7;
}

.btn-actions:hover .icon-more {
  opacity: 1;
}

/* Ícones do dropdown */
.icon-edit, .icon-delete {
  width: 14px;
  height: 14px;
  opacity: 0.7;
}

.dropdown-content button:hover .icon-edit {
  opacity: 1;
  color: #193155;
}

.dropdown-content button.delete:hover .icon-delete {
  opacity: 1;
  filter: brightness(0) saturate(100%) invert(27%) sepia(51%) 
          saturate(2878%) hue-rotate(346deg) brightness(97%) contrast(97%);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  color: #193155;
  font-size: 1.25rem;
  font-weight: 600;
}

.form-grid {
  display: grid;
  gap: 1.8rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.form-group label {
  color: #193155;
  font-weight: 500;
  font-size: 0.95rem;
}

.form-group input {
  padding: 0.9rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  transition: all 0.3s ease;
  background: #f8f9fa;
  font-family: 'Roboto', sans-serif;
  font-size: 0.9rem;
  color: #495057;
}

.form-group input:focus {
  outline: none;
  border-color: #193155;
  box-shadow: 0 0 0 3px rgba(25, 49, 85, 0.1);
  background: white;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.btn-cancelar, .btn-salvar {
  padding: 0.9rem 2rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  font-size: 0.9rem;
}

.btn-cancelar {
  background: #e9ecef;
  color: #495057;
}

.btn-salvar {
  background: #193155;
  color: white;
}

.btn-cancelar:hover {
  background: #dee2e6;
  transform: translateY(-2px);
}

.btn-salvar:hover {
  background: #254677;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(25, 49, 85, 0.2);
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.btn-close:hover {
  background: #f3f4f6;
  color: #374151;
}

@media (max-width: 768px) {
  .modal-content {
    margin: 1rem;
    padding: 1.5rem;
  }
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 70px;
    padding: 1rem;
  }

  .header {
    flex-direction: column;
    gap: 1rem;
  }

  .btn-add {
    width: 100%;
    justify-content: center;
  }

  .btn-actions {
    width: 42px; /* Maior em dispositivos móveis para facilitar o toque */
    height: 42px;
  }

  .icon-more {
    width: 18px;
    height: 18px;
  }

  .dropdown-content {
    min-width: 160px;
  }

  .dropdown-content button {
    padding: 12px 16px;
  }
}

/* Adicione os estilos do toast */
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
}

.toast {
  padding: 1rem 2rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toast-success {
  background: #10B981;
  color: white;
}

.toast-error {
  background: #EF4444;
  color: white;
}

.toast::before {
  content: '✓';
  font-weight: bold;
}

.toast-error::before {
  content: '✕';
}

/* Estilos do diálogo de confirmação */
.confirm-dialog {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.confirm-content {
  text-align: center;
}

.confirm-content h3 {
  color: #193155;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.confirm-content p {
  color: #4B5563;
  margin-bottom: 0.5rem;
}

.warning-text {
  color: #DC2626;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 1.5rem;
}

.confirm-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-cancel, .btn-confirm {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-cancel {
  background: #E5E7EB;
  color: #4B5563;
}

.btn-confirm.delete {
  background: #DC2626;
  color: white;
}

.btn-cancel:hover {
  background: #D1D5DB;
}

.btn-confirm.delete:hover {
  background: #B91C1C;
}
</style>