<template>
  <div class="export-dropdown">
    <button class="btn btn-info" 
            title="Opções de exportação" 
            @click="toggleDropdown">
      <i class="fas fa-file-export"></i> Exportar
    </button>
    
    <div class="dropdown-menu" :class="{ 'show': isOpen }">
      <div class="dropdown-header">Formatos de Arquivo</div>
      <a class="dropdown-item" href="#" @click.prevent="exportToExcel(data)">
        <i class="fas fa-file-excel"></i> Excel
      </a>
      <a class="dropdown-item" href="#" @click.prevent="exportToPDF(data)">
        <i class="fas fa-file-pdf"></i> PDF
      </a>
      <a class="dropdown-item" href="#" @click.prevent="exportToTXT(data)">
        <i class="fas fa-file-alt"></i> TXT
      </a>
      
      <div class="dropdown-divider"></div>
      
      <div class="dropdown-header">Visualizações</div>
      <a class="dropdown-item" href="#" @click.prevent="showChartSafe('bar')">
        <i class="fas fa-chart-bar"></i> Gráfico de Barras
      </a>
      <a class="dropdown-item" href="#" @click.prevent="showChartSafe('line')">
        <i class="fas fa-chart-line"></i> Gráfico de Linhas
      </a>
      <a class="dropdown-item" href="#" @click.prevent="showChartSafe('pie')">
        <i class="fas fa-chart-pie"></i> Gráfico de Pizza
      </a>
      <a class="dropdown-item" href="#" @click.prevent="showChartSafe('bar')">
        <i class="fas fa-bars"></i> Barras Horizontais
      </a>
    </div>
    
    <!-- Chart dialog -->
    <div class="chart-dialog" v-if="chartDialog" @click.self="closeChart">
      <div class="chart-container">
        <div class="chart-header">
          <h3>Visualização de Dados</h3>
          <button class="close-btn" @click="closeChart">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="chart-body">
          <canvas ref="chartRef" width="800" height="400"></canvas>
        </div>
        <div class="chart-footer">
          <button class="btn btn-sm btn-outline-secondary" 
                  :class="{ 'active': currentChartType === 'bar' }"
                  @click="changeChartType('bar')">
            <i class="fas fa-chart-bar"></i> Barras
          </button>
          <button class="btn btn-sm btn-outline-secondary"
                  :class="{ 'active': currentChartType === 'line' }"
                  @click="changeChartType('line')">
            <i class="fas fa-chart-line"></i> Linhas
          </button>
          <button class="btn btn-sm btn-outline-secondary"
                  :class="{ 'active': currentChartType === 'pie' }"
                  @click="changeChartType('pie')">
            <i class="fas fa-chart-pie"></i> Pizza
          </button>
          <button class="btn btn-sm btn-outline-secondary"
                  :class="{ 'active': currentChartType === 'horizontalBar' }"
                  @click="changeChartType('bar')">
            <i class="fas fa-bars"></i> Barras Horizontais
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useAnaliseExport } from '@/composables/useAnaliseExport'

const props = defineProps({
  data: {
    type: Array,
    required: true,
    default: () => []
  }
})

const { 
  exportToExcel, 
  exportToPDF, 
  exportToTXT,
  showChart,
  chartRef,
  chartDialog,
  currentChartType
} = useAnaliseExport()

const isOpen = ref(false)

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const closeDropdown = (e) => {
  if (!e.target.closest('.export-dropdown')) {
    isOpen.value = false
  }
}

const closeChart = () => {
  chartDialog.value = false
}

// Função de segurança para chamar showChart com verificação de dados
const showChartSafe = (type) => {
  // Verificar se há dados antes de mostrar o gráfico
  if (!props.data || !Array.isArray(props.data) || props.data.length === 0) {
    console.warn('Nenhum dado disponível para mostrar no gráfico')
    // Ainda exibe o gráfico vazio para manter a UX consistente
    showChart([], type)
    return
  }
  
  // Verificar se há dados válidos (itens com total_itens > 0)
  const dadosValidos = props.data.some(item => (item.total_itens || 0) > 0)
  
  if (!dadosValidos) {
    console.warn('Sem sistemas com dados para visualização no gráfico')
    showChart([], type)
    return
  }
  
  showChart(props.data, type)
}

const changeChartType = (type) => {
  showChartSafe(type)
}

// Observar mudanças nos dados e atualizar o gráfico se necessário
watch(() => props.data, (newData) => {
  // Se o diálogo estiver aberto, atualizar o gráfico quando os dados mudarem
  if (chartDialog.value) {
    showChartSafe(currentChartType.value)
  }
}, { deep: true })

onMounted(() => {
  document.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
})
</script>

<style scoped>
.export-dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 1000;
  display: none;
  min-width: 220px;
  padding: 0.5rem 0;
  margin: 0.125rem 0 0;
  background-color: #fff;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 0.25rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.175);
}

.dropdown-menu.show {
  display: block;
}

.dropdown-header {
  display: block;
  padding: 0.5rem 1.5rem;
  margin-bottom: 0;
  font-size: 0.875rem;
  color: #6c757d;
  white-space: nowrap;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 0.25rem 1.5rem;
  clear: both;
  font-weight: 400;
  color: #212529;
  text-align: inherit;
  white-space: nowrap;
  background-color: transparent;
  border: 0;
  text-decoration: none;
}

.dropdown-item:hover, .dropdown-item:focus {
  color: #16181b;
  text-decoration: none;
  background-color: #f8f9fa;
}

.dropdown-item i {
  width: 20px;
  margin-right: 8px;
  text-align: center;
}

.dropdown-divider {
  height: 0;
  margin: 0.5rem 0;
  overflow: hidden;
  border-top: 1px solid #e9ecef;
}

/* Chart Dialog */
.chart-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
}

.chart-container {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e9ecef;
}

.chart-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #6c757d;
}

close-btn:hover {
  color: #343a40;
}

.chart-body {
  padding: 16px;
  height: 450px;
}

.chart-footer {
  padding: 12px 16px;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: center;
  gap: 8px;
}

.chart-footer button.active {
  background-color: #007bff;
  color: white;
}
</style>
