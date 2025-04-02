<template>
  <div class="search-filter">
    <label>{{ label }}</label>
    <div class="search-input">
      <input 
        type="text" 
        :value="value" 
        @input="$emit('update:value', $event.target.value)"
        :placeholder="placeholder" 
      />
      <span class="search-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </span>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

defineProps({
  label: {
    type: String,
    required: true
  },
  value: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Buscar...'
  }
});

defineEmits(['update:value']);
</script>

<style scoped>
.search-filter {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label {
  font-size: 14px;
  color: #555;
  font-weight: 500;
}

.search-input {
  position: relative;
}

input {
  padding: 8px;
  padding-right: 32px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  width: 100%;
  height: 36px;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: #40a9ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.search-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
}
</style>
