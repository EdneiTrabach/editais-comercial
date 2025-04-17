<template>
  <div class="processo-header-section">
    <div class="processo-header-top">
      <h2>Selecione o Processo</h2>
      <div class="header-actions">
        <VisualizacaoToggle 
          :modo="modoVisualizacao"
          @mudar-visualizacao="alterarModoVisualizacao"
        />
        <button class="btn-novo-processo" @click="$emit('criar-processo')">
          <i class="fas fa-plus"></i> Criar Novo Processo
        </button>
      </div>
    </div>
    
    <div class="filtros-container" :class="{ 'expanded': filtrosVisiveis }">
      <div class="filtros-header">
        <h3>Filtrar Processos</h3>
        <button 
          class="btn-toggle-filtros" 
          :class="{ 'active': filtrosVisiveis }"
          @click="toggleFiltros">
          {{ filtrosVisiveis ? 'Ocultar Filtros' : 'Exibir Filtros' }}
          <i class="fas fa-chevron-down"></i>
        </button>
      </div>
      
      <div class="filtros-content" v-show="filtrosVisiveis">
        <div class="filtros-grid">
          <div class="filtro-item">
            <label for="orgao">Órgão</label>
            <input 
              type="text" 
              id="orgao" 
              v-model="filtros.orgao"
              placeholder="Nome do órgão"
            >
          </div>
          
          <div class="filtro-item">
            <label for="data">Data</label>
            <input 
              type="date" 
              id="data" 
              v-model="filtros.data"
            >
          </div>
          
          <div class="filtro-item">
            <label for="numero">Número do Processo</label>
            <input 
              type="text" 
              id="numero" 
              v-model="filtros.numeroProcesso"
              placeholder="Ex: 001/2024"
            >
          </div>
          
          <div class="filtro-item">
            <label for="codigo-gpi">Código GPI</label>
            <input 
              type="text" 
              id="codigo-gpi" 
              v-model="filtros.codigoGpi"
              placeholder="Código GPI"
            >
          </div>

          <div class="filtro-item">
            <label for="estado">Estado</label>
            <select 
              id="estado" 
              v-model="filtros.estado"
            >
              <option value="">Todos os estados</option>
              <option value="AC">Acre</option>
              <option value="AL">Alagoas</option>
              <option value="AP">Amapá</option>
              <option value="AM">Amazonas</option>
              <option value="BA">Bahia</option>
              <option value="CE">Ceará</option>
              <option value="DF">Distrito Federal</option>
              <option value="ES">Espírito Santo</option>
              <option value="GO">Goiás</option>
              <option value="MA">Maranhão</option>
              <option value="MT">Mato Grosso</option>
              <option value="MS">Mato Grosso do Sul</option>
              <option value="MG">Minas Gerais</option>
              <option value="PA">Pará</option>
              <option value="PB">Paraíba</option>
              <option value="PR">Paraná</option>
              <option value="PE">Pernambuco</option>
              <option value="PI">Piauí</option>
              <option value="RJ">Rio de Janeiro</option>
              <option value="RN">Rio Grande do Norte</option>
              <option value="RS">Rio Grande do Sul</option>
              <option value="RO">Rondônia</option>
              <option value="RR">Roraima</option>
              <option value="SC">Santa Catarina</option>
              <option value="SP">São Paulo</option>
              <option value="SE">Sergipe</option>
              <option value="TO">Tocantins</option>
            </select>
          </div>
          
          <div class="filtro-item">
            <label for="sistema">Sistema</label>
            <select 
              id="sistema" 
              v-model="filtros.sistema"
            >
              <option value="">Todos os sistemas</option>
              <option 
                v-for="sistema in sistemas" 
                :key="sistema.id" 
                :value="sistema.id"
              >
                {{ sistema.nome }}
              </option>
            </select>
          </div>
          
          <div class="filtro-item">
            <label for="status">Status</label>
            <select 
              id="status" 
              v-model="filtros.status"
            >
              <option value="">Todos os status</option>
              <option value="em_analise">Em Análise</option>
              <option value="ganhamos">Ganhamos</option>
              <option value="perdemos">Perdemos</option>
              <option value="cancelado">Cancelado</option>
              <option value="aguardando">Aguardando</option>
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
  </div>
</template>

<script>
import VisualizacaoToggle from './VisualizacaoToggle.vue';

export default {
  name: 'ProcessoHeader',
  
  components: {
    VisualizacaoToggle
  },
  
  props: {
    sistemas: {
      type: Array,
      default: () => []
    },
    modoVisualizacao: {
      type: String,
      default: 'grid'
    }
  },
  
  emits: ['filtrar', 'criar-processo', 'mudar-visualizacao'],
  
  data() {
    return {
      filtrosVisiveis: false,
      filtros: {
        orgao: '',
        data: '',
        numeroProcesso: '',
        codigoGpi: '',
        sistema: '',
        estado: '',
        status: ''
      }
    }
  },
  
  methods: {
    toggleFiltros() {
      this.filtrosVisiveis = !this.filtrosVisiveis;
    },
    
    limparFiltros() {
      this.filtros = {
        orgao: '',
        data: '',
        numeroProcesso: '',
        codigoGpi: '',
        sistema: '',
        estado: '',
        status: ''
      };
    },
    
    aplicarFiltros() {
      this.$emit('filtrar', { ...this.filtros });
    },
    
    alterarModoVisualizacao(modo) {
      this.$emit('mudar-visualizacao', modo);
    }
  }
}
</script>

<style scoped>
.processo-header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
