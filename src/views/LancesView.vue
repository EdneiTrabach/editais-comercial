<!-- src/views/LancesView.vue -->
<template>
  <div class="layout">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />
    
    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <div class="header">
        <h1>Planilha de Lances</h1>
      </div>
      
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
        v-if="step < 3 && podeAvancar" 
        @click="avancarEtapa" 
        class="btn-avancar"
        >
        Avançar
      </button>
      <button 
        v-if="step > 1" 
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
import { onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'
import TheSidebar from '@/components/TheSidebar.vue'
import ProcessoSelection from '@/components/lances/ProcessoSelection.vue'
import SistemasSelection from '@/components/lances/SistemasSelection.vue'
import PlanilhaValores from '@/components/lances/PlanilhaValores.vue'
import { useConnectionManager } from '@/composables/useConnectionManager'
import { SupabaseManager } from '@/lib/supabaseManager'
import { useLances } from '@/composables/useLances'

// Importar a lógica dos composables
const {
  step,
  isSidebarExpanded,
  processos,
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
  carregarNomesSistemas // Adicionar esta linha
} = useLances()

// Use o composable de conexão
useConnectionManager(loadProcessos)

onMounted(() => {
  loadProcessos()
  carregarNomesSistemas() // Adicionar esta linha
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
