<template>
  <div>
    <!-- Seu layout existente -->
    
    <!-- Modal de atualizações do sistema -->
    <SystemUpdateModal 
      :show="showUpdateModal"
      :updates="unreadUpdates"
      @close="closeUpdateModal"
      @mark-read="handleMarkAsRead"
    />
  </div>
</template>

<script>
import { onMounted } from 'vue';
import SystemUpdateModal from '@/components/SystemUpdateModal.vue';
import { useSystemUpdates } from '@/composables/useSystemUpdates';

export default {
  components: {
    SystemUpdateModal,
    // Seus componentes existentes
  },
  setup() {
    const { 
      unreadUpdates,
      showUpdateModal,
      checkForUpdates,
      handleMarkAsRead, 
      closeUpdateModal 
    } = useSystemUpdates();
    
    onMounted(async () => {
      // Verificar atualizações após o login
      await checkForUpdates();
    });
    
    return {
      unreadUpdates,
      showUpdateModal,
      handleMarkAsRead,
      closeUpdateModal
    };
  }
}
</script>