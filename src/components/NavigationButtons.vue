<script setup>
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'

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

// Apenas rotas de autenticação não devem mostrar os botões
const hideNavigationRoutes = ['/login', '/reset-password', '/forgot-password']

const shouldShowNavigation = computed(() => {
  return !hideNavigationRoutes.includes(route.path)
})
</script>

<template>
  <div class="navigation-buttons" v-if="shouldShowNavigation">
    <button 
      @click="goToPrevious" 
      :disabled="!hasPrevious"
      :class="{ disabled: !hasPrevious }"
    >
      Anterior
    </button>
    <div class="current-page">
      {{ navigationRoutes[currentIndex.value]?.name || 'Página Atual' }}
    </div>
    <button 
      @click="goToNext" 
      :disabled="!hasNext"
      :class="{ disabled: !hasNext }"
    >
      Próximo
    </button>
  </div>
</template>

<style scoped>
.navigation-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding: 20px;
  margin-top: auto;
  background-color: #f8f9fa;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.current-page {
  font-family: 'JetBrains Mono';
  color: #193155;
  font-weight: 500;
  min-width: 120px;
  text-align: center;
}

button {
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg,#193155,#254677);
  color: white;
  cursor: pointer;
  font-family: 'JetBrains Mono';
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #461D22;
  box-shadow: none;
}

button:hover:not(.disabled) {
  background: linear-gradient(180deg, #4b618b 0%, #2f7269 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

button:active:not(.disabled) {
  transform: translateY(0);
  background: linear-gradient(135deg,#193155,#254677);;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Adicione em cada view ou no seu CSS global */
.main-content {
  padding-bottom: 80px; /* Espaço para os botões de navegação */
}
</style>
