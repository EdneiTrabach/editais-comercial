<template>
  <div class="layout">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />
    
    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <div class="header">
        <h1>Relatórios</h1>
      </div>

      <div class="reports-container">
        <div class="empty-state">
          <img src="/icons/grafico.svg" alt="Relatórios" class="empty-icon" />
          <h2>Relatórios em desenvolvimento</h2>
          <p>Esta funcionalidade está sendo implementada e estará disponível em breve.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import TheSidebar from '@/components/TheSidebar.vue';

// Estado para controle da sidebar
const isSidebarExpanded = ref(true);

// Função para lidar com o toggle da sidebar
const handleSidebarToggle = (expanded) => {
  isSidebarExpanded.value = expanded;
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
  align-items: center;
  justify-content: center;
  min-height: 70vh;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px;
  max-width: 500px;
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