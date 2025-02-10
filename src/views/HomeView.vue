<script setup>
import TheSidebar from '@/components/TheSidebar.vue'
</script>

<template>
  <div class="layout">
    <TheSidebar />
    
    <div class="main-content">
      <header class="home-header">
        <h1>Bem-vindo ao Sistema de Controle de Alunos e Cursos - ITILH</h1>
      </header>

      <div class="cards-grid">
        <!-- Seus cards aqui... -->
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
  margin-left: 280px;
  padding: 2rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.home {
  padding: 2rem;
  text-align: center;
}
</style>
