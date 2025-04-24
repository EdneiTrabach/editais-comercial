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

<script>
export default {
  name: 'RelatoriosHeader',
  
  emits: ['sincronizar', 'exportar-excel']
}
</script>

<style scoped>
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e0e0e0;
}

.header-section h1 {
  font-size: 1.8rem;
  color: #193155;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.btn {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  gap: 8px;
}

.btn-primary {
  background-color: #193155;
  color: white;
}

.btn-primary:hover {
  background-color: #12233e;
}

.btn-success {
  background-color: #28a745;
  color: white;
}

.btn-success:hover {
  background-color: #218838;
}
</style>