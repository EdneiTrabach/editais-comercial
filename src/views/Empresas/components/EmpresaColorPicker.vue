<template>
  <div class="form-group-cfg-usuarios">
    <label>Cor de Identificação</label>
    <div class="color-selection">
      <input 
        type="color" 
        :value="modelValue" 
        @input="updateColor($event.target.value)"
        class="color-picker"
      >
      <span class="color-preview" :style="{ backgroundColor: modelValue }"></span>
      <span class="color-hex">{{ modelValue }}</span>
    </div>
    
    <!-- Paleta de cores predefinidas -->
    <div class="color-palette">
      <div 
        v-for="(color, index) in predefinedColors" 
        :key="index"
        class="color-option"
        :style="{ backgroundColor: color }"
        @click="updateColor(color)"
        :class="{ 'selected': modelValue === color }"
      ></div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';

export default {
  name: 'EmpresaColorPicker',
  props: {
    modelValue: {
      type: String,
      default: '#FFFFFF'
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const predefinedColors = ref([
      '#FFFFFF', '#193155', '#4285F4', '#34A853', '#FBBC05', '#EA4335', 
      '#9C27B0', '#3F51B5', '#00BCD4', '#009688', '#8BC34A', '#FFEB3B', 
      '#FF9800', '#795548', '#607D8B'
    ]);
    
    const updateColor = (color) => {
      emit('update:modelValue', color);
    };
    
    return {
      predefinedColors,
      updateColor
    };
  }
}
</script>