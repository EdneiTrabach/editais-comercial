<template>
  <div class="filtros-container">
    <div class="filtros-header">
      <h3>Filtros</h3>
      <button class="btn-limpar" @click="$emit('limpar')">Limpar Filtros</button>
    </div>
    <div class="filtros-body">
      <div class="filtro-item">
        <label>Status:</label>
        <select v-model="statusLocal" @change="emitirStatusChange">
          <option value="todos">Todos</option>
          <option value="vamos_participar">Vamos Participar</option>
          <option value="ganhamos">Ganhamos</option>
          <option value="perdemos">Perdemos</option>
        </select>
      </div>
      <div class="filtro-item">
        <label>Responsável:</label>
        <input 
          type="text" 
          v-model="responsavelLocal" 
          @input="emitirResponsavelChange" 
          placeholder="Buscar por responsável"
        >
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue';

export default {
  name: 'RelatoriosFiltros',
  
  props: {
    status: {
      type: String,
      default: 'todos'
    },
    responsavel: {
      type: String,
      default: ''
    }
  },
  
  emits: ['limpar', 'update:status', 'update:responsavel'],
  
  setup(props, { emit }) {
    const statusLocal = ref(props.status);
    const responsavelLocal = ref(props.responsavel);
    
    // Observar mudanças nas props
    watch(() => props.status, (newVal) => {
      statusLocal.value = newVal;
    });
    
    watch(() => props.responsavel, (newVal) => {
      responsavelLocal.value = newVal;
    });
    
    // Emitir eventos quando os valores locais mudarem
    const emitirStatusChange = () => {
      emit('update:status', statusLocal.value);
    };
    
    const emitirResponsavelChange = () => {
      emit('update:responsavel', responsavelLocal.value);
    };
    
    return {
      statusLocal,
      responsavelLocal,
      emitirStatusChange,
      emitirResponsavelChange
    };
  }
}
</script>

<style scoped>
.filtros-container {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filtros-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.filtros-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #193155;
}

.btn-limpar {
  background: none;
  border: none;
  color: #193155;
  cursor: pointer;
  font-size: 0.9rem;
  text-decoration: underline;
  padding: 0;
}

.filtros-body {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.filtro-item {
  display: flex;
  flex-direction: column;
  min-width: 200px;
  flex: 1;
}

.filtro-item label {
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 5px;
  color: #555;
}

.filtro-item select,
.filtro-item input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95rem;
  background-color: #fff;
}

.filtro-item select:focus,
.filtro-item input:focus {
  outline: none;
  border-color: #193155;
  box-shadow: 0 0 0 2px rgba(25, 49, 85, 0.2);
}

@media (max-width: 768px) {
  .filtros-body {
    flex-direction: column;
    gap: 10px;
  }
  
  .filtro-item {
    width: 100%;
  }
}
</style>