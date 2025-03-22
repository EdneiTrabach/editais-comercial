import { ref } from 'vue';
import { supabase } from '@/lib/supabase';
import { scheduleRecurringNotifications, RECURRING_NOTIFICATION_STATUS } from '@/utils/notificationScheduler';

export function useProcessoUpdate() {
  const loading = ref(false);
  const error = ref(null);
  
  /**
   * Atualiza o status de um processo e agenda notificações se necessário
   * @param {string} processoId - ID do processo
   * @param {string} newStatus - Novo status
   * @param {Object} additionalData - Dados adicionais para atualizar
   * @returns {Promise<Object>} - Resultado da operação
   */
  const updateProcessoStatus = async (processoId, newStatus, additionalData = {}) => {
    loading.value = true;
    error.value = null;
    
    try {
      // Primeiro, obter o status atual do processo
      const { data: currentProcess, error: fetchError } = await supabase
        .from('processos')
        .select('*')
        .eq('id', processoId)
        .single();
        
      if (fetchError) throw fetchError;
      
      const oldStatus = currentProcess.status;
      
      // Se o status não mudou e não for um dos especiais, não precisa fazer nada especial
      if (oldStatus === newStatus && !RECURRING_NOTIFICATION_STATUS.includes(newStatus)) {
        // Apenas atualizar os dados adicionais se houver
        if (Object.keys(additionalData).length > 0) {
          const { error: updateError } = await supabase
            .from('processos')
            .update(additionalData)
            .eq('id', processoId);
            
          if (updateError) throw updateError;
        }
        
        return { success: true, message: 'Nenhuma alteração no status do processo' };
      }
      
      // Atualizar o processo com o novo status e dados adicionais
      const { error: updateError } = await supabase
        .from('processos')
        .update({
          status: newStatus,
          ...additionalData,
          updated_at: new Date().toISOString()
        })
        .eq('id', processoId);
        
      if (updateError) throw updateError;
      
      // Obter o processo atualizado para passar para o agendador
      const { data: updatedProcess, error: refetchError } = await supabase
        .from('processos')
        .select('*')
        .eq('id', processoId)
        .single();
        
      if (refetchError) throw refetchError;
      
      // Verificar se precisa agendar notificações recorrentes
      if (RECURRING_NOTIFICATION_STATUS.includes(newStatus)) {
        await scheduleRecurringNotifications(updatedProcess, oldStatus);
      }
      
      return {
        success: true,
        message: `Status do processo atualizado para ${newStatus}`,
        processo: updatedProcess
      };
    } catch (err) {
      error.value = err;
      console.error('Erro ao atualizar status do processo:', err);
      return {
        success: false,
        message: `Erro ao atualizar status: ${err.message || 'Erro desconhecido'}`
      };
    } finally {
      loading.value = false;
    }
  };
  
  return {
    loading,
    error,
    updateProcessoStatus
  };
}
