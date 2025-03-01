<template>
  <div class="layout">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />

    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <div class="header">
        <h1>Sistemas</h1>
        <div class="actions">
          <button class="btn-add" @click="showModal = true">
            <img src="/icons/adicao.svg" alt="Adicionar" class="icon icon-add" />
            Novo Sistema
          </button>
        </div>
      </div>

      <!-- Tabela de Sistemas -->
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Setor</th>
              <th>Sistema</th>
              <th>Descrição</th>
              <th>URL</th>
              <th>Contatos</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sistema in sistemas" :key="sistema.id">
              <td>{{ getSetorNome(sistema.setor_id) }}</td>
              <td>{{ sistema.nome }}</td>
              <td>{{ sistema.descricao || '-' }}</td>
              <td>
                <a v-if="sistema.url" :href="sistema.url" target="_blank" rel="noopener">
                  {{ sistema.url }}
                </a>
                <span v-else>-</span>
              </td>
              <td>
                <div class="contatos-list">
                  <div v-for="contato in sistema.sistema_contatos" :key="contato.id" class="contato-item">
                    {{ contato.nome }} - {{ contato.telefone }}
                  </div>
                </div>
              </td>
              <td>
                <span :class="['status-badge', sistema.status.toLowerCase()]">
                  {{ sistema.status }}
                </span>
              </td>
              <td class="actions-cell">
                <div class="action-buttons" :class="{ 'admin': isAdmin }">
                  <!-- Botão editar - disponível para todos -->
                  <button class="btn-icon edit" @click="editSistema(sistema)">
                    <img src="/icons/edicao.svg" alt="Editar" class="icon" />
                  </button>

                  <!-- Botão ativar/inativar - apenas para admin -->
                  <button 
                    v-if="isAdmin"  
                    class="btn-icon" 
                    :class="sistema.status === 'ACTIVE' ? 'delete' : 'enable'"
                    @click="sistema.status === 'ACTIVE' ? inativarSistema(sistema) : ativarSistema(sistema)"
                    :title="sistema.status === 'ACTIVE' ? 'Inativar Sistema' : 'Ativar Sistema'"
                  >
                    <img 
                      :src="sistema.status === 'ACTIVE' ? '/icons/disable.svg' : '/icons/enable.svg'"
                      :alt="sistema.status === 'ACTIVE' ? 'Inativar' : 'Ativar'" 
                      class="icon" 
                    />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal de Cadastro/Edição -->
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
          <h2>{{ editingId ? 'Editar' : 'Novo' }} Sistema</h2>
          <form @submit.prevent="handleSubmit" class="form-grid">
            <div class="form-group">
              <label>Setor*</label>
              <div class="setor-container">
                <select v-model="formData.setor_id" required>
                  <option value="">Selecione o setor...</option>
                  <option v-for="setor in setores" :key="setor.id" :value="setor.id">
                    {{ setor.nome }}
                  </option>
                </select>
                <button type="button" class="btn-add-setor" @click="showSetorModal = true">
                  <img src="/icons/adicao.svg" alt="Adicionar Setor" class="icon-add" />
                </button>
              </div>
            </div>

            <div class="form-group">
              <label>Nome do Sistema*</label>
              <input v-model="formData.nome" required type="text" />
            </div>

            <div class="form-group full-width">
              <label>Descrição</label>
              <textarea v-model="formData.descricao" rows="3"></textarea>
            </div>

            <div class="form-group">
              <label>URL</label>
              <input v-model="formData.url" type="url" />
            </div>

            <!-- Seção de Contatos -->
            <div class="contatos-section full-width">
              <h3>Contatos</h3>
              <div v-for="(contato, index) in formData.contatos" :key="index" class="contato-form">
                <input v-model="contato.nome" placeholder="Nome" />
                <input v-model="contato.telefone" placeholder="Telefone" />
                <button type="button" @click="removeContato(index)" class="btn-remove">×</button>
              </div>
              <button type="button" @click="addContato" class="btn-add-contato">
                + Adicionar Contato
              </button>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-cancel" @click="closeModal">Cancelar</button>
              <button type="submit" class="btn-save" :disabled="loading">
                {{ loading ? 'Salvando...' : 'Salvar' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal de Novo Setor -->
      <div v-if="showSetorModal" class="modal-overlay" @click.self="closeSetorModal">
        <div class="modal-content setor-modal">
          <h2>Novo Setor</h2>
          <form @submit.prevent="handleAddSetor" class="form-grid">
            <div class="form-group">
              <label>Nome do Setor*</label>
              <input v-model="novoSetor.nome" type="text" required placeholder="Digite o nome do setor" />
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-cancel" @click="closeSetorModal">Cancelar</button>
              <button type="submit" class="btn-save">Salvar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
    <!-- Dentro do template, antes do fechamento da div.layout -->
    <div class="toast-container">
      <div v-for="toast in toasts" :key="toast.id" :class="['toast', `toast-${toast.type}`]">
        {{ toast.message }}
      </div>
    </div>

    <!-- Modal de confirmação -->
    <div v-if="confirmDialog.show" class="dialog-overlay">
      <div class="confirm-dialog">
        <div class="confirm-content">
          <h3>{{ confirmDialog.title }}</h3>
          <p>{{ confirmDialog.message }}</p>
          <p v-if="confirmDialog.warning" class="warning-text">
            {{ confirmDialog.warning }}
          </p>
          <div class="confirm-actions">
            <button class="btn-cancel" @click="confirmDialog.show = false">
              Cancelar
            </button>
            <button class="btn-confirm delete" @click="confirmDialog.onConfirm">
              {{ confirmDialog.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'
import TheSidebar from '@/components/TheSidebar.vue'
import { useConnectionManager } from '@/composables/useConnectionManager'
import { SupabaseManager } from '@/lib/supabaseManager'

const sistemas = ref([])
const setores = ref([])
const loading = ref(false)
const showModal = ref(false)
const showSetorModal = ref(false)
const editingId = ref(null)
const isSidebarExpanded = ref(true)
const isAdmin = ref(false)

// Sistema de toast
const toasts = ref([])

// Dialog de confirmação
const confirmDialog = ref({
  show: false,
  title: '',
  message: '',
  warning: '',
  confirmText: '',
  onConfirm: null
})

// Refs para os formulários
const formData = ref({
  setor_id: '',
  nome: '',
  descricao: '',
  url: '',
  contatos: []
})

const novoSetor = ref({
  nome: ''
})

// Funções de carregamento
const loadSistemas = async () => {
  try {
    const { data, error } = await supabase
      .from('sistemas')
      .select(`
        *,
        setores (
          nome
        ),
        sistema_contatos (
          id,
          nome,
          telefone
        )
      `)
      .order('status', { ascending: false }) // ACTIVE virá primeiro que INACTIVE
      .order('created_at', { ascending: false })

    if (error) throw error
    sistemas.value = data
  } catch (error) {
    console.error('Erro ao carregar sistemas:', error)
    showToast('Erro ao carregar dados', 'error')
  }
}

const loadSetores = async () => {
  try {
    const { data, error } = await supabase
      .from('setores')
      .select('*')
      .order('nome')

    if (error) throw error
    setores.value = data
  } catch (error) {
    console.error('Erro ao carregar setores:', error)
  }
}

// Carregar dados ao montar o componente
const loadData = async () => {
  await Promise.all([
    loadSistemas(),
    loadSetores(),
    checkAdminStatus() // Adicione esta linha
  ])
}

// Use o composable
useConnectionManager(loadData)

onMounted(() => {
  loadData()
  
  const channel = supabase.channel('lances-updates')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'processos' }, 
      () => loadData()
    )
    .subscribe()
  
  SupabaseManager.addSubscription('lances-updates', channel)
})

onUnmounted(() => {
  const channel = SupabaseManager.getSubscription('lances-updates')
  if (channel) {
    supabase.removeChannel(channel)
    SupabaseManager.removeSubscription('lances-updates')
  }
})

// Outras funções necessárias
const handleSidebarToggle = (expanded) => {
  isSidebarExpanded.value = expanded
}

const getSetorNome = (setorId) => {
  const setor = setores.value.find(s => s.id === setorId)
  return setor?.nome || '-'
}

// Funções para gerenciar contatos no formulário
const addContato = () => {
  formData.value.contatos.push({ nome: '', telefone: '' })
}

const removeContato = (index) => {
  formData.value.contatos.splice(index, 1)
}

// Função para fechar o modal de setor
const closeSetorModal = () => {
  showSetorModal.value = false
  novoSetor.value.nome = ''
}

// Função para adicionar novo setor
const handleAddSetor = async () => {
  try {
    const { data, error } = await supabase
      .from('setores')
      .insert({
        nome: novoSetor.value.nome,
        created_at: new Date().toISOString()
      })
      .select()

    if (error) throw error

    // Recarrega os setores
    await loadSetores()

    // Fecha o modal e limpa o form
    closeSetorModal()

    // Feedback opcional
    alert('Setor criado com sucesso!')
  } catch (error) {
    console.error('Erro ao criar setor:', error)
    alert('Erro ao criar setor')
  }
}

// Função para fechar o modal
const closeModal = () => {
  showModal.value = false
  editingId.value = null
  formData.value = {
    setor_id: '',
    nome: '',
    descricao: '',
    url: '',
    contatos: []
  }
}

// Função para editar sistema
const editSistema = (sistema) => {
  editingId.value = sistema.id
  formData.value = {
    setor_id: sistema.setor_id,
    nome: sistema.nome,
    descricao: sistema.descricao,
    url: sistema.url,
    contatos: sistema.sistema_contatos || []
  }
  showModal.value = true
}

// Função para deletar sistema
const deleteSistema = (sistema) => {
  showConfirmDialog({
    title: 'Confirmar Exclusão',
    message: `Deseja realmente excluir o sistema ${sistema.nome}?`,
    warning: 'Esta ação não poderá ser desfeita!',
    confirmText: 'Excluir',
    onConfirm: async () => {
      try {
        const { error } = await supabase
          .from('sistemas')
          .delete()
          .eq('id', sistema.id)

        if (error) throw error

        await loadSistemas()
        showToast('Sistema excluído com sucesso!')
        confirmDialog.value.show = false
      } catch (error) {
        console.error('Erro ao excluir sistema:', error)
        showToast('Erro ao excluir sistema', 'error')
      }
    }
  })
}

// Função para inativar sistema
const inativarSistema = (sistema) => {
  if (!isAdmin.value) {
    showToast('Apenas administradores podem inativar sistemas', 'error')
    return
  }

  showConfirmDialog({
    title: 'Confirmar Inativação',
    message: `Deseja realmente inativar o sistema ${sistema.nome}?`,
    warning: 'O sistema ficará indisponível para novas operações!',
    confirmText: 'Inativar',
    onConfirm: async () => {
      try {
        const { error } = await supabase
          .from('sistemas')
          .update({
            status: 'INACTIVE',
            updated_at: new Date().toISOString()
          })
          .eq('id', sistema.id)

        if (error) throw error

        await loadSistemas()
        showToast('Sistema inativado com sucesso!')
        confirmDialog.value.show = false
      } catch (error) {
        console.error('Erro ao inativar sistema:', error)
        showToast('Erro ao inativar sistema', 'error')
      }
    }
  })
}

// Função para ativar sistema
const ativarSistema = (sistema) => {
  if (!isAdmin.value) {
    showToast('Apenas administradores podem ativar sistemas', 'error')
    return
  }

  showConfirmDialog({
    title: 'Confirmar Ativação',
    message: `Deseja realmente ativar o sistema ${sistema.nome}?`,
    warning: 'O sistema voltará a ficar disponível para operações!',
    confirmText: 'Ativar',
    onConfirm: async () => {
      try {
        const { error } = await supabase
          .from('sistemas')
          .update({
            status: 'ACTIVE',
            updated_at: new Date().toISOString()
          })
          .eq('id', sistema.id)

        if (error) throw error

        await loadSistemas()
        showToast('Sistema ativado com sucesso!')
        confirmDialog.value.show = false
      } catch (error) {
        console.error('Erro ao ativar sistema:', error)
        showToast('Erro ao ativar sistema', 'error')
      }
    }
  })
}

// Função atualizada para salvar
const handleSubmit = async () => {
  try {
    loading.value = true
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    // Dados do sistema
    const sistemaData = {
      setor_id: formData.value.setor_id,
      nome: formData.value.nome,
      descricao: formData.value.descricao,
      url: formData.value.url,
      created_by: user.id,
      status: 'ACTIVE'
    }

    let sistema
    if (editingId.value) {
      const { data, error } = await supabase
        .from('sistemas')
        .update({
          ...sistemaData,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingId.value)
        .select()
        .single()

      if (error) throw error
      sistema = data
    } else {
      const { data, error } = await supabase
        .from('sistemas')
        .insert(sistemaData)
        .select()
        .single()

      if (error) throw error
      sistema = data
    }

    // Atualiza contatos
    if (formData.value.contatos?.length > 0) {
      if (editingId.value) {
        // Remove contatos antigos
        await supabase
          .from('sistema_contatos')
          .delete()
          .eq('sistema_id', editingId.value)
      }

      // Insere novos contatos
      const { error: contatosError } = await supabase
        .from('sistema_contatos')
        .insert(
          formData.value.contatos.map(c => ({
            sistema_id: sistema.id,
            nome: c.nome,
            telefone: c.telefone
          }))
        )

      if (contatosError) throw contatosError
    }

    await loadSistemas()
    closeModal()
    showToast(editingId.value ? 'Sistema atualizado com sucesso!' : 'Sistema criado com sucesso!')

  } catch (error) {
    console.error('Erro ao salvar sistema:', error)
    showToast(`Erro ao salvar sistema: ${error.message}`, 'error')
  } finally {
    loading.value = false
  }
}

// Função para mostrar toast
const showToast = (message, type = 'success') => {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, 3000)
}

// Função para mostrar diálogo de confirmação
const showConfirmDialog = (config) => {
  confirmDialog.value = {
    show: true,
    ...config
  }
}

// Função para verificar permissão de admin
const checkAdminStatus = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    isAdmin.value = profile?.role === 'admin'
    return isAdmin.value
  } catch (error) {
    console.error('Erro ao verificar status admin:', error)
    return false
  }
}
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  padding: 2rem;
  transition: all 0.3s ease;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

.header h1 {
  color: #193155;
  font-size: 1.8rem;
  font-weight: 600;
}

.table-container {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
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
  border-bottom: 1px solid #e5e7eb;
}

th {
  background: #f8f9fa;
  font-weight: 600;
  text-align: left;
  color: #193155;
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
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-add:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(25, 49, 85, 0.2);
}

.status-badge {
  transition: all 0.3s ease;
  padding: 0.25rem 0.75rem;
  border-radius: 50px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-badge.active {
  background: #dcfce7;
  color: #166534;
}

.status-badge.inactive {
  background: #fee2e2;
  color: #991b1b;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.btn-icon {
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

.btn-icon.edit {
  background: #e9ecef;
}

.btn-icon.delete {
  background: #fee2e2;
}

.btn-icon:hover {
  transform: translateY(-2px);
}

.contatos-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.contato-item {
  font-size: 0.875rem;
  color: #4b5563;
}

/* Layout principal */
.layout {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
}

.main-content {
  flex: 1;
  padding: 2rem;
  transition: all 0.3s ease;
}

/* Cabeçalho */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

.header h1 {
  color: #193155;
  font-size: 1.8rem;
  font-weight: 600;
}

/* Botão Adicionar */
.btn-add {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
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
  box-shadow: 0 4px 6px rgba(25, 49, 85, 0.2);
}

.icon-add {
  width: 20px;
  height: 20px;
  filter: brightness(0) invert(1);
}

/* Tabela de Sistemas */
.table-container {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: auto;
}

.excel-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.excel-table th {
  background: #f8f9fa;
  padding: 1rem;
  font-weight: 600;
  color: #193155;
  border: 1px solid #e9ecef;
  text-align: left;
  position: sticky;
  top: 0;
  z-index: 10;
}

.excel-table td {
  padding: 1rem;
  border: 1px solid #e9ecef;
  vertical-align: middle;
}

/* Status badges */
.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 50px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-badge.active {
  background: #dcfce7;
  color: #166534;
}

.status-badge.inactive {
  background: #fee2e2;
  color: #991b1b;
}

/* Botões de ação */
.action-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.btn-icon {
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

.btn-icon.edit {
  background: #e9ecef;
}

.btn-icon.edit:hover {
  background: #dee2e6;
  transform: translateY(-2px);
}

.btn-icon.delete {
  background: #f77777;
}

.btn-icon.delete:hover {
  background: #fecaca;
  transform: translateY(-2px);
}

.icon {
  width: 16px;
  height: 16px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  width: 95%;
  max-width: 800px;
  /* Aumentado para acomodar 2 colunas */
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

/* Título do modal */
.modal-content h2 {
  color: #193155;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

/* Grid de 2 colunas */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  /* 2 colunas */
  gap: 1.5rem;
}

/* Campos que ocupam largura total */
.form-group.full-width,
.contatos-section,
.modal-actions {
  grid-column: 1 / -1;
}

/* Seção de contatos */
.contatos-section {
  margin-top: 1rem;
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.contatos-section h3 {
  color: #193155;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

/* Botão adicionar contato */
.btn-add-contato {
  width: 100%;
  padding: 0.75rem;
  background: #e5e7eb;
  color: #4b5563;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-add-contato:hover {
  background: #d1d5db;
  transform: translateY(-1px);
}

/* Ajustes de responsividade */
@media (max-width: 768px) {
  .modal-content {
    padding: 1.5rem;
    margin: 1rem;
    width: calc(100% - 2rem);
  }

  .form-grid {
    grid-template-columns: 1fr;
    /* Uma coluna em telas menores */
  }
}

/* Novo estilo para o container do setor */
.setor-container {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.setor-container select {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #1f2937;
}

.btn-add-setor {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  background: #193155;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-add-setor:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(25, 49, 85, 0.2);
}

.btn-add-setor-small {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #193155;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 0.5rem;
  vertical-align: middle;
  transition: all 0.3s ease;
}

.btn-add-setor-small:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(25, 49, 85, 0.2);
}

.icon-add {
  width: 20px;
  height: 20px;
  filter: brightness(0) invert(1);
}

.icon-add-small {
  width: 14px;
  height: 14px;
  filter: brightness(0) invert(1);
}

/* Modal Actions */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel {
  padding: 0.75rem 1.5rem;
  background: #e5e7eb;
  color: #4b5563;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-save {
  padding: 0.75rem 1.5rem;
  background: #193155;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-save:hover,
.btn-cancel:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Modal de Setor */
.setor-modal {
  max-width: 400px;
  /* Menor que o modal padrão */
}

.setor-modal .form-group {
  margin-bottom: 1.5rem;
}

.setor-modal input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
}

.setor-modal input:focus {
  outline: none;
  border-color: #193155;
  box-shadow: 0 0 0 3px rgba(25, 49, 85, 0.1);
}

/* Responsividade */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 1rem;
  }

  .btn-add {
    width: 100%;
  }

  .modal-content {
    margin: 1rem;
    padding: 1.5rem;
  }
}

/* Adicione ao final do seu <style> */

/* Toast */
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
}

.toast {
  padding: 1rem 1.5rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  animation: slideIn 0.3s ease;
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

/* Dialog de confirmação */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.confirm-dialog {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
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

.warning-text {
  color: #DC2626;
  margin: 1rem 0;
  font-size: 0.9rem;
}

.confirm-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
}

/* Animações */
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

/* Estilos base para inputs, selects e textareas */
.form-group input,
.form-group select,
.form-group textarea,
.contato-form input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #1f2937;
  background: #f8f9fa;
  transition: all 0.2s ease;
}

/* Estilo de foco comum */
.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus,
.contato-form input:focus {
  outline: none;
  border-color: #193155;
  box-shadow: 0 0 0 3px rgba(25, 49, 85, 0.1);
  background: white;
}

/* Estilo hover */
.form-group input:hover,
.form-group select:hover,
.form-group textarea:hover,
.contato-form input:hover {
  border-color: #d1d5db;
}

/* Labels */
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #374151;
  font-weight: 500;
  font-size: 0.875rem;
}

/* Ajustes no formulário de contatos */
.contato-form {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 1rem;
  margin-bottom: 1rem;
  align-items: center;
}

/* Botão remover contato */
.btn-remove {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fee2e2;
  border: none;
  border-radius: 8px;
  color: #dc2626;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-remove:hover {
  background: #fecaca;
  transform: translateY(-1px);
}

/* Seção de contatos melhorada */
.contatos-section {
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 1.5rem;
}

.contatos-section h3 {
  color: #1f2937;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
}

/* Botão adicionar contato melhorado */
.btn-add-contato {
  width: 100%;
  padding: 0.75rem;
  background: #f3f4f6;
  color: #374151;
  border: 2px dashed #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-add-contato:hover {
  background: #e5e7eb;
  transform: translateY(-1px);
}

/* Modal content refinado */
.modal-content {
  max-height: 90vh;
  overflow-y: auto;
  padding: 2rem;
}

.modal-content h2 {
  position: sticky;
  top: 0;
  background: white;
  padding: 1rem 0;
  margin: -2rem -2rem 2rem -2rem;
  padding: 2rem;
  border-bottom: 1px solid #e5e7eb;
  z-index: 10;
}

/* Scrollbar personalizada para o modal */
.modal-content::-webkit-scrollbar {
  width: 8px;
}

.modal-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 8px;
}

.modal-content::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 8px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* Modal actions fixo */
.modal-actions {
  position: sticky;
  bottom: -2rem;
  background: white;
  padding: 1rem 0;
  margin: 1rem -2rem -2rem -2rem;
  padding: 1.5rem 2rem;
  border-top: 1px solid #e5e7eb;
  z-index: 10;
}

/* Adicione aos seus estilos */
.btn-icon.enable {
  background: #dcfce7;
}

.btn-icon.enable:hover {
  background: #bbf7d0;
  transform: translateY(-2px);
}

/* Ajuste o estilo existente do botão delete se necessário */
.btn-icon.delete {
  background: #fee2e2;
}

.btn-icon.delete:hover {
  background: #fecaca;
  transform: translateY(-2px);
}

/* Estilos base para todos os botões */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

/* Botão primário (azul) */
.btn-primary,
.btn-save,
.btn-add,
.btn-add-setor {
  background: #193155;
  color: white;
}

.btn-primary:hover,
.btn-save:hover,
.btn-add:hover,
.btn-add-setor:hover {
  background: #254677;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(25, 49, 85, 0.2);
}

/* Botão secundário (cinza) */
.btn-secondary,
.btn-cancel,
.btn-add-contato {
  background: #f3f4f6;
  color: #4b5563;
  border: 1px solid #e5e7eb;
}

.btn-secondary:hover,
.btn-cancel:hover,
.btn-add-contato:hover {
  background: #e5e7eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Botões de ação (ícones) */
.btn-icon {
  width: 36px;
  height: 36px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.3s ease;
}

/* Botão editar */
.btn-icon.edit {
  background: #e9ecef;
  border: 1px solid #dee2e6;
}

.btn-icon.edit:hover {
  background: #dee2e6;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Botão excluir/inativar */
.btn-icon.delete {
  background: #fee2e2;
  border: 1px solid #fecaca;
}

.btn-icon.delete:hover {
  background: #fecaca;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(220, 38, 38, 0.15);
}

/* Botão ativar */
.btn-icon.enable {
  background: #dcfce7;
  border: 1px solid #bbf7d0;
}

.btn-icon.enable:hover {
  background: #bbf7d0;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(22, 163, 74, 0.15);
}

/* Botão confirmar em modals */
.btn-confirm {
  background: #193155;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
}

.btn-confirm:hover {
  background: #254677;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(25, 49, 85, 0.2);
}

/* Botão adicionar contato */
.btn-add-contato {
  width: 100%;
  padding: 0.75rem;
  border: 2px dashed #e5e7eb;
  font-weight: 500;
  background: #f8fafc;
}

/* Ícones dentro dos botões */
.icon {
  width: 18px;
  height: 18px;
}

.icon-add {
  width: 20px;
  height: 20px;
  filter: brightness(0) invert(1);
}

/* Estado desabilitado */
.btn:disabled,
.btn-icon:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  pointer-events: none;
}

/* Adicione ao seu <style> */
.action-buttons {
  position: relative;
}

.action-buttons:not(.is-admin) .btn-icon.delete,
.action-buttons:not(.is-admin) .btn-icon.enable {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-buttons:not(.is-admin):hover::after {
  display: block;
}

/* Remova os estilos anteriores de .action-buttons:not(.is-admin) e adicione estes: */

/* Estilo para o botão de ativar/inativar */
.btn-icon.enable,
.btn-icon.delete {
  position: relative;
}

/* Quando não for admin e passar o mouse sobre o botão */
:not(.admin) .btn-icon.enable:hover::after,
:not(.admin) .btn-icon.delete:hover::after {
  content: 'Acesso restrito';
  position: absolute;
  bottom: -25px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.75rem;
  color: #dc2626;
  white-space: nowrap;
  background: white;
  padding: 4px 8px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 10;
}
</style>