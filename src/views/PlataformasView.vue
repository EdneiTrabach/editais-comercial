<template>
  <div class="layout">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />
    
    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <div class="header">
        <h1>Gerenciamento de Plataformas</h1>
        <div class="actions">
          <button class="btn-add" @click="showModal = true">
            <img src="/icons/adicao.svg" alt="Adicionar" class="icon icon-add" />
            Nova Plataforma
          </button>
        </div>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>URL</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="plataforma in plataformas" :key="plataforma.id">
              <td class="nome-column">{{ plataforma.nome }}</td>
              <td class="url-column">
                <a :href="plataforma.url" target="_blank" rel="noopener noreferrer" :title="plataforma.url">
                  {{ truncateUrl(plataforma.url) }}
                </a>
              </td>
              <td class="actions-cell">
                <div class="actions-buttons">
                  <button class="btn-action edit" @click="editPlataforma(plataforma)">
                    <img src="/icons/edicao.svg" alt="Editar" class="icon" />
                  </button>
                  <button class="btn-action delete" @click="deletePlataforma(plataforma.id)">
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
          <h3>{{ editingId ? 'Editar' : 'Nova' }} Plataforma</h3>
          <button class="btn-close" @click="closeModal">×</button>
        </div>
        
        <form @submit.prevent="handleSubmit" class="form-grid">
          <div class="form-group">
            <label>Nome*</label>
            <input 
              v-model="formData.nome"
              type="text"
              required
              placeholder="Nome da plataforma"
            />
          </div>
          <div class="form-group">
            <label>URL*</label>
            <input 
              v-model="formData.url"
              type="url"
              required
              placeholder="https://exemplo.com"
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import TheSidebar from '@/components/TheSidebar.vue'

const isSidebarExpanded = ref(true)
const showModal = ref(false)
const editingId = ref(null)
const plataformas = ref([])

const formData = ref({
  nome: '',
  url: ''
})

const loadPlataformas = async () => {
  try {
    const { data, error } = await supabase
      .from('plataformas')
      .select('*')
      .order('nome')
    
    if (error) throw error
    plataformas.value = data
  } catch (error) {
    console.error('Erro ao carregar plataformas:', error)
  }
}

const handleSubmit = async () => {
  try {
    const data = { ...formData.value }
    
    if (editingId.value) {
      const { error } = await supabase
        .from('plataformas')
        .update(data)
        .eq('id', editingId.value)
      
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('plataformas')
        .insert(data)
      
      if (error) throw error
    }

    await loadPlataformas()
    closeModal()
  } catch (error) {
    console.error('Erro ao salvar:', error)
    alert('Erro ao salvar plataforma')
  }
}

const editPlataforma = (plataforma) => {
  editingId.value = plataforma.id
  formData.value = { ...plataforma }
  showModal.value = true
}

const deletePlataforma = async (id) => {
  if (!confirm('Deseja realmente excluir esta plataforma?')) return

  try {
    const { error } = await supabase
      .from('plataformas')
      .delete()
      .eq('id', id)

    if (error) throw error
    await loadPlataformas()
  } catch (error) {
    console.error('Erro ao excluir:', error)
    alert('Erro ao excluir plataforma')
  }
}

const closeModal = () => {
  showModal.value = false
  editingId.value = null
  formData.value = {
    nome: '',
    url: ''
  }
}

const handleSidebarToggle = (expanded) => {
  isSidebarExpanded.value = expanded
}

const truncateUrl = (url) => {
  return url.length > 60 ? url.substring(0, 60) + '...' : url
}

onMounted(() => {
  loadPlataformas()
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
  background: #f8f9fa;
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
  transition: all 0.3s ease;
  font-weight: 500;
}

.btn-add:hover {
  background: #254677;
  transform: translateY(-2px);
}

.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed; /* Importante para larguras fixas */
}

th, td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e9ecef;
}

th {
  background: #f8f9fa;
  color: #193155;
  font-weight: 600;
}

tr:hover {
  background: #f8f9fa;
}

.actions-cell {
  width: 100px;
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
  background: #e3f2fd;
}

.btn-action.delete {
  background: #fee2e2;
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

/* Modal Styles */
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

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.btn-close:hover {
  background: #f3f4f6;
  color: #374151;
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
  font-family: 'JetBrains Mono', monospace;
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
}

.btn-cancelar {
  background: #e9ecef;
  color: #495057;
}

.btn-salvar {
  background: #193155;
  color: white;
}

.btn-cancelar:hover, .btn-salvar:hover {
  transform: translateY(-2px);
}

.btn-cancelar:hover {
  background: #dee2e6;
}

.btn-salvar:hover {
  background: #254677;
  box-shadow: 0 4px 12px rgba(25, 49, 85, 0.2);
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

  .modal-content {
    margin: 1rem;
    padding: 1.5rem;
  }
}

.nome-column {
  width: 600px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.url-column {
  width: 400px; /* ou outro valor que desejar */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.url-column a {
  color: #193155;
  text-decoration: none;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.url-column a:hover {
  text-decoration: underline;
}
</style>