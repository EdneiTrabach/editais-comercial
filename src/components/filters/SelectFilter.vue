<template>
  <div class="select-filter">
    <label>{{ label }}</label>
    <select 
      :value="selectedValue" 
      @change="$emit('update:selectedValue', $event.target.value)"
    >
      <option 
        v-for="option in options" 
        :key="option.value" 
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

defineProps({
  label: {
    type: String,
    required: true
  },
  options: {
    type: Array,
    required: true
  },
  selectedValue: {
    type: String,
    default: ''
  }
});

defineEmits(['update:selectedValue']);
</script>

<style scoped>
.select-filter {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label {
  font-size: 14px;
  color: #555;
  font-weight: 500;
}

select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  width: 100%;
  background-color: white;
  height: 36px;
}

select:focus {
  outline: none;
  border-color: #40a9ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}
</style>
