<!-- src/views/LancesView.vue -->
<template>
  <div class="layout">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />
    
    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <div class="header">
        <h1>Planilha de Lances</h1>
      </div>
      
      <!-- Componente de seleção de ano -->
      <AnoSelection 
        v-if="step === 0" 
        :anos="anosDisponiveis"
        :processos="processos" 
        :selectedAno="anoSelecionado"
        @select-ano="selecionarAno"
      />
      
      <!-- Componentes para cada etapa -->
      <ProcessoSelection 
        v-if="step === 1" 
        :processos="processos" 
        :selectedProcesso="selectedProcesso"
        @select-processo="selectProcesso"
      />

      <SistemasSelection 
        v-if="step === 2" 
        :sistemas="sistemas"
        :itensDisponiveis="itensDisponiveis"
        v-model:itensSelecionados="itensSelecionados"
      />

      <PlanilhaValores 
        v-if="step === 3" 
        :itensPlanilha="itensPlanilha" 
        :totalGeral="totalGeral"
        :valorEstimado="processoAtual?.valor_estimado"
        @calcular-total="calcularTotal"
        @adicionar-item="adicionarItem"
        @remover-item="removerItem"
        @exportar-pdf="exportarPDF"
        @exportar-excel="exportarExcel"
      />

      <!-- Navegação entre etapas -->
      <div class="navigation-buttons-lances">
        <button 
          v-if="step < 3" 
          @click="avancarEtapa" 
          class="btn-avancar"
          :disabled="!podeAvancar"
        >
          Avançar
        </button>
        <button 
          v-if="step > 0" 
          @click="voltarEtapa" 
          class="btn-voltar"
        >
          Voltar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import TheSidebar from '@/components/TheSidebar.vue'
import ProcessoSelection from '@/components/lances/ProcessoSelection.vue'
import SistemasSelection from '@/components/lances/SistemasSelection.vue'
import PlanilhaValores from '@/components/lances/PlanilhaValores.vue'
import AnoSelection from '@/components/lances/AnoSelection.vue'
import { useConnectionManager } from '@/composables/useConnectionManager'
import { SupabaseManager } from '@/lib/supabaseManager'
import { useLances } from '@/composables/useLances'

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

// Computed property para obter o processo atual selecionado
const processoAtual = computed(() => {
  if (!selectedProcesso.value) return null
  return processos.value.find(p => p.id === selectedProcesso.value)
})

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
