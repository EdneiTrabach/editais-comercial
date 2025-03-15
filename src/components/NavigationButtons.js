import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'

export default {
  props: {
    isSidebarExpanded: {
      type: Boolean,
      default: true
    }
  },
  
  setup(props) {
    // Define a ordem correta das rotas para navegação
    const navigationRoutes = [
      { path: '/processos', name: 'Processos' },
      { path: '/funcionalidades', name: 'Funcionalidades' },
      { path: '/editais', name: 'Editais' },
      { path: '/lances', name: 'Lances' },
      { path: '/sistemas', name: 'Sistemas' },
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/representantes', name: 'Representantes' },
      { path: '/plataformas', name: 'Plataformas' },
      { path: '/empresas', name: 'Empresas' },
      { path: '/relatorios', name: 'Relatórios' },
      { path: '/configuracoes', name: 'Admin. de Usuários' }
    ]

    const router = useRouter()
    const route = useRoute()

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

    // Rotas onde não devemos mostrar a navegação
    const hideNavigationRoutes = ['/login', '/reset-password', '/forgot-password']

    // Adiciona suporte para rotas especiais
    const isSpecialRoute = computed(() => {
      // Verifica se está em uma rota de edição ou criação baseada no padrão das URLs
      // Rotas básicas como /editais não devem ser consideradas especiais
      if (navigationRoutes.some(r => r.path === route.path)) {
        return false; // Não é rota especial se for uma das rotas de navegação padrão
      }
      
      return route.path.includes('/edit') || 
             route.path.includes('/new') || 
             route.path.includes('/create') || 
             (route.path.includes('/') && route.params.id);
    })

    // Determina a rota para voltar quando está em uma rota especial
    const getBackRoute = computed(() => {
      // Personalizar conforme necessário para seu aplicativo
      if (route.path.includes('/editais/')) return '/editais'
      if (route.path.includes('/processos/')) return '/processos'
      if (route.path.includes('/lances/')) return '/lances'
      if (route.path.includes('/plataformas/')) return '/plataformas'
      if (route.path.includes('/sistemas/')) return '/sistemas'
      if (route.path.includes('/empresas/')) return '/empresas'
      if (route.path.includes('/representantes/')) return '/representantes'
      if (route.path.includes('/configuracoes/')) return '/configuracoes'
      return '/home'
    })

    const shouldShowNavigation = computed(() => {
      return !hideNavigationRoutes.includes(route.path)
    })

    return {
      navigationRoutes,
      currentIndex,
      hasPrevious,
      hasNext,
      goToPrevious,
      goToNext,
      isSpecialRoute,
      getBackRoute,
      shouldShowNavigation,
      router
    }
  }
}