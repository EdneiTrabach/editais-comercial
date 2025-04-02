<template>
  <div class="date-range-filter">
    <label>{{ label }}</label>
    <div class="date-inputs">
      <div class="date-input">
        <span class="date-label">De</span>
        <input 
          type="date" 
          :value="startDate" 
          @input="$emit('update:startDate', $event.target.value)"
          :max="endDate || getCurrentDate()"
        />
      </div>
      <div class="date-input">
        <span class="date-label">Até</span>
        <input 
          type="date" 
          :value="endDate" 
          @input="$emit('update:endDate', $event.target.value)"
          :min="startDate"
          :max="getCurrentDate()"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

defineProps({
  label: {
    type: String,
    default: 'Período'
  },
  startDate: {
    type: String,
    default: ''
  },
  endDate: {
    type: String,
    default: ''
  }
});

defineEmits(['update:startDate', 'update:endDate']);

// Função para obter a data atual no formato YYYY-MM-DD
const getCurrentDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
</script>

<style scoped>
.date-range-filter {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label {
  font-size: 14px;
  color: #555;
  font-weight: 500;
}

.date-inputs {
  display: flex;
  gap: 10px;
}

.date-input {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.date-label {
  font-size: 12px;
  color: #888;
}

input[type="date"] {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  width: 100%;
}

input[type="date"]:focus {
  outline: none;
  border-color: #40a9ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}
</style>
