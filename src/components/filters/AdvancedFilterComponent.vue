<template>
  <div class="advanced-filter-container">
    <div class="filter-header">
      <h3>Filtro Avançado</h3>
      <button class="btn-close" @click="closeFilter" aria-label="Fechar">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          <path d="M6.4 19L5 17.6L10.6 12L5 6.4L6.4 5L12 10.6L17.6 5L19 6.4L13.4 12L19 17.6L17.6 19L12 13.4L6.4 19Z">
          </path>
        </svg>
      </button>
    </div>

    <div class="filter-body">
      <!-- Período (à esquerda superior) -->
      <div class="filter-section period-section">
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

      <!-- Estados -->
      <div class="filter-section estados-section">
        <h4>Estados</h4>
        <div class="select-container">
          <select v-model="filters.estados" class="filter-select modern-select" multiple @change="updateFilters">
            <option v-for="estado in estados" :key="estado.uf" :value="estado.uf">
              {{ estado.nome }} ({{ estado.uf }})
            </option>
          </select>
        </div>
      </div>

      <!-- Modalidade -->
      <div class="filter-section modalidade-section">
        <h4>Modalidade</h4>
        <div class="checkbox-group">
          <div v-for="modalidade in modalidadeOptions" :key="modalidade.valor" class="checkbox-item">
            <input type="checkbox" :id="`modalidade-${modalidade.valor}`" :value="modalidade.valor"
              v-model="filters.modalidade" @change="updateFilters" />
            <label :for="`modalidade-${modalidade.valor}`" class="checkbox-label">{{ modalidade.texto }}</label>
          </div>
        </div>
      </div>

      <!-- Status -->
      <div class="filter-section status-section">
        <h4>Status</h4>
        <div class="checkbox-group">
          <div v-for="option in statusOptions" :key="option.value" class="checkbox-item">
            <input type="checkbox" :id="'status-' + option.value" :value="option.value" v-model="filters.status"
              @change="updateFilters" class="custom-cursor-on-hover">
            <label :for="'status-' + option.value" class="checkbox-label">{{ option.text }}</label>
          </div>
        </div>
      </div>

      <!-- Responsáveis -->
      <div class="filter-section responsaveis-section">
        <h4>Responsáveis</h4>
        <div class="select-container">
          <select v-model="filters.responsavel" class="filter-select modern-select" multiple @change="updateFilters">
            <option v-for="resp in responsaveis" :key="resp.id" :value="resp.id">
              {{ resp.nome }}
            </option>
          </select>
        </div>
      </div>

      <!-- Valor Estimado -->
      <div class="filter-section valor-section">
        <h4>Valor Estimado</h4>
        <div class="range-filter">
          <div class="range-field">
            <label for="valor-min">Mínimo</label>
            <div class="input-money">
              <span class="prefix">R$</span>
              <input type="text" id="valor-min" v-model="filters.valorMin" placeholder="0,00"
                @input="formatCurrency($event, 'valorMin')" />
            </div>
          </div>
          <div class="range-field">
            <label for="valor-max">Máximo</label>
            <div class="input-money">
              <span class="prefix">R$</span>
              <input type="text" id="valor-max" v-model="filters.valorMax" placeholder="0,00"
                @input="formatCurrency($event, 'valorMax')" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="active-filters" v-if="hasActiveFilters">
      <h4>Filtros Ativos</h4>
      <div class="filter-tags">
        <span v-for="(tag, index) in activeTags" :key="index" class="filter-tag">
          {{ tag.label }}
          <button @click="removeFilter(tag)" class="btn-remove" aria-label="Remover filtro">×</button>
        </span>
      </div>
    </div>

    <div class="filter-footer">
      <button class="btn-clear" @click="clearFilters">Limpar</button>
      <button class="btn-apply" @click="applyFilters">Aplicar Filtros</button>
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
      estados: props.initialFilters.estados || [],
      status: props.initialFilters.status || [],
      modalidade: props.initialFilters.modalidade || [],
      responsavel: props.initialFilters.responsavel || [],
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
            label: `Status: ${statusObj.text}`, // Alterado de statusObj.label para statusObj.text
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
  max-height: 380px;
  overflow-y: auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
}

.filter-header {
  padding: 12px 20px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  background: white;
  z-index: 5;
}

.filter-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #193155;
}

.btn-close {
  background: transparent;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.btn-close:hover {
  background: #f8f9fa;
  color: #343a40;
}

.filter-body {
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto auto;
  gap: 16px;
  overflow-y: auto;
}

.filter-section {
  display: flex;
  flex-direction: column;
}

.filter-section h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 500;
  color: #495057;
}

/* Seção de período */
.date-range {
  display: flex;
  gap: 10px;
}

.date-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.date-field label {
  font-size: 12px;
  color: #6c757d;
}

.date-field input[type="date"] {
  padding: 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 13px;
}

/* Estilos para os grupos de checkbox */
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 120px;
  overflow-y: auto;
  padding-right: 8px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.checkbox-label {
  font-size: 13px;
  color: #495057;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Estilos para selects modernos */
.select-container {
  position: relative;
}

.modern-select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 13px;
  background-color: white;
  max-height: 120px;
}

.modern-select option {
  padding: 8px;
}

/* Estilo para inputs de valor */
.range-filter {
  display: flex;
  gap: 10px;
}

.range-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.range-field label {
  font-size: 12px;
  color: #6c757d;
}

.input-money {
  position: relative;
  display: flex;
  align-items: center;
}

.input-money .prefix {
  position: absolute;
  left: 8px;
  color: #6c757d;
  font-size: 13px;
}

.input-money input {
  padding: 8px 8px 8px 28px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 13px;
  width: 100%;
}

/* Estilo para filtros ativos */
.active-filters {
  padding: 12px 16px;
  border-top: 1px solid #e9ecef;
  max-height: 80px;
  overflow-y: auto;
}

.active-filters h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 500;
  color: #495057;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-tag {
  display: flex;
  align-items: center;
  background-color: #e7f1ff;
  color: #0d6efd;
  border-radius: 16px;
  padding: 4px 10px;
  font-size: 12px;
  gap: 6px;
}

.btn-remove {
  background: transparent;
  border: none;
  color: #0d6efd;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  padding: 0 2px;
}

.btn-remove:hover {
  color: #0a58ca;
}

/* Estilo para o footer */
.filter-footer {
  padding: 12px 16px;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  position: sticky;
  bottom: 0;
  background: white;
  z-index: 5;
}

.btn-clear,
.btn-apply {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 13px;
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
}

.btn-clear:hover {
  background-color: #f8f9fa;
  border-color: #adb5bd;
}

.btn-apply:hover {
  background-color: #0b5ed7;
  border-color: #0b5ed7;
}

/* Scrollbar estilizado */
.checkbox-group::-webkit-scrollbar,
.modern-select::-webkit-scrollbar,
.advanced-filter-container::-webkit-scrollbar,
.active-filters::-webkit-scrollbar {
  width: 6px;
}

.checkbox-group::-webkit-scrollbar-track,
.modern-select::-webkit-scrollbar-track,
.advanced-filter-container::-webkit-scrollbar-track,
.active-filters::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.checkbox-group::-webkit-scrollbar-thumb,
.modern-select::-webkit-scrollbar-thumb,
.advanced-filter-container::-webkit-scrollbar-thumb,
.active-filters::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.checkbox-group::-webkit-scrollbar-thumb:hover,
.modern-select::-webkit-scrollbar-thumb:hover,
.advanced-filter-container::-webkit-scrollbar-thumb:hover,
.active-filters::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

@media screen and (max-width: 992px) {
  .filter-body {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media screen and (max-width: 768px) {
  .filter-body {
    grid-template-columns: 1fr;
  }
}
</style>
