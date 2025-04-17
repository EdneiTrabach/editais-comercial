<template>
  <div class="filtros-container">
    <div class="filtros-header">
      <h3>Filtrar Processos</h3>
      <button class="btn-toggle-filtros" @click="toggleFiltros">
        {{ filtrosVisivel ? 'Ocultar Filtros' : 'Exibir Filtros' }}
        <i class="fas" :class="filtrosVisivel ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
      </button>
    </div>
    
    <div class="filtros-content" v-show="filtrosVisivel">
      <div class="filtros-grid">
        <div class="filtro-item">
          <label for="orgao">Órgão</label>
          <input 
            type="text" 
            id="orgao" 
            v-model="filtros.orgao" 
            placeholder="Nome do órgão"
            @input="aplicarFiltros"
          />
        </div>
        
        <div class="filtro-item">
          <label for="data">Data</label>
          <input 
            type="date" 
            id="data" 
            v-model="filtros.data" 
            @change="aplicarFiltros"
          />
        </div>
        
        <div class="filtro-item">
          <label for="numero">Número do Processo</label>
          <input 
            type="text" 
            id="numero" 
            v-model="filtros.numeroProcesso" 
            placeholder="Ex: 001/2024"
            @input="aplicarFiltros"
          />
        </div>
        
        <div class="filtro-item">
          <label for="codigo-gpi">Código GPI</label>
          <input 
            type="text" 
            id="codigo-gpi" 
            v-model="filtros.codigoGpi" 
            placeholder="Código GPI"
            @input="aplicarFiltros"
          />
        </div>
        
        <div class="filtro-item">
          <label for="sistema">Sistema</label>
          <select 
            id="sistema" 
            v-model="filtros.sistema" 
            @change="aplicarFiltros"
          >
            <option value="">Todos os sistemas</option>
            <option v-for="sistema in sistemasList" :key="sistema.id" :value="sistema.id">
              {{ sistema.nome }}
            </option>
          </select>
        </div>
        
        <div class="filtro-item filtro-acoes">
          <button class="btn-limpar" @click="limparFiltros">
            <i class="fas fa-eraser"></i> Limpar
          </button>
          <button class="btn-aplicar" @click="aplicarFiltros">
            <i class="fas fa-search"></i> Filtrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AnalisesFiltros',
  props: {
    sistemasDisponiveis: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      filtrosVisivel: false,
      filtros: {
        orgao: '',
        data: '',
        numeroProcesso: '',
        codigoGpi: '',
        sistema: ''
      }
    }
  },
  computed: {
    sistemasList() {
      return this.sistemasDisponiveis;
    }
  },
  methods: {
    toggleFiltros() {
      this.filtrosVisivel = !this.filtrosVisivel;
    },
    aplicarFiltros() {
      this.$emit('filtrar', { ...this.filtros });
    },
    limparFiltros() {
      this.filtros = {
        orgao: '',
        data: '',
        numeroProcesso: '',
        codigoGpi: '',
        sistema: ''
      };
      this.$emit('filtrar', { ...this.filtros });
    }
  }
}
</script>

<style scoped>
.filtros-container {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  border: 1px solid #e9ecef;
}

.filtros-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.filtros-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #495057;
  margin: 0;
}

.btn-toggle-filtros {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  color: #193155;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.btn-toggle-filtros:hover {
  background-color: rgba(25, 49, 85, 0.05);
}

.filtros-content {
  margin-top: 1rem;
  border-top: 1px solid #e9ecef;
  padding-top: 1rem;
}

.filtros-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.filtro-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filtro-item label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #495057;
}

.filtro-item input,
.filtro-item select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.filtro-item input:focus,
.filtro-item select:focus {
  outline: none;
  border-color: #193155;
  box-shadow: 0 0 0 3px rgba(25, 49, 85, 0.1);
}

.filtro-acoes {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
}

.btn-limpar,
.btn-aplicar {
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s;
}

.btn-limpar {
  background-color: #e9ecef;
  color: #495057;
}

.btn-limpar:hover {
  background-color: #dee2e6;
}

.btn-aplicar {
  background-color: #193155;
  color: white;
}

.btn-aplicar:hover {
  background-color: #254677;
}

@media (max-width: 768px) {
  .filtros-grid {
    grid-template-columns: 1fr;
  }
  
  .filtro-acoes {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
