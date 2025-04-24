<template>
  <div class="header-section">
    <h1>Relatórios de Processos com Participação</h1>
    <div class="header-actions">
      <button class="btn btn-primary" @click="$emit('sincronizar')">
        <i class="fas fa-sync"></i> Sincronizar Processos
      </button>
      <button class="btn btn-success" @click="$emit('exportar-excel')">
        <i class="fas fa-file-excel"></i> Exportar Excel
      </button>
    </div>
  </div>
</template>

<script src="./script.js"></script>
<style scoped src="./style.css"></style>