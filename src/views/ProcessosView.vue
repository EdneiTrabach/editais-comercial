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

                  <div v-if="['modalidade', 'estado', 'numero_processo', 'orgao', 'status', 'responsavel_nome', 'site_pregao', 'representante', 'empresa'].includes(coluna.campo)" class="filtro-container">
                    <button @click="toggleFiltro(coluna.campo)" class="btn-filtro">
                      <img src="/icons/filter.svg" alt="Filtrar" class="icon-filter" />
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
                  <textarea v-if="coluna.campo === 'impugnacoes'" v-model="editingCell.value"
                    @blur="handleUpdate(processo)" @keyup.enter="handleUpdate(processo)" @keyup.esc="cancelEdit()"
                    rows="3" placeholder="Digite as impugnações..."></textarea>
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
                          {{ empresa.nome }}
                        </option>
                      </select>
                    </template>
                    <span v-else @dblclick="handleDblClick(coluna.campo, processo, $event)" class="empresa-display">
                      {{ getEmpresaNome(processo.empresa_id) }}
                    </span>
                  </template>
                  <td v-else-if="coluna.campo === 'distancias'">
                    <div class="distancias-stack">
                      <div v-for="dist in getDistancias(processo.id)" :key="dist.id" class="distancia-chip">
                        {{ dist.distancia_km }}km ({{ dist.ponto_referencia_cidade }}/{{ dist.ponto_referencia_uf }})
                      </div>
                    </div>
                  </td>
                  <template v-else-if="coluna.campo === 'sistemas_ativos'">
                    <div class="sistemas-chips">
                      {{ processo.sistemas_nomes }}
                    </div>
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
          <button v-for="ano in anosDisponiveis" :key="ano" :class="['tab-button', { active: anoSelecionado === ano }]"
            @click="selecionarAno(ano)">
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
import { ref, onMounted, computed, nextTick, onUnmounted, watch } from 'vue' // Adicione onUnmounted e watch
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import TheSidebar from '@/components/TheSidebar.vue'
import * as XLSX from 'xlsx'
import { writeFileXLSX, utils } from 'xlsx'
import { buildUrl } from '@/utils/url'
import BaseImage from '@/components/BaseImage.vue'
import '../assets/styles/dark-mode.css'
import { useConnectionManager } from '@/composables/useConnectionManager'
import { SupabaseManager } from '@/lib/supabaseManager'

// Adicione aqui o código de monitoramento de visibilidade
const loadingTimeout = ref(null)
const isLoading = ref(false)

const handleLoading = async (loadingFunction) => {
  try {
    isLoading.value = true
    await loadingFunction()
  } catch (error) {
    console.error('Erro:', error)
  } finally {
    isLoading.value = false
  }
}

// Simplifique o pageVisibilityHandler
const pageVisibilityHandler = () => {
  if (!document.hidden) {
    loadProcessos().catch(console.error) // Carrega em background
  }
}

const startVisibilityMonitoring = () => {
  document.addEventListener('visibilitychange', pageVisibilityHandler)
  window.addEventListener('focus', pageVisibilityHandler)
  window.addEventListener('online', pageVisibilityHandler) 
}

const stopVisibilityMonitoring = () => {
  document.removeEventListener('visibilitychange', pageVisibilityHandler)
  window.removeEventListener('focus', pageVisibilityHandler)
  window.removeEventListener('online', pageVisibilityHandler)
}

// Restante do código existente...

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
  { titulo: 'Data', campo: 'data_pregao' },             // processo.data_pregao
  { titulo: 'Hora', campo: 'hora_pregao' },             // processo.hora_pregao
  { titulo: 'Modalidade', campo: 'modalidade' },        // processo.modalidade
  { titulo: 'Estado', campo: 'estado' },                // processo.estado
  { titulo: 'Nº Processo', campo: 'numero_processo' },  // processo.numero_processo
  { titulo: 'Objeto Resumido', campo: 'objeto_resumido' }, // processo.objeto_resumido
  { 
    titulo: 'Sistemas', 
    campo: 'sistemas_ativos',  // Alterado para refletir o nome correto da coluna
    tabela: 'processo',
    tipo: 'array'  // Para indicar que é um array de IDs
  },
  { titulo: 'Código Análise', campo: 'codigo_analise' }, // processo.codigo_analise
  { titulo: 'Órgão', campo: 'orgao' },                  // processo.orgao
  { titulo: 'Objeto Completo', campo: 'objeto_completo' }, // processo.objeto_completo
  { titulo: 'Status', campo: 'status' },                // processo.status
  { 
    titulo: 'Responsável', 
    campo: 'responsavel_id',                            // processo.responsavel_id
    tabelaRelacionada: 'profiles',
    campoExibicao: 'nome'
  },
  { 
    titulo: 'Distâncias', 
    campo: 'processo_distancias',                       // tabela processo_distancias
    tabelaRelacionada: 'processo_distancias',
    camposExibicao: ['distancia_km', 'ponto_referencia_cidade', 'ponto_referencia_uf']
  },
  { titulo: 'Portal', campo: 'site_pregao' },          // processo.site_pregao
  { 
    titulo: 'Representante', 
    campo: 'representante_id',                          // processo.representante_id
    tabelaRelacionada: 'representantes',
    campoExibicao: 'nome'
  },
  { titulo: 'Impugnações', campo: 'impugnacoes' },     // processo.impugnacoes
  { 
    titulo: 'Empresa Participante', 
    campo: 'empresa_id',                                // processo.empresa_id
    tabelaRelacionada: 'empresas',
    campoExibicao: 'nome'
  }
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
    // Garante que estamos tratando apenas a data, sem considerar timezone
    const [date] = dateString.split('T');
    const [year, month, day] = date.split('-');
    
    // Retorna a data formatada sem manipulação de timezone
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
  if (isLoading.value) return
  
  try {
    isLoading.value = true
    const { data, error } = await supabase
      .from('processos')
      .select(`
        *,
        processo_sistemas!left(
          sistemas(
            nome
          )
        )
      `)
      .order('data_pregao', { ascending: true })

    if (error) throw error

    const processosComSistemas = await Promise.all(
      (data || []).map(async processo => {
        return {
          ...processo,
          sistemas_nomes: Array.isArray(processo.sistemas_ativos)
            ? await getSistemasNomes(processo.sistemas_ativos)
            : '-'
        }
      })
    )
    
    processos.value = processosComSistemas

  } catch (error) {
    console.error('Erro ao carregar processos:', error)
    processos.value = []
  } finally {
    isLoading.value = false
  }
}

// Nova função para buscar nomes dos sistemas
const getSistemasNomes = async (sistemasIds) => {
  if (!sistemasIds?.length) return '-'

  try {
    const { data } = await supabase
      .from('sistemas')
      .select('nome')
      .in('id', sistemasIds)

    return data?.map(s => s.nome).join(', ') || '-'
  } catch (error) {
    console.error('Erro ao buscar nomes dos sistemas:', error)
    return '-'
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
    if (!editingCell.value.value) {
      cancelEdit()
      return
    }

    let updateValue = editingCell.value.value

    // Formatação específica por tipo de campo
    switch (editingCell.value.field) {
      case 'data_pregao':
        // Converte data para formato ISO
        const [day, month, year] = editingCell.value.value.split('/')
        updateValue = `${year}-${month}-${day}`
        break
      case 'hora_pregao':
        // Garante formato HH:mm
        updateValue = editingCell.value.value.split(':').slice(0, 2).join(':')
        break
      case 'sistemas_ativos':
        // Garante que é um array
        updateValue = Array.isArray(editingCell.value.value) ? editingCell.value.value : []
        break
    }

    // Prepara dados para atualização
    const updateData = {
      [editingCell.value.field]: updateValue,
      updated_at: new Date().toISOString(),
      updated_by: (await supabase.auth.getUser()).data.user?.id
    }

    // Atualiza no banco de dados
    const { error } = await supabase
      .from('processos')
      .update(updateData)
      .eq('id', processo.id)

    if (error) throw error

    // Log da alteração
    await logSystemAction({
      tipo: 'atualizacao',
      tabela: 'processos', 
      registro_id: processo.id,
      campo_alterado: editingCell.value.field,
      dados_anteriores: processo[editingCell.value.field],
      dados_novos: updateValue
    })

    // Recarrega os processos após atualização bem-sucedida
    await loadProcessos()

  } catch (error) {
    console.error('Erro ao atualizar:', error)
    // Exibe mensagem de erro para o usuário
    alert('Erro ao atualizar o campo. Por favor, tente novamente.')
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

// Adicione esta função junto com as outras
const getEmpresaNome = (empresaId) => {
  const empresa = empresas.value.find(e => e.id === empresaId)
  return empresa ? empresa.nome : '-'
}

// Adicione esta função
const getDistancias = async (processoId) => {
  const { data } = await supabase
    .from('processo_distancias')
    .select('*')
    .eq('processo_id', processoId)
    .order('created_at', { ascending: true })
  
  return data || []
}

// Para cada cache no sistema (exemplo para processamentosCache):
const processamentosCache = {
  dados: new Map(),
  coordenadas: new Map(),
  orgaos: new Map(),
  
  limparCache() {
    this.dados.clear();
    this.coordenadas.clear();
    this.orgaos.clear();
    console.log('Cache limpo com sucesso');
  }
}

// Consolidação de todos os onMounted em um único bloco
onMounted(async () => {
  try {
    // 1. Iniciar monitoramento de visibilidade da página
    startVisibilityMonitoring()
    
    // 2. Limpar cache antes de carregar novos dados
    if (processamentosCache) {
      processamentosCache.limparCache()
    }
    
    // 3. Registrar listener para fechar dropdowns de filtros ao clicar fora
    document.addEventListener('click', (e) => {
      const isFilterClick = e.target.closest('.filtro-container')
      if (!isFilterClick) {
        Object.keys(mostrarFiltro.value).forEach(key => {
          mostrarFiltro.value[key] = false
        })
      }
    })
    
    // 4. Carregar dados em paralelo para melhor desempenho
    await Promise.all([
      loadProcessos(),
      loadRepresentantes(),
      loadEmpresas(),
      loadPlataformas()
    ])
    
    // 5. Carregar configurações da interface
    loadColumnWidths()
    
    // 6. Configurar canal Realtime para atualizações em tempo real
    const channel = supabase.channel('processos-updates')
      .on('postgres_changes',
        { 
          event: '*',
          schema: 'public',
          table: 'processos'
        },
        () => {
          loadProcessos()
        }
      )
      .subscribe()
    
    // 7. Registrar canal no gerenciador
    SupabaseManager.addSubscription('processos-updates', channel)
    
    // 8. Iniciar atualização automática
    startAutoRefresh()
    
  } catch (error) {
    console.error('Erro na inicialização do componente:', error)
  }
})

// Manter o onUnmounted original para limpeza adequada
onUnmounted(() => {
  // Parar monitoramento de visibilidade
  stopVisibilityMonitoring()
  
  // Parar auto-refresh
  stopAutoRefresh()
  
  // Remover canal do Supabase
  const channel = SupabaseManager.getSubscription('processos-updates')
  if (channel) {
    supabase.removeChannel(channel)
    SupabaseManager.removeSubscription('processos-updates')
  }
})

const refreshInterval = ref(null)

const startAutoRefresh = () => {
  stopAutoRefresh() // Para evitar múltiplos intervalos
  refreshInterval.value = setInterval(() => {
    loadProcessos()
  }, 30000) // Atualiza a cada 30 segundos
}

const stopAutoRefresh = () => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
}

// No setup do componente
const loadData = async () => {
  await loadProcessos() // ou qualquer outra função que carregue seus dados
}

// Use o composable
useConnectionManager(loadData)
</script>

<style src="../assets/styles/ProcessosView.css"></style>
