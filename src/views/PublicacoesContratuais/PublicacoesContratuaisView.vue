<template>
  <div class="layout">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />
    
    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <div class="header">
        <h1>Análise de Publicações Contratuais</h1>
        <p class="subtitle">Extraia automaticamente informações de contratos usando IA</p>
      </div>
      
      <div class="content-container">
        <!-- Componente para input de texto -->
        <TextoPublicacaoInput 
          :texto="textoPublicacao"
          :pode-identificar="podeIdentificar"
          :identificando="identificando"
          :pode-analisar="podeAnalisar"
          :analisando="analisando"
          @update-texto="textoPublicacao = $event"
          @identificar="identificarProcesso"
          @analisar="analisarPublicacao"
          @limpar="limparCampos"
        />
        
        <!-- Componente para sugestões de processos -->
        <ProcessosSugestoes
          v-if="processoSugestoes.length > 0 || processoBuscaRealizada"
          :sugestoes="sugestoesExibidas"
          :total-sugestoes="processoSugestoes.length"
          :mostrar-todas="mostrarTodasSugestoes"
          :busca-realizada="processoBuscaRealizada"
          :processo-selecionado="processoSelecionado"
          :processos-filtrados="processosFiltrados"
          @selecionar="selecionarProcesso"
          @toggle-mostrar="mostrarTodasSugestoes = !mostrarTodasSugestoes"
          @update-selecao="processoSelecionado = $event"
        />
        
        <!-- Componente para resultados da análise -->
        <ResultadosAnalise
          v-if="resultadoAnalise"
          :resultado="resultadoAnalise"
          :processo-atual="processoAtual"
          :empresa-encontrada="empresaEncontrada"
          :sistemas-mencionados="sistemasMencionados"
          :pode-aplicar="podeAplicar"
          :aplicando="aplicando"
          @aplicar="aplicarResultados"
        />

        <!-- Componente para feedback da análise -->
        <FeedbackAnaliseForm
          v-if="resultadoAnalise && ultimaAnaliseId"
          :empresas="empresas"
          :resultado="resultadoAnalise"
          :enviando-feedback="enviandoFeedback"
          :feedback-correto="feedbackCorreto"
          :mostrar-form-correcao="mostrarFormCorrecao"
          :correcoes="correcoes"
          :feedback-enviado="feedbackEnviado"
          @enviar-feedback="enviarFeedback"
          @abrir-form="abrirFormCorrecao"
          @cancelar-correcao="cancelarCorrecao"
          @update-correcoes="correcoes = $event"
        />
      </div>
      
      <div v-if="mostrarMensagem" class="toast-message" :class="tipoMensagem">
        {{ mensagem }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import TheSidebar from '@/components/TheSidebar.vue';

// Componentes extraídos
import TextoPublicacaoInput from './components/TextoPublicacaoInput.vue';
import ProcessosSugestoes from './components/ProcessosSugestoes.vue';
import ResultadosAnalise from './components/ResultadosAnalise.vue';
import FeedbackAnaliseForm from './components/FeedbackAnaliseForm.vue';

// Composables customizados
import { usePublicacaoAnalise } from './composables/usePublicacaoAnalise';
import { usePublicacaoEstado } from './composables/usePublicacaoEstado';

// Serviços 
import { carregarDados } from './functions/carregamentoService';

export default {
  name: 'PublicacoesContratuaisView',
  
  components: {
    TheSidebar,
    TextoPublicacaoInput,
    ProcessosSugestoes,
    ResultadosAnalise,
    FeedbackAnaliseForm
  },
  
  setup() {
    // Estado da interface
    const isSidebarExpanded = ref(true);
    const mostrarMensagem = ref(false);
    const mensagem = ref('');
    const tipoMensagem = ref('');
    
    // Usar o composable de estado principal
    const {
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
    } = usePublicacaoEstado();
    
    // Usar o composable de análise
    const {
      identificarProcesso,
      analisarPublicacao,
      aplicarResultados,
      enviarFeedback
    } = usePublicacaoAnalise({
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
      ultimaAnaliseId,
      feedbackCorreto,
      mostrarFormCorrecao,
      feedbackEnviado,
      correcoes,
      exibirMensagem
    });
    
    // Função para exibir mensagem
    function exibirMensagem(msg, tipo = 'info') {
      mensagem.value = msg;
      tipoMensagem.value = tipo;
      mostrarMensagem.value = true;
      
      setTimeout(() => {
        mostrarMensagem.value = false;
      }, 5000);
    }
    
    // Função para lidar com toggle da sidebar
    const handleSidebarToggle = (expanded) => {
      isSidebarExpanded.value = expanded;
    };
    
    // Ao montar o componente, carregamos os dados necessários
    onMounted(async () => {
      try {
        const dados = await carregarDados();
        processos.value = dados.processos || [];
        empresas.value = dados.empresas || [];
        sistemas.value = dados.sistemas || [];
      } catch (error) {
        exibirMensagem('Erro ao carregar dados. Tente novamente mais tarde.', 'error');
      }
    });
    
    return {
      // Estado
      isSidebarExpanded,
      mostrarMensagem,
      mensagem,
      tipoMensagem,
      
      // Estado da publicação
      processos,
      processosFiltrados,
      processoSelecionado,
      processoAtual,
      textoPublicacao,
      resultadoAnalise,
      analisando,
      identificando,
      aplicando,
      processoSugestoes,
      processoBuscaRealizada,
      mostrarTodasSugestoes,
      sugestoesExibidas,
      
      // Estado do feedback
      empresas,
      ultimaAnaliseId,
      feedbackCorreto,
      mostrarFormCorrecao,
      correcoes,
      enviandoFeedback,
      feedbackEnviado,
      
      // Computed properties
      podeIdentificar,
      podeAnalisar,
      podeAplicar,
      empresaEncontrada,
      sistemasMencionados,
      
      // Métodos
      handleSidebarToggle,
      identificarProcesso,
      selecionarProcesso,
      analisarPublicacao,
      aplicarResultados,
      limparCampos,
      enviarFeedback,
      abrirFormCorrecao,
      cancelarCorrecao
    };
  }
}
</script>

<style src="./css/PublicacoesContratuais.css"></style>