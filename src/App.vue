<script setup>
import { RouterView } from 'vue-router'
import { ref, watch, onMounted, provide, onUnmounted } from 'vue'
import NavigationButtons from './components/NavigationButtons.vue'
import { useSystemUpdates } from './composables/useSystemUpdates';
import SystemUpdateModal from './components/SystemUpdateModal.vue';
import { supabase } from './lib/supabase';
import FloatingNotificationButton from './components/notifications/FloatingNotificationButton.vue';

// Definir a variável isSidebarExpanded
const isSidebarExpanded = ref(true) // Valor padrão: expandido

// Carregar o estado do sidebar do localStorage na montagem
onMounted(() => {
  const savedState = localStorage.getItem('sidebarState')
  if (savedState !== null) {
    isSidebarExpanded.value = savedState === 'true'
  }
})

// Função para atualizar o estado quando o sidebar mudar
const handleSidebarToggle = (expanded) => {
  isSidebarExpanded.value = expanded
}

// Opcional: escutar eventos do localStorage para sincronização entre componentes
window.addEventListener('storage', (event) => {
  if (event.key === 'sidebarState') {
    isSidebarExpanded.value = event.newValue === 'true'
  }
})

const { 
  unreadUpdates, 
  showUpdateModal, 
  checkForUpdates, 
  handleMarkAsRead, 
  closeUpdateModal 
} = useSystemUpdates();

// Sobrescrever função de fechar para verificar se é permitido
const handleUpdateModalClose = () => {
  // Se não há atualizações não lidas, pode fechar normalmente
  closeUpdateModal();
};

// Tornar funções disponíveis globalmente para o app
provide('systemUpdates', {
  checkForUpdates,
  unreadUpdates,
  showUpdateModal,
  handleMarkAsRead
});

const user = ref(null);

// Monitorar mudanças na autenticação
onMounted(async () => {
  // Verificar usuário atual
  const { data } = await supabase.auth.getUser();
  user.value = data.user;
  
  // Configurar listener de autenticação
  supabase.auth.onAuthStateChange((event, session) => {
    user.value = session?.user || null;
    
    // Verificar atualizações imediatamente após login bem-sucedido
    if (event === 'SIGNED_IN') {
      setTimeout(() => {
        checkForUpdates();
      }, 500); // Reduzido para aparecer mais rápido
    }
  });
  
  // Verificar atualizações ao montar se o usuário já estiver autenticado
  if (user.value) {
    setTimeout(() => {
      checkForUpdates();
    }, 500);
  }
});

// Observar mudanças no usuário para verificar atualizações após login
watch(user, async (newUser) => {
  if (newUser) {
    // Aguardar um curto intervalo para garantir que a navegação foi concluída
    setTimeout(() => {
      checkForUpdates();
    }, 1500);
  }
});

onMounted(async () => {
  // Verificar atualizações após o login
  setTimeout(() => {
    checkForUpdates();
  }, 2000); // Atraso de 2 segundos após carregar
});

const notificationsCount = ref(0);

// Função para abrir o painel de notificações
const openNotificationsPanel = () => {
  // Emitir um evento global que TheSidebar.js pode escutar
  window.dispatchEvent(new CustomEvent('open-notifications-panel'));
};

// Monitorar contagem de notificações (pode ser feito via localStorage)
watch(() => localStorage.getItem('unreadNotificationsCount'), (newCount) => {
  if (newCount) {
    notificationsCount.value = parseInt(newCount);
  }
});

// Verificar notificações ao iniciar
onMounted(() => {
  // Inicializar contagem de notificações
  const count = localStorage.getItem('unreadNotificationsCount');
  if (count) {
    notificationsCount.value = parseInt(count);
  }
  
  // Adicionar listener para atualizar contagem
  window.addEventListener('notifications-count-updated', (e) => {
    notificationsCount.value = e.detail.count;
  });
});

onUnmounted(() => {
  window.removeEventListener('notifications-count-updated', () => {});
});

/**
 * Verifica as atualizações do sistema e mostra o diálogo se necessário
 */
async function checkSystemUpdates() {
  try {
    const { data: updates } = await supabase
      .from('system_updates')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (updates && updates.length > 0) {
      // Verifica se há alguma atualização não lida pelo usuário atual
      const latestUpdateId = updates[0].id;
      const userLastRead = localStorage.getItem('lastReadUpdateId');
      
      if (!userLastRead || userLastRead !== latestUpdateId) {
        this.systemUpdates = updates;
        this.showUpdatesDialog = true;
      }
    }
  } catch (error) {
    console.error('Erro ao verificar atualizações do sistema:', error);
  }
};

/**
 * Confirma a leitura das atualizações do sistema
 */
function confirmUpdateRead() {
  if (this.systemUpdates && this.systemUpdates.length > 0) {
    // Salva o ID da última atualização lida no localStorage
    localStorage.setItem('lastReadUpdateId', this.systemUpdates[0].id);
    // Fecha o diálogo
    this.showUpdatesDialog = false;
  }
}
</script>

<template>
  <div class="app-container">
    <!-- Overlay que bloqueia interações com o app enquanto o modal estiver aberto -->
    <div 
      v-if="showUpdateModal" 
      class="system-update-overlay"
    ></div>
    
    <RouterView @sidebarToggle="handleSidebarToggle" />
    <NavigationButtons :isSidebarExpanded="isSidebarExpanded" />
    
    <!-- Sistema de atualizações com configuração de modal obrigatório -->
    <SystemUpdateModal 
      :show="showUpdateModal"
      :updates="unreadUpdates"
      :isForced="true"
      @close="handleUpdateModalClose"
      @mark-read="handleMarkAsRead"
    />

    <!-- Botão flutuante de notificações -->
    <FloatingNotificationButton 
      :unreadCount="notificationsCount" 
      @click="openNotificationsPanel" 
    />
  </div>
</template>

<style scoped>
* {
  font-family: 'Roboto', sans-serif;
  box-sizing: border-box;
}
header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

#app {
  height: 100%;
  font-family: 'Roboto', sans-serif;
  position: relative;
}

/* Adicione ao final do CSS existente */
.system-update-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999; /* Um pouco abaixo do modal (z-index: 1000) */
}
</style>
