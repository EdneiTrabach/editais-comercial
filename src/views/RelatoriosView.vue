<template>
  <div class="layout">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />
    
    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <div class="header">
        <h1>Relatórios</h1>
      </div>

      <div class="reports-container">
        <!-- Seleção do tipo de relatório -->
        <div class="report-type-selector">
          <h2>Selecione o tipo de relatório</h2>
          <div class="report-grid">
            <div 
              v-for="report in availableReports" 
              :key="report.id"
              class="report-card"
              :class="{ 'active': selectedReportType === report.id }"
              @click="selectReportType(report.id)"
            >
              <img :src="report.icon" :alt="report.name" class="report-icon" />
              <h3>{{ report.name }}</h3>
              <p>{{ report.description }}</p>
            </div>
          </div>
        </div>

        <!-- Componente dinâmico baseado no tipo de relatório selecionado -->
        <component 
          v-if="selectedReportType" 
          :is="currentReportComponent"
          @back="selectedReportType = null"
        />
        
        <!-- Estado vazio - apenas mostrado quando nenhum relatório está selecionado -->
        <div class="empty-state" v-if="!selectedReportType && availableReports.length === 0">
          <img src="/icons/grafico.svg" alt="Relatórios" class="empty-icon" />
          <h2>Relatórios em desenvolvimento</h2>
          <p>Esta funcionalidade está sendo implementada e estará disponível em breve.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import TheSidebar from '@/components/TheSidebar.vue';
import ProcessReportComponent from '@/components/reports/ProcessReportComponent.vue';

// Estado para controle da sidebar
const isSidebarExpanded = ref(true);

// Relatório selecionado atualmente
const selectedReportType = ref(null);

// Lista de relatórios disponíveis
const availableReports = ref([
  {
    id: 'process',
    name: 'Relatório de Processos',
    description: 'Relatório detalhado de todos os processos licitatórios',
    icon: '/icons/process-report.svg',
    component: ProcessReportComponent
  },
  // Aqui você pode adicionar os outros tipos de relatórios quando forem implementados
]);

// Componente dinâmico a ser renderizado com base no relatório selecionado
const currentReportComponent = computed(() => {
  if (!selectedReportType.value) return null;
  const report = availableReports.value.find(r => r.id === selectedReportType.value);
  return report ? report.component : null;
});

// Função para lidar com o toggle da sidebar
const handleSidebarToggle = (expanded) => {
  isSidebarExpanded.value = expanded;
};

// Função para selecionar o tipo de relatório
const selectReportType = (reportId) => {
  selectedReportType.value = reportId;
};
</script>

<style scoped>
.header {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  font-size: 24px;
  margin: 0;
  color: #333;
}

.reports-container {
  padding: 20px;
  display: flex;
  flex-direction: column;
  min-height: 70vh;
}

.report-type-selector {
  margin-bottom: 30px;
}

.report-type-selector h2 {
  margin-bottom: 20px;
  font-size: 18px;
  color: #555;
}

.report-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.report-card {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid #eee;
}

.report-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  border-color: #ddd;
}

.report-card.active {
  background-color: #e6f7ff;
  border-color: #1890ff;
}

.report-icon {
  width: 50px;
  height: 50px;
  margin-bottom: 15px;
}

.report-card h3 {
  font-size: 16px;
  margin-bottom: 10px;
}

.report-card p {
  font-size: 14px;
  color: #666;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px;
  max-width: 500px;
  margin: 0 auto;
}

.empty-icon {
  width: 80px;
  height: 80px;
  opacity: 0.5;
  margin-bottom: 20px;
}

.empty-state h2 {
  font-size: 20px;
  margin-bottom: 10px;
  color: #333;
}

.empty-state p {
  color: #666;
  line-height: 1.5;
}
</style>