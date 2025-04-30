<template>
  <div class="analises-processo-container">
    <div class="header-section">
      <h1>Processos para Análise</h1>
      <div class="actions">
        <button class="btn-novo-processo" @click="criarNovoProcesso">
          <i class="fas fa-plus"></i> Novo Processo
        </button>
      </div>
    </div>
    
    <!-- Componente de Filtros -->
    <div class="filtros-wrapper">
      <ProcessosFiltros 
        @filtros-atualizados="aplicarFiltros"
      />
    </div>
    
    <!-- Componente de Lista de Processos -->
    <ProcessoLista 
      :processos="processosFiltrados"
      :selected-processo="processoSelecionado"
      @select-processo="selecionarProcesso"
      @filter-change="aplicarFiltrosAdicionais"
    />
    
    <!-- Modal para criar novo processo aqui... -->
  </div>
</template>

<script>
import ProcessosFiltros from '@/components/ProcessosFiltros.vue';
import ProcessoLista from '@/components/ProcessoLista.vue';
import { ref, computed, onMounted } from 'vue';
import { useAnalises } from '@/composables/useAnalises';

export default {
  name: 'AnalisesProcessoView',
  components: {
    ProcessosFiltros,
    ProcessoLista
  },
  setup() {
    // Usar o composable de análises
    const { loadProcessos, processos } = useAnalises();
    
    const processoSelecionado = ref(null);
    const filtros = ref({});
    const filtrosAdicionais = ref({
      onlyInAnalysis: false
    });
    const carregando = ref(true);
    
    // Computed para filtrar processos
    const processosFiltrados = computed(() => {
      let resultado = [...processos.value];
      
      // Aplicar filtros básicos
      if (filtros.value.orgao) {
        resultado = resultado.filter(p => 
          p.orgao && p.orgao.toLowerCase().includes(filtros.value.orgao.toLowerCase())
        );
      }
      
      if (filtros.value.estado) {
        resultado = resultado.filter(p => 
          p.estado === filtros.value.estado
        );
      }
      
      if (filtros.value.status) {
        resultado = resultado.filter(p => 
          p.status === filtros.value.status
        );
      }
      
      // Aplicar filtros adicionais
      if (filtrosAdicionais.value.onlyInAnalysis) {
        resultado = resultado.filter(p => 
          p.status === 'em_analise'
        );
      }
      
      return resultado;
    });
    
    // Carregar dados ao montar o componente
    onMounted(async () => {
      await loadProcessos();
      carregando.value = false;
    });
    
    // Métodos
    const aplicarFiltros = (novosFiltros) => {
      filtros.value = { ...novosFiltros };
    };
    
    const aplicarFiltrosAdicionais = (novosOpcoes) => {
      filtrosAdicionais.value = { ...novosOpcoes };
    };
    
    const selecionarProcesso = (processo) => {
      processoSelecionado.value = processo;
      // Aqui você poderia navegar para outra rota, por exemplo
    };
    
    const criarNovoProcesso = () => {
      // Lógica para criar novo processo
    };
    
    return {
      processos,
      processosFiltrados,
      processoSelecionado,
      carregando,
      aplicarFiltros,
      aplicarFiltrosAdicionais,
      selecionarProcesso,
      criarNovoProcesso
    };
  }
};
</script>