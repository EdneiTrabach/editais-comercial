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
import { ref, onMounted, watch, computed, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'
import TheSidebar from '@/components/TheSidebar.vue'
import EmpresasSelector from '@/components/EmpresasSelector.vue'
import { useConnectionManager } from '@/composables/useConnectionManager'
import { SupabaseManager } from '@/lib/supabaseManager'

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

    console.log('Dados retornados:', data) // Debug

    plataformas.value = data.map(p => ({
      ...p,
      dados_especificos: p.empresa_plataforma_dados?.find(
        d => d.empresa_id === empresaId
      ) || null
    }))

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

  if (selectedEmpresa.value) {
    // Modo edição com empresa específica
    const dadosEspecificos = plataforma.dados_especificos || {}
    formData.value = {
      ...formData.value,
      login: dadosEspecificos.login || '',
      senha: dadosEspecificos.senha || '',
      data_validade: dadosEspecificos.data_validade || '',
      observacoes: dadosEspecificos.observacoes || ''
    }
  } else {
    // Carrega empresas vinculadas
    const { data } = await supabase
      .from('empresa_plataforma_dados')
      .select('empresa_id')
      .eq('plataforma_id', plataforma.id)

    empresasSelecionadas.value = data?.map(v => v.empresa_id) || []
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

    // 2. Gerenciar vinculações com empresas
    if (!selectedEmpresa.value && empresasSelecionadas.value.length > 0) {
      // Remove vinculações antigas
      await supabase
        .from('empresa_plataforma_dados')
        .delete()
        .eq('plataforma_id', plataformaId)

      // Insere novas vinculações
      const vinculacoes = empresasSelecionadas.value.map(empresaId => ({
        empresa_id: empresaId,
        plataforma_id: plataformaId,
        responsavel_id: user.id,
        created_at: new Date().toISOString()
      }))

      const { error: vinculacaoError } = await supabase
        .from('empresa_plataforma_dados')
        .insert(vinculacoes)

      if (vinculacaoError) throw vinculacaoError
    }

    // 3. Se tiver empresa selecionada, atualiza dados específicos
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

const loadData = async () => {
  await loadPlataformas(selectedEmpresa.value?.id)
}

useConnectionManager(loadData)

onMounted(() => {
  loadPlataformas()
  loadEmpresas()
  
  const channel = supabase.channel('plataformas-updates')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'plataformas' }, 
      () => loadData()
    )
    .subscribe()
  
  SupabaseManager.addSubscription('plataformas-updates', channel)
})

onUnmounted(() => {
  const channel = SupabaseManager.getSubscription('plataformas-updates')
  if (channel) {
    supabase.removeChannel(channel)
    SupabaseManager.removeSubscription('plataformas-updates')
  }
})
</script>

<style src="../assets/styles/PlataformasView.css"></style>