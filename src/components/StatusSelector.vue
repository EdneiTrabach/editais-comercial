<template>
  <select :value="modelValue" class="status-select" @change="handleChange">
    <option v-for="option in statusOptions" :key="option.value" :value="option.value">
      {{ option.label }}
    </option>
  </select>
</template>

<script>
export default {
  name: 'StatusSelector',
  props: {
    modelValue: String,
    processo: {
      type: Object,
      required: true
    },
    statusOptions: {
      type: Array,
      required: true
    }
  },
  emits: ['update:modelValue', 'status-changed'],
  methods: {
    handleChange(event) {
      const newValue = event.target.value;
      
      // Emitir evento para atualização do v-model
      this.$emit('update:modelValue', newValue);
      
      // Emitir evento com todos os dados necessários para a atualização
      this.$emit('status-changed', {
        processo: this.processo,
        event: event,
        newValue: newValue,
        oldValue: this.modelValue
      });
    }
  }
}
</script>

<style scoped>
.status-select {
  width: 100%;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
}
</style>
