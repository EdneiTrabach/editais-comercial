import { ref } from 'vue';
import { supabase } from '@/lib/supabase';

export function useSystemUpdates() {
  const unreadUpdates = ref([]);
  const showUpdateModal = ref(false);
  const loading = ref(false);
  
  // Busca atualizações não lidas pelo usuário atual
  const checkForUpdates = async () => {
    try {
      loading.value = true;
      
      // Verificar se o usuário está autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Buscar todas as atualizações
      const { data: updates, error } = await supabase
        .from('system_updates')
        .select('*')
        .order('release_date', { ascending: false });
      
      if (error) throw error;
      
      // Buscar atualizações já lidas pelo usuário
      const { data: readUpdates, error: readError } = await supabase
        .from('system_update_reads')
        .select('update_id')
        .eq('user_id', user.id);
      
      if (readError) throw readError;
      
      // Filtrar apenas as não lidas
      const readIds = new Set(readUpdates?.map(item => item.update_id) || []);
      const unread = updates?.filter(update => !readIds.has(update.id)) || [];
      
      if (unread.length > 0) {
        unreadUpdates.value = unread;
        showUpdateModal.value = true;
      }
    } catch (error) {
      console.error('Erro ao verificar atualizações:', error);
    } finally {
      loading.value = false;
    }
  };
  
  // Marca uma atualização como lida
  const handleMarkAsRead = async (updateId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Registrar leitura no banco
      const { error } = await supabase
        .from('system_update_reads')
        .insert({
          user_id: user.id,
          update_id: updateId,
          read_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      // Atualizar lista local
      unreadUpdates.value = unreadUpdates.value.filter(
        update => update.id !== updateId
      );
      
      // Fechar o modal se não houver mais atualizações
      if (unreadUpdates.value.length === 0) {
        showUpdateModal.value = false;
      }
    } catch (error) {
      console.error('Erro ao marcar como lido:', error);
    }
  };
  
  const closeUpdateModal = () => {
    showUpdateModal.value = false;
  };
  
  return {
    unreadUpdates,
    showUpdateModal,
    loading,
    checkForUpdates,
    handleMarkAsRead,
    closeUpdateModal
  };
}