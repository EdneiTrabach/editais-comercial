<template>
  <div class="layout">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />

    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <div class="header">
        <h1>Processos Licitatórios</h1>

        <div class="actions">
          <button class="btn-export" @click="exportToExcel">
            <img src="/icons/excel.svg" alt="Exportar" class="icon" />
            Exportar
          </button>
          <button class="btn-add" @click="handleNewProcess">
            <img src="/icons/adicao.svg" alt="Adicionar" class="icon icon-add" />
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
              <th class="row-number-cell"></th> <!-- Nova coluna -->
              <th v-for="(coluna, index) in colunas" :key="index" class="resizable-column" :data-field="coluna.campo"
                :style="{ width: colunasWidth[coluna.campo] }">
                <div class="th-content">
                  {{ coluna.titulo }}

                  <!-- Botões de ordenação apenas para data do pregão -->
                  <div v-if="coluna.campo === 'data_pregao'" class="sort-buttons">
                    <button class="btn-sort"
                      :class="{ active: sortConfig.field === 'data_pregao' && sortConfig.direction === 'asc' }"
                      @click="handleSort('data_pregao', 'asc')">
                      ▲
                    </button>
                    <button class="btn-sort"
                      :class="{ active: sortConfig.field === 'data_pregao' && sortConfig.direction === 'desc' }"
                      @click="handleSort('data_pregao', 'desc')">
                      ▼
                    </button>
                  </div>

                  <!-- Filtro para outras colunas, exceto data e hora do pregão -->
                  <div v-if="coluna.campo !== 'data_pregao' && coluna.campo !== 'hora_pregao'" class="filtro-container">
                    <button @click="toggleFiltro(coluna.campo)" class="btn-filtro">
                      <img src="/icons/search-line.svg" alt="Filtrar" class="icon-filter" />
                    </button>
                    <!-- ... resto do código dos filtros ... -->
                  </div>
                </div>
                <!-- Handle para redimensionar coluna -->
                <div class="column-resize-handle" @mousedown.stop="startColumnResize($event, coluna.campo)"></div>
              </th>
              <th class="actions-column">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(processo, index) in processosFiltrados" :key="processo.id" class="resizable-row"
              :class="{ 'selected-row': selectedRow === processo.id }" @click="selectRow(processo.id)"
              :style="{ height: rowsHeight[processo.id] }">
              <td class="row-number-cell">{{ index + 1 }}</td> <!-- Nova coluna -->
              <!-- Cada célula segue o mesmo padrão -->
              <td v-for="coluna in colunas" :key="coluna.campo" :data-field="coluna.campo"
                @dblclick="handleDblClick(coluna.campo, processo, $event)">
                <template v-if="editingCell.id === processo.id && editingCell.field === coluna.campo">
                  <!-- Input específico baseado no tipo de campo -->
                  <input v-if="coluna.campo === 'data_pregao'" ref="editInput" type="date" v-model="editingCell.value"
                    :min="new Date().toISOString().split('T')[0]" @blur="handleUpdate(processo)"
                    @keyup.enter="handleUpdate(processo)" @keyup.esc="cancelEdit()">
                  <input v-else-if="coluna.campo === 'hora_pregao'" type="time" v-model="editingCell.value" min="08:00"
                    max="18:00" @blur="handleUpdate(processo)" @keyup.enter="handleUpdate(processo)"
                    @keyup.esc="cancelEdit()">
                  <select v-else-if="coluna.campo === 'estado'" v-model="editingCell.value"
                    @change="handleUpdate(processo)" @blur="handleUpdate(processo)" @keyup.esc="cancelEdit()">
                    <option value="">Selecione o estado...</option>
                    <option v-for="estado in estados" :key="estado.uf" :value="estado.uf">
                      {{ estado.nome }}
                    </option>
                  </select>
                  <select v-else-if="coluna.campo === 'representante'" v-model="editingCell.value"
                    @change="handleUpdate(processo)" @blur="handleUpdate(processo)" @keyup.esc="cancelEdit()">
                    <option value="">Selecione o representante...</option>
                    <option v-for="rep in representantes" :key="rep.id" :value="rep.id">
                      {{ rep.nome }}
                    </option>
                  </select>
                  <textarea v-else-if="coluna.campo === 'objeto_completo'" v-model="editingCell.value"
                    @blur="handleUpdate(processo)" @keyup.enter="handleUpdate(processo)" @keyup.esc="cancelEdit()"
                    rows="3"></textarea>
                  <select v-else-if="coluna.campo === 'modalidade'" v-model="editingCell.value"
                    @blur="handleUpdate(processo)" @change="handleUpdate(processo)" @keyup.esc="cancelEdit()">
                    <option value="pregao_eletronico">Pregão Eletrônico</option>
                    <option value="pregao_presencial">Pregão Presencial</option>
                    <option value="credenciamento">Credenciamento</option>
                    <option value="concorrencia">Concorrência</option>
                    <option value="concurso">Concurso</option>
                    <option value="leilao">Leilão</option>
                    <option value="dialogo_competitivo">Diálogo Competitivo</option>
                    <option value="tomada_precos">Tomada de Preços</option>
                    <option value="chamamento_publico">Chamamento Público</option>
                    <option value="rdc">RDC</option>
                    <option value="rdc_eletronico">RDC Eletrônico</option>
                    <option value="srp">SRP</option>
                    <option value="srp_eletronico">SRP Eletrônico</option>
                    <option value="srp_internacional">SRP Internacional</option>
                  </select>
                  <select v-else-if="coluna.campo === 'status'" v-model="editingCell.value"
                    @change="handleUpdate(processo)" @blur="handleUpdate(processo)" @keyup.esc="cancelEdit()"
                    class="status-select">
                    <option value="">Selecione um status...</option>
                    <option value="em_analise">Em Análise</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="ganhamos">Ganhamos</option>
                    <option value="perdemos">Perdemos</option>
                    <option value="suspenso">Suspenso</option>
                    <option value="revogado">Revogado</option>
                    <option value="adiado">Adiado</option>
                    <option value="demonstracao">Demonstração</option>
                    <option value="cancelado">Cancelado</option>
                    <option value="nao_participar">Decidido Não Participar</option>
                  </select>
                  <input v-else type="text" v-model="editingCell.value" @blur="handleUpdate(processo)"
                    @keyup.enter="handleUpdate(processo)" @keyup.esc="cancelEdit()">
                </template>
                <template v-else>
                  <span v-if="coluna.campo === 'data_pregao'">
                    {{ processo[coluna.campo] }}
                  </span>
                  <span v-else-if="coluna.campo === 'hora_pregao'">
                    {{ formatTime(processo[coluna.campo]) }}
                  </span>
                  <template v-if="coluna.campo === 'modalidade'">
                    <span :title="formatModalidadeCompleta(processo.modalidade)">
                      {{ getModalidadeSigla(processo.modalidade) }}
                    </span>
                  </template>
                  <span v-else-if="coluna.campo === 'objeto_resumido' || coluna.campo === 'objeto_completo'"
                    class="objeto-cell">
                    {{ processo[coluna.campo] || '-' }}
                  </span>
                  <span v-else-if="coluna.campo === 'representante'">
                    {{ processo.representantes?.nome || '-' }}
                  </span>
                  <span v-else-if="coluna.campo === 'responsavel_nome'">
                    {{ processo.profiles?.nome || '-' }}
                  </span>
                  <template v-else-if="coluna.campo === 'site_pregao'" class="portal-link">
                    <a v-if="processo.site_pregao" :href="processo.site_pregao" target="_blank"
                      rel="noopener noreferrer" class="portal-button">
                      {{ getPlataformaNome(processo.site_pregao) }}
                    </a>
                    <span v-else>-</span>
                  </template>
                  <span v-else-if="coluna.campo === 'status'" :class="['status', processo.status]">
                    {{ formatStatus(processo.status) }}
                  </span>
                  <span v-else>
                    {{ processo[coluna.campo] || '-' }}
                  </span>
                </template>
              </td>
              <!-- Coluna de ações -->
              <td class="actions-cell">
                <div class="action-buttons">
                  <button class="btn-icon delete" @click="handleDelete(processo)">
                    <BaseImage src="icons/lixeira.svg" alt="Excluir" class="icon icon-delete"
                      fallbackImage="icons/fallback.svg" />
                  </button>
                </div>
              </td>
              <!-- Handle para redimensionar linha -->
              <div class="row-resize-handle" @mousedown.stop="startRowResize($event, processo.id)"></div>
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

      <!-- Adicione este componente para o balão de confirmação de exclusão -->
      <div v-if="deleteConfirmDialog.show" class="modal-overlay">
        <div class="confirm-dialog">
          <div class="confirm-content">
            <h3>Confirmar Exclusão</h3>
            <p>Tem certeza que deseja excluir este processo?</p>
            <p class="warning-text">Esta ação não poderá ser desfeita!</p>
            <div class="confirm-actions">
              <button class="btn-cancel" @click="hideDeleteDialog">Cancelar</button>
              <button class="btn-confirm delete" @click="confirmDelete">
                Excluir
              </button>
            </div>
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
import { buildUrl } from '@/utils/url'
import BaseImage from '@/components/BaseImage.vue'

const router = useRouter()
const isSidebarExpanded = ref(true) // Alterado de true para false
const processos = ref([])
const loading = ref(false)

// Adicione aos refs existentes
const deleteConfirmDialog = ref({
  show: false,
  processo: null
})

// Adicione estes refs no início do script
const sortConfig = ref({
  field: 'data_pregao', // campo padrão de ordenação
  direction: 'asc' // direção padrão
})

// Adicione aos refs existentes
const selectedRow = ref(null)

// Definição das colunas
const colunas = [
  { titulo: 'Data', campo: 'data_pregao' },
  { titulo: 'Hora', campo: 'hora_pregao' },
  { titulo: 'Modalidade', campo: 'modalidade' },
  { titulo: 'Estado', campo: 'estado' },
  { titulo: 'Nº Processo', campo: 'numero_processo' },
  { titulo: 'Ano', campo: 'ano' },
  { titulo: 'Órgão', campo: 'orgao' },
  { titulo: 'Status', campo: 'status' },
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

      // Formatação específica para cada tipo de campo
      switch (coluna.campo) {
        case 'data_pregao':
          valorProcesso = formatDate(valorProcesso)
          break
        case 'hora_pregao':
          valorProcesso = formatTime(valorProcesso)
          break
        case 'modalidade':
          valorProcesso = formatModalidade(valorProcesso)
          break
      }

      return filtros.value[coluna.campo].includes(valorProcesso)
    })
  })
})

const handleSidebarToggle = (expanded) => {
  isSidebarExpanded.value = expanded
}

// Ajuste a função formatDate
const formatDate = (dateString) => {
  if (!dateString) return '-'
  try {
    return dateString
  } catch (error) {
    console.error('Erro ao formatar data:', error)
    return '-'
  }
}

// Função para formatar hora (HH:mm)
const formatTime = (time) => {
  if (!time) return '-';
  try {
    // Pega apenas HH:mm da string de hora
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  } catch (error) {
    console.error('Erro ao formatar hora:', error);
    return '-';
  }
}

const formatModalidade = (modalidade, tipo_pregao) => {
  // Mapeamento de modalidades para siglas
  const modalidades = {
    'pregao': {
      'presencial': 'PP',
      'eletronico': 'PE'
    },
    'concorrencia': 'CONC',
    'concurso': 'CNC',
    'leilao': 'LEI',
    'dialogo_competitivo': 'DC',
    'credenciamento': 'CR',
    'pre_qualificacao': 'PQ',
    'manifestacao_interesse': 'PMI',
    'licitacao_internacional': 'LI'
  }

  // Se for pregão, verifica o tipo
  if (modalidade === 'pregao' && tipo_pregao) {
    return modalidades[modalidade][tipo_pregao]
  }

  // Para outras modalidades, retorna a sigla direta
  return modalidades[modalidade] || modalidade
}

const formatModalidadeCompleta = (modalidade) => {
  const modalidades = {
    'pregao_eletronico': 'Pregão Eletrônico',
    'pregao_presencial': 'Pregão Presencial',
    'credenciamento': 'Credenciamento',
    'concorrencia': 'Concorrência',
    'concurso': 'Concurso',
    'leilao': 'Leilão',
    'dialogo_competitivo': 'Diálogo Competitivo',
    'tomada_precos': 'Tomada de Preços',
    'chamamento_publico': 'Chamamento Público',
    'rdc': 'Regime Diferenciado de Contratações',
    'rdc_eletronico': 'RDC Eletrônico',
    'srp': 'Sistema de Registro de Preços',
    'srp_eletronico': 'SRP Eletrônico',
    'srp_internacional': 'SRP Internacional'
  }

  return modalidades[modalidade] || modalidade
}

const formatStatus = (status) => {
  const statusMap = {
    'em_analise': 'Em Análise',
    'em_andamento': 'Em Andamento',
    'ganhamos': 'Ganhamos',
    'perdemos': 'Perdemos',
    'suspenso': 'Suspenso',
    'revogado': 'Revogado',
    'adiado': 'Adiado',
    'demonstracao': 'Demonstração',
    'cancelado': 'Cancelado',
    'nao_participar': 'Decidido Não Participar'
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
      .order(sortConfig.value.field, { ascending: sortConfig.value.direction === 'asc' })
      .order('hora_pregao', { ascending: true }) // ordenação secundária por hora

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
  router.push('/editais')
}

const editProcess = (processo) => {
  router.push(`/editais/${processo.id}/edit`)
}

const viewDetails = (processo) => {
  router.push(`/editais/${processo.id}`)
}

// Função para mostrar o diálogo de confirmação de exclusão
const handleDelete = (processo) => {
  deleteConfirmDialog.value = {
    show: true,
    processo
  }
}

// Função para confirmar a exclusão
const confirmDelete = async () => {
  try {
    const processo = deleteConfirmDialog.value.processo

    // Log da ação antes de excluir
    await logSystemAction({
      tipo: 'exclusao',
      tabela: 'processos',
      registro_id: processo.id,
      dados_anteriores: processo
    })

    const { error } = await supabase
      .from('processos')
      .delete()
      .eq('id', processo.id)

    if (error) throw error

    // Atualiza a lista local
    processos.value = processos.value.filter(p => p.id !== processo.id)

    hideDeleteDialog()
  } catch (error) {
    console.error('Erro ao excluir:', error)
    alert('Erro ao excluir processo')
  }
}

const hideDeleteDialog = () => {
  deleteConfirmDialog.value = {
    show: false,
    processo: null
  }
}

// Função para registrar logs
const logSystemAction = async (dados) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    const logData = {
      usuario_id: user.id,
      usuario_email: user.email,
      tipo: dados.tipo,
      tabela: dados.tabela,
      registro_id: dados.registro_id,
      dados_anteriores: dados.dados_anteriores,
      dados_novos: dados.dados_novos,
      data_hora: new Date().toISOString()
    }

    const { error } = await supabase
      .from('system_logs')
      .insert(logData)

    if (error) throw error
  } catch (error) {
    console.error('Erro ao registrar log:', error)
  }
}

const exportToExcel = () => {
  const dataToExport = processos.value.map(processo => ({
    'Data do Pregão': formatDate(processo.data_pregao),
    'Hora do Pregão': formatTime(processo.hora_pregao),
    'Número do Processo': processo.numero_processo,
    'Ano': processo.ano,
    'Órgão': processo.orgao,
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
    const newWidth = Math.max(80, startWidth + dx)
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
  if (editingCell.value.id === processo.id && editingCell.value.field === field) {
    return
  }

  const cell = event.target.closest('td')
  const rect = cell.getBoundingClientRect()

  confirmDialog.value = {
    show: true,
    position: {
      top: `${rect.bottom + 10}px`, // 20px abaixo do clique
      left: `${rect.left}px` // Alinhado com a célula
    },
    callback: () => {
      editingCell.value = {
        id: processo.id,
        field,
        value: processo[field]
      }

      nextTick(() => {
        const input = cell.querySelector('input, textarea, select')
        if (input) {
          input.focus()
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
    if (!editingCell.value.value) return cancelEdit();

    let updateValue = editingCell.value.value;

    // Formatação específica para data e hora
    if (editingCell.value.field === 'data_pregao') {
      // Garante que a data seja salva no formato YYYY-MM-DD
      const [day, month, year] = updateValue.split('/');
      updateValue = `${year}-${month}-${day}`;
    } else if (editingCell.value.field === 'hora_pregao') {
      // Garante que a hora seja salva no formato HH:mm
      updateValue = updateValue.split(':').slice(0, 2).join(':');
    }

    const updateData = {
      [editingCell.value.field]: updateValue,
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('processos')
      .update(updateData)
      .eq('id', processo.id)

    if (error) throw error;

    // Atualiza o valor localmente após sucesso
    processo[editingCell.value.field] = updateValue;

  } catch (error) {
    console.error('Erro ao atualizar:', error);
  } finally {
    cancelEdit();
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

// Script para manipular a ordenação
// Note: sortConfig já foi declarado anteriormente

// Função para ordenar
const handleSort = async (field, direction) => {
  // Se clicar no mesmo botão, mantém a ordenação atual
  if (sortConfig.value.field === field && sortConfig.value.direction === direction) {
    return
  }

  sortConfig.value = {
    field,
    direction
  }

  // Recarrega os dados com a nova ordenação
  await loadProcessos()
}

// Adicione este ref no início do script
const estadoSearch = ref('')

// Computed para filtrar estados com base na busca
const estadosFiltrados = computed(() => {
  if (!estadoSearch.value) return estados.value

  const busca = estadoSearch.value.toLowerCase()
  return estados.value.filter(estado =>
    estado.nome.toLowerCase().includes(busca) ||
    estado.uf.toLowerCase().includes(busca)
  )
})

// Adicione este ref junto com os outros
const plataformas = ref([])

// Adicione esta função para carregar as plataformas
const loadPlataformas = async () => {
  try {
    const { data, error } = await supabase
      .from('plataformas')
      .select('*')

    if (error) throw error
    plataformas.value = data
  } catch (error) {
    console.error('Erro ao carregar plataformas:', error)
  }
}

// Modifique a função onMounted para incluir o carregamento das plataformas
onMounted(() => {
  loadRepresentantes()
  loadPlataformas()
})

// Adicione esta função para obter o nome da plataforma
const getPlataformaNome = (url) => {
  if (!url) return '-'
  const plataforma = plataformas.value.find(p => p.url === url)
  return plataforma ? plataforma.nome : url
}

// Adicione este ref no início do script
const formData = ref({
  status: null // Alterado de '' para null
})

// Adicione a função para selecionar a linha
const selectRow = (id) => {
  selectedRow.value = id
}

// Adicione este ref no início do script
const showPlataformaField = computed(() => {
  return formData.value.modalidade === 'pregao_eletronico';
});

// Adicione esta função no script
const handleModalidadeChange = () => {
  // Limpa o campo de plataforma se não for pregão eletrônico
  if (formData.value.modalidade !== 'pregao_eletronico') {
    formData.value.site_pregao = '';
  }
};

// Adicione esta função no script
const handleSubmit = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    // Ajusta a data para meio-dia para evitar problemas de timezone
    const dataPregao = new Date(formData.value.data_pregao + 'T12:00:00')

    const processoData = {
      numero_processo: `${formData.value.numero}/${formData.value.ano}`,
      ano: formData.value.ano,
      orgao: formData.value.orgao,
      data_pregao: dataPregao.toISOString().split('T')[0], // Formato YYYY-MM-DD
      hora_pregao: formData.value.hora_pregao,
      estado: formData.value.estado,
      modalidade: formData.value.modalidade,
      site_pregao: formData.value.site_pregao,
      objeto_resumido: formData.value.objeto_resumido,
      objeto_completo: formData.value.objeto_completo,
      responsavel: user.id,
      representante: formData.value.representante
    }

    console.log('Dados a serem inseridos:', {
      data_pregao: dataPregao.toISOString().split('T')[0],
      hora_pregao: formData.value.hora_pregao
    });

    const { error } = await supabase
      .from('processos')
      .insert(processoData)

    if (error) throw error
    alert('Processo cadastrado com sucesso!')
    router.push('/processos')
  } catch (error) {
    console.error('Erro:', error)
    alert('Erro ao cadastrar processo')
  }
};

// No arquivo ProcessosView.vue, adicione esta função no <script setup>
const getModalidadeSigla = (modalidade) => {
  const modalidades = {
    'pregao_eletronico': 'PE',
    'pregao_presencial': 'PP',
    'credenciamento': 'CR',
    'concorrencia': 'CC',
    'concurso': 'CS',
    'leilao': 'LL',
    'dialogo_competitivo': 'DC',
    'tomada_precos': 'TP',
    'chamamento_publico': 'CP',
    'rdc': 'RDC',
    'rdc_eletronico': 'RDC-E',
    'srp': 'SRP',
    'srp_eletronico': 'SRP-E',
    'srp_internacional': 'SRP-I'
  }

  return modalidades[modalidade] || modalidade
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
  height: 100vh;
  /* Altura total */
  overflow: hidden;
  /* Previne scroll duplo */
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
  flex-shrink: 0;
  /* Impede que o header encolha */
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

.btn-export,
.btn-add {
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
  max-height: calc(100vh - 180px);
  /* Ajusta altura máxima considerando o header */
  margin-bottom: 1rem;
  position: relative;
  user-select: text;
  /* Altera de 'none' para 'text' */
}

.excel-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #e9ecef;
  min-width: 1500px;
  /* Força uma largura mínima para garantir o scroll horizontal */
}

.excel-table th {
  background: #f8f9fa;
  text-align: left;
  font-weight: 600;
  color: #193155;
  border: 1px solid #e9ecef;
  position: sticky;
  top: 0;
  z-index: 10;
}

.th-content {
  margin: 1rem;
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

/* Remova ou comente estas propriedades que impedem a quebra de linha */
/* .excel-table td {
  white-space: nowrap;
} */

/* Adicione estes estilos para permitir quebra de linha */
.excel-table td {
  white-space: normal;
  /* Permite quebra de linha */
  word-wrap: break-word;
  /* Força quebra de palavras longas */
  min-width: 100px;
  /* Largura mínima para cada célula */
  max-width: 300px;
  /* Largura máxima para evitar células muito largas */
  vertical-align: top;
  /* Alinha o conteúdo no topo */
  height: auto;
  /* Altura automática */
  padding: 10px;
  /* Padding adequado */
  user-select: text;
  cursor: text;
}

/* Ajuste para células específicas */
.objeto-cell {
  white-space: normal !important;
  word-wrap: break-word !important;
  line-height: 1.4;
  user-select: text;
}

/* Mantenha a última coluna (ações) com largura fixa */
.actions-column {
  width: 60px;
  min-width: 60px;
  white-space: nowrap;
  /* Esta pode manter nowrap */
}

/* Ajuste o container da tabela */
.table-container {
  max-height: calc(100vh - 180px);
  overflow: auto;
}

/* Ajuste a tabela */
.excel-table {
  width: 100%;
  table-layout: fixed;
  /* Importante para respeitar as larguras */
}

/* Mantenha o número da linha com largura fixa */
.row-number-cell {
  width: 50px !important;
  min-width: 50px !important;
  max-width: 50px !important;
  white-space: nowrap !important;
  /* Esta precisa manter nowrap */
}

.excel-table tbody tr:hover {
  background: #f8f9fa;
}

.modalidade,
.status {
  padding: 0.25rem 0.75rem;
  border-radius: 50px;
  font-size: 0.85rem;
  user-select: text;
  cursor: text;
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

.status.nao_participar {
  background: #bebc1b;
  color: #495057;
}

.actions-cell {
  width: 80px;
  text-align: center;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.btn-icon {
  width: 32px;
  height: 32px;
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon.delete {
  background: #fee2e2;
}

.btn-icon.delete:hover {
  background: #dc3545;
  transform: translateY(-2px);
}

.btn-icon.delete:hover .icon {
  filter: brightness(0) invert(1);
}

.icon {
  width: 16px;
  height: 16px;
  transition: all 0.3s ease;
}

/* Estilos do modal de confirmação */
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

.confirm-dialog {
  position: absolute;
  /* Alterado de static para absolute */
  background: white;
  padding: 1rem;
  border-radius: 8px;
  min-width: 200px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

/* Adicione uma seta para cima no diálogo */
.confirm-dialog::before {
  content: '';
  position: absolute;
  top: -8px;
  left: 20px;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 8px solid white;
}

.warning-text {
  color: #dc3545;
  font-size: 0.9rem;
  margin: 1rem 0;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel,
.btn-confirm {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.btn-cancel {
  background: #e9ecef;
  color: #495057;
}

.btn-confirm.delete {
  background: #dc3545;
  color: white;
}

.btn-cancel:hover,
.btn-confirm:hover {
  transform: translateY(-2px);
}

.btn-confirm.delete:hover {
  background: #c82333;
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
  justify-content: space-between;
  padding: 8px;
}

.th-content span {
  flex: 1;
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
  user-select: text;
  /* Altera de 'none' para 'text' */
  overflow: auto;
  position: relative;
}

.table-container.resizing * {
  cursor: col-resize;
  user-select: text !important;
}

/* Ajuste para o container da tabela */
.table-container {
  position: relative;
}

/* Garante que a última coluna (ações) tenha largura fixa */
.actions-column {
  width: 60px;
  min-width: 60px;
}

/* Mantém o texto alinhado durante o redimensionamento */
.excel-table td>*,
.excel-table th>* {
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
  user-select: text;
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
}

.confirm-actions {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.btn-confirm,
.btn-cancel {
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

.btn-confirm:hover,
.btn-cancel:hover {
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
  white-space: normal;
  /* Permite quebra de linha */
  line-height: 1.4;
  user-select: text;
}

/* Estilo para o select de status */
.status-select {
  position: absolute;
  z-index: 1000;
  min-width: 90%;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.5rem;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin-top: 4px;
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

/* Estilos para os botões de ordenação */
.sort-buttons {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-left: 8px;
}

.btn-sort {
  background: none;
  border: none;
  padding: 0;
  width: 20px;
  height: 20px;
  font-size: 12px;
  color: #6c757d;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-sort:hover {
  color: #193155;
}

.btn-sort.active {
  color: #193155;
  font-weight: bold;
}

/* Ajuste na estrutura do cabeçalho da coluna */
.th-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
}

.th-content span {
  flex: 1;
}

.sort-buttons {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-left: 8px;
}

.btn-sort {
  background: none;
  border: none;
  padding: 0;
  width: 20px;
  height: 20px;
  font-size: 12px;
  color: #6c757d;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-sort:hover {
  color: #193155;
}

.btn-sort.active {
  color: #193155;
  font-weight: bold;
}

/* Estilos para o filtro de estado */
.filtro-container {
  position: relative;
}

.filtro-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
  width: 200px;
  max-height: 300px;
  overflow-y: auto;
  padding: 0.5rem;
}

.estado-dropdown {
  width: 250px;
}

.dropdown-header {
  padding: 0.5rem;
  border-bottom: 1px solid #e9ecef;
}

.estado-search {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  font-family: inherit;
  font-size: inherit;
}

.estados-list {
  max-height: 200px;
  overflow-y: auto;
  padding: 0.5rem 0;
}

.estado-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.estado-option:hover {
  background: #f8f9fa;
}

.estado-nome {
  flex: 1;
}

.estado-uf {
  color: #6c757d;
  font-size: 0.85rem;
}

/* Estilos para o dropdown de estados */
.filtro-container {
  position: relative;
}

.btn-filtro {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  opacity: 0.6;
  transition: all 0.2s ease;
}

.btn-filtro:hover {
  opacity: 1;
}

.icon-filter {
  width: 16px;
  height: 16px;
}

.estado-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 250px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  margin-top: 8px;
  padding: 8px 0;
  animation: fadeIn 0.2s ease;
}

.dropdown-header {
  padding: 8px 12px;
  border-bottom: 1px solid #e5e7eb;
}

.estado-search {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.9rem;
}

.estado-search:focus {
  outline: none;
  border-color: #193155;
  box-shadow: 0 0 0 2px rgba(25, 49, 85, 0.1);
}

.estados-list {
  max-height: 300px;
  overflow-y: auto;
  padding: 8px 0;
}

.estado-option {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  gap: 8px;
}

.estado-option:hover {
  background: #f8f9fa;
}

.estado-nome {
  flex: 1;
}

.estado-uf {
  color: #6c757d;
  font-size: 0.85rem;
}

/* Estilização do checkbox */
.estado-option input[type="checkbox"] {
  width: 16px;
  height: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 4px;
  cursor: pointer;
}

.estado-option input[type="checkbox"]:checked {
  background-color: #193155;
  border-color: #193155;
}

/* Scrollbar personalizada para a lista de estados */
.estados-list::-webkit-scrollbar {
  width: 6px;
}

.estados-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.estados-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.estados-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Estilo para o link do portal */
.portal-link {
  display: inline-block;
  width: 100%;
}

.portal-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.8rem;
  background: #e3f2fd;
  color: #193155;
  border-radius: 6px;
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.portal-button:hover {
  background: #bbdefb;
  transform: translateY(-1px);
  border-color: #90caf9;
}

.portal-button::after {
  content: '↗';
  font-size: 0.8rem;
  opacity: 0.7;
}

.portal-button:hover::after {
  opacity: 1;
}

/* Estilos para os status */
.status {
  padding: 0.25rem 0.75rem;
  border-radius: 50px;
  font-size: 0.85rem;
  font-weight: 500;
  user-select: text;
  cursor: text;
}

.status.em_analise {
  background: #fff3cd;
  color: #856404;
}

.status.em_andamento {
  background: #cce5ff;
  color: #004085;
}

.status.ganhamos {
  background: #d4edda;
  color: #155724;
}

.status.perdemos {
  background: #f8d7da;
  color: #721c24;
}

.status.suspenso {
  background: #e2e3e5;
  color: #383d41;
}

.status.revogado {
  background: #f8d7da;
  color: #721c24;
}

.status.adiado {
  background: #fff3cd;
  color: #856404;
}

.status.demonstracao {
  background: #d1ecf1;
  color: #0c5460;
}

.status.cancelado {
  background: #f8d7da;
  color: #721c24;
}

/* Estilo para a coluna de numeração */
.row-number-cell {
  width: 50px;
  min-width: 50px;
  max-width: 50px;
  background: #f8f9fa;
  text-align: center;
  color: #6c757d;
  font-size: 0.9rem;
  position: sticky;
  left: 0;
  z-index: 2;
  border-right: 2px solid #e9ecef !important;
}

/* Ajuste para quando a célula de numeração encontra o cabeçalho fixo */
thead .row-number-cell {
  z-index: 3;
  background: #f8f9fa;
}

/* Ajuste para células fixas no corpo da tabela */
tbody .row-number-cell {
  position: sticky;
  left: 0;
  z-index: 3;
  background: #f8f9fa;
  /* Mantém o fundo mesmo durante scroll */
}

/* Efeito hover mantendo o fundo */
tbody tr:hover .row-number-cell {
  background: #f0f0f0;
  /* Cor um pouco mais escura no hover */
}

/* Ajuste no container da tabela */
.table-container {
  overflow: auto;
  position: relative;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Ajuste na tabela */
.excel-table {
  border-collapse: separate;
  border-spacing: 0;
}

/* Sombra sutil para indicar scroll */
.row-number-cell::after {
  content: '';
  position: absolute;
  top: 0;
  right: -2px;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to right, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0));
}

/* Fixa o cabeçalho */
.excel-table thead th {
  position: sticky;
  top: 0;
  background: #f8f9fa;
  z-index: 2;
  border-bottom: 2px solid #e9ecef;
}

/* Ajuste especial para a célula de numeração no cabeçalho */
.excel-table thead th.row-number-cell {
  position: sticky;
  left: 0;
  top: 0;
  z-index: 4;
  /* Maior z-index para ficar acima de tudo */
  background: #f8f9fa;
}

/* Sombra sutil no cabeçalho para indicar scroll */
.excel-table thead th::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -2px;
  height: 2px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0));
}

/* Estilo para a linha selecionada */
.selected-row {
  background-color: #19315594 !important;
  border-left: 4px solid #193155 !important;
}

/* Mantém o highlight mesmo no hover */
.selected-row:hover {
  background-color: rgba(25, 49, 85, 0.08) !important;
}

/* Ajuste para a célula de numeração na linha selecionada */
.selected-row .row-number-cell {
  background-color: rgb(25, 49, 85) !important;
  font-weight: 600;
  color: #ffffff;
}

/* Efeito de transição suave */
.excel-table tr {
  transition: background-color 0.2s ease, border-left 0.2s ease;
}

/* Estilo específico para a coluna de Objeto Completo */
td[data-field="objeto_completo"],
th[data-field="objeto_completo"] {
  min-width: 500px !important;
  width: 500px !important;
}

/* Ajuste para o conteúdo */
.objeto-cell {
  max-width: 500px;
  min-width: 500px;
  white-space: normal;
  /* Permite quebra de linha */
  line-height: 1.4;
  word-wrap: break-word;
  user-select: text;
}
</style>