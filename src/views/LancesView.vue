<!-- src/views/LancesView.vue -->
<template>
  <div class="layout">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />
    
    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <h1>Planilha de Lances</h1>
      
      <!-- Seleção de Processo -->
      <div v-if="step === 1" class="processo-selection">
        <h2>Selecione o Processo</h2>
        <div class="processos-grid">
          <div 
            v-for="processo in processos" 
            :key="processo.id"
            class="processo-card"
            :class="{ 'selected': selectedProcesso === processo.id }"
            @click="selectProcesso(processo)"
          >
            <h3>{{ processo.numero_processo }}</h3>
            <div class="processo-info">
              <p><strong>Órgão:</strong> {{ processo.orgao }}</p>
              <p><strong>Data:</strong> {{ formatDate(processo.data_pregao) }}</p>
              <p><strong>Hora:</strong> {{ processo.hora_pregao }}</p>
              <p class="objeto">{{ processo.objeto_resumido }}</p>
            </div>
            <div class="processo-status">
              {{ formatStatus(processo.status) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Seleção de Sistemas e Itens -->
      <div v-if="step === 2" class="sistemas-selection">
        <h2>Selecione os Itens da Proposta</h2>
        <div class="sistemas-grid">
          <div 
            v-for="sistema in sistemas" 
            :key="sistema.id"
            class="sistema-card"
          >
            <h3>{{ sistema.nome }}</h3>
            <div class="itens-list">
              <label 
                v-for="item in itensDisponiveis" 
                :key="item.id"
                class="item-checkbox"
              >
                <input 
                  type="checkbox"
                  v-model="itensSelecionados"
                  :value="item.id"
                >
                {{ item.nome }}
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Planilha de Valores -->
      <div v-if="step === 3" class="planilha-container">
        <h2>Preencha os Valores</h2>
        <table class="planilha-valores">
          <thead>
            <tr>
              <th>Item</th>
              <th>Descrição</th>
              <th>Valor Unitário</th>
              <th>Quantidade</th>
              <th>Total</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in itensPlanilha" :key="index">
              <td>{{ item.nome }}</td>
              <td>
                <input 
                  v-model="item.descricao" 
                  type="text"
                  class="input-descricao"
                >
              </td>
              <td>
                <input 
                  v-model="item.valorUnitario"
                  type="number"
                  class="input-valor"
                  @input="calcularTotal(item)"
                >
              </td>
              <td>
                <input 
                  v-model="item.quantidade"
                  type="number"
                  class="input-quantidade"
                  @input="calcularTotal(item)"
                >
              </td>
              <td>{{ formatarMoeda(item.total) }}</td>
              <td>
                <button @click="removerItem(index)" class="btn-remover">
                  Remover
                </button>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4" class="total-label">Total Geral:</td>
              <td>{{ formatarMoeda(totalGeral) }}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>

        <div class="acoes-planilha">
          <button @click="adicionarItem" class="btn-adicionar">
            Adicionar Item
          </button>
          <button @click="exportarPDF" class="btn-exportar">
            Exportar PDF
          </button>
          <button @click="exportarExcel" class="btn-exportar">
            Exportar Excel
          </button>
        </div>
      </div>

      <!-- Navegação entre etapas -->
      <div class="navigation-buttons">
        <button 
          v-if="step > 1" 
          @click="voltarEtapa" 
          class="btn-voltar"
        >
          Voltar
        </button>
        <button 
          v-if="step < 3 && podeAvancar" 
          @click="avancarEtapa" 
          class="btn-avancar"
        >
          Avançar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue' // Adicione onMounted e onUnmounted aqui
import { supabase } from '@/lib/supabase'
import TheSidebar from '@/components/TheSidebar.vue'
import { utils, writeFileXLSX } from 'xlsx'
import html2pdf from 'html2pdf.js'
import { useConnectionManager } from '@/composables/useConnectionManager'
import { SupabaseManager } from '@/lib/supabaseManager'

const step = ref(1)
const isSidebarExpanded = ref(true)
const processos = ref([])
const sistemas = ref([])
const selectedProcesso = ref(null)
const itensSelecionados = ref([])
const itensPlanilha = ref([])

const itensDisponiveis = [
  { id: 1, nome: 'Manutenção Mensal' },
  { id: 2, nome: 'Treinamento' },
  { id: 3, nome: 'Implantação' },
  { id: 4, nome: 'Customização' },
  { id: 5, nome: 'Outros' }
]

// Função para formatar status do processo
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

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('pt-BR')
}

// Carregar processos do Supabase
const loadProcessos = async () => {
  try {
    const { data, error } = await supabase
      .from('processos')
      .select('*')
      .eq('status', 'vamos_participar') // Adiciona filtro por status
      .order('created_at', { ascending: false })

    if (error) throw error
    processos.value = data
  } catch (error) {
    console.error('Erro ao carregar processos:', error)
  }
}

// Carregar sistemas do processo selecionado
const loadSistemas = async (processoId) => {
  try {
    const { data, error } = await supabase
      .from('sistemas')
      .select('*')
      .eq('processo_id', processoId)

    if (error) throw error
    sistemas.value = data
  } catch (error) {
    console.error('Erro ao carregar sistemas:', error)
  }
}

const selectProcesso = async (processo) => {
  selectedProcesso.value = processo.id
  await loadSistemas(processo.id) // Carrega os sistemas do processo selecionado
  step.value = 2 // Avança para a etapa 2 após selecionar o processo
}

const formatarMoeda = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor)
}

const calcularTotal = (item) => {
  item.total = item.valorUnitario * item.quantidade
}

const totalGeral = computed(() => {
  return itensPlanilha.value.reduce((acc, item) => acc + (item.total || 0), 0)
})

const podeAvancar = computed(() => {
  switch (step.value) {
    case 1:
      return selectedProcesso.value !== null
    case 2:
      return itensSelecionados.value.length > 0
    default:
      return false
  }
})

const adicionarItem = () => {
  itensPlanilha.value.push({
    nome: '',
    descricao: '',
    valorUnitario: 0,
    quantidade: 1,
    total: 0
  })
}

const removerItem = (index) => {
  itensPlanilha.value.splice(index, 1)
}

const exportarPDF = () => {
  const element = document.querySelector('.planilha-container')
  html2pdf()
    .from(element)
    .save('proposta.pdf')
}

const exportarExcel = () => {
  const ws = utils.json_to_sheet(itensPlanilha.value)
  const wb = utils.book_new()
  utils.book_append_sheet(wb, ws, 'Proposta')
  writeFileXLSX(wb, 'proposta.xlsx')
}

const voltarEtapa = () => {
  if (step.value > 1) {
    step.value--
  }
}

const avancarEtapa = () => {
  if (step.value < 3 && podeAvancar.value) {
    step.value++
    if (step.value === 3) {
      // Prepara os itens selecionados para a planilha
      itensPlanilha.value = itensSelecionados.value.map(itemId => {
        const item = itensDisponiveis.find(i => i.id === itemId)
        return {
          nome: item.nome,
          descricao: '',
          valorUnitario: 0,
          quantidade: 1,
          total: 0
        }
      })
    }
  }
}

const loadData = async () => {
  await loadProcessos() // ou qualquer outra função que carregue seus dados
}

// Use o composable
useConnectionManager(loadData)

onMounted(() => {
  loadProcessos()
})

// Quando criar um canal
const channel = supabase.channel('nome-do-canal')
channel.subscribe()
SupabaseManager.addSubscription('nome-do-canal', channel)

onUnmounted(() => {
  const channel = SupabaseManager.getSubscription('nome-do-canal')
  if (channel) {
    supabase.removeChannel(channel)
    SupabaseManager.removeSubscription('nome-do-canal')
  }
})
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  padding: 2rem;
  background: #f8f9fa;
}

h1 {
  color: #193155;
  margin-bottom: 2rem;
}

.processos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.processo-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.processo-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.processo-card.selected {
  border: 2px solid #193155;
  background: #f8f9fa;
}

.processo-info {
  margin: 1rem 0;
}

.processo-info p {
  margin: 0.5rem 0;
  color: #4b5563;
}

.processo-info .objeto {
  font-style: italic;
  color: #6b7280;
  margin-top: 1rem;
}

.processo-status {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 50px;
  font-size: 0.85rem;
  background: #e3f2fd;
  color: #1976d2;
}

.sistemas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.planilha-valores {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 2rem;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.planilha-valores th,
.planilha-valores td {
  padding: 1rem;
  border: 1px solid #e9ecef;
  text-align: left;
}

.input-descricao,
.input-valor,
.input-quantidade {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e9ecef;
  border-radius: 4px;
}

.planilha-container {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-top: 2rem;
}

.navigation-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
}

.btn-voltar,
.btn-avancar,
.btn-exportar {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-voltar {
  background: #e9ecef;
  color: #495057;
}

.btn-avancar {
  background: #193155;
  color: white;
}

.btn-exportar {
  background: #28a745;
  color: white;
  margin-left: 1rem;
}

.btn-remover {
  background: #dc3545;
  color: white;
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.total-label {
  font-weight: bold;
  text-align: right;
}

/* Adicione estes estilos */
.sistemas-selection {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.sistemas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.sistema-card {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.sistema-card h3 {
  color: #193155;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.itens-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.item-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.item-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  border: 2px solid #193155;
  border-radius: 4px;
}

.navigation-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
}
</style>