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
              <th>
                Setor
                <button class="btn-add-setor-small" @click="showSetorModal = true" title="Adicionar Setor">
                  <img src="/icons/adicao.svg" alt="Adicionar Setor" class="icon-add-small" />
                </button>
              </th>
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
                <div class="action-buttons">
                  <button class="btn-icon edit" @click="editSistema(sistema)">
                    <img src="/icons/edicao.svg" alt="Editar" class="icon" />
                  </button>
                  <button class="btn-icon delete" @click="deleteSistema(sistema.id)">
                    <img src="/icons/lixeira.svg" alt="Excluir" class="icon" />
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

            <div class="form-group">
              <label>Descrição</label>
              <textarea v-model="formData.descricao" rows="3"></textarea>
            </div>

            <div class="form-group">
              <label>URL</label>
              <input v-model="formData.url" type="url" />
            </div>

            <!-- Seção de Contatos -->
            <div class="contatos-section">
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
              <input 
                v-model="novoSetor.nome" 
                type="text" 
                required
                placeholder="Digite o nome do setor"
              />
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-cancel" @click="closeSetorModal">Cancelar</button>
              <button type="submit" class="btn-save">Salvar</button>
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

const sistemas = ref([])
const setores = ref([])
const loading = ref(false)
const showModal = ref(false)
const showSetorModal = ref(false)
const editingId = ref(null)
const isSidebarExpanded = ref(true)

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
      .order('created_at', { ascending: false })

    if (error) throw error
    sistemas.value = data
  } catch (error) {
    console.error('Erro ao carregar sistemas:', error)
    alert('Erro ao carregar dados')
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
onMounted(async () => {
  await Promise.all([
    loadSistemas(),
    loadSetores()
  ])
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
const deleteSistema = async (id) => {
  if (!confirm('Deseja realmente excluir este sistema?')) return

  try {
    const { error } = await supabase
      .from('sistemas')
      .delete()
      .eq('id', id)

    if (error) throw error

    await loadSistemas()
    alert('Sistema excluído com sucesso!')
  } catch (error) {
    console.error('Erro ao excluir sistema:', error)
    alert('Erro ao excluir sistema')
  }
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
    alert(editingId.value ? 'Sistema atualizado!' : 'Sistema criado!')

  } catch (error) {
    console.error('Erro ao salvar sistema:', error)
    alert('Erro ao salvar: ' + error.message)
  } finally {
    loading.value = false
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

th, td {
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
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  margin-bottom: 2rem;
}

.modal-header h2 {
  color: #193155;
  font-size: 1.5rem;
  font-weight: 600;
}

/* Formulário */
.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #4b5563;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #193155;
  box-shadow: 0 0 0 3px rgba(25, 49, 85, 0.1);
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
  max-width: 400px; /* Menor que o modal padrão */
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
</style>