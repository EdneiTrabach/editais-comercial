import { ref } from 'vue';
import { supabase } from '../lib/supabase';

export function useSystemUpdates() {
  const unreadUpdates = ref([]);
  const showUpdateModal = ref(false);

  // Verificar se há atualizações não lidas
  const checkForUpdates = async () => {
    try {
      const { data: updates } = await supabase
        .from('system_updates')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (updates && updates.length > 0) {
        // Verificar se o usuário já leu a atualização mais recente
        const lastReadUpdateId = localStorage.getItem('lastReadUpdateId');
        const latestUpdate = updates[0];
        
        // Se não houver registro de leitura ou se for diferente do mais recente
        if (!lastReadUpdateId || lastReadUpdateId !== latestUpdate.id) {
          unreadUpdates.value = updates;
          showUpdateModal.value = true;
        }
      }
    } catch (error) {
      console.error('Erro ao verificar atualizações do sistema:', error);
    }
  };

  // Marcar atualizações como lidas
  const handleMarkAsRead = (updates) => {
    if (updates && updates.length > 0) {
      // Salvar o ID da atualização mais recente como lida
      localStorage.setItem('lastReadUpdateId', updates[0].id);
      unreadUpdates.value = [];
      // Fechar o modal automaticamente
      closeUpdateModal();
    }
  };

  // Fechar o modal de atualizações
  const closeUpdateModal = () => {
    showUpdateModal.value = false;
  };

  return {
    unreadUpdates,
    showUpdateModal,
    checkForUpdates,
    handleMarkAsRead,
    closeUpdateModal
  };
}