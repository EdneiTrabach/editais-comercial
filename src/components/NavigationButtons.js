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
      shouldShowNavigation,
      router
    }
  }
}