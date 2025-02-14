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

      <!-- Componente de seleção de empresas -->
      <EmpresasSelector @empresa-selected="handleEmpresaSelected" />

      <!-- Header da tabela com informação da empresa selecionada -->
      <div v-if="selectedEmpresa" class="table-header">
        <h3>Plataformas vinculadas à {{ selectedEmpresa.nome }}</h3>
        <button class="btn-view-all" @click="clearEmpresaSelection">
          Ver todas as plataformas
        </button>
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
            <tr v-for="plataforma in plataformasFiltradas" :key="plataforma.id">
              <td>{{ plataforma.nome }}</td>
              <td>
                <a :href="plataforma.url" target="_blank">{{ truncateUrl(plataforma.url) }}</a>
              </td>
              <td class="actions">
                <button class="btn-action edit" @click="editPlataforma(plataforma)">
                  <img src="/icons/edicao.svg" alt="Editar" />
                </button>
                <button 
                  v-if="selectedEmpresa" 
                  class="btn-action unlink" 
                  @click="desvincularEmpresa(plataforma.id)"
                >
                  <span class="unlink-text">×</span>
                </button>
                <button class="btn-action delete" @click="deletePlataforma(plataforma.id)">
                  <img src="/icons/lixeira.svg" alt="Excluir" />
                </button>
              </td>
            </tr>
            <tr v-if="plataformasFiltradas.length === 0">
              <td colspan="3" class="empty-state">
                {{ getEmptyStateMessage() }}
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

          <!-- Nova seção de empresas -->
          <div class="form-group">
            <label>Vincular Empresas</label>
            <div class="empresas-grid">
              <button
                v-for="empresa in empresasCadastradas"
                :key="empresa.id"
                type="button"
                class="empresa-chip"
                :class="{ 'selected': empresasSelecionadas.includes(empresa.id) }"
                @click="toggleEmpresa(empresa)"
              >
                {{ empresa.nome }}
                <span class="empresa-cnpj">{{ formatCNPJ(empresa.cnpj) }}</span>
              </button>
            </div>
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
import { ref, onMounted, watch, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import TheSidebar from '@/components/TheSidebar.vue'
import EmpresasSelector from '@/components/EmpresasSelector.vue'

const isSidebarExpanded = ref(true)
const showModal = ref(false)
const editingId = ref(null)
const plataformas = ref([])

const formData = ref({
  nome: '',
  url: '',
  empresas: [] // Novo campo para armazenar empresas relacionadas
})

const selectedEmpresa = ref(null)

const empresasCadastradas = ref([])
const empresasSelecionadas = ref([])

// Carregar plataformas com filtro por empresa
const loadPlataformas = async (empresaId = null) => {
  try {
    let query = supabase
      .from('plataformas')
      .select(`
        *,
        empresa_plataforma:empresa_plataforma(
          empresa_id,
          plataforma_id
        )
      `)
      .order('nome')

    if (empresaId) {
      // Se uma empresa está selecionada, filtra as plataformas vinculadas
      query = query.eq('empresa_plataforma.empresa_id', empresaId)
    }

    const { data, error } = await query
    
    if (error) throw error

    // Log para debug
    console.log('Dados retornados:', data)

    plataformas.value = data?.map(plataforma => ({
      ...plataforma,
      vinculada: plataforma.empresa_plataforma?.length > 0
    })) || []
    
    console.log('Plataformas processadas:', plataformas.value)
  } catch (error) {
    console.error('Erro ao carregar plataformas:', error)
  }
}

// Carregar empresas
const loadEmpresas = async () => {
  try {
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .order('nome')
    
    if (error) throw error
    empresasCadastradas.value = data
  } catch (error) {
    console.error('Erro ao carregar empresas:', error)
  }
}

// Atualizar lista quando uma empresa for selecionada
const handleEmpresaSelected = async (empresa) => {
  selectedEmpresa.value = empresa
  await loadPlataformas(empresa.id)
}

// Função para vincular plataforma à empresa
const vincularEmpresaPlataforma = async (plataformaId, empresaId) => {
  try {
    const { error } = await supabase
      .from('empresa_plataforma')
      .insert({
        empresa_id: empresaId,
        plataforma_id: plataformaId
      })

    if (error) throw error
  } catch (error) {
    console.error('Erro ao vincular empresa-plataforma:', error)
    throw error
  }
}

// Função para desvincular plataforma da empresa
const desvincularEmpresa = async (plataformaId) => {
  if (!confirm('Deseja desvincular esta plataforma da empresa?')) return

  try {
    const { error } = await supabase
      .from('empresa_plataforma')
      .delete()
      .match({
        empresa_id: selectedEmpresa.value.id,
        plataforma_id: plataformaId
      })

    if (error) throw error
    await loadPlataformas(selectedEmpresa.value.id)
  } catch (error) {
    console.error('Erro ao desvincular:', error)
    alert('Erro ao desvincular plataforma da empresa')
  }
}

// Função para vincular empresa à plataforma
const vincularEmpresa = async (plataformaId) => {
  try {
    if (!selectedEmpresa.value) return

    const { error } = await supabase
      .from('empresa_plataforma')
      .insert({
        empresa_id: selectedEmpresa.value.id,
        plataforma_id: plataformaId
      })

    if (error) throw error
    await loadPlataformas(selectedEmpresa.value.id)
  } catch (error) {
    console.error('Erro ao vincular empresa:', error)
    alert('Erro ao vincular empresa à plataforma')
  }
}

// Toggle seleção de empresa
const toggleEmpresa = (empresa) => {
  const index = empresasSelecionadas.value.indexOf(empresa.id)
  if (index === -1) {
    empresasSelecionadas.value.push(empresa.id)
    showToast(`Empresa ${empresa.nome} vinculada com sucesso!`)
  } else {
    empresasSelecionadas.value.splice(index, 1)
  }
}

// Carregar vinculações existentes ao editar
const loadVinculacoes = async (plataformaId) => {
  try {
    const { data, error } = await supabase
      .from('empresa_plataforma')
      .select('empresa_id')
      .eq('plataforma_id', plataformaId)
    
    if (error) throw error
    empresasSelecionadas.value = data.map(v => v.empresa_id)
  } catch (error) {
    console.error('Erro ao carregar vinculações:', error)
  }
}

// Modificar editPlataforma para carregar vinculações
const editPlataforma = async (plataforma) => {
  editingId.value = plataforma.id
  formData.value = { ...plataforma }
  await loadVinculacoes(plataforma.id)
  showModal.value = true
}

// Modificar handleSubmit para salvar vinculações
const handleSubmit = async () => {
  try {
    let plataformaId = editingId.value

    if (editingId.value) {
      const { error } = await supabase
        .from('plataformas')
        .update({
          nome: formData.value.nome,
          url: formData.value.url
        })
        .eq('id', editingId.value)

      if (error) throw error
    } else {
      const { data, error } = await supabase
        .from('plataformas')
        .insert({
          nome: formData.value.nome,
          url: formData.value.url
        })
        .select()

      if (error) throw error
      plataformaId = data[0].id
    }

    // Remover vinculações antigas
    await supabase
      .from('empresa_plataforma')
      .delete()
      .eq('plataforma_id', plataformaId)

    // Inserir novas vinculações
    if (empresasSelecionadas.value.length > 0) {
      const vinculacoes = empresasSelecionadas.value.map(empresaId => ({
        empresa_id: empresaId,
        plataforma_id: plataformaId
      }))

      const { error } = await supabase
        .from('empresa_plataforma')
        .insert(vinculacoes)

      if (error) throw error
    }

    await loadPlataformas(selectedEmpresa.value?.id)
    closeModal()
  } catch (error) {
    console.error('Erro ao salvar:', error)
    alert('Erro ao salvar plataforma')
  }
}

// Adicionar função para formatação de CNPJ
const formatCNPJ = (cnpj) => {
  if (!cnpj) return ''
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
}

// Limpar seleções ao fechar modal
const closeModal = () => {
  showModal.value = false
  editingId.value = null
  formData.value = { nome: '', url: '' }
  empresasSelecionadas.value = []
}

// Toast para feedback
const showToast = (message) => {
  // Implementar toast de sua preferência
  alert(message)
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

const handleSidebarToggle = (expanded) => {
  isSidebarExpanded.value = expanded
}

const truncateUrl = (url) => {
  return url.length > 60 ? url.substring(0, 60) + '...' : url
}

const plataformasFiltradas = computed(() => {
  if (!selectedEmpresa.value) {
    return plataformas.value
  }
  return plataformas.value.filter(plataforma => 
    plataforma.empresa_plataforma?.some(ep => 
      ep.empresa_id === selectedEmpresa.value.id
    )
  )
})

const getEmptyStateMessage = () => {
  if (selectedEmpresa.value) {
    return `Nenhuma plataforma vinculada à empresa ${selectedEmpresa.value.nome}`
  }
  return 'Nenhuma plataforma cadastrada'
}

const clearEmpresaSelection = () => {
  selectedEmpresa.value = null
  loadPlataformas()
}

onMounted(() => {
  loadPlataformas()
  loadEmpresas()
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
  height: 100%;
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

.btn-action.unlink {
  background: #e9ecef;
}

.btn-action.unlink:hover {
  background: #dee2e6;
}

.unlink-text {
  font-size: 1.2rem;
  font-weight: bold;
  color: #6c757d;
}

.btn-action.unlink:hover .unlink-text {
  color: #495057;
}

.btn-action.link {
  background: #d1fae5;
}

.btn-action.link:hover {
  background: #a7f3d0;
}

.link-text {
  font-size: 1.2rem;
  font-weight: bold;
  color: #059669;
}

.btn-action.link:hover .link-text {
  color: #047857;
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

.empresas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  max-height: 300px;
  overflow-y: auto;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #e9ecef;
}

.empresa-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.empresa-chip.selected {
  border-color: #193155;
  background: #193155;
  color: white;
}

.empresa-cnpj {
  font-size: 0.8rem;
  opacity: 0.8;
  margin-top: 0.5rem;
}

.empresa-chip:hover {
  transform: translateY(-2px);
  border-color: #193155;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.table-header h3 {
  color: #193155;
  font-size: 1.1rem;
  margin: 0;
}

.btn-view-all {
  padding: 0.5rem 1rem;
  background: #e9ecef;
  border: none;
  border-radius: 6px;
  color: #193155;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-view-all:hover {
  background: #dee2e6;
  transform: translateY(-1px);
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
  font-style: italic;
}
</style>