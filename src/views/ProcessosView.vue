<template>
  <div class="layout">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />
    
    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <div class="header">
        <h1>Processos Licitatórios</h1>
        
        <div class="actions">
          <button class="btn-export" @click="exportToExcel">
            <!-- <img src="/icons/excel.svg" alt="Exportar" class="icon" /> -->
            Exportar
          </button>
          <button class="btn-add" @click="handleNewProcess">
            <!-- <img src="/icons/adicao.svg" alt="Novo" class="icon" /> -->
            Novo Processo
          </button>
        </div>
      </div>

      <div class="filtros-ativos" v-if="temFiltrosAtivos">
        <span>Filtros ativos:</span>
        <button @click="limparFiltros" class="btn-limpar-filtros">
          Limpar todos os filtros
        </button>
      </div>

      <div class="table-container">
        <table class="excel-table resizable">
          <thead>
            <tr>
              <th v-for="(coluna, index) in colunas" 
                  :key="index"
                  class="resizable-column"
                  :style="{ width: colunasWidth[coluna.campo] }">
                <div class="th-content">
                  {{ coluna.titulo }}
                  <div class="filtro-container">
                    <button @click="toggleFiltro(coluna.campo)" class="btn-filtro">
                      <span>🔍</span>
                    </button>
                    <div v-if="mostrarFiltro[coluna.campo]" class="filtro-dropdown">
                      <div class="filtro-opcoes">
                        <label v-for="opcao in opcoesUnicas(coluna.campo)" :key="opcao">
                          <input
                            type="checkbox"
                            :value="opcao"
                            v-model="filtros[coluna.campo]"
                          >
                          {{ opcao }}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- Handle para redimensionar coluna -->
                <div class="column-resize-handle"
                     @mousedown.stop="startColumnResize($event, coluna.campo)"></div>
              </th>
              <th class="actions-column">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="processo in processosFiltrados" 
                :key="processo.id"
                class="resizable-row"
                :style="{ height: rowsHeight[processo.id] }">
              <!-- Cada célula segue o mesmo padrão -->
              <td v-for="coluna in colunas" 
                  :key="coluna.campo"
                  @dblclick="handleDblClick(coluna.campo, processo, $event)">
                <template v-if="editingCell.id === processo.id && editingCell.field === coluna.campo">
                  <!-- Input específico baseado no tipo de campo -->
                  <input v-if="coluna.campo === 'data_pregao'"
                    ref="editInput"
                    type="date"
                    v-model="editingCell.value"
                    @blur="handleUpdate(processo)"
                    @keyup.enter="handleUpdate(processo)"
                    @keyup.esc="cancelEdit()"
                  >
                  <input v-else-if="coluna.campo === 'hora_pregao'"
                    type="time"
                    v-model="editingCell.value"
                    @blur="handleUpdate(processo)"
                    @keyup.enter="handleUpdate(processo)"
                    @keyup.esc="cancelEdit()"
                  >
                  <select v-else-if="coluna.campo === 'estado'"
                    v-model="editingCell.value"
                    @change="handleUpdate(processo)"
                    @blur="handleUpdate(processo)"
                    @keyup.esc="cancelEdit()"
                  >
                    <option value="">Selecione o estado...</option>
                    <option v-for="estado in estados" 
                            :key="estado.uf" 
                            :value="estado.uf">
                      {{ estado.nome }}
                    </option>
                  </select>
                  <select v-else-if="coluna.campo === 'representante'"
                    v-model="editingCell.value"
                    @change="handleUpdate(processo)"
                    @blur="handleUpdate(processo)"
                    @keyup.esc="cancelEdit()"
                  >
                    <option value="">Selecione o representante...</option>
                    <option v-for="rep in representantes" 
                            :key="rep.id" 
                            :value="rep.id">
                      {{ rep.nome }}
                    </option>
                  </select>
                  <textarea v-else-if="coluna.campo === 'objeto_completo'"
                    v-model="editingCell.value"
                    @blur="handleUpdate(processo)"
                    @keyup.enter="handleUpdate(processo)"
                    @keyup.esc="cancelEdit()"
                    rows="3"
                  ></textarea>
                  <select v-else-if="coluna.campo === 'modalidade'"
                    v-model="editingCell.value"
                    @blur="handleUpdate(processo)"
                    @change="handleUpdate(processo)"
                    @keyup.esc="cancelEdit()"
                  >
                    <option value="pregao">Pregão</option>
                    <option value="concorrencia">Concorrência</option>
                    <option value="concurso">Concurso</option>
                    <option value="leilao">Leilão</option>
                    <option value="dialogo_competitivo">Diálogo Competitivo</option>
                  </select>
                  <input v-else
                    type="text"
                    v-model="editingCell.value"
                    @blur="handleUpdate(processo)"
                    @keyup.enter="handleUpdate(processo)"
                    @keyup.esc="cancelEdit()"
                  >
                </template>
                <template v-else>
                  <span v-if="coluna.campo === 'data_pregao'">
                    {{ formatDate(processo[coluna.campo]) }}
                  </span>
                  <span v-else-if="coluna.campo === 'hora_pregao'">
                    {{ formatTime(processo[coluna.campo]) }}
                  </span>
                  <span v-else-if="coluna.campo === 'modalidade'" :class="['modalidade', processo[coluna.campo]]">
                    {{ formatModalidade(processo[coluna.campo], processo.tipo_pregao) }}
                  </span>
                  <span v-else-if="coluna.campo === 'objeto_resumido' || coluna.campo === 'objeto_completo'" class="objeto-cell">
                    {{ processo[coluna.campo] || '-' }}
                  </span>
                  <span v-else-if="coluna.campo === 'representante'">
                    {{ processo.representantes?.nome || '-' }}
                  </span>
                  <span v-else-if="coluna.campo === 'responsavel_nome'">
                    {{ processo.profiles?.nome || '-' }}
                  </span>
                  <span v-else-if="coluna.campo === 'site_pregao'" class="portal-link">
                    <a v-if="processo.site_pregao" 
                       :href="processo.site_pregao" 
                       target="_blank"
                       rel="noopener noreferrer">
                      {{ getPortalName(processo.site_pregao) }}
                    </a>
                    <span v-else>-</span>
                  </span>
                  <span v-else>
                    {{ processo[coluna.campo] || '-' }}
                  </span>
                </template>
              </td>
              <!-- Coluna de ações -->
              <td class="actions-cell">
                <button class="btn-icon" @click="editProcess(processo)">Editar</button>
                <button class="btn-icon" @click="viewDetails(processo)">Ver</button>
                <button class="btn-icon delete" @click="deleteProcess(processo)">Excluir</button>
              </td>
              <!-- Handle para redimensionar linha -->
              <div class="row-resize-handle"
                   @mousedown.stop="startRowResize($event, processo.id)"></div>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Adicione este componente para o balão de confirmação -->
      <div v-if="confirmDialog.show" class="confirm-dialog" :style="confirmDialog.position">
        <div class="confirm-content">
          <p>Deseja editar este campo?</p>
          <div class="confirm-actions">
            <button @click="handleConfirmEdit" class="btn-confirm">Confirmar</button>
            <button @click="hideConfirmDialog" class="btn-cancel">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import TheSidebar from '@/components/TheSidebar.vue'
import * as XLSX from 'xlsx'
import { writeFileXLSX, utils } from 'xlsx'

const router = useRouter()
const isSidebarExpanded = ref(true)
const processos = ref([])
const loading = ref(false)

// Definição das colunas
const colunas = [
  { titulo: 'Data do Pregão', campo: 'data_pregao' },
  { titulo: 'Hora do Pregão', campo: 'hora_pregao' },
  { titulo: 'Estado', campo: 'estado' },
  { titulo: 'Número do Processo', campo: 'numero_processo' },
  { titulo: 'Ano', campo: 'ano' },
  { titulo: 'Órgão', campo: 'orgao' },
  { titulo: 'Status', campo: 'status' },
  { titulo: 'Modalidade/Tipo', campo: 'modalidade' }, 
  { titulo: 'Objeto Resumido', campo: 'objeto_resumido' },
  { titulo: 'Responsável', campo: 'responsavel_nome' },
  { titulo: 'Objeto Completo', campo: 'objeto_completo' },
  { titulo: 'Portal', campo: 'site_pregao' },
  { titulo: 'Representante', campo: 'representante' },
  { titulo: 'Campo Adicional 1', campo: 'campo_adicional1' },
  { titulo: 'Campo Adicional 2', campo: 'campo_adicional2' }
]

// Inicialização dos filtros com todas as colunas
const initializeFiltros = () => {
  const filtrosIniciais = {}
  colunas.forEach(coluna => {
    filtrosIniciais[coluna.campo] = []
  })
  return filtrosIniciais
}

// Use a função para inicializar os filtros
const filtros = ref(initializeFiltros())

// Processos filtrados com todos os filtros
const processosFiltrados = computed(() => {
  if (!processos.value) return []
  
  return processos.value.filter(processo => {
    return colunas.every(coluna => {
      if (!filtros.value[coluna.campo] || filtros.value[coluna.campo].length === 0) {
        return true
      }
      
      let valorProcesso = processo[coluna.campo]
      if (!valorProcesso) return false
      
      if (coluna.campo === 'data_pregao') {
        valorProcesso = formatDate(valorProcesso)
      } else if (coluna.campo === 'hora_pregao') {
        valorProcesso = formatTime(valorProcesso)
      } else if (coluna.campo === 'modalidade') {
        valorProcesso = formatModalidade(valorProcesso, processo.tipo_pregao)
      } else if (coluna.campo === 'representante') {
        valorProcesso = processo.representantes?.nome || '-'
      }
      
      return filtros.value[coluna.campo].includes(valorProcesso)
    })
  })
})

const handleSidebarToggle = (expanded) => {
  isSidebarExpanded.value = expanded
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  // Adiciona horário meio-dia para evitar problemas de timezone
  const date = new Date(dateString + 'T12:00:00')
  return date.toLocaleDateString('pt-BR')
}

const formatTime = (time) => {
  if (!time) return '-'
  // Pega apenas as horas e minutos da string de tempo
  const [hours, minutes] = time.split(':')
  return `${hours}:${minutes}`
}

const formatModalidade = (modalidade, tipo_pregao) => {
  const modalidades = {
    'pregao': 'Pregão',
    'concorrencia': 'Concorrência',
    'concurso': 'Concurso',
    'leilao': 'Leilão',
    'dialogo_competitivo': 'Diálogo Competitivo'
  }
  
  const tipoFormatado = tipo_pregao ? 
    (tipo_pregao === 'eletronico' ? 'Eletrônico' : 'Presencial') : 
    ''
  
  return `${modalidades[modalidade] || modalidade}${tipoFormatado ? ` - ${tipoFormatado}` : ''}`
}

const formatStatus = (status) => {
  const statusMap = {
    'em_analise': 'Em Análise',
    'em_andamento': 'Em Andamento',
    'concluido': 'Concluído',
    'cancelado': 'Cancelado'
  }
  return statusMap[status] || status
}

const loadProcessos = async () => {
  try {
    loading.value = true
    const { data, error } = await supabase
      .from('processos')
      .select(`
        *,
        representantes!processos_representante_fkey (
          id, 
          nome
        )
      `)
      .order('data_pregao', { ascending: true })
      .order('hora_pregao', { ascending: true })

    if (error) throw error
    
    processos.value = data?.map(processo => ({
      ...processo,
      responsavel_nome: '-', // Por enquanto, deixamos fixo
      representante: processo.representantes?.nome || '-',
      campo_adicional1: processo.campo_adicional1 || '-',
      campo_adicional2: processo.campo_adicional2 || '-'
    })) || []
    
  } catch (error) {
    console.error('Erro ao carregar processos:', error)
    alert('Erro ao carregar dados') 
    processos.value = []
  } finally {
    loading.value = false
  }
}

const handleNewProcess = () => {
  router.push('/editais/novo')
}

const editProcess = (processo) => {
  router.push(`/editais/${processo.id}/edit`)
}

const viewDetails = (processo) => {
  router.push(`/editais/${processo.id}`)
}

const deleteProcess = async (processo) => {
  if (!confirm('Tem certeza que deseja excluir este processo?')) return

  try {
    const { error } = await supabase
      .from('processos')
      .delete()
      .eq('id', processo.id)

    if (error) throw error
    await loadProcessos()
  } catch (error) {
    console.error('Erro ao excluir:', error)
    alert('Erro ao excluir processo')
  }
}

const exportToExcel = () => {
  const dataToExport = processos.value.map(processo => ({
    'Número do Processo': processo.numero_processo,
    'Ano': processo.ano,
    'Órgão': processo.orgao,
    'Data do Pregão': formatDate(processo.data_pregao),
    'Modalidade': formatModalidade(processo.modalidade),
    'Tipo': processo.tipo_pregao || '-',
    'Site': processo.site_pregao || '-',
    'Objeto Resumido': processo.objeto_resumido,
    'Status': formatStatus(processo.status)
  }))

  const ws = utils.json_to_sheet(dataToExport)
  const wb = utils.book_new()
  utils.book_append_sheet(wb, ws, 'Processos')
  writeFileXLSX(wb, 'processos_licitatorios.xlsx')
}

const mostrarFiltro = ref({})

const toggleFiltro = (coluna) => {
  mostrarFiltro.value[coluna] = !mostrarFiltro.value[coluna]
}

// Função para obter opções únicas para cada coluna
const opcoesUnicas = (coluna) => {
  const opcoes = new Set()
  processos.value.forEach(processo => {
    let valor = processo[coluna]
    
    // Formatação especial para alguns campos
    if (coluna === 'data_pregao') {
      valor = formatDate(valor)
    } else if (coluna === 'hora_pregao') {
      valor = formatTime(valor)
    } else if (coluna === 'modalidade') {
      valor = formatModalidade(valor)
    }
    
    if (valor) opcoes.add(valor)
  })
  return Array.from(opcoes).sort()
}

const temFiltrosAtivos = computed(() => {
  return Object.values(filtros.value).some(f => f.length > 0)
})

const limparFiltros = () => {
  Object.keys(filtros.value).forEach(key => {
    filtros.value[key] = []
  })
}

// Fechar filtros quando clicar fora
onMounted(() => {
  document.addEventListener('click', (e) => {
    const isFilterClick = e.target.closest('.filtro-container')
    if (!isFilterClick) {
      Object.keys(mostrarFiltro.value).forEach(key => {
        mostrarFiltro.value[key] = false
      })
    }
  })
})

onMounted(() => {
  loadProcessos()
})

// Estado para larguras das colunas e alturas das linhas
const STORAGE_KEY = 'table-columns-width'
const colunasWidth = ref({})

// Funções para redimensionamento
const startColumnResize = (event, campo) => {
  event.preventDefault()
  const th = event.target.closest('th')
  const startWidth = th.offsetWidth
  const startX = event.pageX
  
  const handleMouseMove = (e) => {
    const dx = e.pageX - startX
    const newWidth = Math.max(100, startWidth + dx)
    colunasWidth.value[campo] = `${newWidth}px`
    th.style.width = `${newWidth}px`
    document.body.style.cursor = 'col-resize'
  }

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = ''
    // Salva as configurações quando terminar o redimensionamento
    saveColumnWidths()
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

// Função para carregar as larguras salvas
const loadColumnWidths = () => {
  try {
    const savedWidths = localStorage.getItem(STORAGE_KEY)
    if (savedWidths) {
      colunasWidth.value = JSON.parse(savedWidths)
    } else {
      // Larguras padrão se não houver configuração salva
      colunas.forEach(coluna => {
        colunasWidth.value[coluna.campo] = '150px'
      })
    }
  } catch (error) {
    console.error('Erro ao carregar larguras das colunas:', error)
  }
}

// Função para salvar as larguras
const saveColumnWidths = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colunasWidth.value))
  } catch (error) {
    console.error('Erro ao salvar larguras das colunas:', error)
  }
}

// Estado para alturas das linhas
const rowsHeight = ref({})

// Funções para redimensionamento
const startRowResize = (event, id) => {
  event.preventDefault()
  const tr = event.target.closest('tr')
  const startHeight = tr.offsetHeight
  const startY = event.pageY

  const handleMouseMove = (e) => {
    const dy = e.pageY - startY
    const newHeight = Math.max(40, startHeight + dy)
    rowsHeight.value[id] = `${newHeight}px`
    tr.style.height = `${newHeight}px`
    document.body.style.cursor = 'row-resize'
  }

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = ''
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

// Estado para controlar a edição
const editingCell = ref({
  id: null,
  field: null,
  value: null
})

// Função para lidar com duplo clique ajustada
const handleDblClick = async (field, processo, event) => {
  // Se já estiver editando esta célula, não faz nada
  if (editingCell.value.id === processo.id && editingCell.value.field === field) {
    return
  }

  // Posiciona o balão próximo ao elemento clicado
  const rect = event.target.getBoundingClientRect()
  
  confirmDialog.value = {
    show: true,
    position: {
      top: `${rect.bottom + window.scrollY + 10}px`,
      left: `${rect.left + window.scrollX}px`
    },
    callback: () => {
      editingCell.value = {
        id: processo.id,
        field,
        value: processo[field]
      }

      // Foca no input após a renderização
      nextTick(() => {
        const input = event.target.querySelector('input, textarea, select')
        if (input) {
          input.focus()
          // Se for input de texto, posiciona o cursor no final
          if (input.type === 'text') {
            input.selectionStart = input.selectionEnd = input.value.length
          }
        }
      })
    }
  }
}

// Funções para o diálogo de confirmação
const handleConfirmEdit = () => {
  confirmDialog.value.callback?.()
  hideConfirmDialog()
  
  // Foca no input após fechar o diálogo
  nextTick(() => {
    const input = document.querySelector('.editing-cell input, .editing-cell textarea, .editing-cell select')
    if (input) {
      input.focus()
      // Se for input de texto, posiciona o cursor no final
      if (input.type === 'text') {
        input.selectionStart = input.selectionEnd = input.value.length
      }
    }
  })
}

const hideConfirmDialog = () => {
  confirmDialog.value = {
    show: false,
    position: {},
    callback: null
  }
}

// Função para atualizar o registro
const handleUpdate = async (processo) => {
  try {
    if (!editingCell.value.value) return cancelEdit()

    // Validações específicas por campo
    if (editingCell.value.field === 'estado') {
      if (editingCell.value.value.length !== 2) {
        alert('O estado deve ter 2 caracteres')
        return cancelEdit()
      }
      editingCell.value.value = editingCell.value.value.toUpperCase()
    }

    const updateData = {
      [editingCell.value.field]: editingCell.value.value,
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('processos')
      .update(updateData)
      .eq('id', processo.id)

    if (error) throw error

    // Atualiza localmente
    const index = processos.value.findIndex(p => p.id === processo.id)
    if (index !== -1) {
      processos.value[index] = {
        ...processos.value[index],
        ...updateData
      }
    }

    cancelEdit()
    await loadProcessos() // Recarrega os dados para garantir consistência
  } catch (error) {
    console.error('Erro ao atualizar:', error)
    alert(`Erro ao atualizar o registro: ${error.message}`)
    cancelEdit()
  }
}

// Função para cancelar edição
const cancelEdit = () => {
  editingCell.value = {
    id: null,
    field: null,
    value: null
  }
}

// Adicione esta definição logo após os outros refs
const confirmDialog = ref({
  show: false,
  position: {},
  callback: null
})

const checkAdminStatus = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Erro ao verificar perfil:', error)
        return
      }

      isAdmin.value = profile?.role === 'admin'
    }
  } catch (error) {
    console.error('Erro ao verificar status de admin:', error)
  }
}

// Inicialize as larguras padrão das colunas
onMounted(async () => {
  await loadProcessos()
  await loadRepresentantes()
  loadColumnWidths()
})

// Adicione no início do script junto com outros refs
const estados = ref([
  { uf: 'AC', nome: 'Acre' },
  { uf: 'AL', nome: 'Alagoas' },
  { uf: 'AP', nome: 'Amapá' },
  { uf: 'AM', nome: 'Amazonas' },
  { uf: 'BA', nome: 'Bahia' },
  { uf: 'CE', nome: 'Ceará' },
  { uf: 'DF', nome: 'Distrito Federal' },
  { uf: 'ES', nome: 'Espírito Santo' },
  { uf: 'GO', nome: 'Goiás' },
  { uf: 'MA', nome: 'Maranhão' },
  { uf: 'MT', nome: 'Mato Grosso' },
  { uf: 'MS', nome: 'Mato Grosso do Sul' },
  { uf: 'MG', nome: 'Minas Gerais' },
  { uf: 'PA', nome: 'Pará' },
  { uf: 'PB', nome: 'Paraíba' },
  { uf: 'PR', nome: 'Paraná' },
  { uf: 'PE', nome: 'Pernambuco' },
  { uf: 'PI', nome: 'Piauí' },
  { uf: 'RJ', nome: 'Rio de Janeiro' },
  { uf: 'RN', nome: 'Rio Grande do Norte' },
  { uf: 'RS', nome: 'Rio Grande do Sul' },
  { uf: 'RO', nome: 'Rondônia' },
  { uf: 'RR', nome: 'Roraima' },
  { uf: 'SC', nome: 'Santa Catarina' },
  { uf: 'SP', nome: 'São Paulo' },
  { uf: 'SE', nome: 'Sergipe' },
  { uf: 'TO', nome: 'Tocantins' }
])

const representantes = ref([])

// Função para carregar representantes
const loadRepresentantes = async () => {
  try {
    const { data, error } = await supabase
      .from('representantes')
      .select('*')
      .order('nome')
    
    if (error) throw error
    representantes.value = data
  } catch (error) {
    console.error('Erro ao carregar representantes:', error)
    representantes.value = []
  }
}

// Carregar representantes quando montar o componente
onMounted(() => {
  loadProcessos()
  loadRepresentantes()
})

const getPortalName = (url) => {
  if (!url) return '-'
  try {
    const hostname = new URL(url).hostname
    return hostname
      .replace('www.', '')
      .split('.')
      .slice(0, -1)
      .join('.')
      .toUpperCase()
  } catch (e) {
    return url
  }
}
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.main-content {
  margin-left: 300px;
  padding: 2rem;
  transition: margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
  background: #f8f9fa;
  height: 100vh; /* Altura total */
  overflow: hidden; /* Previne scroll duplo */
  display: flex;
  flex-direction: column;
}

.main-content.expanded {
  margin-left: 80px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-shrink: 0; /* Impede que o header encolha */
}

.header h1 {
  color: #193155;
  font-size: 1.8rem;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 1rem;
}

.btn-export, .btn-add {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.3s ease;
  font-weight: 500;
}

.btn-export {
  background: #28a745;
  color: white;
}

.btn-add {
  background: #193155;
  color: white;
}

.icon {
  width: 20px;
  height: 20px;
  filter: brightness(0) invert(1);
}

.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: auto;
  height: calc(100vh - 150px); /* Altura total da viewport menos o header */
  margin-bottom: 1rem;
  position: relative;
}

.excel-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #e9ecef;
  min-width: 1500px; /* Força uma largura mínima para garantir o scroll horizontal */
}

.excel-table th {
  background: #f8f9fa;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #193155;
  border: 1px solid #e9ecef;
  position: sticky;
  top: 0;
  z-index: 10;
}

/* Personalização da scrollbar */
.table-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.table-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.table-container::-webkit-scrollbar-thumb {
  background: #193155;
  border-radius: 4px;
}

.table-container::-webkit-scrollbar-thumb:hover {
  background: #254677;
}

.excel-table td {
  padding: 0.75rem 1rem;
  border: 1px solid #e9ecef;
  white-space: nowrap;
}

.excel-table tbody tr:hover {
  background: #f8f9fa;
}

.modalidade, .status {
  padding: 0.25rem 0.75rem;
  border-radius: 50px;
  font-size: 0.85rem;
}

.modalidade.pregao {
  background: #e3f2fd;
  color: #1976d2;
}

.status.em_analise {
  background: #fff3cd;
  color: #856404;
}

.status.em_andamento {
  background: #cce5ff;
  color: #004085;
}

.status.concluido {
  background: #d4edda;
  color: #155724;
}

.status.cancelado {
  background: #f8d7da;
  color: #721c24;
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.btn-icon {
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f8f9fa;
}

.btn-icon:hover {
  background: #e9ecef;
  transform: translateY(-2px);
}

.btn-icon.delete:hover {
  background: #dc3545;
}

.btn-icon.delete:hover img {
  filter: brightness(0) invert(1);
}

.btn-icon img {
  width: 16px;
  height: 16px;
}

.link-site {
  color: #007bff;
  text-decoration: none;
}

.link-site:hover {
  text-decoration: underline;
}

.objeto-cell {
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.filtro-container {
  position: relative;
  display: inline-block;
  margin-left: 8px;
}

.btn-filtro {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
}

.btn-filtro:hover {
  background: rgba(0,0,0,0.1);
}

.filtro-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  z-index: 1000;
  min-width: 200px;
  max-height: 300px;
  overflow-y: auto;
}

.filtro-opcoes {
  padding: 8px;
}

.filtro-opcoes label {
  display: block;
  padding: 4px 8px;
  cursor: pointer;
}

.filtro-opcoes label:hover {
  background: #f5f5f5;
}

.filtro-opcoes input[type="checkbox"] {
  margin-right: 8px;
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

  .actions {
    width: 100%;
  }

  .btn-export, .btn-add {
    flex: 1;
  }

  .table-container {
    height: calc(100vh - 200px); /* Ajuste para mobile considerando header maior */
  }
}

/* Estilos para redimensionamento */
.resizable-column {
  position: relative;
  user-select: none;
  min-width: 100px;
}

.th-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.column-resize-handle {
  position: absolute;
  right: -4px;
  top: 0;
  bottom: 0;
  width: 8px;
  background: transparent;
  cursor: col-resize;
  z-index: 20;
}

.column-resize-handle:hover,
.resizing .column-resize-handle {
  background: rgba(25, 49, 85, 0.2);
}

.resizing .column-resize-handle {
  background: rgba(25, 49, 85, 0.3);
}

/* Garante que o texto não quebre durante o redimensionamento */
.excel-table th,
.excel-table td {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Previne seleção de texto durante o redimensionamento */
.table-container {
  user-select: none;
  overflow: auto;
  position: relative;
}

.table-container.resizing * {
  cursor: col-resize;
}

/* Ajuste para o container da tabela */
.table-container {
  position: relative;
}

/* Garante que a última coluna (ações) tenha largura fixa */
.actions-column {
  width: 120px;
  min-width: 120px;
}

/* Mantém o texto alinhado durante o redimensionamento */
.excel-table td > *,
.excel-table th > * {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Estilos para células editáveis */
td {
  position: relative;
}

td input {
  width: 90%;
  height: 100%;
  padding: 0.5rem;
  border: 2px solid #193155;
  border-radius: 4px;
  font-family: inherit;
  font-size: inherit;
  background: white;
}

td input:focus {
  outline: none;
  border-color: #254677;
  box-shadow: 0 0 0 2px rgba(25, 49, 85, 0.2);
}

/* Indicador visual para células editáveis */
td:hover {
  position: relative;
}

td:hover::after {
  content: '✎';
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #6c757d;
  opacity: 0.5;
}

/* Estilos para o balão de confirmação */
.confirm-dialog {
  position: absolute;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 200px;
  animation: fadeIn 0.2s ease;
}

.confirm-dialog::before {
  content: '';
  position: absolute;
  top: -8px;
  left: 20px;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 8px solid white;
}

.confirm-content {
  text-align: center;
}

.confirm-actions {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.btn-confirm, .btn-cancel {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.3s ease;
}

.btn-confirm {
  background: #193155;
  color: white;
}

.btn-cancel {
  background: #e9ecef;
  color: #495057;
}

.btn-confirm:hover, .btn-cancel:hover {
  transform: translateY(-1px);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Estilos para redimensionamento de linhas */
.row-resize-handle {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -4px;
  height: 8px;
  background: transparent;
  cursor: row-resize;
  z-index: 20;
}

.row-resize-handle:hover,
.resizing-row .row-resize-handle {
  background: rgba(25, 49, 85, 0.2);
}

/* Ajustes na tabela */
.excel-table {
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
  position: relative;
}

.excel-table th,
.excel-table td {
  position: relative;
  border: 1px solid #e9ecef;
}

/* Indicadores visuais durante o redimensionamento */
.resizing {
  border-right: 2px solid #193155 !important;
}

.resizing-row {
  border-bottom: 2px solid #193155 !important;
}

/* Garantir que o conteúdo não interfira no redimensionamento */
.th-content,
.td-content {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Corrigir z-index para garantir que os handles fiquem visíveis */
.resizable-column {
  position: relative;
  z-index: 1;
}

.resizable-row {
  position: relative;
  z-index: 1;
  min-height: 40px;
}

/* Ajustes para campos específicos */
td textarea {
  width: 100%;
  min-height: 60px;
  resize: vertical;
  padding: 0.5rem;
  border: 2px solid #193155;
  border-radius: 4px;
  font-family: inherit;
  font-size: inherit;
}

td select {
  width: 100%;
  height: 100%;
  padding: 0.5rem;
  border: 2px solid #193155;
  border-radius: 4px;
  font-family: inherit;
  font-size: inherit;
  background: white;
  cursor: pointer;
}

td select:focus {
  outline: none;
  border-color: #254677;
  box-shadow: 0 0 0 2px rgba(25, 49, 85, 0.2);
}

/* Estilo para as opções do select */
td select option {
  padding: 0.5rem;
  font-family: inherit;
}

/* Ajuste para células com objetos longos */
.objeto-cell {
  max-width: 300px;
  white-space: normal; /* Permite quebra de linha */
  line-height: 1.4;
}

/* Estilo para célula em edição */
.editing-cell {
  background-color: rgba(25, 49, 85, 0.05);
}

/* Ajuste no input dentro da célula em edição */
.editing-cell input,
.editing-cell textarea,
.editing-cell select {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  border: 2px solid #193155;
}

.portal-link a {
  color: #007bff;
  text-decoration: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.portal-link a:hover {
  background: #e3f2fd;
  text-decoration: underline;
}

.modalidade {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
</style>