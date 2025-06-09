<!-- Arquivo: src/components/processos/ProcessoHeader.vue -->
<template>
  <div class="processo-header-section">
    <div class="processo-header-top">
      <h2>{{ title }}</h2>
      <div class="header-actions">
        <div class="visualizacao-toggle">
          <button 
            class="btn-visualizacao" 
            :class="{ 'ativo': modoVisualizacao === 'grid' }"
            title="Visualização em grade"
            @click="alternarVisualizacao('grid')"
          >
            <i class="fas fa-th-large"></i>
          </button>
          <button 
            class="btn-visualizacao" 
            :class="{ 'ativo': modoVisualizacao === 'lista' }"
            title="Visualização em lista"
            @click="alternarVisualizacao('lista')"
          >
            <i class="fas fa-list"></i>
          </button>
        </div>
        <button class="btn-novo-processo" @click="criarNovoProcesso">
          <i class="fas fa-plus"></i> Criar Novo Processo
        </button>
      </div>
    </div>
    
    <div class="filtros-container">
      <div class="filtros-header">
        <h3>Filtrar Processos</h3>
        <button class="btn-toggle-filtros" @click="toggleFiltros">
          {{ mostrarFiltros ? 'Ocultar Filtros' : 'Exibir Filtros' }}
          <i class="fas" :class="mostrarFiltros ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
        </button>
      </div>
      
      <div class="filtros-content" :style="{ display: mostrarFiltros ? 'block' : 'none' }">
        <div class="filtros-grid">
          <div class="filtro-item">
            <label for="orgao">Órgão</label>
            <input 
              type="text" 
              id="orgao" 
              placeholder="Nome do órgão" 
              v-model="filtros.orgao"
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
              placeholder="Ex: 001/2024" 
              v-model="filtros.numeroProcesso"
            >
          </div>
          
          <div class="filtro-item">
            <label for="codigo-gpi">Código GPI</label>
            <input 
              type="text" 
              id="codigo-gpi" 
              placeholder="Código GPI" 
              v-model="filtros.codigoGpi"
            >
          </div>
          
          <div class="filtro-item">
            <label for="estado">Estado</label>
            <select id="estado" v-model="filtros.estado">
              <option value="">Todos os estados</option>
              <option v-for="estado in estados" :key="estado.uf" :value="estado.uf">
                {{ estado.nome }}
              </option>
            </select>
          </div>
          
          <div class="filtro-item">
            <label for="sistema">Sistema</label>
            <select id="sistema" v-model="filtros.sistema">
              <option value="">Todos os sistemas</option>
              <option v-for="sistema in sistemas" :key="sistema.id" :value="sistema.id">
                {{ sistema.nome }}
              </option>
            </select>
          </div>
          
          <div class="filtro-item">
            <label for="status">Status</label>
            <select id="status" v-model="filtros.status">
              <option value="">Todos os status</option>
              <option value="em_analise">Em Análise</option>
              <option value="vamos_participar">Vamos Participar</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="ganhamos">Ganhamos</option>
              <option value="perdemos">Perdemos</option>
              <option value="suspenso">Suspenso</option>
              <option value="revogado">Revogado</option>
              <option value="adiado">Adiado</option>
              <option value="demonstracao">Demonstração</option>
              <option value="cancelado">Cancelado</option>
              <option value="nao_participar">Decidido Não Participar</option>
            </select>
          </div>
          
          <div class="filtro-item">
            <label for="responsavel">Responsável</label>
            <input 
              type="text" 
              id="responsavel" 
              placeholder="Nome do responsável" 
              v-model="filtros.responsavel"
            >
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
export default {
  name: 'ProcessoHeader',
  
  props: {
    title: {
      type: String,
      default: 'Selecione o Processo'
    },
    sistemas: {
      type: Array,
      default: () => []
    },
    modoVisualizacao: {
      type: String,
      default: 'lista',
      validator: (value) => ['grid', 'lista'].includes(value)
    },
    estados: {
      type: Array,
      default: () => [
        { uf: 'AC', nome: 'Acre' },
        { uf: 'AL', nome: 'Alagoas' },
        { uf: 'AP', nome: 'Amapá' },
        { uf: 'AM', nome: 'Amazonas' },
        { uf: 'BA', nome: 'Bahia' },
        { uf: 'CE', nome: 'Ceará' },
        { uf: 'DF', nome: 'Distrito Federal' },
        { uf: 'ES', nome: 'Espírito Santo' },
        { uf: 'GO', nome: 'Goiás' },
        { uf: 'MA', nome: 'Maranhão' },
        { uf: 'MT', nome: 'Mato Grosso' },
        { uf: 'MS', nome: 'Mato Grosso do Sul' },
        { uf: 'MG', nome: 'Minas Gerais' },
        { uf: 'PA', nome: 'Pará' },
        { uf: 'PB', nome: 'Paraíba' },
        { uf: 'PR', nome: 'Paraná' },
        { uf: 'PE', nome: 'Pernambuco' },
        { uf: 'PI', nome: 'Piauí' },
        { uf: 'RJ', nome: 'Rio de Janeiro' },
        { uf: 'RN', nome: 'Rio Grande do Norte' },
        { uf: 'RS', nome: 'Rio Grande do Sul' },
        { uf: 'RO', nome: 'Rondônia' },
        { uf: 'RR', nome: 'Roraima' },
        { uf: 'SC', nome: 'Santa Catarina' },
        { uf: 'SP', nome: 'São Paulo' },
        { uf: 'SE', nome: 'Sergipe' },
        { uf: 'TO', nome: 'Tocantins' }
      ]
    }
  },
  
  data() {
    return {
      mostrarFiltros: false,
      filtros: {
        orgao: '',
        data: '',
        numeroProcesso: '',
        codigoGpi: '',
        estado: '',
        sistema: '',
        status: '',
        responsavel: ''
      }
    }
  },
  
  methods: {
    toggleFiltros() {
      this.mostrarFiltros = !this.mostrarFiltros;
    },
    
    alternarVisualizacao(modo) {
      this.$emit('mudar-visualizacao', modo);
    },
    
    criarNovoProcesso() {
      this.$emit('criar-processo');
    },
    
    limparFiltros() {
      this.filtros = {
        orgao: '',
        data: '',
        numeroProcesso: '',
        codigoGpi: '',
        estado: '',
        sistema: '',
        status: '',
        responsavel: ''
      };
      this.$emit('filtrar', this.filtros);
    },
    
    aplicarFiltros() {
      this.$emit('filtrar', {...this.filtros});
    }
  }
}
</script>

<style scoped>
/* Você pode importar os estilos do arquivo CSS existente ou defini-los aqui */
@import '@/assets/styles/analises/filtros.css';
</style>