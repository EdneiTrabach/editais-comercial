<template>
  <select 
    :value="modelValue" 
    @input="$emit('update:modelValue', $event.target.value)"
    class="empresa-select"
  >
    <option value="">Selecione a empresa vencedora...</option>
    <option v-for="empresa in empresas" :key="empresa.id" :value="empresa.id">
      {{ empresa.nome }}
    </option>
  </select>
</template>

<script>
export default {
  name: 'EmpresaSelector',
  
  props: {
    modelValue: {
      type: [String, Number],
      default: ''
    },
    empresas: {
      type: Array,
      default: () => []
    }
  },
  
  emits: ['update:modelValue']
}
</script>

<style scoped>
.empresa-select {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  background-color: white;
}
</style>