import { supabase } from '@/lib/supabase'
import { useLogSistema } from '@/composables/desmembramento_processosview_js/useLogSistema'

/**
 * Atualiza o status de um processo usando um método alternativo que evita ambiguidade
 * @param {string} processoId - ID do processo a ser atualizado
 * @param {string} novoStatus - Novo valor do status
 * @returns {Promise<Object>} Resultado da operação
 */
export async function atualizarStatusAlternativo(processoId, novoStatus) {
  try {
    // Obter usuário atual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: { message: 'Usuário não autenticado' } }
    }

    // SOLUÇÃO MAIS DIRETA: Usar SQL bruto (raw SQL) para evitar qualquer problema de ambiguidade
    const { data, error } = await supabase.rpc(
      'execute_sql', 
      { 
        sql_command: `
          UPDATE processos 
          SET status = '${novoStatus}', 
              updated_at = NOW(), 
              updated_by = '${user.id}' 
          WHERE id = '${processoId}' 
          RETURNING id, status, updated_at, updated_by;
        `
      }
    );

    if (error) {
      console.error('Erro ao usar SQL direto:', error);
      
      // Último recurso: apenas atualizar o status sem colunas adicionais
      try {
        // Forma mais direta possível usando a API
        const updateResult = await supabase
          .from('processos')
          .update({ status: novoStatus })
          .eq('id', processoId)
          .select('id, status');
          
        if (updateResult.error) {
          console.error('Falha em todas as tentativas de atualização:', updateResult.error);
          return { error: updateResult.error };
        }
        
        return { data: updateResult.data, metodo: 'update_simples' };
      } catch (finalError) {
        console.error('Erro final:', finalError);
        return { error: finalError };
      }
    }
    
    // Log da ação
    try {
      const { logSystemAction } = useLogSistema()
      await logSystemAction({
        tipo: 'atualizacao',
        tabela: 'processos',
        registro_id: processoId,
        campo_alterado: 'status',
        dados_novos: { status: novoStatus }
      })
    } catch (logError) {
      console.warn('Aviso: Erro ao registrar log (não crítico):', logError)
    }
    
    return { data, metodo: 'sql_direto' };
  } catch (err) {
    console.error('Erro ao atualizar status:', err);
    return { error: { message: 'Erro interno', details: err.message } };
  }
}
