<template>
  <div class="layout">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />
    
    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <div class="header">
        <h1>Empresas</h1>
        <button class="btn-add" @click="showModal = true">
          <img src="/icons/adicao.svg" alt="Adicionar" class="icon icon-add" />
          Nova Empresa
        </button>
      </div>

      <div class="table-container">
        <table class="excel-table">
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
                    v-maska="'##.###.###/####-##'"
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
                    v-maska="'(##) #####-####'"
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

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import TheSidebar from '@/components/TheSidebar.vue'
import VueTheMask from 'vue-the-mask'
import { useConnectionManager } from '@/composables/useConnectionManager'

const empresas = ref([])
const showModal = ref(false)
const isSidebarExpanded = ref(true)

const formData = ref({
  nome: '',
  cnpj: '',
  razao_social: '',
  contato: '',
  telefone: '',
  email: ''
})

const cnpjError = ref('')

const loadEmpresas = async () => {
  try {
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .order('nome')

    if (error) throw error
    empresas.value = data
  } catch (error) {
    console.error('Erro ao carregar empresas:', error)
  }
}

// Modifique a função handleSubmit para incluir a validação
const handleSubmit = async () => {
  try {
    // Primeiro, verifica se já existe uma empresa com este CNPJ
    const { data: existingCompany } = await supabase
      .from('empresas')
      .select('id')
      .eq('cnpj', formData.value.cnpj)
      .single()

    if (existingCompany) {
      alert('Já existe uma empresa cadastrada com este CNPJ')
      return
    }

    // Se não existir, prossegue com o cadastro
    const { error } = await supabase
      .from('empresas')
      .insert(formData.value)

    if (error) throw error

    await loadEmpresas()
    showModal.value = false
    formData.value = {
      nome: '',
      cnpj: '',
      razao_social: '',
      contato: '',
      telefone: '',
      email: ''
    }
  } catch (error) {
    console.error('Erro ao cadastrar empresa:', error)
    
    // Mensagem de erro mais amigável
    if (error.code === '23505') {
      alert('CNPJ já cadastrado no sistema')
    } else {
      alert('Erro ao cadastrar empresa. Por favor, tente novamente.')
    }
  }
}

const validateCNPJ = async () => {
  if (!formData.value.cnpj) {
    cnpjError.value = 'CNPJ é obrigatório'
    return false
  }

  // Remove caracteres especiais para validação
  const cnpj = formData.value.cnpj.replace(/[^\d]/g, '')
  
  if (cnpj.length !== 14) {
    cnpjError.value = 'CNPJ inválido'
    return false
  }

  // Verifica se já existe
  const { data } = await supabase
    .from('empresas')
    .select('id')
    .eq('cnpj', formData.value.cnpj)
    .single()

  if (data) {
    cnpjError.value = 'CNPJ já cadastrado'
    return false
  }

  cnpjError.value = ''
  return true
}

const handleDelete = async (empresa) => {
  if (!confirm('Confirma a exclusão desta empresa?')) return

  try {
    const { error } = await supabase
      .from('empresas')
      .delete()
      .eq('id', empresa.id)

    if (error) throw error
    await loadEmpresas()
  } catch (error) {
    console.error('Erro ao excluir empresa:', error)
    alert('Erro ao excluir empresa')
  }
}

const formatCNPJ = (cnpj) => {
  return cnpj || '-'
}

const handleSidebarToggle = (expanded) => {
  isSidebarExpanded.value = expanded
}

const loadData = async () => {
  await loadProcessos() // ou qualquer outra função que carregue seus dados
}

useConnectionManager(loadData)

onMounted(() => {
  loadEmpresas()
})
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.main-content {
  padding: 2rem;
  transition: margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
  background: #f8f9fa;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header h1 {
  color: #193155;
  font-size: 1.8rem;
  font-weight: 600;
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
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-add:hover {
  background: #244776;
}

.excel-table {
  width: 100%;
  border-collapse: collapse;
}

.excel-table th {
  background: #f8f9fa;
  padding: 1rem;
  text-align: left;
  color: #193155;
  font-weight: 600;
  border-bottom: 2px solid #e5e7eb;
}

.excel-table td {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  color: #4b5563;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: transparent;
}

.icon {
  width: 16px;
  height: 16px;
  transition: all 0.3s ease;
}

.icon-add {
  width: 20px;
  height: 20px;
  filter: brightness(0) invert(1); /* Deixa o ícone branco */
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
  width: 800px; /* Aumentado para acomodar duas colunas */
  max-width: 90%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr; /* Divide em duas colunas iguais */
  gap: 2rem; /* Espaço entre as colunas */
  margin-bottom: 1.5rem;
}

.form-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  margin-bottom: 0; /* Remove margem bottom pois agora usamos gap */
}

/* Responsividade para telas menores */
@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr; /* Uma coluna em telas menores */
    gap: 1rem;
  }

  .modal-content {
    padding: 1.5rem;
    width: 95%;
  }
}

.modal-content h2 {
  color: #193155;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  font-weight: 600;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #193155;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.95rem;
  transition: border-color 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #193155;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
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
  background: #a5daff;
}

.btn-action.delete {
  background: #f17b7b;
}

.btn-action:hover {
  transform: translateY(-2px);
}

.btn-action.edit:hover {
  background: #bbdefb;
}

.btn-cancel {
  padding: 0.75rem 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  color: #4b5563;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-confirm {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: #193155;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cancel:hover {
  background: #f3f4f6;
}

.btn-confirm:hover {
  background: #244776;
}

.invalid {
  border-color: #dc2626 !important;
}

.error-message {
  color: #dc2626;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
  }

  .modal-content {
    padding: 1.5rem;
  }

  .btn-add {
    padding: 0.5rem 1rem;
  }
}
</style>