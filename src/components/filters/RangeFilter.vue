<template>
  <div class="range-filter">
    <label>{{ label }}</label>
    <div class="range-inputs">
      <div class="range-input">
        <span class="range-label">De</span>
        <div class="input-wrapper" :class="{ 'has-prefix': prefix }">
          <span v-if="prefix" class="prefix">{{ prefix }}</span>
          <input 
            type="number" 
            :value="minValue" 
            @input="$emit('update:minValue', $event.target.value)"
            :placeholder="minPlaceholder"
            :min="min"
            :max="maxValue || max"
            :step="step"
          />
        </div>
      </div>
      <div class="range-input">
        <span class="range-label">Até</span>
        <div class="input-wrapper" :class="{ 'has-prefix': prefix }">
          <span v-if="prefix" class="prefix">{{ prefix }}</span>
          <input 
            type="number" 
            :value="maxValue" 
            @input="$emit('update:maxValue', $event.target.value)"
            :placeholder="maxPlaceholder"
            :min="minValue || min"
            :max="max"
            :step="step"
          />
        </div>
      </div>
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
  minValue: {
    type: [String, Number],
    default: ''
  },
  maxValue: {
    type: [String, Number],
    default: ''
  },
  min: {
    type: Number,
    default: 0
  },
  max: {
    type: Number,
    default: 99999999
  },
  step: {
    type: [String, Number],
    default: 'any'
  },
  prefix: {
    type: String,
    default: ''
  },
  minPlaceholder: {
    type: String,
    default: 'Min'
  },
  maxPlaceholder: {
    type: String,
    default: 'Max'
  }
});

defineEmits(['update:minValue', 'update:maxValue']);
</script>

<style scoped>
.range-filter {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label {
  font-size: 14px;
  color: #555;
  font-weight: 500;
}

.range-inputs {
  display: flex;
  gap: 10px;
}

.range-input {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.range-label {
  font-size: 12px;
  color: #888;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.prefix {
  position: absolute;
  left: 8px;
  color: #666;
  font-size: 14px;
}

input[type="number"] {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  -moz-appearance: textfield;
}

.input-wrapper.has-prefix input {
  padding-left: 25px;
}

input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input:focus {
  outline: none;
  border-color: #40a9ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}
</style>
