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

<style src="../assets/styles/RepresentantesView.css"></style>
