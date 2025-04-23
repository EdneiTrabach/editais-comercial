import { ref, computed } from 'vue';

export function usePublicacaoEstado() {
  // Estado dos dados
  const processos = ref([]);
  const empresas = ref([]);
  const sistemas = ref([]);
  const processoSelecionado = ref(null);
  const textoPublicacao = ref('');
  const resultadoAnalise = ref(null);
  const processoSugestoes = ref([]);
  const processoBuscaRealizada = ref(false);
  const mostrarTodasSugestoes = ref(false);

  // Estado de loading
  const analisando = ref(false);
  const identificando = ref(false);
  const aplicando = ref(false);

  // Estado de feedback
  const feedbackCorreto = ref(false);
  const mostrarFormCorrecao = ref(false);
  const correcoes = ref({});
  const feedbackEnviado = ref(false);
  const ultimaAnaliseId = ref(null);

  // Computed properties
  const processosFiltrados = computed(() => {
    // Lógica para filtrar processos
    return processos.value;
  });
  
  const processoAtual = computed(() => {
    if (!processoSelecionado.value) return null;
    return processos.value.find(p => p.id === processoSelecionado.value);
  });
  
  const podeIdentificar = computed(() => {
    return textoPublicacao.value.trim().length > 20 && !identificando.value;
  });
  
  const podeAnalisar = computed(() => {
    return textoPublicacao.value.trim().length > 20 && !analisando.value;
  });
  
  const podeAplicar = computed(() => {
    return resultadoAnalise.value && processoAtual.value && !aplicando.value;
  });
  
  const empresaEncontrada = computed(() => {
    if (!resultadoAnalise.value || !resultadoAnalise.value.empresa) return null;
    return empresas.value.find(e => e.id === resultadoAnalise.value.empresa.id);
  });
  
  const sistemasMencionados = computed(() => {
    if (!resultadoAnalise.value || !resultadoAnalise.value.sistemas) return [];
    
    return resultadoAnalise.value.sistemas.map(sistemaId => {
      return sistemas.value.find(s => s.id === sistemaId) || { id: sistemaId, nome: 'Sistema não encontrado' };
    });
  });
  
  const sugestoesExibidas = computed(() => {
    if (mostrarTodasSugestoes.value) {
      return processoSugestoes.value;
    }
    // Mostrar apenas as 3 primeiras sugestões
    return processoSugestoes.value.slice(0, 3);
  });
  
  const enviandoFeedback = computed(() => {
    return false; // Implementar lógica se necessário
  });

  // Métodos para manipulação do estado
  function limparCampos() {
    textoPublicacao.value = '';
    resultadoAnalise.value = null;
    processoSelecionado.value = null;
    processoSugestoes.value = [];
    processoBuscaRealizada.value = false;
    mostrarTodasSugestoes.value = false;
    ultimaAnaliseId.value = null;
    feedbackEnviado.value = false;
  }
  
  function selecionarProcesso(processoId) {
    processoSelecionado.value = processoId;
  }
  
  function abrirFormCorrecao() {
    mostrarFormCorrecao.value = true;
  }
  
  function cancelarCorrecao() {
    mostrarFormCorrecao.value = false;
    correcoes.value = {};
  }

  // Retornar todos os valores e métodos
  return {
    // Estado
    processos,
    empresas,
    sistemas,
    processoSelecionado,
    textoPublicacao,
    resultadoAnalise,
    processoSugestoes,
    processoBuscaRealizada,
    mostrarTodasSugestoes,
    analisando,
    identificando,
    aplicando,
    feedbackCorreto,
    mostrarFormCorrecao,
    correcoes,
    feedbackEnviado,
    ultimaAnaliseId,
    
    // Computed properties
    processosFiltrados,
    processoAtual,
    podeIdentificar,
    podeAnalisar,
    podeAplicar,
    empresaEncontrada,
    sistemasMencionados,
    sugestoesExibidas,
    enviandoFeedback,
    
    // Métodos
    limparCampos,
    selecionarProcesso,
    abrirFormCorrecao,
    cancelarCorrecao
  };
}