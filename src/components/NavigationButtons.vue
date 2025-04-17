<template>
  <div class="navigation-buttons" 
       v-if="shouldShowNavigation"
       :class="{ 'sidebar-expanded': isSidebarExpanded, 'sidebar-collapsed': !isSidebarExpanded }">
    
    <!-- Navegação padrão para todas as rotas -->
    <nav-button 
      direction="prev"
      text="ANTERIOR"
      :disabled="!hasPrevious"
      @click="goToPrevious"
    />

    <div class="current-page">
      {{ navigationRoutes[currentIndex]?.name || 'Página Atual' }}
    </div>

    <nav-button
      direction="next" 
      text="PRÓXIMO"
      :disabled="!hasNext"
      @click="goToNext"
    />
  </div>
</template>

<script>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import NavButton from './navigation/NavButton.vue'

export default {
  name: 'NavigationButtons',
  
  components: {
    NavButton
  },

  props: {
    isSidebarExpanded: {
      type: Boolean,
      default: true
    }
  },

  setup(props) {
    const router = useRouter()
    const route = useRoute()

    // Define rotas de navegação com a ordem correta
    const navigationRoutes = [
      { path: '/processos', name: 'Processos' },
      { path: '/funcionalidades', name: 'Funcionalidades' },
      { path: '/editais', name: 'Novo Processo' },
      { path: '/lances', name: 'Lances' },
      { path: '/analises', name: 'Análises' },
      { path: '/sistemas', name: 'Sistemas' },
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/representantes', name: 'Representantes' },
      { path: '/plataformas', name: 'Plataformas' },
      { path: '/empresas', name: 'Empresas' },
      { path: '/publicacoes-contratuais', name: 'Publicações Contratuais' },
      { path: '/configuracoes-ia', name: 'Configurações IA' },
      { path: '/responsaveis', name: 'Responsáveis' },
      { path: '/configuracoes', name: 'Admin. de Usuários' }
    ]

    const currentIndex = computed(() => {
      // Primeiro tenta encontrar correspondência exata
      const exactIndex = navigationRoutes.findIndex(r => r.path === route.path)
      if (exactIndex !== -1) return exactIndex
      
      // Se não encontrar correspondência exata, procura por rota base
      // Por exemplo: /editais/123 deve corresponder a /editais
      const currentBasePath = '/' + route.path.split('/')[1]
      return navigationRoutes.findIndex(r => r.path === currentBasePath)
    })

    const hasPrevious = computed(() => currentIndex.value > 0)
    const hasNext = computed(() => currentIndex.value < navigationRoutes.length - 1)

    // Rotas onde não devemos mostrar a navegação
    const hideNavigationRoutes = ['/login', '/reset-password', '/forgot-password']

    const shouldShowNavigation = computed(() => {
      return !hideNavigationRoutes.includes(route.path)
    })

    const goToPrevious = () => {
      if (hasPrevious.value) {
        router.push(navigationRoutes[currentIndex.value - 1].path)
      }
    }

    const goToNext = () => {
      if (hasNext.value) {
        router.push(navigationRoutes[currentIndex.value + 1].path)
      }
    }

    return {
      navigationRoutes,
      currentIndex,
      hasPrevious,
      hasNext,
      goToPrevious,
      goToNext,
      shouldShowNavigation,
      router
    }
  }
}
</script>

<style scoped>
.navigation-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  padding: 20px;
  margin-bottom: 1rem;
  background-color: #00000000;
  border-radius: 8px;
  z-index: 10;
}

.current-page {
  font-family: 'Poppins', sans-serif;
  color: #193155;
  font-weight: 500;
  min-width: 120px;
  text-align: center;
  padding: 0.75rem 1.5rem;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.current-page:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Ajustes para os botões de navegação */
:deep(.cta) {
  transition: all 0.3s ease;
}

:deep(.cta:hover) {
  transform: scale(1.05);
}

:deep(.cta .second) {
  margin: 0 10px;
  transition: all 0.3s ease;
}

:deep(.prev .second) {
  margin-right: 10px;
  margin-left: 0;
}

:deep(.next .second) {
  margin-left: 10px;
  margin-right: 0;
}

:deep(.cta:not(:disabled):hover.prev .second) {
  transform: translateX(-5px);
}

:deep(.cta:not(:disabled):hover.next .second) {
  transform: translateX(5px);
}

/* Ajustes para o modo expanded/collapsed */
.navigation-buttons.sidebar-expanded {
  margin-left: 260px;
  transition: margin-left 0.3s ease;
}

.navigation-buttons.sidebar-collapsed {
  margin-left: 70px;
  transition: margin-left 0.3s ease;
}

@media (max-width: 768px) {
  .navigation-buttons {
    padding: 15px;
    flex-direction: column;
  }

  .current-page {
    order: -1;
    margin-bottom: 1rem;
  }
}
</style>