<script setup>
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'

// Defina a propriedade como prop
const props = defineProps({
  isSidebarExpanded: {
    type: Boolean,
    default: true
  }
})

// Define a ordem correta das rotas para navegação
const navigationRoutes = [
  { path: '/home', name: 'Home' },
  { path: '/editais', name: 'Editais' },
  { path: '/processos', name: 'Processos' },
  { path: '/lances', name: 'Lances' },
  { path: '/plataformas', name: 'Plataformas' },
  { path: '/sistemas', name: 'Sistemas' },
  { path: '/empresas', name: 'Empresas' },
  { path: '/representantes', name: 'Representantes' },
  { path: '/configuracoes', name: 'Configurações' }
]

const router = useRouter()
const route = useRoute()

const currentIndex = computed(() => {
  return navigationRoutes.findIndex(r => r.path === route.path)
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
  return route.path.includes('/edit') || 
         route.path.includes('/new') || 
         route.path.includes('/create') || 
         (route.path.includes('/') && route.params.id)
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
</script>

<template>
  <div class="navigation-buttons" 
       v-if="shouldShowNavigation"
       :class="{ 'sidebar-expanded': isSidebarExpanded, 'sidebar-collapsed': !isSidebarExpanded }">
    <!-- Modo especial: botão voltar quando estiver em rota de edição/criação -->
    <template v-if="isSpecialRoute">
      <button 
        @click="router.push(getBackRoute)"
        class="nav-btn prev-btn"
      >
        <i class="fa fa-chevron-left icon-white"></i>
        Voltar para Lista
      </button>
    </template>
    
    <!-- Navegação padrão para rotas normais -->
    <template v-else>
      <button 
        @click="goToPrevious" 
        :disabled="!hasPrevious"
        class="nav-btn prev-btn"
      >
        <i class="fa fa-chevron-left icon-white"></i>
        Anterior
      </button>
      <div class="current-page" v-if="!isSpecialRoute">
        {{ navigationRoutes[currentIndex.value]?.name || 'Página Atual' }}
      </div>
      <button 
        @click="goToNext" 
        :disabled="!hasNext"
        class="nav-btn"
      >
        Próximo
        <i class="fa fa-chevron-right icon-white"></i>
      </button>
    </template>
  </div>
</template>

<style scoped>
.navigation-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 20px;
  /* margin-top: 2rem; */
  margin-bottom: 1rem;
  background-color: #00000000;
  border-radius: 8px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  z-index: 10;
}

.current-page {
  font-family: 'Roboto', sans-serif;
  color: #193155;
  font-weight: 500;
  min-width: 120px;
  text-align: center;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #193155;
  color: white;
}

.nav-btn:hover:not(:disabled) {
  background: #254677;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #e9ecef !important;
  color: #6c757d !important;
}

.prev-btn {
  background: #e9ecef;
  color: #193155;
}

.prev-btn:not(:disabled) {
  background: #193155;
  color: white;
}

.prev-btn:hover:not(:disabled) {
  background: #254677;
  transform: translateY(-1px);
}

.icon-white {
  font-size: 1.2rem;
  color: white;
}

.nav-btn:disabled .icon-white {
  color: #6c757d;
}

/* Removido o espaçamento para o main-content, já não é necessário */
</style>
