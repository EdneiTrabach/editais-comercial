<template>
  <div class="multi-select-filter">
    <label>{{ label }}</label>
    <div class="select-container">
      <div 
        class="selected-options" 
        @click="toggleDropdown"
        :class="{ 'active': isOpen }"
      >
        <div v-if="selectedLabels.length" class="selected-tags">
          <div 
            v-for="(selectedLabel, index) in visibleSelectedLabels" 
            :key="index" 
            class="selected-tag"
          >
            {{ selectedLabel }}
          </div>
          <div v-if="hiddenCount > 0" class="more-tag">
            +{{ hiddenCount }}
          </div>
        </div>
        <div v-else class="placeholder">
          {{ placeholder }}
        </div>
        <div class="arrow" :class="{ 'up': isOpen }">▼</div>
      </div>
      
      <div v-if="isOpen" class="dropdown">
        <div class="search-box">
          <input 
            type="text" 
            v-model="search" 
            @input="filterOptions"
            placeholder="Buscar..." 
            ref="searchInput"
          />
        </div>
        <div class="options-list">
          <label 
            v-for="option in filteredOptions" 
            :key="option.valor" 
            class="option"
          >
            <input 
              type="checkbox" 
              :value="option.valor" 
              :checked="isSelected(option.valor)"
              @change="toggleOption(option.valor)"
            />
            <span>{{ option.label }}</span>
          </label>
          <div v-if="filteredOptions.length === 0" class="no-results">
            Nenhum resultado encontrado
          </div>
        </div>
        <div class="actions">
          <button class="select-all" @click="selectAll">Selecionar todos</button>
          <button class="clear-all" @click="clearAll">Limpar seleção</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  label: {
    type: String,
    required: true
  },
  options: {
    type: Array,
    required: true
  },
  selectedValues: {
    type: Array,
    default: () => []
  },
  placeholder: {
    type: String,
    default: 'Selecione as opções...'
  }
});

const emit = defineEmits(['update:selectedValues']);

const isOpen = ref(false);
const search = ref('');
const allOptions = ref([...props.options]);
const filteredOptions = ref([...props.options]);
const searchInput = ref(null);
const maxVisibleTags = 2;

// Filtra as opções com base na busca
const filterOptions = () => {
  if (!search.value) {
    filteredOptions.value = [...allOptions.value];
    return;
  }
  
  const searchTerm = search.value.toLowerCase();
  filteredOptions.value = allOptions.value.filter(option => 
    option.label.toLowerCase().includes(searchTerm)
  );
};

// Verifica se um valor está selecionado
const isSelected = (value) => {
  return props.selectedValues.includes(value);
};

// Alterna um valor na seleção
const toggleOption = (value) => {
  const newSelection = [...props.selectedValues];
  const index = newSelection.indexOf(value);
  
  if (index === -1) {
    newSelection.push(value);
  } else {
    newSelection.splice(index, 1);
  }
  
  emit('update:selectedValues', newSelection);
};

// Abre/fecha o dropdown
const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    setTimeout(() => {
      if (searchInput.value) {
        searchInput.value.focus();
      }
    }, 100);
  }
};

// Seleciona todos os itens filtrados
const selectAll = () => {
  const currentSelection = [...props.selectedValues];
  const newValues = filteredOptions.value
    .map(option => option.valor)
    .filter(valor => !currentSelection.includes(valor));
  
  emit('update:selectedValues', [...currentSelection, ...newValues]);
};

// Limpa seleção dos itens filtrados
const clearAll = () => {
  const currentSelection = [...props.selectedValues];
  const filteredValues = filteredOptions.value.map(option => option.valor);
  
  const newSelection = currentSelection.filter(
    value => !filteredValues.includes(value)
  );
  
  emit('update:selectedValues', newSelection);
};

// Fecha o dropdown ao clicar fora
const handleClickOutside = (event) => {
  const element = event.target;
  let isInside = false;
  let current = element;
  
  while (current) {
    if (current.classList && current.classList.contains('multi-select-filter')) {
      isInside = true;
      break;
    }
    current = current.parentNode;
  }
  
  if (!isInside && isOpen.value) {
    isOpen.value = false;
  }
};

// Computados para exibição das tags selecionadas
const selectedLabels = computed(() => {
  return props.selectedValues
    .map(value => {
      const option = props.options.find(opt => opt.valor === value);
      return option ? option.label : '';
    })
    .filter(Boolean);
});

const visibleSelectedLabels = computed(() => {
  return selectedLabels.value.slice(0, maxVisibleTags);
});

const hiddenCount = computed(() => {
  return Math.max(0, selectedLabels.value.length - maxVisibleTags);
});

// Watch para atualizar opções quando props mudam
watch(() => props.options, (newOptions) => {
  allOptions.value = [...newOptions];
  filteredOptions.value = [...newOptions];
}, { deep: true });

// Lifecycle hooks
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.multi-select-filter {
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
  width: 100%;
}

label {
  font-size: 14px;
  color: #555;
  font-weight: 500;
}

.select-container {
  position: relative;
  width: 100%;
}

.selected-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px 12px;
  background-color: white;
  min-height: 36px;
  cursor: pointer;
  user-select: none;
}

.selected-options:hover {
  border-color: #b3b3b3;
}

.selected-options.active {
  border-color: #40a9ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  flex: 1;
}

.selected-tag, .more-tag {
  background-color: #f0f0f0;
  border-radius: 3px;
  padding: 2px 6px;
  font-size: 12px;
  white-space: nowrap;
}

.more-tag {
  background-color: #e0e0e0;
  font-weight: 500;
}

.placeholder {
  color: #bbb;
}

.arrow {
  font-size: 10px;
  color: #999;
  transition: transform 0.2s;
}

.arrow.up {
  transform: rotate(180deg);
}

.dropdown {
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  right: 0;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
  z-index: 10;
  max-height: 300px;
  display: flex;
  flex-direction: column;
}

.search-box {
  padding: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.search-box input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
}

.search-box input:focus {
  outline: none;
  border-color: #40a9ff;
}

.options-list {
  overflow-y: auto;
  max-height: 200px;
  padding: 6px 0;
}

.option {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 14px;
  user-select: none;
  transition: background-color 0.1s;
}

.option:hover {
  background-color: #f5f5f5;
}

.option input {
  margin-right: 8px;
}

.no-results {
  padding: 10px;
  text-align: center;
  color: #999;
  font-style: italic;
  font-size: 13px;
}

.actions {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  border-top: 1px solid #f0f0f0;
}

.actions button {
  background: none;
  border: none;
  color: #1890ff;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
}

.actions button:hover {
  text-decoration: underline;
}

.select-all {
  color: #1890ff;
}

.clear-all {
  color: #ff4d4f;
}
</style>
