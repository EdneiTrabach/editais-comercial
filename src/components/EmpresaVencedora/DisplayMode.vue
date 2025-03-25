<template>
  <div class="display-mode" @dblclick="$emit('dblclick')">
    <div v-if="empresaNome || numeroContrato" class="info-container">
      <div v-if="empresaNome" class="empresa-nome">{{ empresaNome }}</div>
      <div v-if="numeroContrato" class="contrato-numero">Contrato: {{ numeroContrato }}</div>
      <div v-if="dadosAnalise" class="dados-analise">{{ dadosAnalise }}</div>
    </div>
    <span v-else class="sem-empresa">Não definida</span>
  </div>
</template>

<script>
export default {
  name: 'DisplayMode',
  
  props: {
    empresaNome: {
      type: String,
      default: ''
    },
    numeroContrato: {
      type: String,
      default: ''
    },
    dadosAnalise: {
      type: String,
      default: ''
    }
  },
  
  emits: ['dblclick']
}
</script>

<style scoped>
.display-mode {
  width: 100%;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
}

.sem-empresa {
  color: #999;
  font-style: italic;
}

.info-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.empresa-nome {
  font-weight: bold;
}

.contrato-numero {
  font-size: 0.85em;
  color: #555;
}

.dados-analise {
  font-size: 0.8em;
  color: #4caf50;
  font-style: italic;
}
</style>