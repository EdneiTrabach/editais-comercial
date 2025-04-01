<template>
  <div class="advanced-filter-container">
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
/* Estilos removidos - agora são gerenciados no arquivo filters.css */
</style>
