import { supabase } from '@/supabase';

/**
 * Busca os dados de análise de um processo específico
 * @param {String} processoId - ID do processo
 * @returns {Promise<Array>} - Array com os itens de análise
 */
export async function buscarAnalisesProcesso(processoId) {
  try {
    const { data, error } = await supabase
      .from('analises_itens')
      .select(`
        *,
        sistemas:sistema_id (id, nome)
      `)
      .eq('processo_id', processoId)
      .order('ordem_exibicao', { ascending: true, nullsLast: true });
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar análises:', error);
    return [];
  }
}