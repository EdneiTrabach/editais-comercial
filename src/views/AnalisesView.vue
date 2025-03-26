<template>
  <div class="layout">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />
    
    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <div class="analises-container">
        <div class="header-section">
          <h1>Análise de Sistemas</h1>
        </div>

        <!-- Seleção de Processo similar ao LancesView -->
        <div class="selection-steps" v-if="step === 0">
          <AnoSelection 
            :anos="anosDisponiveis" 
            :processos="processos"
            :selectedAno="anoSelecionado"
            @select-ano="selecionarAno"
          />
        </div>

        <div v-else-if="step === 1">
          <ProcessoSelection
            :processos="processosFiltrados"
            :selectedProcesso="selectedProcesso"
            @select-processo="selectProcesso"
          />
        </div>

        <!-- Tabela de Análise -->
        <div v-else-if="step === 2" class="analise-table-container">
          <div class="table-header">
            <h2>Análise de Atendimento - {{ processoAtual?.numero_processo }}</h2>
            <div class="total-geral">
              <span>Porcentagem Geral de Atendimento: {{ porcentagemGeralAtendimento }}%</span>
            </div>
          </div>

          <table class="analise-table">
            <thead>
              <tr>
                <th>Sistema</th>
                <th>Total de Itens</th>
                <th>Atendidos</th>
                <th>Não Atendidos</th>
                <th>% Atendimento</th>
                <th>% Não Atendimento</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sistema in sistemasAnalise" :key="sistema.id">
                <td>{{ sistema.nome }}</td>
                <td>{{ sistema.totalItens }}</td>
                <td class="atendidos">{{ sistema.atendidos }}</td>
                <td class="nao-atendidos">{{ sistema.naoAtendidos }}</td>
                <td class="porcentagem-atendimento">
                  {{ calcularPorcentagem(sistema.atendidos, sistema.totalItens) }}%
                </td>
                <td class="porcentagem-nao-atendimento">
                  {{ calcularPorcentagem(sistema.naoAtendidos, sistema.totalItens) }}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Botões de navegação -->
        <div class="navigation-buttons">
          <button 
            v-if="step > 0" 
            @click="voltarEtapa" 
            class="btn-voltar"
          >
            Voltar
          </button>
          <button 
            v-if="step < 2" 
            @click="avancarEtapa" 
            class="btn-avancar"
            :disabled="!podeAvancar"
          >
            Avançar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import TheSidebar from '@/components/TheSidebar.vue'
import AnoSelection from '@/components/lances/AnoSelection.vue'
import ProcessoSelection from '@/components/lances/ProcessoSelection.vue'
import { useAnalises } from '@/composables/useAnalises'

const {
  step,
  isSidebarExpanded,
  processos,
  sistemas,
  selectedProcesso,
  processoAtual,
  sistemasAnalise,
  anosDisponiveis,
  anoSelecionado,
  processosFiltrados,
  podeAvancar,
  porcentagemGeralAtendimento,
  handleSidebarToggle,
  selecionarAno,
  selectProcesso,
  voltarEtapa,
  avancarEtapa,
  calcularPorcentagem,
  loadProcessos // Adicionar esta linha
} = useAnalises()

// Carregar dados quando o componente for montado
onMounted(async () => {
  await loadProcessos()
})
</script>

<style scoped>
.analises-container {
  padding: 2rem;
}

.header-section {
  margin-bottom: 2rem;
}

.header-section h1 {
  font-size: 1.8rem;
  color: #1e293b;
}

.analise-table-container {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.table-header h2 {
  font-size: 1.2rem;
  color: #334155;
}

.total-geral {
  background: #f8fafc;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
}

.analise-table {
  width: 100%;
  border-collapse: collapse;
}

.analise-table th,
.analise-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.analise-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
}

.atendidos {
  color: #059669;
  font-weight: 500;
}

.nao-atendidos {
  color: #dc2626;
  font-weight: 500;
}

.porcentagem-atendimento {
  color: #059669;
  font-weight: 600;
}

.porcentagem-nao-atendimento {
  color: #dc2626;
  font-weight: 600;
}

.navigation-buttons {
  margin-top: 2rem;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn-voltar,
.btn-avancar {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-voltar {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
}

.btn-avancar {
  background: #2563eb;
  color: white;
  border: none;
}

.btn-avancar:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

.btn-voltar:hover {
  background: #e2e8f0;
}

.btn-avancar:hover:not(:disabled) {
  background: #1d4ed8;
}
</style>