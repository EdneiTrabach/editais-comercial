import { supabase } from '@/lib/supabase';

export function usePublicacaoAnalise(state) {
  // Função para identificar o processo baseado no texto
  async function identificarProcesso() {
    try {
      if (!state.textoPublicacao) {
        state.exibirMensagem('Digite o texto da publicação primeiro', 'error');
        return;
      }

      state.identificando.value = true;
      state.processoSugestoes.value = [];
      
      // Simula a chamada para a API de identificação
      // Em um caso real, você faria uma chamada para a sua API que processa IA
      const { data, error } = await supabase.functions.invoke('identificar-processo', {
        body: {
          texto: state.textoPublicacao.value
        }
      });
      
      if (error) throw error;
      
      if (data && data.sugestoes && data.sugestoes.length) {
        // Mapear as sugestões para incluir os detalhes completos do processo
        state.processoSugestoes.value = data.sugestoes.map(sugestao => {
          const processoCompleto = state.processos.value.find(p => p.id === sugestao.id);
          return processoCompleto || sugestao;
        });
      }
      
      state.processoBuscaRealizada.value = true;
      
      if (state.processoSugestoes.value.length === 0) {
        state.exibirMensagem('Nenhum processo relacionado encontrado', 'info');
      }
    } catch (error) {
      console.error('Erro ao identificar processo:', error);
      state.exibirMensagem('Erro ao identificar processo. Tente novamente.', 'error');
    } finally {
      state.identificando.value = false;
    }
  }

  // Função para analisar publicação
  async function analisarPublicacao() {
    try {
      if (!state.textoPublicacao.value) {
        state.exibirMensagem('Digite o texto da publicação primeiro', 'error');
        return;
      }

      state.analisando.value = true;
      
      // Chamar a API de análise
      const { data, error } = await supabase.functions.invoke('analisar-publicacao', {
        body: {
          texto: state.textoPublicacao.value,
          processo_id: state.processoSelecionado.value
        }
      });
      
      if (error) throw error;
      
      if (data) {
        state.resultadoAnalise.value = data;
        state.ultimaAnaliseId.value = data.id;
        state.exibirMensagem('Análise concluída com sucesso', 'success');
      }
    } catch (error) {
      console.error('Erro ao analisar publicação:', error);
      state.exibirMensagem('Erro ao analisar publicação. Tente novamente.', 'error');
    } finally {
      state.analisando.value = false;
    }
  }

  // Função para aplicar os resultados ao processo
  async function aplicarResultados() {
    try {
      if (!state.resultadoAnalise.value || !state.processoAtual.value) {
        state.exibirMensagem('Nenhum resultado ou processo selecionado', 'error');
        return;
      }

      state.aplicando.value = true;
      
      // Atualizar o processo com as informações analisadas
      const { error } = await supabase
        .from('processos')
        .update({
          empresa_contratada: state.resultadoAnalise.value.empresa?.id,
          sistemas_implantacao: { 
            sistemas_ids: state.resultadoAnalise.value.sistemas || [],
            ultima_atualizacao: new Date().toISOString()
          },
          ultima_atualizacao: new Date().toISOString()
        })
        .eq('id', state.processoAtual.value.id);
      
      if (error) throw error;
      
      // Registrar a ação no histórico
      await supabase
        .from('historico_analises')
        .insert({
          processo_id: state.processoAtual.value.id,
          analise_id: state.ultimaAnaliseId.value,
          data_aplicacao: new Date().toISOString(),
          textoPublicacao: state.textoPublicacao.value
        });
        
      state.exibirMensagem('Resultados aplicados com sucesso!', 'success');
      
      // Atualizar o processo atual com as novas informações
      const { data: processoAtualizado } = await supabase
        .from('processos')
        .select('*')
        .eq('id', state.processoAtual.value.id)
        .single();
        
      if (processoAtualizado) {
        const index = state.processos.value.findIndex(p => p.id === processoAtualizado.id);
        if (index !== -1) {
          state.processos.value[index] = processoAtualizado;
        }
      }
    } catch (error) {
      console.error('Erro ao aplicar resultados:', error);
      state.exibirMensagem('Erro ao aplicar resultados. Tente novamente.', 'error');
    } finally {
      state.aplicando.value = false;
    }
  }

  // Função para enviar feedback sobre a análise
  async function enviarFeedback(tipoFeedback, dados) {
    try {
      if (!state.ultimaAnaliseId.value) {
        state.exibirMensagem('Nenhuma análise disponível para feedback', 'error');
        return;
      }

      const feedbackData = {
        analise_id: state.ultimaAnaliseId.value,
        tipo_feedback: tipoFeedback,
        data_feedback: new Date().toISOString(),
        detalhes: dados
      };
      
      if (tipoFeedback === 'correcao') {
        feedbackData.correcoes = state.correcoes.value;
      }
      
      const { error } = await supabase
        .from('analises_feedback')
        .insert(feedbackData);
      
      if (error) throw error;
      
      state.feedbackEnviado.value = true;
      state.exibirMensagem('Feedback enviado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      state.exibirMensagem('Erro ao enviar feedback. Tente novamente.', 'error');
    }
  }

  return {
    identificarProcesso,
    analisarPublicacao,
    aplicarResultados,
    enviarFeedback
  };
}