<template>
  <div class="visualizacao-toggle">
    <button 
      class="btn-visualizacao" 
      :class="{ 'ativo': modo === 'grid' }"
      @click="alterarModo('grid')"
      title="Visualização em grade"
    >
      <i class="fas fa-th-large"></i>
    </button>
    <button 
      class="btn-visualizacao"
      :class="{ 'ativo': modo === 'lista' }"
      @click="alterarModo('lista')"
      title="Visualização em lista"
    >
      <i class="fas fa-list"></i>
    </button>
  </div>
</template>

<script>
export default {
  name: 'VisualizacaoToggle',
  
  props: {
    modo: {
      type: String,
      default: 'grid',
      validator: (value) => ['grid', 'lista'].includes(value)
    }
  },
  
  emits: ['mudar-visualizacao'],
  
  methods: {
    alterarModo(novoModo) {
      if (this.modo !== novoModo) {
        this.$emit('mudar-visualizacao', novoModo);
      }
    }
  }
}
</script>

<style scoped>
.visualizacao-toggle {
  display: flex;
  gap: 4px;
}

.btn-visualizacao {
  padding: 6px 10px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
}

.btn-visualizacao:hover {
  background-color: #e9e9e9;
}

.btn-visualizacao.ativo {
  background-color: #4285f4;
  color: white;
  border-color: #3367d6;
}
</style>
