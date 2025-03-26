<!-- src/views/LancesView.vue -->
<template>
  <div class="layout">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />

    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <div class="header-section">
        <h1>Planilha de Lances</h1>
        <div class="header-actions">
          <!-- Ações principais -->
          <div class="acoes-principais" v-if="step === 3">
            <button @click="salvarPlanilha" class="btn-salvar" :disabled="!alteracoesPendentes">
              <i class="fas fa-save"></i>
              Salvar Planilha
            </button>
            
            <button @click="abrirReadequacao" class="btn-readequar">
              <i class="fas fa-calculator"></i>
              Readequar Proposta
            </button>
            
            <div class="dropdown-exportar">
              <button class="btn-exportar">
                <i class="fas fa-file-export"></i>
                Exportar
              </button>
              <div class="dropdown-content">
                <button @click="exportarExcel">
                  <i class="fas fa-file-excel"></i> Excel
                </button>
                <button @click="exportarPDF">
                  <i class="fas fa-file-pdf"></i> PDF
                </button>
                <button @click="abrirDashboard">
                  <i class="fas fa-chart-bar"></i> Dashboard
                </button>
              </div>
            </div>

            <!-- Botão voltar -->
            <button v-if="step > 0" @click="voltarEtapa" class="btn-voltar">
              <i class="fas fa-arrow-left"></i>
              Voltar
            </button>
          </div>

          <!-- Botões de navegação -->
          <div class="navigation-actions">
            <button v-if="step < 3" @click="avancarEtapa" class="btn-avancar" :disabled="!podeAvancar">
              Avançar
              <i class="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Conteúdo principal -->
      <div class="content-section">
        <!-- Componente de seleção de ano -->
        <AnoSelection v-if="step === 0" :anos="anosDisponiveis" :processos="processos" :selectedAno="anoSelecionado"
          @select-ano="selecionarAno" />

        <!-- Componentes para cada etapa -->
        <ProcessoSelection v-if="step === 1" :processos="processos" :selectedProcesso="selectedProcesso"
          @select-processo="selectProcesso" />

        <SistemasSelection v-if="step === 2" :sistemas="sistemas" :itensDisponiveis="itensDisponiveis"
          v-model:itensSelecionados="itensSelecionados" />

        <PlanilhaValores v-if="step === 3" :itensPlanilha="itensPlanilha" :totalGeral="totalGeral"
          :valorEstimado="processoAtual?.valor_estimado" @calcular-total="calcularTotal" @adicionar-item="adicionarItem"
          @remover-item="removerItem" />

        <PlanilhaValoresReadequada 
          v-if="step === 3"
          :itens-planilha="itensPlanilha"
          :total-geral="totalGeral"
          :valor-estimado="processoAtual?.valor_estimado"
          @adicionar-item="handleAdicionarItem"
          @exportar-pdf="exportarPDF"
          @exportar-excel="exportarExcel"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, computed, ref } from 'vue'
import { supabase } from '@/lib/supabase'
import TheSidebar from '@/components/TheSidebar.vue'
import ProcessoSelection from '@/components/lances/ProcessoSelection.vue'
import SistemasSelection from '@/components/lances/SistemasSelection.vue'
import PlanilhaValores from '@/components/lances/PlanilhaValores.vue'
import AnoSelection from '@/components/lances/AnoSelection.vue'
import { useConnectionManager } from '@/composables/useConnectionManager'
import { SupabaseManager } from '@/lib/supabaseManager'
import { useLances } from '@/composables/useLances'
import { useRouter } from 'vue-router' // Adicione este import

// Adicionar estado para controle de alterações
const alteracoesPendentes = ref(false)

const {
  step,
  isSidebarExpanded,
  processos, // Agora recebemos processos diretamente 
  sistemas,
  selectedProcesso,
  itensSelecionados,
  itensPlanilha,
  itensDisponiveis,
  totalGeral,
  podeAvancar,
  handleSidebarToggle,
  selectProcesso,
  calcularTotal,
  adicionarItem,
  removerItem,
  exportarPDF,
  exportarExcel,
  voltarEtapa,
  avancarEtapa,
  loadProcessos,
  carregarNomesSistemas,
  anoSelecionado,
  anosDisponiveis,
  selecionarAno
} = useLances()

const router = useRouter()

// Computed property para obter o processo atual selecionado
const processoAtual = computed(() => {
  if (!selectedProcesso.value) return null
  return processos.value.find(p => p.id === selectedProcesso.value)
})

// Adicione a função abrirReadequacao
const abrirReadequacao = () => {
  try {
    router.push({
      name: 'PlanilhaReadequada',
      query: {
        itens: encodeURIComponent(JSON.stringify(itensPlanilha.value)),
        totalGeral: totalGeral.value,
        valorEstimado: processoAtual.value?.valor_estimado
      }
    })
  } catch (error) {
    console.error('Erro ao abrir readequação:', error)
  }
}

// Função para lidar com adição de item na readequação
const handleAdicionarItem = () => {
  // Recuperar estado da readequação
  const estadoSalvo = localStorage.getItem('estadoReadequacao')
  
  // Abrir modal de seleção de itens
  const modalConfig = {
    title: 'Adicionar Item',
    callback: (novoItem) => {
      // Recuperar estado anterior
      if (estadoSalvo) {
        const estado = JSON.parse(estadoSalvo)
        
        // Adicionar novo item com valores já readequados
        const percentual = estado.percentual
        const fator = 1 + (parseFloat(percentual) / 100)
        
        const itemReadequado = {
          ...novoItem,
          valorUnitarioOriginal: novoItem.valorUnitario,
          valorUnitario: Number((novoItem.valorUnitario * fator).toFixed(2)),
          total: Number((novoItem.valorUnitario * fator * novoItem.quantidade).toFixed(2))
        }
        
        // Atualizar lista de itens
        itensReadequados.value.push(itemReadequado)
        
        // Recalcular totais
        recalcularTotal()
      }
      
      // Limpar estado salvo
      localStorage.removeItem('estadoReadequacao')
    }
  }
  
  // Abrir modal de seleção de itens
  showItemSelectionModal.value = true
  itemSelectionConfig.value = modalConfig
}

// Use o composable de conexão
useConnectionManager(loadProcessos)

onMounted(async () => {
  await loadProcessos()
  await carregarNomesSistemas()
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

<style src="../assets/styles/LancesView.css"></style>
