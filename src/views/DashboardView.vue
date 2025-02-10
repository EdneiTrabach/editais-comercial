<script setup>
import TheSidebar from '@/components/TheSidebar.vue'
</script>

<template>
  <div class="layout">
    <TheSidebar />
    
    <div class="main-content">
      <header class="dashboard-header">
        <h1>Dashboard</h1>
      </header>

      <div class="dashboard-grid">
        <!-- Cards de estatísticas -->
        <div class="stat-card">
          <h3>Total de Alunos</h3>
          <!-- Adicione suas estatísticas aqui -->
        </div>

        <div class="stat-card">
          <h3>Cursos Ativos</h3>
          <!-- Adicione suas estatísticas aqui -->
        </div>

        <div class="stat-card">
          <h3>Certificados Emitidos</h3>
          <!-- Adicione suas estatísticas aqui -->
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  margin-left: 250px;
  padding: 2rem;
  background: #f8f9fa;
  transition: margin-left 0.3s ease;
}

.dashboard-header {
  margin-bottom: 2rem;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 60px;
  }
}
</style>