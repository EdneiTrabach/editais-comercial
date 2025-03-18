<template>
  <div class="layout">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />

    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <!-- Header Section -->
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

      <!-- Active Filters -->
      <div class="filtros-ativos" v-if="temFiltrosAtivos">
        <span>Filtros ativos:</span>
        <button @click="limparFiltros" class="btn-limpar-filtros">
          Limpar todos os filtros
        </button>
      </div>

      <!-- Data Table -->
      <div class="table-container">
        <table class="excel-table resizable">
          <thead>
            <tr>
              <th class="row-number-cell"></th>
              <th 
                v-for="(coluna, index) in colunas" 
                :key="index" 
                class="resizable-column" 
                :data-field="coluna.campo"
                :style="{ width: colunasWidth[coluna.campo] }">
                <div class="th-content">
                  {{ coluna.titulo }}

                  <!-- Sort buttons for date column -->
                  <div v-if="coluna.campo === 'data_pregao'" class="sort-buttons">
                    <button 
                      class="btn-sort"
                      :class="{ active: sortConfig.field === 'data_pregao' && sortConfig.direction === 'asc' }"
                      @click="handleSort('data_pregao', 'asc')">
                      ▲
                    </button>
                    <button 
                      class="btn-sort"
                      :class="{ active: sortConfig.field === 'data_pregao' && sortConfig.direction === 'desc' }"
                      @click="handleSort('data_pregao', 'desc')">
                      ▼
                    </button>
                  </div>

                  <!-- Filter button for filterable columns -->
                  <div
                    v-if="['modalidade', 'estado', 'numero_processo', 'orgao', 'status', 'responsavel_nome', 'site_pregao', 'representante', 'empresa'].includes(coluna.campo)"
                    class="filtro-container">
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
            <tr 
              v-for="(processo, index) in processosFiltrados" 
              :key="processo.id" 
              class="resizable-row"
              :class="{ 'selected-row': selectedRow === processo.id }" 
              :data-status="processo.status"
              @click="selectRow(processo.id)" 
              :style="{ height: rowsHeight[processo.id] }">
              <td class="row-number-cell">{{ index + 1 }}</td>
              <td 
                v-for="coluna in colunas" 
                :key="coluna.campo" 
                :data-field="coluna.campo"
                @dblclick="handleDblClick(coluna.campo, processo, $event)">
                <!-- Editing Mode -->
                <template v-if="editingCell.id === processo.id && editingCell.field === coluna.campo">
                  <!-- Analysis Code field -->
                  <input 
                    v-if="coluna.campo === 'codigo_analise'" 
                    type="text" 
                    v-model="editingCell.value"
                    @blur="handleUpdate(processo)" 
                    @keyup.enter="handleUpdate(processo)" 
                    @keyup.esc="cancelEdit()"
                    placeholder="Digite o código">

                  <!-- Date field -->
                  <input 
                    v-if="coluna.campo === 'data_pregao'" 
                    ref="editInput" 
                    type="date" 
                    v-model="editingCell.value"
                    :min="new Date().toISOString().split('T')[0]" 
                    @blur="handleUpdate(processo)"
                    @keyup.enter="handleUpdate(processo)" 
                    @keyup.esc="cancelEdit()">

                  <!-- Time field -->
                  <input 
                    v-else-if="coluna.campo === 'hora_pregao'" 
                    type="time" 
                    v-model="editingCell.value" 
                    min="08:00"
                    max="18:00" 
                    @blur="handleUpdate(processo)" 
                    @keyup.enter="handleUpdate(processo)"
                    @keyup.esc="cancelEdit()">

                  <!-- State field -->
                  <select 
                    v-else-if="coluna.campo === 'estado'" 
                    v-model="editingCell.value"
                    @change="handleUpdate(processo)" 
                    @blur="handleUpdate(processo)" 
                    @keyup.esc="cancelEdit()">
                    <option value="">Selecione o estado...</option>
                    <option 
                      v-for="estado in estados" 
                      :key="estado.uf" 
                      :value="estado.uf">
                      {{ estado.nome }}
                    </option>
                  </select>

                  <!-- Impugnações field -->
                  <textarea 
                    v-else-if="coluna.campo === 'impugnacoes'" 
                    v-model="editingCell.value"
                    @blur="handleUpdate(processo)" 
                    @keyup.enter="handleUpdate(processo)" 
                    @keyup.esc="cancelEdit()"
                    rows="3" 
                    placeholder="Digite as impugnações..."></textarea>

                  <!-- Representative field -->
                  <select 
                    v-else-if="coluna.campo === 'representante'" 
                    v-model="editingCell.value"
                    @change="handleUpdate(processo)" 
                    @blur="handleUpdate(processo)" 
                    @keyup.esc="cancelEdit()">
                    <option value="">Selecione o representante...</option>
                    <option 
                      v-for="rep in representantes" 
                      :key="rep.id" 
                      :value="rep.id">
                      {{ rep.nome }}
                    </option>
                  </select>

                  <!-- Full Object field -->
                  <textarea 
                    v-else-if="coluna.campo === 'objeto_completo'" 
                    v-model="editingCell.value"
                    @blur="handleUpdate(processo)" 
                    @keyup.enter="handleUpdate(processo)" 
                    @keyup.esc="cancelEdit()"
                    rows="3"></textarea>

                  <!-- Modality field -->
                  <select 
                    v-else-if="coluna.campo === 'modalidade'" 
                    v-model="editingCell.value"
                    @blur="handleUpdate(processo)" 
                    @change="handleUpdate(processo)" 
                    @keyup.esc="cancelEdit()">
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

                  <!-- Status field -->
                  <select 
                    v-else-if="coluna.campo === 'status'" 
                    v-model="editingCell.value"
                    @change="handleUpdate(processo)" 
                    @blur="handleUpdate(processo)" 
                    @keyup.esc="cancelEdit()"
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

                  <!-- Systems field -->
                  <template
                    v-else-if="coluna.campo === 'sistemas_ativos' && editingCell.id === processo.id && editingCell.field === coluna.campo">
                    <div class="sistemas-dropdown-container">
                      <div class="sistemas-selected">
                        <div v-for="id in editingCell.value" :key="id" class="sistema-chip">
                          {{ getSistemaNome(id) }}
                          <span @click.stop="removerSistema(id)" class="sistema-remove">×</span>
                        </div>
                      </div>
                      <select multiple class="sistemas-select" @change="handleSistemasChange($event)">
                        <option 
                          v-for="sistema in sistemasAtivos" 
                          :key="sistema.id" 
                          :value="sistema.id"
                          :selected="editingCell.value && editingCell.value.includes(sistema.id)">
                          {{ sistema.nome }}
                        </option>
                      </select>
                    </div>
                  </template>

                  <!-- Default input for other fields -->
                  <input 
                    v-else 
                    type="text" 
                    v-model="editingCell.value" 
                    @blur="handleUpdate(processo)"
                    @keyup.enter="handleUpdate(processo)" 
                    @keyup.esc="cancelEdit()">
                </template>

                <!-- View Mode -->
                <template v-else>
                  <!-- Date field -->
                  <template v-if="coluna.campo === 'data_pregao'">
                    {{ formatDate(processo.data_pregao) }}
                  </template>

                  <!-- Time field -->
                  <template v-else-if="coluna.campo === 'hora_pregao'">
                    {{ formatTime(processo.hora_pregao) }}
                  </template>

                  <!-- Modality field -->
                  <template v-else-if="coluna.campo === 'modalidade'">
                    <span :title="formatModalidadeCompleta(processo.modalidade)">
                      {{ getModalidadeSigla(processo.modalidade) }}
                    </span>
                  </template>

                  <!-- Object fields -->
                  <span 
                    v-else-if="coluna.campo === 'objeto_resumido' || coluna.campo === 'objeto_completo'"
                    class="objeto-cell">
                    {{ processo[coluna.campo] || '-' }}
                  </span>

                  <!-- Representative field -->
                  <span v-else-if="coluna.campo === 'representante'">
                    {{ processo.representantes?.nome || '-' }}
                  </span>

                  <!-- Responsible name field -->
                  <span v-else-if="coluna.campo === 'responsavel_nome'">
                    {{ processo.profiles?.nome || '-' }}
                  </span>

                  <!-- Site field -->
                  <template v-else-if="coluna.campo === 'site_pregao'">
                    <div class="portal-link">
                      <a 
                        v-if="processo.site_pregao" 
                        :href="processo.site_pregao" 
                        target="_blank"
                        rel="noopener noreferrer" 
                        class="portal-button">
                        {{ getPlataformaNome(processo.site_pregao) }}
                      </a>
                      <span v-else>-</span>
                    </div>
                  </template>

                  <!-- Status field -->
                  <span v-else-if="coluna.campo === 'status'" :class="['status', processo.status]">
                    {{ formatStatus(processo.status) }}
                  </span>
                  
                  <!-- Company field -->
                  <template v-else-if="coluna.campo === 'empresa'">
                    <template v-if="editingCell.id === processo.id && editingCell.field === coluna.campo">
                      <select 
                        v-model="editingCell.value" 
                        @change="handleUpdate(processo)"
                        @blur="handleUpdate(processo)" 
                        @keyup.esc="cancelEdit()" 
                        class="empresa-select">
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

                  <!-- Distances field -->
                  <td v-else-if="coluna.campo === 'distancias'">
                    <div class="distancias-stack">
                      <div v-for="dist in getDistancias(processo.id)" :key="dist.id" class="distancia-chip">
                        {{ dist.distancia_km }}km ({{ dist.ponto_referencia_cidade }}/{{ dist.ponto_referencia_uf }})
                      </div>
                    </div>
                  </td>

                  <!-- Systems field -->
                  <template v-else-if="coluna.campo === 'sistemas_ativos'">
                    <div class="sistemas-chips">
                      <div v-if="processo.sistemas_ativos && processo.sistemas_ativos.length > 0" class="sistemas-lista">
                        {{ getSistemasNomesString(processo.sistemas_ativos) }}
                      </div>
                      <div v-else class="sem-sistemas">-</div>
                    </div>
                  </template>
                  
                  <!-- Responsible ID field -->
                  <template v-else-if="coluna.campo === 'responsavel_id'">
                    <!-- Edit mode -->
                    <select 
                      v-if="editingCell.id === processo.id && editingCell.field === coluna.campo"
                      v-model="editingCell.value" 
                      @blur="handleUpdate(processo)" 
                      @change="handleUpdate(processo)"
                      @keyup.esc="cancelEdit()" 
                      class="responsavel-select">
                      <option :value="null">Sem responsável</option>
                      <option v-for="resp in responsaveisAtivos" :key="resp.id" :value="resp.id">
                        {{ resp.nome }} {{ resp.departamento ? `(${resp.departamento})` : '' }}
                      </option>
                    </select>

                    <!-- View mode -->
                    <span v-else @dblclick="handleDblClick(coluna.campo, processo, $event)" class="responsavel-badge">
                      {{ getResponsavelNome(processo.responsavel_id) }}
                    </span>
                  </template>
                  
                  <!-- Distance type display -->
                  <template v-else-if="coluna.tipoExibicao === 'distancia'">
                    <span class="distancia-badge" v-if="formatarDistancia(processo) !== '-'">
                      {{ formatarDistancia(processo) }}
                    </span>
                    <span v-else>-</span>
                  </template>
                  
                  <!-- Representative ID field -->
                  <template v-else-if="coluna.campo === 'representante_id'">
                    <!-- Edit mode -->
                    <select 
                      v-if="editingCell.id === processo.id && editingCell.field === coluna.campo"
                      v-model="editingCell.value" 
                      @blur="handleUpdate(processo)" 
                      @change="handleUpdate(processo)" 
                      @keyup.esc="cancelEdit()" 
                      class="representante-select">
                      <option value="">Sem representante</option>
                      <option v-for="rep in representantes" :key="rep.id" :value="rep.id">
                        {{ rep.nome }} {{ rep.documento ? `(${rep.documento})` : '' }}
                      </option>
                    </select>

                    <!-- View mode -->
                    <span v-else @dblclick="handleDblClick(coluna.campo, processo, $event)" class="representante-display">
                      {{ getRepresentanteNome(processo.representante_id) }}
                    </span>
                  </template>
                  
                  <!-- Default display for other fields -->
                  <span v-else>
                    {{ processo[coluna.campo] || '-' }}
                  </span>
                </template>
              </td>
              
              <!-- Actions cell -->
              <td class="actions-cell">
                <div class="action-buttons">
                  <button class="btn-icon delete" @click="handleDelete(processo)">
                    <BaseImage src="icons/lixeira.svg" alt="Excluir" class="icon icon-delete" fallbackImage="icons/fallback.svg" />
                  </button>
                </div>
              </td>
              
              <!-- Row resize handle -->
              <div class="row-resize-handle" @mousedown.stop="startRowResize($event, processo.id)"></div>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Year tabs -->
      <div class="anos-tabs">
        <div class="tabs-header">
          <button 
            v-for="ano in anosDisponiveis" 
            :key="ano" 
            :class="['tab-button', { active: anoSelecionado === ano }]"
            @click="selecionarAno(ano)">
            {{ ano }}
          </button>
        </div>
      </div>

      <!-- Confirm dialog -->
      <div v-if="confirmDialog.show" class="confirm-dialog" :style="confirmDialog.position">
        <div class="confirm-content">
          <p>Deseja editar este campo?</p>
          <div class="confirm-actions">
            <button @click="handleConfirmEdit" class="btn-confirm">Confirmar</button>
            <button @click="hideConfirmDialog" class="btn-cancel">Cancelar</button>
          </div>
        </div>
      </div>

      <!-- Delete confirm dialog -->
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

      <!-- Systems dialog -->
      <div v-if="sistemasDialog.show" class="sistemas-dialog" :style="sistemasDialog.position">
        <div class="sistemas-dialog-content">
          <h3>Selecionar Sistemas</h3>
          <div class="sistemas-selected">
            <div v-for="id in editingCell.value" :key="id" class="sistema-chip">
              {{ getSistemaNome(id) }}
              <span @click.stop="removerSistema(id)" class="sistema-remove">×</span>
            </div>
          </div>
          <select multiple class="sistemas-select" @change="handleSistemasChange($event)">
            <option 
              v-for="sistema in sistemasAtivos" 
              :key="sistema.id" 
              :value="sistema.id"
              :selected="editingCell.value && editingCell.value.includes(sistema.id)">
              {{ sistema.nome }}
            </option>
          </select>
          <div class="sistemas-dialog-actions">
            <button @click="saveSistemas" class="btn-confirm">Salvar</button>
            <button @click="hideSistemasDialog" class="btn-cancel">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, onUnmounted, watch } from 'vue'
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

// Router and basic component state
const router = useRouter()
const isSidebarExpanded = ref(true)
const processos = ref([])
const loading = ref(false)
const isLoading = ref(false)
const loadingTimeout = ref(null)

// System cache
const sistemasNomesCache = ref({})
const responsaveisCache = ref(new Map())

// UI state
const confirmDialog = ref({
  show: false,
  position: {},
  callback: null
})

const deleteConfirmDialog = ref({
  show: false,
  processo: null
})

const sistemasDialog = ref({
  show: false,
  position: {},
  processo: null
})

const editingCell = ref({
  id: null,
  field: null,
  value: null
})

const sortConfig = ref({
  field: 'data_pregao',
  direction: 'asc'
})

const selectedRow = ref(null)
const anoSelecionado = ref(new Date().getFullYear())
const mostrarFiltro = ref({})
const filtros = ref({})
const estadoSearch = ref('')
const refreshInterval = ref(null)

// Reference Data
const responsaveis = ref([])
const responsaveisAtivos = ref([])
const representantes = ref([])
const empresas = ref([])
const sistemasAtivos = ref([])
const plataformas = ref([])

// UI Configuration
const colunasWidth = ref({})
const rowsHeight = ref({})

// Table columns definition
const colunas = [
  { titulo: 'Data', campo: 'data_pregao' },
  { titulo: 'Hora', campo: 'hora_pregao' },
  { titulo: 'Modalidade', campo: 'modalidade' },
  { titulo: 'Estado', campo: 'estado' },
  { titulo: 'Nº Processo', campo: 'numero_processo' },
  { titulo: 'Objeto Resumido', campo: 'objeto_resumido' },
  {
    titulo: 'Sistemas',
    campo: 'sistemas_ativos',
    tabela: 'processo',
    tipo: 'array'
  },
  { titulo: 'Código Análise', campo: 'codigo_analise' },
  { titulo: 'Órgão', campo: 'orgao' },
  { titulo: 'Objeto Completo', campo: 'objeto_completo' },
  { titulo: 'Status', campo: 'status' },
  {
    titulo: 'Responsável',
    campo: 'responsavel_id',
    tabelaRelacionada: 'responsaveis_processos',
    campoExibicao: 'nome',
    tipoEdicao: 'select'
  },
  {
    titulo: 'Distâncias',
    campo: 'distancia_km',
    tipoExibicao: 'distancia',
    camposDisplay: ['distancia_km', 'ponto_referencia_cidade', 'ponto_referencia_uf']
  },
  { titulo: 'Portal', campo: 'site_pregao' },
  {
    titulo: 'Representante',
    campo: 'representante_id',
    tabelaRelacionada: 'representantes',
    campoExibicao: 'nome',
    tipoEdicao: 'select'
  },
  { titulo: 'Impugnações', campo: 'impugnacoes' },
  {
    titulo: 'Empresa Participante',
    campo: 'empresa_id',
    tabelaRelacionada: 'empresas',
    campoExibicao: 'nome'
  }
]

// Brazilian states
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

// Form data
const formData = ref({
  status: null
})

// Computed properties
const anosDisponiveis = computed(() => {
  const anos = new Set(processos.value.map(p => p.ano))
  return Array.from(anos).sort((a, b) => b - a) // Descending order
})

const estadosFiltrados = computed(() => {
  if (!estadoSearch.value) return estados.value

  const busca = estadoSearch.value.toLowerCase()
  return estados.value.filter(estado =>
    estado.nome.toLowerCase().includes(busca) ||
    estado.uf.toLowerCase().includes(busca)
  )
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

const temFiltrosAtivos = computed(() => {
  return Object.values(filtros.value).some(f => f.length > 0)
})

const empresasCadastradas = computed(() => {
  return empresas.value.filter(empresa => empresa.id) // Filter only valid companies
})

const showPlataformaField = computed(() => {
  return formData.value.modalidade === 'pregao_eletronico';
});

// Helper functions
const getSistemasNomesFromCache = async (sistemasIds) => {
  if (!sistemasIds || !sistemasIds.length) return '-';

  // Create a unique key for this set of IDs
  const cacheKey = sistemasIds.sort().join(',');

  // Check if we already have this result in cache
  if (sistemasNomesCache.value[cacheKey]) {
    return sistemasNomesCache.value[cacheKey];
  }

  // If not in cache, fetch and store
  const resultado = await getSistemasNomes(sistemasIds);
  sistemasNomesCache.value[cacheKey] = resultado;

  return resultado;
}

const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    // Ensure we're only dealing with the date part
    const [date] = dateString.split('T');
    const [year, month, day] = date.split('-');

    // Return the formatted date without timezone manipulation
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
}

const formatTime = (time) => {
  if (!time) return '-';
  try {
    const cleanTime = time.split(':').slice(0, 2).join(':');
    return cleanTime;
  } catch (error) {
    console.error('Error formatting time:', error);
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

const getPlataformaNome = (url) => {
  if (!url) return '-'
  const plataforma = plataformas.value.find(p => p.url === url)
  return plataforma ? plataforma.nome : url
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

const getEmpresaNome = (empresaId) => {
  const empresa = empresas.value.find(e => e.id === empresaId)
  return empresa ? empresa.nome : '-'
}

const getResponsavelNome = (id) => {
  if (!id) return 'Sem responsável';
  
  // Try to fetch from cache first
  const cachedResp = responsaveisCache.value.get(id);
  if (cachedResp) {
    return cachedResp.nome || 'Sem nome';
  }
  
  // If not in cache, search the array
  const responsavel = responsaveisAtivos.value.find(r => r.id === id);
  if (responsavel) {
    // Update cache for future queries
    responsaveisCache.value.set(id, responsavel);
    return responsavel.nome || 'Sem nome';
  }
  
  return 'Responsável não encontrado';
};

const getRepresentanteNome = (id) => {
  if (!id) return 'Sem representante';

  const representante = representantes.value.find(r => r.id === id);
  return representante ? representante.nome : 'Carregando...';
};

const getSistemaNome = (id) => {
  return sistemasNomesCache.value[id] || 'Sistema não encontrado'
}

const getSistemasNomesString = (ids) => {
  if (!ids || !ids.length) return '-'
  return ids.map(id => getSistemaNome(id)).join(', ')
}

const formatarDistancia = (processo) => {
  if (!processo) return '-';

  // Check if the process has basic distance data
  if (processo.distancia_km && processo.ponto_referencia_cidade && processo.ponto_referencia_uf) {
    return `${processo.distancia_km} km (${processo.ponto_referencia_cidade}/${processo.ponto_referencia_uf})`;
  }

  return '-';
};

// API and data loading functions
const handleLoading = async (loadingFunction) => {
  try {
    isLoading.value = true
    await loadingFunction()
  } catch (error) {
    console.error('Error:', error)
  } finally {
    isLoading.value = false
  }
}

const loadProcessos = async () => {
  if (isLoading.value) return

  try {
    isLoading.value = true
    console.log('Starting process loading...')

    // Query processes
    const { data, error } = await supabase
      .from('processos')
      .select(`*`)
      .order('data_pregao', { ascending: true })

    if (error) throw error

    // Additional data processing
    const processosComNomes = []

    for (const processo of data || []) {
      // Fetch system names for each process
      let sistemasNomes = '-'
      if (processo.sistemas_ativos && processo.sistemas_ativos.length > 0) {
        sistemasNomes = await getSistemasNomes(processo.sistemas_ativos)
      }

      // Add the process with sistemas_nomes field populated
      processosComNomes.push({
        ...processo,
        sistemas_nomes: sistemasNomes
      })
    }

    processos.value = processosComNomes
    console.log('Processes loaded with system names:', processos.value.length)

  } catch (error) {
    console.error('Error loading processes:', error)
  } finally {
    isLoading.value = false
  }
}

const getSistemasNomes = async (sistemasIds) => {
  if (!sistemasIds || !sistemasIds.length) return '-'

  try {
    console.log('Fetching system names for IDs:', sistemasIds)

    const { data, error } = await supabase
      .from('sistemas')
      .select('nome')
      .in('id', sistemasIds)

    if (error) throw error

    const nomes = data?.map(s => s.nome) || []
    console.log('Names found:', nomes)

    return nomes.join(', ') || '-'
  } catch (error) {
    console.error('Error fetching system names:', error)
    return '-'
  }
}

const loadResponsaveis = async () => {
  try {
    console.log('Loading responsibles...');
    const { data, error } = await supabase
      .from('responsaveis_processos')
      .select('id, nome, email, departamento')
      .eq('status', 'ACTIVE')
      .order('nome');

    if (error) throw error;

    // Assign to responsibles refs
    responsaveis.value = data || [];
    responsaveisAtivos.value = data || [];

    // Pre-load the responsibles cache as a Map
    responsaveisCache.value.clear(); // Clear cache first
    data?.forEach(resp => {
      if (resp && resp.id) {
        responsaveisCache.value.set(resp.id, resp);
      }
    });

    console.log(`Loaded ${data?.length || 0} responsibles`);
    return data;
  } catch (error) {
    console.error('Error loading responsibles:', error);
    return [];
  }
};

const loadRepresentantes = async () => {
  try {
    console.log('Starting representatives loading...');
    
    const { data, error } = await supabase
      .from('representantes')
      .select('*')
      .order('nome');

    if (error) {
      console.error('Error in representatives query:', error);
      throw error;
    }
    
    console.log(`Loaded ${data?.length || 0} representatives:`, data);
    representantes.value = data || [];
    
    return data;
  } catch (error) {
    console.error('Error loading representatives:', error);
    representantes.value = [];
    return [];
  }
}

const loadEmpresas = async () => {
  try {
    const { data, error } = await supabase
      .from('empresas')
      .select('id, nome, cnpj')
      .order('nome')

    if (error) throw error
    empresas.value = data || []
  } catch (error) {
    console.error('Error loading companies:', error)
    empresas.value = []
  }
}

const loadPlataformas = async () => {
  try {
    const { data, error } = await supabase
      .from('plataformas')
      .select('*')

    if (error) throw error
    plataformas.value = data
  } catch (error) {
    console.error('Error loading platforms:', error)
  }
}

const loadSistemas = async () => {
  try {
    const { data, error } = await supabase
      .from('sistemas')
      .select('id, nome')
      .eq('status', 'ACTIVE')
      .order('nome')

    if (error) throw error
    sistemasAtivos.value = data || []

    // Update names cache
    data.forEach(sistema => {
      sistemasNomesCache.value[sistema.id] = sistema.nome
    })
  } catch (error) {
    console.error('Error loading systems:', error)
  }
}

const getDistancias = async (processoId) => {
  const { data } = await supabase
    .from('processo_distancias')
    .select('*')
    .eq('processo_id', processoId)
    .order('created_at', { ascending: true })

  return data || []
}

// Event handlers
const handleSidebarToggle = (expanded) => {
  isSidebarExpanded.value = expanded
}

const handleNewProcess = () => {
  router.push('/editais')
}

const handleDelete = (processo) => {
  deleteConfirmDialog.value = {
    show: true,
    processo
  }
}

const hideDeleteDialog = () => {
  deleteConfirmDialog.value = {
    show: false,
    processo: null
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
    console.error('Error deleting:', error)
    alert('Error deleting process')
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
    console.error('Error logging action:', error)
  }
}

const exportToExcel = () => {
  const dataToExport = processos.value.map(processo => ({
    'Data': formatDate(processo.data_pregao),
    'Hora': formatTime(processo.hora_pregao),
    'Número do Processo': processo.numero_processo,
    'Código Análise': processo.codigo_analise || '-',
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

const toggleFiltro = (coluna) => {
  mostrarFiltro.value[coluna] = !mostrarFiltro.value[coluna]
}

const limparFiltros = () => {
  Object.keys(filtros.value).forEach(key => {
    filtros.value[key] = []
  })
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

const selecionarAno = (ano) => {
  anoSelecionado.value = ano
}

const selectRow = (id) => {
  selectedRow.value = id
}

const handleModalidadeChange = () => {
  if (formData.value.modalidade !== 'pregao_eletronico') {
    formData.value.site_pregao = '';
  }
};

// Table editing functions
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

const loadColumnWidths = () => {
  try {
    const savedWidths = localStorage.getItem('table-columns-width')
    if (savedWidths) {
      colunasWidth.value = JSON.parse(savedWidths)
    } else {
      colunas.forEach(coluna => {
        colunasWidth.value[coluna.campo] = '150px'
      })
    }
  } catch (error) {
    console.error('Error loading column widths:', error)
  }
}

const saveColumnWidths = () => {
  try {
    localStorage.setItem('table-columns-width', JSON.stringify(colunasWidth.value))
  } catch (error) {
    console.error('Error saving column widths:', error)
  }
}

// Cell editing functions
const handleDblClick = async (field, processo, event) => {
  if (editingCell.value.id === processo.id && editingCell.value.field === field) {
    return;
  }

  const cell = event.target.closest('td');
  const rect = cell.getBoundingClientRect();

  // Special handling for sistemas_ativos field
  if (field === 'sistemas_ativos') {
    editingCell.value = {
      id: processo.id,
      field,
      value: Array.isArray(processo[field]) ? [...processo[field]] : []
    };

    sistemasDialog.value = {
      show: true,
      position: {
        top: `${rect.bottom + 10}px`,
        left: `${rect.left}px`
      },
      processo
    };
    return;
  }

  // Check if field is responsavel_id
  if (field === 'responsavel_id') {
    // Check if we have responsibles loaded
    if (responsaveisAtivos.value.length === 0) {
      console.warn('Responsibles list not loaded. Loading now...');
      await loadResponsaveis();
    }
  }

  // Check if field is representante_id
  if (field === 'representante_id') {
    console.log('Clicked on representative field');
    debugRepresentantes(); // Add this log

    // Check if we have representatives loaded
    if (representantes.value.length === 0) {
      console.log('Loading representatives on demand...');
      await loadRepresentantes();
      
      debugRepresentantes(); // Log after loading
      
      // Check again after loading
      if (representantes.value.length === 0) {
        console.error('Could not load representatives.');
        alert('Could not load the list of representatives.');
        return;
      }
    }
  }

  // Default behavior for other fields
  confirmDialog.value = {
    show: true,
    position: {
      top: `${rect.bottom + 2}px`,
      left: `${rect.left}px`
    },
    callback: () => {
      editingCell.value = {
        id: processo.id,
        field,
        value: processo[field]
      };
    }
  };
};

const handleConfirmEdit = () => {
  // Execute callback to start editing
  confirmDialog.value.callback?.()
  hideConfirmDialog()

  // Focus on input field after rendering
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

const cancelEdit = () => {
  editingCell.value = {
    id: null,
    field: null,
    value: null
  }
}

const handleUpdate = async (processo) => {
  try {
    // Special case for responsavel_id:
    // Convert empty string to null - important for UUID type
    if (editingCell.value.field === 'responsavel_id' && editingCell.value.value === '') {
      editingCell.value.value = null;
    }

    if (!editingCell.value.value && editingCell.value.field !== 'status' && editingCell.value.field !== 'responsavel_id') {
      cancelEdit()
      return
    }

    let updateValue = editingCell.value.value

    // Specific formatting by field type
    switch (editingCell.value.field) {
      case 'data_pregao':
        // Ensure date is in the correct format for the database
        if (typeof updateValue === 'string') {
          if (updateValue.includes('/')) {
            // Convert from DD/MM/YYYY to YYYY-MM-DD
            const [day, month, year] = updateValue.split('/')
            updateValue = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
          } else if (updateValue.includes('-')) {
            // Already in YYYY-MM-DD format, just ensure
            const [year, month, day] = updateValue.split('-')
            updateValue = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
          }
        }
        break

      case 'hora_pregao':
        // Ensure HH:mm format
        if (typeof updateValue === 'string') {
          const [hours, minutes] = updateValue.split(':')
          updateValue = `${hours.padStart(2, '0')}:${minutes ? minutes.padStart(2, '0') : '00'}`
        }
        break

      case 'sistemas_ativos':
        // Ensure it's an array
        updateValue = Array.isArray(updateValue) ? updateValue : []
        break

      case 'responsavel_id':
        // No conversion needed, but ensure it's UUID or null
        updateValue = updateValue || null;
        console.log('Updating responsible to:', updateValue);

        if (updateValue) {
          // Check if the responsible exists in the loaded list
          const responsavel = responsaveisAtivos.value.find(r => r.id === updateValue);
          if (responsavel) {
            console.log(`Selected responsible name: ${responsavel.nome}`);
            // Update cache if needed
            responsaveisCache.value.set(updateValue, responsavel);
          } else {
            console.warn('Selected responsible ID not found in list!');
            // Reload responsibles if needed
            await loadResponsaveis();
          }
        }
        break;

      case 'representante_id':
        // Ensure it's UUID or null
        updateValue = updateValue || null;
        console.log('Updating representative to:', updateValue);

        if (updateValue) {
          // Check if the representative exists in the loaded list
          const representante = representantes.value.find(r => r.id === updateValue);
          if (representante) {
            console.log(`Selected representative name: ${representante.nome}`);
          } else {
            console.warn('Selected representative ID not found in list!');
            // Reload the list if not found
            await loadRepresentantes();
          }
        }
        break;
    }

    // Check if value actually changed to avoid unnecessary updates
    if (updateValue === processo[editingCell.value.field]) {
      console.log('Value did not change, canceling update')
      cancelEdit()
      return
    }

    console.log(`Updating ${editingCell.value.field} to:`, updateValue)

    // Prepare data for update
    const updateData = {
      [editingCell.value.field]: updateValue,
      updated_at: new Date().toISOString()
    }

    // Add user who is making the change if available
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.id) {
      updateData.updated_by = user.id
    }

    // Update in database
    console.log('Update data:', updateData)

    const { error } = await supabase
      .from('processos')
      .update(updateData)
      .eq('id', processo.id)

    if (error) {
      console.error('Error updating:', error)
      throw error
    }

    // Log the change
    try {
      await logSystemAction({
        tipo: 'atualizacao',
        tabela: 'processos',
        registro_id: processo.id,
        campo_alterado: editingCell.value.field,
        dados_anteriores: processo[editingCell.value.field],
        dados_novos: updateValue
      })
    } catch (logError) {
      // If log fails, just report the error but continue
      console.warn('Error in change log:', logError)
    }

    // Reload processes after successful update
    await loadProcessos()
    console.log('Update completed successfully')

  } catch (error) {
    console.error('Error updating:', error)
    // Display error message to the user
    alert(`Error updating field: ${error.message || 'Check the data and try again'}`)
  } finally {
    cancelEdit()
  }
}

// Systems handling
const handleSistemasChange = (event) => {
  // Get selected values from the multiple select
  const selectedOptions = Array.from(event.target.selectedOptions).map(option => option.value)
  editingCell.value.value = selectedOptions
}

const removerSistema = (id) => {
  if (!editingCell.value.value) return

  const index = editingCell.value.value.indexOf(id)
  if (index !== -1) {
    const newSistemas = [...editingCell.value.value]
    newSistemas.splice(index, 1)
    editingCell.value.value = newSistemas
  }
}

const saveSistemas = async () => {
  try {
    if (!editingCell.value.id || !sistemasDialog.value.processo) {
      hideSistemasDialog();
      return;
    }

    const processo = sistemasDialog.value.processo;
    const updateData = {
      sistemas_ativos: editingCell.value.value,
      updated_at: new Date().toISOString()
    };

    // Add user who is making the change if available
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      updateData.updated_by = user.id;
    }

    const { error } = await supabase
      .from('processos')
      .update(updateData)
      .eq('id', processo.id);

    if (error) throw error;

    // Log the change
    await logSystemAction({
      tipo: 'atualizacao',
      tabela: 'processos',
      registro_id: processo.id,
      campo_alterado: 'sistemas_ativos',
      dados_anteriores: processo.sistemas_ativos,
      dados_novos: editingCell.value.value
    });

    // Reload processes
    await loadProcessos();

    hideSistemasDialog();
  } catch (error) {
    console.error('Error saving systems:', error);
    alert('Error saving systems');
  }
};

const hideSistemasDialog = () => {
  sistemasDialog.value = {
    show: false,
    position: {},
    processo: null
  };

  // Clear editing state
  editingCell.value = {
    id: null,
    field: null,
    value: null
  };
};

// Page visibility and auto-refresh
const pageVisibilityHandler = () => {
  if (!document.hidden) {
    loadProcessos().catch(console.error) // Load in background
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

const startAutoRefresh = () => {
  stopAutoRefresh() // To avoid multiple intervals
  refreshInterval.value = setInterval(() => {
    loadProcessos()
  }, 30000) // Update every 30 seconds
}

const stopAutoRefresh = () => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
}

// Debugging function
const debugRepresentantes = () => {
  console.log(`Status of representatives: 
  - Array loaded: ${representantes.value ? 'Yes' : 'No'}
  - Quantity: ${representantes.value?.length || 0}
  - First representative: ${representantes.value?.[0]?.nome || 'None'}`);
}

// Validation helpers
const validarIdRelacionamento = async (tabela, campo, id) => {
  if (!id) return null; // Null values are valid
  
  try {
    const { data, error } = await supabase
      .from(tabela)
      .select('id')
      .eq('id', id)
      .single();
      
    if (error || !data) {
      console.warn(`ID ${id} not found in table ${tabela}, will be considered null`);
      return null;
    }
    
    return id; // Valid ID
  } catch (err) {
    console.error(`Error validating ID in ${tabela}:`, err);
    return null;
  }
};

// Form submission
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
      responsavel_id: formData.value.responsavel_id,
      representante_id: formData.value.representante_id
    }

    console.log('Data to be inserted:', {
      data_pregao: dataPregao.toISOString().split('T')[0],
      hora_pregao: formData.value.hora_pregao
    });

    const { error } = await supabase
      .from('processos')
      .insert(processoData)

    if (error) throw error
    alert('Process registered successfully!')
    router.push('/processos')
  } catch (error) {
    console.error('Error:', error)
    alert('Error registering process')
  }
};

// Responsible assignment functions
const ensureResponsaveisCarregados = async () => {
  if (responsaveisAtivos.value.length === 0) {
    console.log('Responsibles not loaded, loading now...');
    await loadResponsaveis();
    return true;
  }
  return false;
}

const atribuirResponsavelRandom = async (processoId) => {
  try {
    // Make sure we have responsibles loaded
    if (responsaveisAtivos.value.length === 0) {
      await loadResponsaveis();
    }
    
    if (responsaveisAtivos.value.length === 0) {
      console.error("No active responsibles registered");
      return;
    }
    
    // Select a random responsible
    const randomIndex = Math.floor(Math.random() * responsaveisAtivos.value.length);
    const responsavelSelecionado = responsaveisAtivos.value[randomIndex];
    
    // Update the process
    const { error } = await supabase
      .from('processos')
      .update({ 
        responsavel_id: responsavelSelecionado.id,
        updated_at: new Date().toISOString() 
      })
      .eq('id', processoId);
      
    if (error) throw error;
    console.log(`Responsible ${responsavelSelecionado.nome} assigned to process ${processoId}`);
    
    // Reload processes
    await loadProcessos();
  } catch (error) {
    console.error("Error assigning responsible:", error);
  }
};

const atribuirResponsaveisAProcessosPendentes = async () => {
  try {
    // Make sure we have responsibles loaded
    if (responsaveisAtivos.value.length === 0) {
      await loadResponsaveis();
    }
    
    if (responsaveisAtivos.value.length === 0) {
      console.error("No active responsibles registered");
      return;
    }
    
    // Filter processes without responsibles
    const processosSemResponsavel = processos.value.filter(p => !p.responsavel_id);
    console.log(`Found ${processosSemResponsavel.length} processes without responsible`);
    
    if (processosSemResponsavel.length === 0) {
      alert("All processes already have assigned responsibles!");
      return;
    }
    
    // Confirm operation
    if (!confirm(`Do you want to assign responsibles to ${processosSemResponsavel.length} pending processes?`)) {
      return;
    }
    
    // Distribute responsibles in a balanced way
    let contadorResponsaveis = 0;
    const totalResponsaveis = responsaveisAtivos.value.length;
    
    // For each process without responsible
    for (const processo of processosSemResponsavel) {
      // Choose a responsible in a rotating fashion
      const responsavelSelecionado = responsaveisAtivos.value[contadorResponsaveis % totalResponsaveis];
      
      // Update the process with the chosen responsible
      const { error } = await supabase
        .from('processos')
        .update({ 
          responsavel_id: responsavelSelecionado.id,
          updated_at: new Date().toISOString(),
          updated_by: (await supabase.auth.getUser()).data.user?.id || null
        })
        .eq('id', processo.id);
        
      if (error) {
        console.error(`Error assigning responsible to process ${processo.numero_processo}:`, error);
      } else {
        console.log(`Responsible ${responsavelSelecionado.nome} assigned to process ${processo.numero_processo}`);
      }
      
      // Advance to the next responsible
      contadorResponsaveis++;
    }
    
    // Reload processes after updates
    await loadProcessos();
    
    alert(`Responsibles successfully assigned to ${processosSemResponsavel.length} processes!`);
  } catch (error) {
    console.error("Error assigning responsibles:", error);
    alert("An error occurred while assigning responsibles");
  }
};

// Helper for filter options
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

// Initialize filters
const initializeFiltros = () => {
  const filtrosIniciais = {}
  colunas.forEach(coluna => {
    filtrosIniciais[coluna.campo] = []
  })
  return filtrosIniciais
}

// Lifecycle hooks
onMounted(async () => {
  try {
    // 1. Start page visibility monitoring
    startVisibilityMonitoring()

    // 2. Initialize filters
    filtros.value = initializeFiltros()

    // 3. Register listener to close filter dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      const isFilterClick = e.target.closest('.filtro-container')
      if (!isFilterClick) {
        Object.keys(mostrarFiltro.value).forEach(key => {
          mostrarFiltro.value[key] = false
        })
      }
    })

    // 4. Load data in parallel for better performance
    console.log('Starting data loading...');

    // Load responsibles early
    await loadResponsaveis();
    console.log('Responsibles initially loaded:', responsaveisAtivos.value.length);

    // Then load other data in parallel
    await Promise.all([
      loadProcessos(),
      loadRepresentantes(),
      loadEmpresas(),
      loadPlataformas(),
      loadSistemas(),
    ]);

    console.log('All other data loaded successfully!');

    // 5. Load interface settings
    loadColumnWidths()

    // 6. Set up Realtime channel for real-time updates
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

    // 7. Register channel in manager
    SupabaseManager.addSubscription('processos-updates', channel)

    // 8. Start auto-refresh
    startAutoRefresh()

  } catch (error) {
    console.error('Error in component initialization:', error)
  }
})

// Cleanup on unmount
onUnmounted(() => {
  // Stop visibility monitoring
  stopVisibilityMonitoring()

  // Stop auto-refresh
  stopAutoRefresh()

  // Remove Supabase channel
  const channel = SupabaseManager.getSubscription('processos-updates')
  if (channel) {
    supabase.removeChannel(channel)
    SupabaseManager.removeSubscription('processos-updates')
  }
})

// Use connection manager
useConnectionManager(loadProcessos)
</script>

<style src="@/assets/styles/ProcessosView.css"></style>