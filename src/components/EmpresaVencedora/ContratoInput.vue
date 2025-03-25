<template>
  <input 
    :value="modelValue"
    @input="$emit('update:modelValue', $event.target.value)"
    class="contrato-input" 
    placeholder="Nº do Contrato" 
    type="text"
  />
</template>

<script>
export default {
  name: 'ContratoInput',
  
  props: {
    modelValue: {
      type: String,
      default: ''
    }
  },
  
  emits: ['update:modelValue']
}
</script>

<style scoped>
.contrato-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  background-color: white;
}
</style>