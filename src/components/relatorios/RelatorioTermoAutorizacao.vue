<template>
  <div class="relatorio-termo-component formulario-container">
    <!-- Seção de cabeçalho -->
    <div class="secao cabecalho">
      <div class="local-data">
        <input 
          type="text" 
          v-model="formData.localData" 
          placeholder="Domingos Martins-ES, __ de ______ de ____" 
          class="input-transparente"
          aria-label="Local e data"
        />
      </div>
      
      <h1 class="titulo-relatorio">RELATÓRIO / TERMO DE AUTORIZAÇÃO</h1>
      
      <div class="tipo-cliente">
        <label class="checkbox-container">
          <input 
            type="checkbox" 
            v-model="formData.isCliente"
            aria-label="Cliente"
          >
          <span class="checkbox-text">Cliente</span>
        </label>
        
        <label class="checkbox-container ml-4">
          <input 
            type="checkbox" 
            v-model="formData.isProspect"
            aria-label="Prospect"
          >
          <span class="checkbox-text">Prospect</span>
        </label>
      </div>
    </div>
    
    <!-- O resto do conteúdo segue o mesmo do RelatorioTermoAutorizacaoView.vue -->
    <!-- ... (use o mesmo conteúdo do seu componente existente) ... -->
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue';
import { exportToPDF } from '@/utils/exportRelatorioUtils';
import { supabase } from '@/lib/supabase';

export default {
  name: 'RelatorioTermoAutorizacao',
  
  props: {
    processo: {
      type: Object,
      required: true
    },
    dataInicial: {
      type: Object,
      default: () => ({})
    }
  },
  
  setup(props) {
    // Use o mesmo código do seu componente RelatorioTermoAutorizacaoView.vue,
    // mas preencha valores iniciais com base no props.processo e props.dataInicial
    
    const formData = ref({
      // Cabeçalho
      localData: '',
      isCliente: false,
      isProspect: false,
      
      // Informações Gerais
      objeto: props.dataInicial.objeto || '',
      modalidadeTipo: props.dataInicial.modalidadeTipo || '',
      dataHoraLicitacao: props.dataInicial.dataHoraLicitacao || '',
      prazoVigencia: '',
      
      // Campos de texto 
      esclarecimentos: '',
      visitaPreLicitacao: '',
      docsHabilitacao: '',
      julgamentoLances: '',
      bancoDados: props.dataInicial.bancoDados || '',
      valorEstimadoEdital: props.dataInicial.valorEstimadoEdital || '',
      valorProposta: '',
      percentualAtendimento: '',
      itensImpugnaveis: '',
      valorConcorrente: '',
      nomeConcorrente: '',
      distanciaFiliais: '',
      infoAdicionais: '',
      periodicidadeVisitas: '',
      pedeDemonstracao: '',
      multas: '',
      prazoImplantacao: '',
      sistemasImplantados: '',
      cotacaoObrigatoria: '',
      prazoRecurso: '',
      condicaoReajuste: '',
      impedeDocumental: '',
      impedeTecnica: '',
      participar: null,
      motivoNaoParticipar: '',
      
      // Responsável
      responsavelConferencia: props.dataInicial.responsavelConferencia || ''
    });
    
    // O resto é semelhante ao seu componente original
    // ...

    // Funções para o formulário
    const exportarPDF = async () => {
      try {
        const conteudoRelatorio = gerarConteudoRelatorio();
        
        await exportToPDF({
          conteudo: conteudoRelatorio,
          processo: props.processo,
          nomeArquivo: `Termo_Autorizacao_${props.processo.numero_processo.replace(/[/\\?%*:|"<>]/g, '-')}.pdf`
        });
        
        alert('PDF exportado com sucesso!');
      } catch (error) {
        console.error('Erro ao exportar PDF:', error);
        alert('Erro ao exportar PDF. Verifique o console para mais detalhes.');
      }
    };
    
    // Expor a função para ser acessível externamente
    return {
      formData,
      exportarPDF
      // ... retornar outras propriedades e métodos necessários
    };
  }
}
</script>

<style scoped>
/* Usar os mesmos estilos do RelatorioTermoAutorizacaoView.vue */
</style>