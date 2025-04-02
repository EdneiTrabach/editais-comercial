<template>
  <div class="process-report-container">
    <div class="report-header">
      <button class="back-button" @click="goBack">
        <span class="arrow-left">←</span> Voltar
      </button>
      <h2>Relatório de Processos</h2>
    </div>

    <!-- Seção de filtros -->
    <div class="filters-section">
      <div class="filters-header">
        <h3>Filtros</h3>
        <button class="toggle-filters" @click="showFilters = !showFilters">
          {{ showFilters ? 'Ocultar filtros' : 'Mostrar filtros' }}
        </button>
      </div>
      
      <div class="filters-container" v-if="showFilters">
        <div class="filter-row">
          <DateRangeFilter 
            label="Período" 
            :startDate="filters.startDate" 
            :endDate="filters.endDate"
            @update:startDate="filters.startDate = $event"
            @update:endDate="filters.endDate = $event" 
          />
          
          <SelectFilter
            label="Status"
            :options="statusOptions"
            :selectedValue="filters.status"
            @update:selectedValue="filters.status = $event"
          />
        </div>
        
        <div class="filter-row">
          <SelectFilter
            label="Modalidade"
            :options="modalidades"
            :selectedValue="filters.modalidade"
            @update:selectedValue="filters.modalidade = $event"
          />
          
          <SearchFilter
            label="Número do Processo"
            :value="filters.numeroProcesso"
            @update:value="filters.numeroProcesso = $event"
            placeholder="Ex: 123/2023"
          />
        </div>
        
        <div class="filter-row">
          <SearchFilter
            label="Órgão"
            :value="filters.orgao"
            @update:value="filters.orgao = $event"
            placeholder="Nome do órgão"
          />
          
          <SelectFilter
            label="Estado (UF)"
            :options="estados"
            :selectedValue="filters.uf"
            @update:selectedValue="filters.uf = $event"
          />
        </div>

        <div class="filter-row">
          <SelectFilter
            v-if="representantes.length"
            label="Representante"
            :options="representanteOptions"
            :selectedValue="filters.representanteId"
            @update:selectedValue="filters.representanteId = $event"
          />
          
          <SelectFilter
            v-if="empresas.length"
            label="Empresa"
            :options="empresaOptions"
            :selectedValue="filters.empresaId"
            @update:selectedValue="filters.empresaId = $event"
          />
        </div>

        <div class="filter-row">
          <SelectFilter
            v-if="responsaveis.length"
            label="Responsável"
            :options="responsavelOptions"
            :selectedValue="filters.responsavelId"
            @update:selectedValue="filters.responsavelId = $event"
          />
          
          <RangeFilter
            label="Valor Estimado"
            :minValue="filters.valorMin"
            :maxValue="filters.valorMax"
            @update:minValue="filters.valorMin = $event"
            @update:maxValue="filters.valorMax = $event"
            prefix="R$"
            minPlaceholder="Valor mínimo"
            maxPlaceholder="Valor máximo"
          />
        </div>
        
        <div class="filter-row">
          <MultiSelectFilter
            v-if="sistemas.length"
            label="Sistemas"
            :options="sistemaOptions"
            :selectedValues="filters.sistemasAtivos"
            @update:selectedValues="filters.sistemasAtivos = $event"
          />
          
          <SelectFilter
            label="Ordenar por"
            :options="sortOptions"
            :selectedValue="filters.sortBy"
            @update:selectedValue="filters.sortBy = $event"
          />
        </div>

        <div class="filter-actions">
          <button class="clear-btn" @click="clearFilters">Limpar filtros</button>
          <button class="apply-btn" @click="applyFilters">Aplicar filtros</button>
        </div>
      </div>
    </div>

    <!-- Seção de resultados -->
    <div class="results-section">
      <div class="results-header">
        <h3>Resultados <span v-if="processes.length > 0">({{ totalItems }})</span></h3>
        
        <div class="export-options">
          <button class="export-btn" @click="exportToPDF" :disabled="processes.length === 0">
            Exportar PDF
          </button>
          <button class="export-btn" @click="exportToExcel" :disabled="processes.length === 0">
            Exportar Excel
          </button>
        </div>
      </div>

      <div class="loading-indicator" v-if="loading">
        <div class="spinner"></div>
        <p>Carregando dados...</p>
      </div>

      <div class="no-results" v-else-if="!loading && processes.length === 0">
        <img src="/icons/empty-search.svg" alt="Sem resultados" />
        <p>Nenhum processo encontrado com os filtros aplicados.</p>
      </div>

      <div class="process-table" v-else>
        <table>
          <thead>
            <tr>
              <th>Número</th>
              <th>Órgão</th>
              <th>Modalidade</th>
              <th>Data Abertura</th>
              <th>Status</th>
              <th>Valor Estimado</th>
              <th>Representante</th>
              <th>Responsável</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="process in processes" :key="process.id">
              <td>{{ process.numero_processo }}</td>
              <td>{{ process.orgao }}</td>
              <td>{{ formatModalidade(process.modalidade) }}</td>
              <td>{{ formatDate(process.data_pregao) }}</td>
              <td>
                <span class="status-badge" :class="getStatusClass(process.status)">
                  {{ formatStatus(process.status) }}
                </span>
              </td>
              <td>{{ formatCurrency(process.valor_estimado) }}</td>
              <td>{{ process.representante?.nome || '-' }}</td>
              <td>{{ process.responsavel?.nome || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination" v-if="totalPages > 0">
        <button 
          class="pagination-btn" 
          :disabled="currentPage === 1"
          @click="changePage(currentPage - 1)"
        >
          Anterior
        </button>
        
        <div class="page-numbers">
          <button 
            v-for="page in displayedPages" 
            :key="page"
            class="page-number"
            :class="{ 'active': page === currentPage, 'ellipsis': page === '...' }"
            :disabled="page === '...'"
            @click="page !== '...' && changePage(page)"
          >
            {{ page }}
          </button>
        </div>
        
        <button 
          class="pagination-btn" 
          :disabled="currentPage === totalPages"
          @click="changePage(currentPage + 1)"
        >
          Próxima
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import { 
  getProcesses, 
  getRepresentantes, 
  getEmpresas, 
  getResponsaveis,
  getSistemas,
  getEstados,
  getModalidades,
  getStatusProcesso
} from '@/services/processService';
import DateRangeFilter from '@/components/filters/DateRangeFilter.vue';
import SelectFilter from '@/components/filters/SelectFilter.vue';
import SearchFilter from '@/components/filters/SearchFilter.vue';
import MultiSelectFilter from '@/components/filters/MultiSelectFilter.vue';
import RangeFilter from '@/components/filters/RangeFilter.vue';
import { exportToPDF as exportPDF, exportToExcel as exportExcel } from '@/utils/exportUtils';
import { testConnection } from '@/lib/supabase';

// Comunicação com o componente pai
const emit = defineEmits(['back']);

// Estado para controle de UI
const showFilters = ref(true);
const loading = ref(false);
const currentPage = ref(1);
const itemsPerPage = ref(10);
const processes = ref([]);
const totalItems = ref(0);

// Dados para filtros
const representantes = ref([]);
const empresas = ref([]);
const responsaveis = ref([]);
const sistemas = ref([]);
const estados = ref(getEstados());
const modalidades = ref(getModalidades());
const statusOptions = ref(getStatusProcesso());

// Filtros a serem aplicados
const filters = reactive({
  startDate: '',
  endDate: '',
  status: '',
  modalidade: '',
  numeroProcesso: '',
  orgao: '',
  representanteId: '',
  empresaId: '',
  responsavelId: '',
  sistemasAtivos: [],
  uf: '',
  valorMin: '',
  valorMax: '',
  sortBy: 'date_desc'
});

// Opções para o filtro de ordenação
const sortOptions = [
  { valor: 'date_desc', label: 'Data (mais recente)' },
  { valor: 'date_asc', label: 'Data (mais antiga)' },
  { valor: 'value_desc', label: 'Valor (maior)' },
  { valor: 'value_asc', label: 'Valor (menor)' }
];

// Opções formatadas para os filtros
const representanteOptions = computed(() => {
  const options = representantes.value.map(item => ({
    valor: item.id,
    label: item.nome
  }));
  return [{ valor: '', label: 'Todos' }, ...options];
});

const empresaOptions = computed(() => {
  const options = empresas.value.map(item => ({
    valor: item.id,
    label: item.nome
  }));
  return [{ valor: '', label: 'Todas' }, ...options];
});

const responsavelOptions = computed(() => {
  const options = responsaveis.value.map(item => ({
    valor: item.id,
    label: item.nome || item.email
  }));
  return [{ valor: '', label: 'Todos' }, ...options];
});

const sistemaOptions = computed(() => {
  return sistemas.value.map(item => ({
    valor: item.id,
    label: item.nome
  }));
});

// Total de páginas calculado
const totalPages = computed(() => {
  return Math.ceil(totalItems.value / itemsPerPage.value) || 0;
});

// Páginas a serem exibidas na paginação
const displayedPages = computed(() => {
  if (totalPages.value <= 7) {
    return Array.from({ length: totalPages.value }, (_, i) => i + 1);
  }
  
  if (currentPage.value <= 4) {
    return [1, 2, 3, 4, 5, '...', totalPages.value];
  }
  
  if (currentPage.value >= totalPages.value - 3) {
    return [1, '...', totalPages.value - 4, totalPages.value - 3, totalPages.value - 2, totalPages.value - 1, totalPages.value];
  }
  
  return [
    1, 
    '...', 
    currentPage.value - 1, 
    currentPage.value, 
    currentPage.value + 1, 
    '...', 
    totalPages.value
  ];
});

// Funções
const fetchProcesses = async () => {
  loading.value = true;
  
  try {
    console.log("Aplicando filtros:", JSON.stringify(filters));
    const response = await getProcesses({
      ...filters,
      page: currentPage.value,
      limit: itemsPerPage.value
    });
    
    processes.value = response.data;
    totalItems.value = response.total;
    
    console.log(`Processos carregados: ${processes.value.length}`);
    console.log("Total de itens:", totalItems.value);
  } catch (error) {
    console.error('Erro ao buscar processos:', error);
  } finally {
    loading.value = false;
  }
};

const loadFilterData = async () => {
  try {
    console.log("Carregando dados para filtros...");
    const [repData, empData, respData, sistData] = await Promise.all([
      getRepresentantes(),
      getEmpresas(),
      getResponsaveis(),
      getSistemas()
    ]);
    
    representantes.value = repData;
    empresas.value = empData;
    responsaveis.value = respData;
    sistemas.value = sistData;
    
    console.log(`Dados carregados: ${representantes.value.length} representantes, ${empresas.value.length} empresas`);
  } catch (error) {
    console.error('Erro ao carregar dados para filtros:', error);
  }
};

const clearFilters = () => {
  Object.keys(filters).forEach(key => {
    if (key === 'sistemasAtivos') {
      filters[key] = [];
    } else {
      filters[key] = '';
    }
  });
  filters.sortBy = 'date_desc';
  console.log("Filtros limpos");
};

const applyFilters = () => {
  currentPage.value = 1; // Reinicia a paginação ao aplicar novos filtros
  console.log("Aplicando filtros:", JSON.stringify(filters));
  fetchProcesses();
};

const changePage = (page) => {
  currentPage.value = page;
  fetchProcesses();
};

const goBack = () => {
  emit('back');
};

const exportToPDF = () => {
  exportPDF(processes.value, 'relatorio_processos');
};

const exportToExcel = () => {
  exportExcel(processes.value, 'relatorio_processos');
};

// Funções auxiliares de formatação
const formatDate = (dateString) => {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR').format(date);
};

const formatCurrency = (value) => {
  if (value === undefined || value === null) return '-';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Carrega dados iniciais
onMounted(async () => {
  console.log("Componente montado, testando conexão com Supabase...");
  
  // Testa a conexão antes de carregar os dados
  const connected = await testConnection();
  if (!connected) {
    console.error("Problemas com a conexão do Supabase. Verifique as credenciais.");
  }
  
  await loadFilterData();
  fetchProcesses();
});
</script>

<style scoped>
.process-report-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 100%;
  margin-top: 20px;
}

.report-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 10px;
}

.back-button {
  background-color: transparent;
  border: none;
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  color: #555;
  font-size: 14px;
  padding: 8px;
}

.back-button:hover {
  color: #1890ff;
}

.arrow-left {
  font-size: 18px;
}

.filters-section, .results-section {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.filters-header, .results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.toggle-filters {
  background-color: transparent;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 14px;
}

.toggle-filters:hover {
  background-color: #f5f5f5;
}

.filters-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding-top: 10px;
}

.filter-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 15px;
}

.clear-btn {
  background-color: #fff;
  border: 1px solid #d9d9d9;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.apply-btn {
  background-color: #1890ff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.apply-btn:hover {
  background-color: #40a9ff;
}

.clear-btn:hover {
  background-color: #f0f0f0;
}

.export-options {
  display: flex;
  gap: 10px;
}

.export-btn {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background-color: white;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
}

.export-btn:hover {
  background-color: #f0f0f0;
}

.export-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
  color: #999;
}

.no-results img {
  width: 80px;
  height: 80px;
  margin-bottom: 15px;
  opacity: 0.6;
}

.process-table {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background-color: #fafafa;
  font-weight: 500;
  color: #555;
}

tr:hover {
  background-color: #f5f5f5;
}

.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

.status-open {
  background-color: #e6f7ff;
  color: #1890ff;
}

.status-analyzing {
  background-color: #fff7e6;
  color: #fa8c16;
}

.status-completed {
  background-color: #f6ffed;
  color: #52c41a;
}

.status-canceled {
  background-color: #fff1f0;
  color: #f5222d;
}

.status-participating {
  background-color: #fffbe6;
  color: #faad14;
}

.status-won {
  background-color: #f6ffed;
  color: #52c41a;
}

.status-lost {
  background-color: #fff1f0;
  color: #f5222d;
}

.status-revoked {
  background-color: #f9f0ff;
  color: #722ed1;
}

.status-suspended {
  background-color: #fcf4e6;
  color: #fa8c16;
}

.status-not-participating {
  background-color: #f0f2f5;
  color: #8c8c8c;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  gap: 10px;
}

.pagination-btn {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  background-color: white;
  border-radius: 4px;
  cursor: pointer;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 5px;
}

.page-number {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #d9d9d9;
  background-color: white;
  border-radius: 4px;
  cursor: pointer;
}

.page-number.active {
  background-color: #1890ff;
  color: white;
  border-color: #1890ff;
}

.ellipsis {
  background-color: transparent;
  border: none;
  cursor: default;
}

.ellipsis:hover {
  background-color: transparent;
}

@media (max-width: 768px) {
  .filter-row {
    grid-template-columns: 1fr;
  }
}
</style>
