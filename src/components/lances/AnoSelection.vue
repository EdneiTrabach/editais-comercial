<template>
  <div class="ano-selection">
    <h2>Selecione o Ano</h2>
    <div class="anos-grid">
      <div 
        v-for="ano in anos" 
        :key="ano"
        class="ano-card"
        :class="{ 'selected': selectedAno === ano }"
        @click="$emit('select-ano', ano)"
      >
        <div class="ano-info">
          <h3>{{ ano }}</h3>
          <p>{{ contarProcessosPorAno(ano) }} processo(s)</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  anos: {
    type: Array,
    required: true
  },
  processos: {
    type: Array,
    required: true
  },
  selectedAno: {
    type: Number,
    default: null
  }
});

defineEmits(['select-ano']);

// Função para contar processos por ano
const contarProcessosPorAno = (ano) => {
  if (!props.processos) return 0
  
  return props.processos.filter(processo => {
    if (processo.ano) return processo.ano === ano
    if (processo.data_pregao) {
      const anoProcesso = new Date(processo.data_pregao).getFullYear()
      return anoProcesso === ano
    }
    return false
  }).length
}
</script>

<style scoped>
.ano-selection {
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.anos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.ano-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.ano-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.ano-card.selected {
  border: 2px solid #193155;
  background: #f8f9fa;
}

.ano-info h3 {
  font-size: 1.8rem;
  color: #193155;
  margin-bottom: 0.5rem;
}

.ano-info p {
  color: #4b5563;
  font-size: 0.9rem;
}
</style>