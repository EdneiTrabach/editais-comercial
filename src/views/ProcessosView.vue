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
              <th class="row-number-cell"></th>
              <th v-for="(coluna, index) in colunas" :key="index" class="resizable-column" :data-field="coluna.campo"
                :style="{ width: colunasWidth[coluna.campo] }">
                <div class="th-content">
                  {{ coluna.titulo }}

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

                  <div v-if="coluna.campo !== 'data_pregao' && coluna.campo !== 'hora_pregao'" class="filtro-container">
                    <button @click="toggleFiltro(coluna.campo)" class="btn-filtro">
                      <img src="/icons/search-line.svg" alt="Filtrar" class="icon-filter" />
                    </button>
                  </div>
                </div>
                <div class="column-resize-handle" @mousedown.stop="startColumnResize($event, coluna.campo)"></div>
              </th>
              <th class="actions-column">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(processo, index) in processosFiltrados" :key="processo.id" class="resizable-row"
              :class="{ 'selected-row': selectedRow === processo.id }" :data-status="processo.status"
              @click="selectRow(processo.id)" :style="{ height: rowsHeight[processo.id] }">
              <td class="row-number-cell">{{ index + 1 }}</td>
              <td v-for="coluna in colunas" :key="coluna.campo" :data-field="coluna.campo"
                @dblclick="handleDblClick(coluna.campo, processo, $event)">
                <template v-if="editingCell.id === processo.id && editingCell.field === coluna.campo">
                  <input v-if="coluna.campo === 'codigo_analise'" type="text" v-model="editingCell.value"
                    @blur="handleUpdate(processo)" @keyup.enter="handleUpdate(processo)" @keyup.esc="cancelEdit()"
                    placeholder="Digite o código">
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
                    <option value="vamos_participar">Vamos Participar</option>
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
                  <template v-if="coluna.campo === 'data_pregao'">
                    {{ formatDate(processo.data_pregao) }}
                  </template>
                  <template v-else-if="coluna.campo === 'hora_pregao'">
                    {{ formatTime(processo.hora_pregao) }}
                  </template>
                  <template v-else-if="coluna.campo === 'modalidade'">
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
                  <template v-else-if="coluna.campo === 'site_pregao'">
                    <div class="portal-link">
                      <a v-if="processo.site_pregao" :href="processo.site_pregao" target="_blank"
                        rel="noopener noreferrer" class="portal-button">
                        {{ getPlataformaNome(processo.site_pregao) }}
                      </a>
                      <span v-else>-</span>
                    </div>
                  </template>
                  <span v-else-if="coluna.campo === 'status'" :class="['status', processo.status]">
                    {{ formatStatus(processo.status) }}
                  </span>
                  <template v-else-if="coluna.campo === 'empresa'">
                    <template v-if="editingCell.id === processo.id && editingCell.field === coluna.campo">
                      <select v-model="editingCell.value" @change="handleUpdate(processo)"
                        @blur="handleUpdate(processo)" @keyup.esc="cancelEdit()" class="empresa-select">
                        <option value="">Selecione uma empresa</option>
                        <option v-for="empresa in empresas" :key="empresa.id" :value="empresa.id">
                          {{ empresa.nome }} ({{ empresa.cnpj }})
                        </option>
                      </select>
                    </template>
                    <span v-else @dblclick="handleDblClick(coluna.campo, processo, $event)" class="empresa-display">
                      {{ getEmpresaNome(processo.empresa_id) }}
                    </span>
                  </template>
                  <span v-else>
                    {{ processo[coluna.campo] || '-' }}
                  </span>
                </template>
              </td>
              <td class="actions-cell">
                <div class="action-buttons">
                  <button class="btn-icon delete" @click="handleDelete(processo)">
                    <BaseImage src="icons/lixeira.svg" alt="Excluir" class="icon icon-delete"
                      fallbackImage="icons/fallback.svg" />
                  </button>
                </div>
              </td>
              <div class="row-resize-handle" @mousedown.stop="startRowResize($event, processo.id)"></div>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="anos-tabs">
        <div class="tabs-header">
          <button 
            v-for="ano in anosDisponiveis" 
            :key="ano"
            :class="['tab-button', { active: anoSelecionado === ano }]"
            @click="selecionarAno(ano)"
          >
            {{ ano }}
          </button>
        </div>
      </div>

      <div v-if="confirmDialog.show" class="confirm-dialog" :style="confirmDialog.position">
        <div class="confirm-content">
          <p>Deseja editar este campo?</p>
          <div class="confirm-actions">
            <button @click="handleConfirmEdit" class="btn-confirm">Confirmar</button>
            <button @click="hideConfirmDialog" class="btn-cancel">Cancelar</button>
          </div>
        </div>
      </div>

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
import '../assets/styles/dark-mode.css'

const router = useRouter()
const isSidebarExpanded = ref(true)
const processos = ref([])
const loading = ref(false)

const deleteConfirmDialog = ref({
  show: false,
  processo: null
})

const sortConfig = ref({
  field: 'data_pregao',
  direction: 'asc'
})

const selectedRow = ref(null)

const colunas = [
  { titulo: 'Data', campo: 'data_pregao' },
  { titulo: 'Hora', campo: 'hora_pregao' },
  { titulo: 'Modalidade', campo: 'modalidade' },
  { titulo: 'Estado', campo: 'estado' },
  { titulo: 'Nº Processo', campo: 'numero_processo' },
  { titulo: 'Código Análise', campo: 'codigo_analise' }, // Nova coluna
  { titulo: 'Órgão', campo: 'orgao' },
  { titulo: 'Status', campo: 'status' },
  { titulo: 'Objeto Resumido', campo: 'objeto_resumido' },
  { titulo: 'Responsável', campo: 'responsavel_nome' },
  { titulo: 'Objeto Completo', campo: 'objeto_completo' },
  { titulo: 'Portal', campo: 'site_pregao' },
  { titulo: 'Representante', campo: 'representante' },
  { titulo: 'Empresa Participante', campo: 'empresa' },
  { titulo: 'Campo Adicional 1', campo: 'campo_adicional1' },
  { titulo: 'Campo Adicional 2', campo: 'campo_adicional2' },
]

const initializeFiltros = () => {
  const filtrosIniciais = {}
  colunas.forEach(coluna => {
    filtrosIniciais[coluna.campo] = []
  })
  return filtrosIniciais
}

const filtros = ref(initializeFiltros())

const anoSelecionado = ref(new Date().getFullYear())
const anosDisponiveis = computed(() => {
  const anos = new Set(processos.value.map(p => p.ano))
  return Array.from(anos).sort((a, b) => b - a) // Ordena decrescente
})

const processosFiltrados = computed(() => {
  if (!processos.value) return []

  return processos.value
    .filter(processo => processo.ano === anoSelecionado.value)
    .filter(processo => {
      return colunas.every(coluna => {
        if (!filtros.value[coluna.campo] || filtros.value[coluna.campo].length === 0) {
          return true
        }

        let valorProcesso = processo[coluna.campo]
        if (!valorProcesso) return false

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

const selecionarAno = (ano) => {
  anoSelecionado.value = ano
}

const handleSidebarToggle = (expanded) => {
  isSidebarExpanded.value = expanded
}

const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const cleanDate = dateString.split('T')[0];
    const date = new Date(cleanDate);
    if (isNaN(date.getTime())) return '-';

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return '-';
  }
}

const formatTime = (time) => {
  if (!time) return '-';
  try {
    const cleanTime = time.split(':').slice(0, 2).join(':');
    return cleanTime;
  } catch (error) {
    console.error('Erro ao formatar hora:', error);
    return '-';
  }
}

const formatModalidade = (modalidade, tipo_pregao) => {
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

  if (modalidade === 'pregao' && tipo_pregao) {
    return modalidades[modalidade][tipo_pregao]
  }

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
    'vamos_participar': 'Vamos Participar',
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

    if (error) throw error

    processos.value = data?.map(processo => ({
      ...processo,
      data_pregao: processo.data_pregao,
      hora_pregao: processo.hora_pregao,
      responsavel_nome: '-',
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

const handleDelete = (processo) => {
  deleteConfirmDialog.value = {
    show: true,
    processo
  }
}

const confirmDelete = async () => {
  try {
    const processo = deleteConfirmDialog.value.processo

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
    'Data': formatDate(processo.data_pregao),
    'Hora': formatTime(processo.hora_pregao),
    'Número do Processo': processo.numero_processo,
    'Código Análise': processo.codigo_analise || '-',  // Novo campo
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

const opcoesUnicas = (coluna) => {
  const opcoes = new Set()
  processos.value.forEach(processo => {
    let valor = processo[coluna]

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

const STORAGE_KEY = 'table-columns-width'
const colunasWidth = ref({})

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
    saveColumnWidths()
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const loadColumnWidths = () => {
  try {
    const savedWidths = localStorage.getItem(STORAGE_KEY)
    if (savedWidths) {
      colunasWidth.value = JSON.parse(savedWidths)
    } else {
      colunas.forEach(coluna => {
        colunasWidth.value[coluna.campo] = '150px'
      })
    }
  } catch (error) {
    console.error('Erro ao carregar larguras das colunas:', error)
  }
}

const saveColumnWidths = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colunasWidth.value))
  } catch (error) {
    console.error('Erro ao salvar larguras das colunas:', error)
  }
}

const rowsHeight = ref({})

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

const editingCell = ref({
  id: null,
  field: null,
  value: null
})

const handleDblClick = async (field, processo, event) => {
  if (editingCell.value.id === processo.id && editingCell.value.field === field) {
    return
  }

  const cell = event.target.closest('td')
  const rect = cell.getBoundingClientRect()

  confirmDialog.value = {
    show: true,
    position: {
      top: `${rect.bottom + 10}px`,
      left: `${rect.left}px`
    },
    callback: () => {
      editingCell.value = {
        id: processo.id,
        field,
        value: field === 'empresa' ? processo.empresa_id : processo[field]
      }
    }
  }
}

const handleConfirmEdit = () => {
  confirmDialog.value.callback?.()
  hideConfirmDialog()

  nextTick(() => {
    const input = document.querySelector('.editing-cell input, .editing-cell textarea, .editing-cell select')
    if (input) {
      input.focus()
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

const handleUpdate = async (processo) => {
  try {
    if (!editingCell.value.value) return cancelEdit();

    let updateValue = editingCell.value.value;

    if (editingCell.value.field === 'data_pregao') {
      updateValue = updateValue.split('T')[0];
    } else if (editingCell.value.field === 'hora_pregao') {
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

    processo[editingCell.value.field] = updateValue;

  } catch (error) {
    console.error('Erro ao atualizar:', error)
  } finally {
    cancelEdit()
  }
}

const cancelEdit = () => {
  editingCell.value = {
    id: null,
    field: null,
    value: null
  }
}

const confirmDialog = ref({
  show: false,
  position: {},
  callback: null
})

const checkAdminStatus = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    console.log('Usuário atual:', user?.email)
    
    if (user) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*') // Selecionar todos os campos para debug
        .eq('id', user.id)
        .single()

      console.log('Perfil encontrado:', profile)
      console.log('Erro:', error)

      if (error) {
        console.error('Erro ao verificar perfil:', error)
        return false
      }

      isAdmin.value = profile?.role === 'admin'
      console.log('É admin?', isAdmin.value)
      return isAdmin.value
    }
  } catch (error) {
    console.error('Erro ao verificar status de admin:', error)
    return false
  }
}

onMounted(async () => {
  await loadProcessos()
  await loadRepresentantes()
  loadColumnWidths()
})

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

const handleSort = async (field, direction) => {
  if (sortConfig.value.field === field && sortConfig.value.direction === direction) {
    return
  }

  sortConfig.value = {
    field,
    direction
  }

  await loadProcessos()
}

const estadoSearch = ref('')

const estadosFiltrados = computed(() => {
  if (!estadoSearch.value) return estados.value

  const busca = estadoSearch.value.toLowerCase()
  return estados.value.filter(estado =>
    estado.nome.toLowerCase().includes(busca) ||
    estado.uf.toLowerCase().includes(busca)
  )
})

const plataformas = ref([])

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

onMounted(() => {
  loadRepresentantes()
  loadPlataformas()
})

const getPlataformaNome = (url) => {
  if (!url) return '-'
  const plataforma = plataformas.value.find(p => p.url === url)
  return plataforma ? plataforma.nome : url
}

const formData = ref({
  status: null
})

const selectRow = (id) => {
  selectedRow.value = id
}

const showPlataformaField = computed(() => {
  return formData.value.modalidade === 'pregao_eletronico';
});

const handleModalidadeChange = () => {
  if (formData.value.modalidade !== 'pregao_eletronico') {
    formData.value.site_pregao = '';
  }
};

const handleSubmit = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    const dataPregao = new Date(formData.value.data_pregao + 'T12:00:00')

    const processoData = {
      numero_processo: `${formData.value.numero}/${formData.value.ano}`,
      ano: formData.value.ano,
      orgao: formData.value.orgao,
      data_pregao: dataPregao.toISOString().split('T')[0],
      hora_pregao: formData.value.hora_pregao,
      codigo_analise: formData.value.codigo_analise,
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

// Adicione no início do script junto com outros refs
const empresas = ref([])

// Adicione este computed
const empresasCadastradas = computed(() => {
  return empresas.value.filter(empresa => empresa.id) // Filtra apenas empresas válidas
})

// Modifique a função loadEmpresas
const loadEmpresas = async () => {
  try {
    const { data, error } = await supabase
      .from('empresas')
      .select('id, nome, cnpj')
      .order('nome')

    if (error) throw error
    empresas.value = data || []
  } catch (error) {
    console.error('Erro ao carregar empresas:', error)
    empresas.value = []
  }
}

const handleEmpresaChange = async (processo) => {
  try {
    const { error } = await supabase
      .from('processos')
      .update({ empresa_id: processo.empresa_id })
      .eq('id', processo.id)

    if (error) throw error
  } catch (error) {
    console.error('Erro ao atualizar empresa:', error)
    alert('Erro ao atualizar empresa')
  }
}

// Adicione no onMounted
onMounted(async () => {
  await Promise.all([
    loadProcessos(),
    loadEmpresas()
  ])
})

// Adicione esta função junto com as outras
const getEmpresaNome = (empresaId) => {
  const empresa = empresas.value.find(e => e.id === empresaId)
  return empresa ? empresa.nome : '-'
}
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.main-content {
  padding: 2rem;
  transition: margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
  background: #f8f9fa;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.main-content.expanded {
  margin-left: 0px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-shrink: 0;
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
  margin-bottom: 1rem;
  position: relative;
  user-select: text;
  height: 100%;
}

.excel-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #e9ecef;
  min-width: 1500px;
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
  white-space: normal;
  word-wrap: break-word;
  min-width: 100px;
  max-width: 300px;
  vertical-align: top;
  height: auto;
  padding: 10px;
  user-select: text;
  cursor: text;
  text-align: center;
  vertical-align: middle;
}

.objeto-cell {
  white-space: normal !important;
  word-wrap: break-word !important;
  line-height: 1.4;
  user-select: text;
}

.actions-column {
  width: 60px;
  min-width: 60px;
  white-space: nowrap;
}

.table-container {
  max-height: calc(100vh - 180px);
  overflow: auto;
}

.excel-table {
  width: 100%;
  table-layout: fixed;
}

.row-number-cell {
  width: 50px !important;
  min-width: 50px !important;
  max-width: 50px !important;
  white-space: nowrap !important;
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
  background: #ca4848;
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
  background: white;
  padding: 1rem;
  border-radius: 8px;
  min-width: 200px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
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

.excel-table th,
.excel-table td {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.table-container {
  user-select: text;
  overflow: auto;
  position: relative;
}

.table-container.resizing * {
  cursor: col-resize;
  user-select: text !important;
}

.table-container {
  position: relative;
}

.actions-column {
  width: 60px;
  min-width: 60px;
}

.excel-table td>*,
.excel-table th>* {
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
  user-select: text;
}

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

.resizing {
  border-right: 2px solid #193155 !important;
}

.resizing-row {
  border-bottom: 2px solid #193155 !important;
}

.th-content,
.td-content {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resizable-column {
  position: relative;
  z-index: 1;
}

.resizable-row {
  position: relative;
  z-index: 1;
  min-height: 40px;
}

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

td select option {
  padding: 0.5rem;
  font-family: inherit;
}

.objeto-cell {
  max-width: 300px;
  white-space: normal;
  line-height: 1.4;
  user-select: text;
}

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

.editing-cell {
  background-color: rgba(25, 49, 85, 0.05);
}

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
  background: #ffe0b2;
  color: #ef6c00;
}

.status.ganhamos {
  background: #d4edda;
  color: #155724;
}

.status.perdemos {
  background: #ffc2c2;
  color: #e90b0b;
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

thead .row-number-cell {
  z-index: 3;
  background: #f8f9fa;
}

tbody .row-number-cell {
  position: sticky;
  left: 0;
  z-index: 3;
  background: #f8f9fa;
}

tbody tr:hover .row-number-cell {
  background: #f0f0f0;
}

.table-container {
  overflow: auto;
  position: relative;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.excel-table {
  border-collapse: separate;
  border-spacing: 0;
}

.row-number-cell::after {
  content: '';
  position: absolute;
  top: 0;
  right: -2px;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to right, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0));
}

.excel-table thead th {
  position: sticky;
  top: 0;
  background: #f8f9fa;
  z-index: 2;
  border-bottom: 2px solid #e9ecef;
}

.excel-table thead th.row-number-cell {
  position: sticky;
  left: 0;
  top: 0;
  z-index: 4;
  background: #f8f9fa;
}

.excel-table thead th::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -2px;
  height: 2px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0));
}

.selected-row {
  background-color: #19315594 !important;
  border-left: 4px solid #193155 !important;
}

.selected-row:hover {
  background-color: rgba(25, 49, 85, 0.08) !important;
}

.selected-row .row-number-cell {
  background-color: rgb(25, 49, 85) !important;
  font-weight: 600;
  color: #ffffff;
}

.excel-table tr {
  transition: background-color 0.2s ease, border-left 0.2s ease;
}

td[data-field="objeto_completo"],
th[data-field="objeto_completo"] {
  min-width: 500px !important;
  width: 500px !important;
}

.objeto-cell {
  max-width: 500px;
  min-width: 500px;
  white-space: normal;
  line-height: 1.4;
  word-wrap: break-word;
  user-select: text;
}

.status.em_analise {
  background: #f8f9fa;
  color: #495057;
}

.status.em_andamento {
  background: #ffe0b2;
  color: #ef6c00;
}

.status.ganhamos {
  background: #d4edda;
  color: #155724;
}

.status.perdemos {
  background: #ffc2c2;
  color: #e90b0b;
}

.status.suspenso {
  background: #e3f2fd;
  color: #1976d2;
}

.status.revogado {
  background: #bbdefb;
  color: #1565c0;
}

.status.adiado {
  background: #e1f5fe;
  color: #0288d1;
}

.status.demonstracao {
  background: #ff9800;
  color: #ffffff;
}

.status.cancelado {
  background: #1a237e;
  color: #ffffff;
}

.status.nao_participar {
  background: #fff9c4;
  color: #f9a825;
}

.excel-table tbody tr[data-status="em_analise"]:hover {
  background-color: rgba(173, 181, 189, 0.6) !important;
  border-left: 4px solid #495057 !important;
}

.excel-table tbody tr[data-status="em_andamento"]:hover {
  background-color: rgba(255, 224, 178, 0.6) !important;
  border-left: 4px solid #ef6c00 !important;
}

.excel-table tbody tr[data-status="ganhamos"]:hover {
  background-color: rgba(212, 237, 218, 0.6) !important;
  border-left: 4px solid #155724 !important;
}

.excel-table tbody tr[data-status="perdemos"]:hover {
  background-color: rgba(255, 213, 213, 0.6) !important;
  border-left: 4px solid #c62828 !important;
}

.excel-table tbody tr[data-status="suspenso"]:hover {
  background-color: rgba(227, 242, 253, 0.6) !important;
  border-left: 4px solid #1976d2 !important;
}

.excel-table tbody tr[data-status="revogado"]:hover {
  background-color: rgba(187, 222, 251, 0.6) !important;
  border-left: 4px solid #1565c0 !important;
}

.excel-table tbody tr[data-status="adiado"]:hover {
  background-color: rgba(225, 245, 254, 0.6) !important;
  border-left: 4px solid #0288d1 !important;
}

.excel-table tbody tr[data-status="demonstracao"]:hover {
  background-color: rgba(255, 152, 0, 0.6) !important;
  border-left: 4px solid #ef6c00 !important;
}

.excel-table tbody tr[data-status="cancelado"]:hover {
  background-color: rgba(26, 35, 126, 0.6) !important;
  border-left: 4px solid #1a237e !important;
}

.excel-table tbody tr[data-status="nao_participar"]:hover {
  background-color: rgba(255, 249, 196, 0.6) !important;
  border-left: 4px solid #f9a825 !important;
}

.excel-table tbody tr {
  transition: all 0.3s ease;
  border-left: 4px solid transparent;
}

.selected-row {
  border-left: 4px solid transparent !important;
}

.selected-row[data-status="em_analise"] {
  background-color: rgba(73, 80, 87, 0.15) !important;
  border-left-color: #495057 !important;
}

.selected-row[data-status="em_andamento"] {
  background-color: rgba(239, 108, 0, 0.15) !important;
  border-left-color: #ef6c00 !important;
}

.selected-row[data-status="ganhamos"] {
  background-color: rgba(21, 87, 36, 0.15) !important;
  border-left-color: #155724 !important;
}

.selected-row[data-status="perdemos"] {
  background-color: rgba(198, 40, 40, 0.15) !important;
  border-left-color: #c62828 !important;
}

.selected-row[data-status="suspenso"] {
  background-color: rgba(25, 118, 210, 0.15) !important;
  border-left-color: #1976d2 !important;
}

.selected-row[data-status="revogado"] {
  background-color: rgba(21, 101, 192, 0.15) !important;
  border-left-color: #1565c0 !important;
}

.selected-row[data-status="adiado"] {
  background-color: rgba(2, 136, 209, 0.15) !important;
  border-left-color: #0288d1 !important;
}

.selected-row[data-status="demonstracao"] {
  background-color: rgba(239, 108, 0, 0.15) !important;
  border-left-color: #ef6c00 !important;
}

.selected-row[data-status="cancelado"] {
  background-color: rgba(26, 35, 126, 0.15) !important;
  border-left-color: #1a237e !important;
}

.selected-row[data-status="nao_participar"] {
  background-color: rgba(249, 168, 37, 0.15) !important;
  border-left-color: #f9a825 !important;
}

.selected-row .row-number-cell {
  background-color: transparent !important;
  color: inherit;
  font-weight: 600;
}

.selected-row {
  border: 2px solid transparent !important;
  box-shadow: inset 0 0 0 2px transparent;
}

.selected-row[data-status="em_analise"] {
  background-color: rgba(73, 80, 87, 0.15) !important;
  border-color: #495057 !important;
  box-shadow: inset 0 0 0 2px #495057;
}

.selected-row[data-status="em_andamento"] {
  background-color: rgba(239, 108, 0, 0.15) !important;
  border-color: #ef6c00 !important;
  box-shadow: inset 0 0 0 2px #ef6c00;
}

.selected-row[data-status="ganhamos"] {
  background-color: rgba(21, 87, 36, 0.15) !important;
  border-color: #155724 !important;
  box-shadow: inset 0 0 0 2px #155724;
}

.selected-row[data-status="perdemos"] {
  background-color: rgba(198, 40, 40, 0.15) !important;
  border-color: #c62828 !important;
  box-shadow: inset 0 0 0 2px #c62828;
}

.selected-row[data-status="suspenso"] {
  background-color: rgba(25, 118, 210, 0.15) !important;
  border-color: #1976d2 !important;
  box-shadow: inset 0 0 0 2px #1976d2;
}

.selected-row[data-status="revogado"] {
  background-color: rgba(21, 101, 192, 0.15) !important;
  border-color: #1565c0 !important;
  box-shadow: inset 0 0 0 2px #1565c0;
}

.selected-row[data-status="adiado"] {
  background-color: rgba(2, 136, 209, 0.15) !important;
  border-color: #0288d1 !important;
  box-shadow: inset 0 0 0 2px #0288d1;
}

.selected-row[data-status="demonstracao"] {
  background-color: rgba(239, 108, 0, 0.15) !important;
  border-color: #ef6c00 !important;
  box-shadow: inset 0 0 0 2px #ef6c00;
}

.selected-row[data-status="cancelado"] {
  background-color: rgba(26, 35, 126, 0.15) !important;
  border-color: #1a237e !important;
  box-shadow: inset 0 0 0 2px #1a237e;
}

.selected-row[data-status="nao_participar"] {
  background-color: rgba(249, 168, 37, 0.15) !important;
  border-color: #f9a825 !important;
  box-shadow: inset 0 0 0 2px #f9a825;
}
.anos-tabs {
  margin-top: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.tabs-header {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  overflow-x: auto;
}

.tab-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  background: #f3f4f6;
  color: #6b7280;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-button:hover {
  background: #e5e7eb;
}

.tab-button.active {
  background: #193155;
  color: white;
}

/* Adicione estilos para scrollbar horizontal nas abas se necessário */
.tabs-header::-webkit-scrollbar {
  height: 4px;
}

.tabs-header::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.tabs-header::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.tabs-header::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
