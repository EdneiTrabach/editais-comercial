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

<style src="../assets/styles/EmpresasView.css"></style>