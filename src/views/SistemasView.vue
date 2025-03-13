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

<style src="../assets/styles/SistemasView.css"></style>
