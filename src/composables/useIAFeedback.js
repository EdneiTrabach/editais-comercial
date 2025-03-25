import { ref } from 'vue';
import { supabase } from '@/lib/supabase';
import { usePadroesCampos } from './usePadroesCampos';

export function useIAFeedback() {
  const enviandoFeedback = ref(false);
  const estatisticas = ref([]);
  const carregandoEstatisticas = ref(false);
  
  const padroesCampos = usePadroesCampos();
  
  /**
   * Registra feedback do usuário sobre uma análise
   * @param {string} analiseId - ID da análise
   * @param {boolean} correto - Se a análise está correta
   * @param {Object} correcoes - Correções se houver
   */
  const registrarFeedback = async (analiseId, correto, correcoes = null) => {
    if (!analiseId) return false;
    
    try {
      enviandoFeedback.value = true;
      
      // Verificar se a análise existe
      const { data: analise, error: analiseError } = await supabase
        .from('analises_ia')
        .select('id, dados_extraidos')
        .eq('id', analiseId)
        .single();
      
      if (analiseError) throw analiseError;
      
      if (!analise) {
        throw new Error('Análise não encontrada');
      }
      
      // Registrar feedback
      const feedback = {
        analise_id: analiseId,
        correto,
        correcoes: correcoes || null,
        usuario_id: (await supabase.auth.getUser()).data?.user?.id,
        criado_em: new Date().toISOString()
      };
      
      const { error: feedbackError } = await supabase
        .from('feedback_analises')
        .insert([feedback]);
      
      if (feedbackError) throw feedbackError;
      
      // Marcar análise como validada
      const { error: updateError } = await supabase
        .from('analises_ia')
        .update({
          validado: true,
          confianca: correto ? 1.0 : 0.0 // Definir confiança com base no feedback
        })
        .eq('id', analiseId);
      
      if (updateError) throw updateError;
      
      // Se houver correções, atualizar padrões
      if (!correto && correcoes) {
        await padroesCampos.atualizarEstatisticasComFeedback(
          analise.dados_extraidos,
          correcoes
        );
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao registrar feedback:', error);
      return false;
    } finally {
      enviandoFeedback.value = false;
    }
  };
  
  /**
   * Obtém estatísticas de precisão por campo
   */
  const obterEstatisticasPrecisao = async () => {
    try {
      carregandoEstatisticas.value = true;
      
      const { data, error } = await supabase.rpc('calcular_precisao_analises');
      
      if (error) {
        // Tentar consulta alternativa se a RPC falhar
        const { data: alternativeData, error: alternativeError } = await supabase
          .from('analises_ia')
          .select('validado, dados_extraidos')
          .eq('validado', true);
        
        if (alternativeError) throw alternativeError;
        
        // Calcular estatísticas manualmente
        const estatisticasCampos = {};
        const totaisCampos = {};
        
        alternativeData.forEach(analise => {
          if (!analise.dados_extraidos) return;
          
          Object.keys(analise.dados_extraidos).forEach(async campo => {
            if (!estatisticasCampos[campo]) {
              estatisticasCampos[campo] = { corretos: 0, total: 0 };
            }
            
            if (analise.dados_extraidos[campo]) {
              estatisticasCampos[campo].total++;
              
              // Verificar se há correção para este campo
              const { data: feedbackData } = await supabase
                .from('feedback_analises')
                .select('correcoes')
                .eq('analise_id', analise.id)
                .single();
              
              if (feedbackData && (!feedbackData.correcoes || feedbackData.correcoes[campo] === analise.dados_extraidos[campo])) {
                estatisticasCampos[campo].corretos++;
              }
            }
          });
        });
        
        // Converter para o formato esperado
        return Object.entries(estatisticasCampos).map(([campo, stats]) => ({
          campo,
          total_analises: stats.total,
          analises_corretas: stats.corretos,
          precisao: stats.total > 0 ? (stats.corretos / stats.total) * 100 : 0
        }));
      }
      
      estatisticas.value = data || [];
      return data;
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return [];
    } finally {
      carregandoEstatisticas.value = false;
    }
  };
  
  return {
    enviandoFeedback,
    estatisticas,
    carregandoEstatisticas,
    registrarFeedback,
    obterEstatisticasPrecisao
  };
}