<template>
  <div class="advanced-filter-container" :class="{ 'is-active': isActive }">
    <div class="filter-header">
      <h3>Filtro Avançado</h3>
      <button class="btn-close" @click="closeFilter">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          <path d="M6.4 19L5 17.6L10.6 12L5 6.4L6.4 5L12 10.6L17.6 5L19 6.4L13.4 12L19 17.6L17.6 19L12 13.4L6.4 19Z"></path>
        </svg>
      </button>
    </div>

    <div class="filter-body">
      <div class="filter-section">
        <h4>Período</h4>
        <div class="date-range">
          <div class="date-field">
            <label for="data-inicio">De</label>
            <input type="date" id="data-inicio" v-model="filters.dataInicio" />
          </div>
          <div class="date-field">
            <label for="data-fim">Até</label>
            <input type="date" id="data-fim" v-model="filters.dataFim" />
          </div>
        </div>
      </div>

      <div class="filter-section">
        <h4>Status</h4>
        <div class="checkbox-group">
          <div v-for="status in statusOptions" :key="status.value" class="checkbox-item">
            <input 
              type="checkbox" 
              :id="`status-${status.value}`" 
              :value="status.value" 
              v-model="filters.status"
              @change="updateFilters"
            />
            <label :for="`status-${status.value}`" class="checkbox-label">{{ status.label }}</label>
          </div>
        </div>
      </div>

      <div class="filter-section">
        <h4>Modalidade</h4>
        <div class="checkbox-group">
          <div v-for="modalidade in modalidadeOptions" :key="modalidade.valor" class="checkbox-item">
            <input 
              type="checkbox" 
              :id="`modalidade-${modalidade.valor}`" 
              :value="modalidade.valor" 
              v-model="filters.modalidade"
              @change="updateFilters"
            />
            <label :for="`modalidade-${modalidade.valor}`" class="checkbox-label">{{ modalidade.texto }}</label>
          </div>
        </div>
      </div>

      <div class="filter-section">
        <h4>Responsáveis</h4>
        <select 
          v-model="filters.responsavel" 
          class="filter-select"
          multiple
          @change="updateFilters"
        >
          <option v-for="resp in responsaveis" :key="resp.id" :value="resp.id">
            {{ resp.nome }}
          </option>
        </select>
      </div>

      <div class="filter-section">
        <h4>Estados</h4>
        <select 
          v-model="filters.estados" 
          class="filter-select"
          multiple
          @change="updateFilters"
        >
          <option v-for="estado in estados" :key="estado.uf" :value="estado.uf">
            {{ estado.nome }} ({{ estado.uf }})
          </option>
        </select>
      </div>

      <div class="filter-section">
        <h4>Valor Estimado</h4>
        <div class="range-filter">
          <div class="range-field">
            <label for="valor-min">Mínimo</label>
            <div class="input-money">
              <span class="prefix">R$</span>
              <input
                type="text" 
                id="valor-min" 
                v-model="filters.valorMin"
                placeholder="0,00"
                @input="formatCurrency($event, 'valorMin')"
              />
            </div>
          </div>
          <div class="range-field">
            <label for="valor-max">Máximo</label>
            <div class="input-money">
              <span class="prefix">R$</span>
              <input
                type="text" 
                id="valor-max" 
                v-model="filters.valorMax"
                placeholder="0,00"
                @input="formatCurrency($event, 'valorMax')"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="filter-footer">
      <button class="btn-clear" @click="clearFilters">Limpar Filtros</button>
      <button class="btn-apply" @click="applyFilters">Aplicar Filtros</button>
    </div>

    <div class="active-filters" v-if="hasActiveFilters">
      <h4>Filtros Ativos</h4>
      <div class="filter-tags">
        <span 
          v-for="(tag, index) in activeTags" 
          :key="index" 
          class="filter-tag"
        >
          {{ tag.label }}
          <button @click="removeFilter(tag)" class="btn-remove">×</button>
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, watch, onMounted } from 'vue';

export default {
  name: 'AdvancedFilterComponent',
  props: {
    isActive: {
      type: Boolean,
      default: false
    },
    statusOptions: {
      type: Array,
      default: () => []
    },
    modalidadeOptions: {
      type: Array,
      default: () => []
    },
    responsaveis: {
      type: Array,
      default: () => []
    },
    estados: {
      type: Array,
      default: () => []
    },
    initialFilters: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['close', 'update-filters', 'apply-filters', 'clear-filters'],
  
  setup(props, { emit }) {
    const filters = reactive({
      dataInicio: props.initialFilters.dataInicio || '',
      dataFim: props.initialFilters.dataFim || '',
      status: props.initialFilters.status || [],
      modalidade: props.initialFilters.modalidade || [],
      responsavel: props.initialFilters.responsavel || [],
      estados: props.initialFilters.estados || [],
      valorMin: props.initialFilters.valorMin || '',
      valorMax: props.initialFilters.valorMax || ''
    });

    const closeFilter = () => {
      emit('close');
    };

    const updateFilters = () => {
      emit('update-filters', { ...filters });
    };

    const applyFilters = () => {
      emit('apply-filters', { ...filters });
    };

    const clearFilters = () => {
      // Redefinir todos os filtros para valores vazios
      Object.keys(filters).forEach(key => {
        if (Array.isArray(filters[key])) {
          filters[key] = [];
        } else {
          filters[key] = '';
        }
      });
      
      emit('clear-filters');
    };

    // Função para formatação de valores monetários
    const formatCurrency = (event, field) => {
      let value = event.target.value;
      
      // Remove todos os caracteres não numéricos, exceto vírgula
      value = value.replace(/[^\d,]/g, '');
      
      // Garantir apenas uma vírgula
      const parts = value.split(',');
      if (parts.length > 2) {
        value = parts[0] + ',' + parts.slice(1).join('');
      }
      
      // Limitar a 2 casas decimais após a vírgula
      if (parts.length > 1 && parts[1].length > 2) {
        value = parts[0] + ',' + parts[1].substring(0, 2);
      }
      
      // Atualizar o valor no modelo
      filters[field] = value;
    };

    const hasActiveFilters = computed(() => {
      return (
        filters.dataInicio || 
        filters.dataFim || 
        filters.status.length > 0 ||
        filters.modalidade.length > 0 ||
        filters.responsavel.length > 0 ||
        filters.estados.length > 0 ||
        filters.valorMin || 
        filters.valorMax
      );
    });

    const activeTags = computed(() => {
      const tags = [];
      
      if (filters.dataInicio) {
        tags.push({
          type: 'dataInicio',
          label: `De: ${formatDateTag(filters.dataInicio)}`,
          value: filters.dataInicio
        });
      }
      
      if (filters.dataFim) {
        tags.push({
          type: 'dataFim',
          label: `Até: ${formatDateTag(filters.dataFim)}`,
          value: filters.dataFim
        });
      }
      
      filters.status.forEach(statusVal => {
        const statusObj = props.statusOptions.find(s => s.value === statusVal);
        if (statusObj) {
          tags.push({
            type: 'status',
            label: `Status: ${statusObj.label}`,
            value: statusVal
          });
        }
      });
      
      filters.modalidade.forEach(modalidadeVal => {
        const modalidadeObj = props.modalidadeOptions.find(m => m.valor === modalidadeVal);
        if (modalidadeObj) {
          tags.push({
            type: 'modalidade',
            label: `Modalidade: ${modalidadeObj.texto}`,
            value: modalidadeVal
          });
        }
      });
      
      filters.responsavel.forEach(respId => {
        const resp = props.responsaveis.find(r => r.id === respId);
        if (resp) {
          tags.push({
            type: 'responsavel',
            label: `Responsável: ${resp.nome}`,
            value: respId
          });
        }
      });
      
      filters.estados.forEach(estadoUf => {
        const estado = props.estados.find(e => e.uf === estadoUf);
        if (estado) {
          tags.push({
            type: 'estado',
            label: `Estado: ${estado.nome}`,
            value: estadoUf
          });
        }
      });
      
      if (filters.valorMin) {
        tags.push({
          type: 'valorMin',
          label: `Valor mínimo: R$ ${filters.valorMin}`,
          value: filters.valorMin
        });
      }
      
      if (filters.valorMax) {
        tags.push({
          type: 'valorMax',
          label: `Valor máximo: R$ ${filters.valorMax}`,
          value: filters.valorMax
        });
      }
      
      return tags;
    });

    const formatDateTag = (dateString) => {
      if (!dateString) return '';
      
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
    };

    const removeFilter = (tag) => {
      switch (tag.type) {
        case 'dataInicio':
          filters.dataInicio = '';
          break;
        case 'dataFim':
          filters.dataFim = '';
          break;
        case 'status':
          filters.status = filters.status.filter(status => status !== tag.value);
          break;
        case 'modalidade':
          filters.modalidade = filters.modalidade.filter(modalidade => modalidade !== tag.value);
          break;
        case 'responsavel':
          filters.responsavel = filters.responsavel.filter(resp => resp !== tag.value);
          break;
        case 'estado':
          filters.estados = filters.estados.filter(estado => estado !== tag.value);
          break;
        case 'valorMin':
          filters.valorMin = '';
          break;
        case 'valorMax':
          filters.valorMax = '';
          break;
      }
      
      updateFilters();
    };

    // Observar mudanças nos filtros iniciais
    watch(() => props.initialFilters, (newFilters) => {
      Object.keys(newFilters).forEach(key => {
        if (filters.hasOwnProperty(key)) {
          filters[key] = newFilters[key];
        }
      });
    }, { deep: true });

    return {
      filters,
      closeFilter,
      updateFilters,
      applyFilters,
      clearFilters,
      formatCurrency,
      hasActiveFilters,
      activeTags,
      removeFilter
    };
  }
};
</script>

<style scoped>
.advanced-filter-container {
  position: absolute;
  top: 60px;
  right: 10px;
  width: 800px;
  max-height: calc(100vh - 150px);
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  opacity: 0;
  transform: translateY(-10px);
  visibility: hidden;
  transition: all 0.3s ease;
  overflow-y: auto;
}

.advanced-filter-container.is-active {
  opacity: 1;
  transform: translateY(0);
  visibility: visible;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e9ecef;
}

.filter-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.btn-close {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 5px;
  color: #6c757d;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-close:hover {
  background-color: #f2f2f2;
  color: #343a40;
}

.filter-body {
  padding: 16px 20px;
  overflow-y: auto;
  flex: 1;
  display: grid;
  grid-template-columns: auto 2fr;
  gap: 30px;
}

.filter-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #495057;
}

.date-range {
  display: flex;
  gap: 12px;
}

.date-field {
  flex: 1;
}

.date-field label,
.range-field label {
  display: block;
  font-size: 12px;
  margin-bottom: 6px;
  color: #6c757d;
}

input[type="date"],
.filter-select,
.input-money input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
}

.checkbox-group {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.checkbox-item {
  display: flex;
  align-items: center;
}

.checkbox-label {
  margin-left: 8px;
  font-size: 14px;
  cursor: pointer;
}

.filter-select {
  min-height: 120px;
}

.range-filter {
  display: flex;
  gap: 12px;
}

.range-field {
  flex: 1;
}

.input-money {
  position: relative;
  display: flex;
  align-items: center;
}

.prefix {
  position: absolute;
  left: 12px;
  color: #6c757d;
  font-size: 14px;
}

.input-money input {
  padding-left: 30px;
}

.filter-footer {
  display: flex;
  justify-content: space-between;
  padding: 16px 20px;
  border-top: 1px solid #e9ecef;
  gap: 10px;
}

.btn-clear,
.btn-apply {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-clear {
  background-color: transparent;
  border: 1px solid #ced4da;
  color: #6c757d;
}

.btn-apply {
  background-color: #0d6efd;
  border: 1px solid #0d6efd;
  color: white;
  flex-grow: 1;
}

.btn-clear:hover {
  background-color: #f8f9fa;
  border-color: #adb5bd;
}

.btn-apply:hover {
  background-color: #0b5ed7;
  border-color: #0b5ed7;
}

.active-filters {
  padding: 16px 20px;
  border-top: 1px solid #e9ecef;
}

.active-filters h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #495057;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-tag {
  background-color: #e9ecef;
  border-radius: 16px;
  padding: 4px 12px;
  font-size: 12px;
  color: #495057;
  display: flex;
  align-items: center;
}

.btn-remove {
  background: transparent;
  border: none;
  color: #6c757d;
  margin-left: 6px;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-remove:hover {
  color: #dc3545;
}

@media (max-width: 640px) {
  .advanced-filter-container {
    width: 100%;
    right: 0;
    border-radius: 0;
    max-height: calc(100vh - 50px);
  }
  
  .checkbox-group {
    grid-template-columns: 1fr;
  }
}
</style>
