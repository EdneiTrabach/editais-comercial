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
      <div v-if="selectedEmpresa" class="filter-info">
        <h3>Plataformas vinculadas à {{ selectedEmpresa.nome }}</h3>
        <button class="btn-clear" @click="clearEmpresaSelection">
          Ver todas
        </button>
      </div>

      <div class="table-container" :class="{ 'sidebar-expanded': isSidebarExpanded }">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>URL</th>
              <th>Responsável</th>
              <th>Detalhes</th>
              <th>Data Cadastro</th>
              <th>Última Atualização</th>
              <th>Validade</th>
              <th>Observações</th>
              <th>Ações</th>
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
              <td>{{ plataforma.responsavel || '-' }}</td>
              <td>{{ plataforma.detalhes || '-' }}</td>
              <td>{{ formatDate(plataforma.data_cadastro) }}</td>
              <td>{{ formatDate(plataforma.ultima_atualizacao) }}</td>
              <td>
                <span :class="getValidadeClass(plataforma.data_validade)">
                  {{ formatDate(plataforma.data_validade) || '-' }}
                </span>
              </td>
              <td>
                <span class="observacoes" :title="plataforma.observacoes">
                  {{ truncateText(plataforma.observacoes) || '-' }}
                </span>
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
            <tr v-if="plataformasFiltradas.length === 0">
              <td colspan="9" class="empty-state"> <!-- Ajuste o colspan para o número total de colunas -->
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
        
        <div class="modal-body">
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

            <div class="form-group">
              <label>Data de Validade</label>
              <input 
                v-model="formData.data_validade"
                type="date"
                :min="new Date().toISOString().split('T')[0]"
              />
            </div>

            <div class="form-group">
              <label>Detalhes</label>
              <textarea 
                v-model="formData.detalhes"
                rows="3"
                placeholder="Detalhes da plataforma"
                class="detalhes"
              ></textarea>
            </div>

            <!-- Seção de empresas ocupa largura total -->
            <div class="form-group full-width">
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

            <div class="form-group full-width">
              <label>Observações</label>
              <textarea 
                v-model="formData.observacoes"
                rows="3"
                placeholder="Observações adicionais"
                class="detalhes"
              ></textarea>
            </div>
          </form>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn-cancelar" @click="closeModal">
            Cancelar
          </button>
          <button type="submit" class="btn-salvar">
            {{ editingId ? 'Atualizar' : 'Salvar' }}
          </button>
        </div>
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
  detalhes: '',
  data_validade: '',
  observacoes: '',
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
        empresa_plataforma (
          empresa_id
        )
      `)
      .order('nome')

    if (empresaId) {
      query = query.eq('empresa_plataforma.empresa_id', empresaId)
    }

    const { data, error } = await query
    
    if (error) throw error
    
    console.log('Dados carregados:', data)
    plataformas.value = data || []
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

// Modificar handleSubmit para incluir os novos campos
const handleSubmit = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    const plataformaData = {
      ...formData.value,
      responsavel_id: user.id
    }

    let plataformaId = editingId.value

    if (editingId.value) {
      const { error } = await supabase
        .from('plataformas')
        .update(plataformaData)
        .eq('id', editingId.value)

      if (error) throw error
    } else {
      const { data, error } = await supabase
        .from('plataformas')
        .insert(plataformaData)
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

const truncateText = (text, length = 60) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

// Adicione no computed plataformasFiltradas
const plataformasFiltradas = computed(() => {
  console.log('Estado atual:', {
    todasPlataformas: plataformas.value.length,
    empresaSelecionada: selectedEmpresa.value?.nome,
    filtradas: plataformas.value.filter(p => !selectedEmpresa.value).length
  })
  
  if (!selectedEmpresa.value) {
    return plataformas.value
  }
  
  // Filtra apenas quando há uma empresa selecionada
  return plataformas.value.filter(plataforma => {
    return plataforma.empresa_plataforma?.some(ep => 
      ep.empresa_id === selectedEmpresa.value.id
    )
  })
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

// Função para formatar datas
const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('pt-BR')
}

// Função para definir classe CSS baseada na validade
const getValidadeClass = (data) => {
  if (!data) return 'validade-indefinida'
  
  const hoje = new Date()
  const validade = new Date(data)
  const diasRestantes = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24))
  
  if (diasRestantes < 0) return 'validade-expirada'
  if (diasRestantes <= 30) return 'validade-proxima'
  return 'validade-ok'
}

onMounted(async () => {
  console.log('Iniciando carregamento...')
  await loadPlataformas() // Primeiro carrega todas as plataformas
  await loadEmpresas()  // Depois carrega as empresas
})
</script>

<style scoped>
/* Layout principal */
.layout {
  display: flex;
  min-height: 100vh;
  position: relative;
}

.main-content {
  flex: 1;
  padding: 2rem;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  width: 74%;
  background: #f8fafc;
  margin-left: auto;
  box-sizing: border-box;
}

/* Quando o sidebar está recolhido */
.main-content.expanded {
  width: calc(100% - 70px); /* Ajusta para a largura do sidebar recolhido */
  margin-left: 70px; /* Igual à largura do sidebar recolhido */
}

/* Media query para telas menores */
@media (max-width: 768px) {
  .main-content {
    width: calc(100% - 70px);
    margin-left: 70px;
    padding: 1rem;
  }

  .main-content.expanded {
    width: 100%;
    margin-left: 0;
  }
}

/* Ajuste responsivo para telas menores */
@media (max-width: 768px) {
  .main-content {
    width: calc(100% - 70px); /* Ajuste para sidebar mobile */
    margin-left: 70px;
    margin-right: 1rem;
    padding: 1rem;
  }

  .main-content.expanded {
    width: 100%;
    margin-left: 1rem;
    margin-right: 1rem;
  }
}

/* Header com estilo padrão */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1.5rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.header h1 {
  color: #193155;
  font-size: 1.8rem;
  font-weight: 600;
}


.btn-add {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.75rem;
  background: #193155;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-add:hover {
  transform: translateY(-2px);
  background: #254677;
  box-shadow: 0 4px 12px rgba(25, 49, 85, 0.2);
}

/* Modal melhorado com scroll */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
  padding: 2rem;
}

.modal-content {
  background: white;
  width: 95%;
  max-width: 1000px; /* Aumentado para acomodar duas colunas */
  max-height: 90vh; /* Limita altura */
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Importante para o scroll interno */
}

.modal-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0; /* Impede o header de encolher */
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  color: #193155;
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0;
}

.btn-close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  font-size: 1.5rem;
}

.btn-close:hover {
  background: #e5e7eb;
  color: #374151;
}

/* Container com scroll */
.modal-body {
  padding: 2rem;
  overflow-y: auto;
  flex: 1;
}

/* Grid de duas colunas melhorado */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 30px; /* Gap solicitado */
  max-width: 100%;
}

/* Campos que ocupam largura total */
.form-group.full-width {
  grid-column: 1 / -1;
}

/* Ajuste para a grid de empresas */
.empresas-grid {
  grid-column: 1 / -1;
  max-height: 300px;
  overflow-y: auto;
  gap: 1rem;
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 12px;
  border: 2px solid #e9ecef;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

/* Botões do modal fixos na parte inferior */
.modal-actions {
  padding: 1.5rem 2rem;
  border-top: 1px solid #e5e7eb;
  background: white;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  flex-shrink: 0; /* Impede os botões de encolherem */
}

/* Responsividade */
@media (max-width: 768px) {
  .modal-content {
    width: 100%;
    height: 100%;
    max-height: 100%;
    border-radius: 0;
  }

  .form-grid {
    grid-template-columns: 1fr; /* Uma coluna em telas menores */
    gap: 20px;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .modal-header,
  .modal-actions {
    padding: 1rem 1.5rem;
  }
}

.table-container::-webkit-scrollbar-thumb:hover {
    background: #254677;
}

.table-container::-webkit-scrollbar-thumb {
    background: #193155;
    border-radius: 4px;
}

.table-container {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  margin-top: 1rem;
  overflow: auto;
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

th, td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

th {
  background: #f8fafc;
  font-weight: 600;
  color: #193155;
  border-bottom: 2px solid #e9ecef;
}

.url-link {
  color: #722F37;
  text-decoration: none;
}

.url-link:hover {
  text-decoration: underline;
}

.validade-expirada {
  padding: 0.25rem 0.75rem;
  background: #fef2f2;
  color: #dc2626;
  border-radius: 50px;
  font-size: 0.875rem;
}

.validade-proxima {
  padding: 0.25rem 0.75rem;
  background: #fffbeb;
  color: #d97706;
  border-radius: 50px;
  font-size: 0.875rem;
}

.validade-ok {
  padding: 0.25rem 0.75rem;
  background: #f0fdf4;
  color: #059669;
  border-radius: 50px;
  font-size: 0.875rem;
}

.observacoes {
  display: block;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin: 1rem 0;
}

.btn-clear {
  padding: 0.5rem 1rem;
  background: #e5e7eb;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.btn-clear:hover {
  background: #d1d5db;
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
  background: rgba(114, 47, 55, 0.2);
}

.btn-action.delete:hover {
  background: rgba(220, 38, 38, 0.2);
}

.icon {
  width: 16px;
  height: 16px;
  transition: all 0.3s ease;
}

.icon-add {
  width: 32px;
  height: 32px;
  filter: brightness(0) invert(1); /* Deixa o ícone branco */
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  color: #193155;
  font-size: 1.75rem;
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

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

textarea.detalhes {
    padding: 0.9rem;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    transition: all 0.3s ease;
    background: #f8fafc;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.95rem;
    color: #495057;
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

.form-group input {
  padding: 0.9rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  transition: all 0.3s ease;
  background: #f8fafc;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.95rem;
  color: #495057;
}

.form-group input:focus {
  outline: none;
  border-color: #193155;
  box-shadow: 0 0 0 3px rgba(25, 49, 85, 0.1);
  background: white;
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

.validade-expirada {
  color: #dc3545;
  font-weight: bold;
}

.validade-proxima {
  color: #ffc107;
  font-weight: bold;
}

.validade-ok {
  color: #28a745;
}

.validade-indefinida {
  color: #6c757d;
  font-style: italic;
}

table td {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

td.actions {
  white-space: nowrap;
  width: 120px;
}

/* Estilo base para scrollbar da tabela */
.table-container::-webkit-scrollbar,
.table-container.sidebar-expanded::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.table-container::-webkit-scrollbar-track,
.table-container.sidebar-expanded::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.table-container::-webkit-scrollbar-thumb,
.table-container.sidebar-expanded::-webkit-scrollbar-thumb {
  background: #193155;
  border-radius: 4px;
}

.table-container::-webkit-scrollbar-thumb:hover,
.table-container.sidebar-expanded::-webkit-scrollbar-thumb:hover {
  background: #254677;
}

/* Ajuste para quando o sidebar estiver expandido */
.table-container.sidebar-expanded {
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Ajuste para quando o sidebar estiver recolhido */
.table-container:not(.sidebar-expanded) {
  width: calc(100% - 70px);
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>



