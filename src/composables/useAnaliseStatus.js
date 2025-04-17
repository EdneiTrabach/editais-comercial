import { ref } from 'vue';
import { supabase } from '@/lib/supabase';

/**
 * Composable para gerenciar status de análise de processos
 * @returns {Object} Métodos e propriedades para gerenciar status de análise
 */
export function useAnaliseStatus() {
  // Cache para armazenar estados das análises (evita múltiplas consultas ao banco)
  const analiseStatusCache = ref({});
  
  /**
   * Determina o status de análise de um processo
   * @param {Object} processo - O processo a ser analisado
   * @returns {Promise<string|null>} Status da análise: 'atende', 'nao-atende', 'nao-analisado' ou null
   */
  async function getStatusAnalise(processo) {
    // Se não é um processo em análise, não precisamos verificar
    if (!processo || processo.status !== 'em_analise') {
      return null;
    }

    // Verificar se já temos o resultado em cache
    if (analiseStatusCache.value[processo.id]) {
      return analiseStatusCache.value[processo.id];
    }
    
    try {
      // Buscar dados de análise deste processo
      const { data, error } = await supabase
        .from('analises_itens')
        .select('total_itens, nao_atendidos, obrigatorio, percentual_minimo')
        .eq('processo_id', processo.id);
        
      if (error) throw error;
      
      // Se não há registros de análise, considerar como não analisado
      if (!data || data.length === 0) {
        analiseStatusCache.value[processo.id] = 'nao-analisado';
        return 'nao-analisado';
      }
      
      // Verificar se algum item foi analisado (tem valor em total_itens)
      const itensAnalisados = data.filter(item => 
        item.total_itens && item.total_itens > 0 && 
        (item.nao_atendidos !== null && item.nao_atendidos !== undefined)
      );
      
      // Se nenhum item foi analisado, considerar como não analisado
      if (itensAnalisados.length === 0) {
        analiseStatusCache.value[processo.id] = 'nao-analisado';
        return 'nao-analisado';
      }
      
      // Calcular se atende os requisitos
      let atende = true;
      
      for (const item of itensAnalisados) {
        const percentualMinimo = item.obrigatorio ? 90 : 70; // Valores padrão
        const percentualAtendimento = ((item.total_itens - item.nao_atendidos) / item.total_itens) * 100;
        
        if (percentualAtendimento < (item.percentual_minimo || percentualMinimo)) {
          atende = false;
          break;
        }
      }
      
      // Armazenar o resultado em cache
      analiseStatusCache.value[processo.id] = atende ? 'atende' : 'nao-atende';
      return atende ? 'atende' : 'nao-atende';
      
    } catch (error) {
      console.error('Erro ao obter status de análise:', error);
      return 'nao-analisado'; // Em caso de erro, consideramos como não analisado
    }
  }
  
  /**
   * Limpa o cache de status de análise
   * @param {string|null} processoId - ID do processo a ser limpo do cache (ou null para limpar tudo)
   */
  function clearAnaliseStatusCache(processoId = null) {
    if (processoId) {
      delete analiseStatusCache.value[processoId];
    } else {
      analiseStatusCache.value = {};
    }
  }
  
  /**
   * Pré-carrega o status de análise para vários processos
   * @param {Array} processos - Lista de processos para pré-carregar
   */
  async function preloadAnaliseStatus(processos) {
    if (!processos || processos.length === 0) return;
    
    // Filtrar apenas processos em análise
    const processosEmAnalise = processos.filter(p => p?.status === 'em_analise');
    
    // Carregar status para cada processo
    for (const processo of processosEmAnalise) {
      await getStatusAnalise(processo);
    }
  }
  
  return {
    getStatusAnalise,
    analiseStatusCache,
    clearAnaliseStatusCache,
    preloadAnaliseStatus
  };
}
