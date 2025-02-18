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
                <button class="btn-action edit" @click="editPlataforma(plataforma)">
                  <img src="/icons/edicao.svg" alt="Editar" class="icon" />
                </button>
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

  <!-- Ajuste o modal de edição -->
  <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ editingId ? 'Editar' : 'Nova' }} Plataforma</h3>
        <button class="btn-close" @click="closeModal">×</button>
      </div>

      <div class="modal-body">
        <form @submit.prevent="handleSubmit" class="form-grid">
          <!-- Dados básicos sempre visíveis -->
          <div class="form-group">
            <label>Nome da Plataforma*</label>
            <input v-model="formData.nome" required type="text" />
          </div>

          <div class="form-group">
            <label>URL*</label>
            <input v-model="formData.url" required type="url" />
          </div>

          <!-- Área de empresas vinculadas apenas quando não há empresa selecionada -->
          <template v-if="!selectedEmpresa">
            <div class="form-group full-width">
              <label>Empresas Vinculadas</label>
              <div class="empresas-grid">
                <div v-for="empresa in empresasCadastradas" :key="empresa.id"
                  :class="['empresa-chip', { 'selected': empresasSelecionadas.includes(empresa.id) }]"
                  @click="toggleEmpresa(empresa)">
                  {{ empresa.nome }}
                  <span class="empresa-cnpj">{{ formatCNPJ(empresa.cnpj) }}</span>
                </div>
              </div>
            </div>
          </template>

          <!-- Dados específicos apenas quando uma empresa está selecionada -->
          <template v-if="selectedEmpresa">
            <div class="form-group">
              <label>Login</label>
              <input v-model="formData.login" type="text" />
            </div>

            <div class="form-group">
              <label>Senha</label>
              <input v-model="formData.senha" type="text" placeholder="Digite a senha para consulta" />
            </div>

            <div class="form-group">
              <label>Validade do Certificado</label>
              <input v-model="formData.data_validade" type="date" />
            </div>

            <div class="form-group full-width">
              <label>Observações</label>
              <textarea v-model="formData.observacoes" rows="3"></textarea>
            </div>
          </template>
        </form>
      </div>

      <div class="modal-actions">
        <button type="button" class="btn-cancelar" @click="closeModal">Cancelar</button>
        <button type="submit" class="btn-salvar" @click="handleSubmit">
          {{ editingId ? 'Atualizar' : 'Salvar' }}
        </button>
      </div>
    </div>
  </div>

  <!-- Modal de Edição de Dados Específicos -->
  <div v-if="showDadosModal" class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Editar Dados da Plataforma</h3>
        <button class="btn-close" @click="closeDadosModal">×</button>
      </div>

      <div class="modal-body">
        <form @submit.prevent="handleDadosSubmit" class="form-grid">
          <div class="form-group">
            <label>Login</label>
            <input v-model="dadosForm.login" type="text" />
          </div>

          <div class="form-group">
            <label>Senha</label>
            <input v-model="dadosForm.senha" type="password" />
          </div>

          <div class="form-group">
            <label>Data de Validade</label>
            <input v-model="dadosForm.data_validade" type="date" />
          </div>

          <div class="form-group full-width">
            <label>Observações</label>
            <textarea v-model="dadosForm.observacoes" rows="3"></textarea>
          </div>
        </form>
      </div>

      <div class="modal-actions">
        <button class="btn-cancelar" @click="closeDadosModal">Cancelar</button>
        <button class="btn-salvar" @click="handleDadosSubmit">Salvar</button>
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

// Adicione junto com as outras refs no início do script
const toasts = ref([])

// Modifique a função loadPlataformas
const loadPlataformas = async (empresaId = null) => {
  try {
    let query = supabase
      .from('plataformas')
      .select(`
        *,
        empresa_plataforma_dados!left(
          empresa_id,
          login,
          senha,
          data_validade,
          observacoes
        )
      `)
      .order('nome')

    if (empresaId) {
      query = query.eq('empresa_plataforma_dados.empresa_id', empresaId)
    }

    const { data, error } = await query

    if (error) throw error

    plataformas.value = data.map(p => ({
      ...p,
      dados_especificos: p.empresa_plataforma_dados?.[0] || null
    }))

    console.log('Plataformas carregadas:', plataformas.value) // Debug

  } catch (error) {
    console.error('Erro ao carregar plataformas:', error)
    showToast('Erro ao carregar plataformas', 'error')
  }
}

// Modifique a função loadEmpresas
const loadEmpresas = async () => {
  try {
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .order('nome')

    if (error) throw error
    empresasCadastradas.value = data || []
    console.log('Empresas carregadas:', empresasCadastradas.value)
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
    showToast(`Empresa ${empresa.nome} vinculada com sucesso!`, 'success')
  } else {
    empresasSelecionadas.value.splice(index, 1)
    showToast(`Empresa ${empresa.nome} desvinculada!`, 'error')
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

// Modifique a função editPlataforma
const editPlataforma = async (plataforma) => {
  editingId.value = plataforma.id

  // Dados básicos da plataforma
  formData.value = {
    nome: plataforma.nome,
    url: plataforma.url
  }

  // Se tiver uma empresa selecionada, carrega os dados específicos
  if (selectedEmpresa.value) {
    const dadosEspecificos = plataforma.dados_especificos || {}
    formData.value = {
      ...formData.value,
      login: dadosEspecificos.login || '',
      senha: dadosEspecificos.senha || '',
      data_validade: dadosEspecificos.data_validade || '',
      observacoes: dadosEspecificos.observacoes || ''
    }
  } else {
    // Se não tiver empresa selecionada, carrega as vinculações
    await loadVinculacoes(plataforma.id)
  }

  showModal.value = true
}

// Modifique o handleSubmit para verificar se está em modo de edição com empresa selecionada
const handleSubmit = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Salvar dados da plataforma
    const plataformaData = {
      nome: formData.value.nome,
      url: formData.value.url,
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

    // 2. Se tiver empresa selecionada, atualiza dados específicos
    if (selectedEmpresa.value) {
      const dadosEspecificos = {
        plataforma_id: plataformaId,
        empresa_id: selectedEmpresa.value.id,
        login: formData.value.login || null,
        senha: formData.value.senha || null,
        data_validade: formData.value.data_validade || null,
        observacoes: formData.value.observacoes || null,
        responsavel_id: user.id
      }

      const { error } = await supabase
        .from('empresa_plataforma_dados')
        .upsert(dadosEspecificos, {
          onConflict: 'empresa_id,plataforma_id'
        })

      if (error) throw error
    }

    await loadPlataformas(selectedEmpresa.value?.id)
    closeModal()
    showToast('Plataforma salva com sucesso!', 'success')
  } catch (error) {
    console.error('Erro ao salvar:', error)
    showToast(`Erro ao salvar plataforma: ${error.message}`, 'error')
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
const showToast = (message, type = 'success') => {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, 3000)
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

// Ajuste o computed plataformasFiltradas
const plataformasFiltradas = computed(() => {
  // Retorna todas as plataformas quando não há empresa selecionada
  if (!selectedEmpresa.value) {
    return plataformas.value
  }

  // Filtra plataformas que têm dados específicos para a empresa selecionada  
  return plataformas.value.filter(p => {
    return p.dados_especificos?.empresa_id === selectedEmpresa.value.id
  })
})

const getEmptyStateMessage = () => {
  if (selectedEmpresa.value) {
    return `Nenhuma plataforma vinculada à empresa ${selectedEmpresa.value.nome}`
  }
  return 'Nenhuma plataforma cadastrada'
}

const selectEmpresa = async (empresa) => {
  selectedEmpresa.value = empresa
  await loadPlataformas(empresa.id)
  console.log('Empresa selecionada:', empresa) // Debug
}

const clearEmpresaSelection = () => {
  selectedEmpresa.value = null
  loadPlataformas()
}

// Função para formatar datas
const formatDate = (date) => {
  if (!date) return '-'
  try {
    return new Date(date).toLocaleDateString('pt-BR')
  } catch (error) {
    console.error('Erro ao formatar data:', error)
    return '-'
  }
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

const saveDadosPlataforma = async (dados) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    const dadosToSave = {
      empresa_id: selectedEmpresa.value.id,
      plataforma_id: editingPlataforma.value.id,
      login: dados.login,
      senha: dados.senha,
      data_validade: dados.data_validade,
      observacoes: dados.observacoes,
      responsavel_id: user.id,
      updated_at: new Date().toISOString()
    }

    // Upsert na tabela empresa_plataforma_dados
    const { error } = await supabase
      .from('empresa_plataforma_dados')
      .upsert(dadosToSave, {
        onConflict: 'empresa_id,plataforma_id'
      })

    if (error) throw error

    // Recarrega apenas as plataformas da empresa selecionada
    await loadPlataformas(selectedEmpresa.value?.id)
    showToast('Dados salvos com sucesso!')
  } catch (error) {
    console.error('Erro ao salvar:', error)
    showToast('Erro ao salvar dados', 'error')
  }
}

const showDadosModal = ref(false)
const editingPlataforma = ref(null)
const dadosForm = ref({
  login: '',
  senha: '',
  certificado_digital: '',
  data_validade_certificado: '',
  observacoes: ''
})

const editDadosPlataforma = (plataforma) => {
  editingPlataforma.value = plataforma
  dadosForm.value = {
    login: plataforma.dados_especificos?.login || '',
    senha: plataforma.dados_especificos?.senha || '',
    data_validade: plataforma.dados_especificos?.data_validade || '',
    observacoes: plataforma.dados_especificos?.observacoes || ''
  }
  showDadosModal.value = true
}

const closeDadosModal = () => {
  showDadosModal.value = false
  editingPlataforma.value = null
  dadosForm.value = {
    login: '',
    senha: '',
    certificado_digital: '',
    data_validade_certificado: '',
    observacoes: ''
  }
}

const handleDadosSubmit = async () => {
  try {
    const dadosToSave = {
      ...dadosForm.value,
      plataforma_id: editingPlataforma.value.id
    }
    await saveDadosPlataforma(dadosToSave)
    closeDadosModal()
  } catch (error) {
    console.error('Erro ao salvar dados específicos:', error)
    showToast('Erro ao salvar dados específicos', 'error')
  }
}

const handleEmpresasVinculadas = async (plataformaId) => {
  // Remove vinculações existentes
  await supabase
    .from('empresa_plataforma')
    .delete()
    .eq('plataforma_id', plataformaId)

  // Adiciona novas vinculações
  if (empresasSelecionadas.value.length > 0) {
    const vinculacoes = empresasSelecionadas.value.map(empresaId => ({
      empresa_id: empresaId,
      plataforma_id: plataformaId
    }))

    await supabase
      .from('empresa_plataforma')
      .insert(vinculacoes)
  }
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
  width: calc(100% - 70px);
  /* Ajusta para a largura do sidebar recolhido */
  margin-left: 70px;
  /* Igual à largura do sidebar recolhido */
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
    width: calc(100% - 70px);
    /* Ajuste para sidebar mobile */
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
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
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
  max-width: 1000px;
  /* Aumentado para acomodar duas colunas */
  max-height: 90vh;
  /* Limita altura */
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  /* Importante para o scroll interno */
}

.modal-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
  /* Impede o header de encolher */
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
  gap: 30px;
  /* Gap solicitado */
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
  flex-shrink: 0;
  /* Impede os botões de encolherem */
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
    grid-template-columns: 1fr;
    /* Uma coluna em telas menores */
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
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  margin-top: 1rem;
  overflow: auto;
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

th,
td {
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
  width: 36px;
  /* Aumentado para melhor clicabilidade */
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
  filter: brightness(0) invert(1);
  /* Deixa o ícone branco */
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


.btn-cancelar,
.btn-salvar {
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
  width: 400px;
  /* ou outro valor que desejar */
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

.btn-view-all.active {
  background: #193155;
  color: white;
}

.btn-view-all:hover {
  background: #193155;
  color: white;
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

.empresas-selector {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
}

.empresas-header {
  margin-bottom: 1rem;
}

.empresas-header h3 {
  color: #193155;
  font-size: 1.2rem;
  font-weight: 600;
}

.empresas-list {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}

.empresa-chip {
  padding: 0.75rem 1.5rem;
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
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

.empresas-actions {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
}

/* Adicione ao seu <style> existente */
.toast-container {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 9999;
}

.toast-message {
  min-width: 300px;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  animation: slideIn 0.3s ease, fadeOut 0.3s ease 2.7s;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toast-success {
  background: #f0fdf4;
  color: #059669;
  border-left: 4px solid #059669;
}

.toast-error {
  background: #fef2f2;
  color: #dc2626;
  border-left: 4px solid #dc2626;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }

  to {
    transform: translateX(100%);
    opacity: 0;
  }
}
</style>