<script setup>
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'
import { sidebarRoutes } from '../router/sidebarRoutes'

const router = useRouter()
const route = useRoute()

const currentIndex = computed(() => {
  return sidebarRoutes.findIndex(r => r.path === route.path)
})

const hasPrevious = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value < sidebarRoutes.length - 1)

const goToPrevious = () => {
  if (hasPrevious.value) {
    router.push(sidebarRoutes[currentIndex.value - 1].path)
  }
}

const goToNext = () => {
  if (hasNext.value) {
    router.push(sidebarRoutes[currentIndex.value + 1].path)
  }
}
</script>

<template>
  <div class="navigation-buttons">
    <button 
      @click="goToPrevious" 
      :disabled="!hasPrevious"
      :class="{ disabled: !hasPrevious }"
    >
      Anterior
    </button>
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
  gap: 20px;
  padding: 20px;
  margin-top: auto;
}

button {
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(180deg, #722F37 0%, #521920 100%);
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
  background: linear-gradient(180deg, #8B4B52 0%, #722F37 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

button:active:not(.disabled) {
  transform: translateY(0);
  background: #521920;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>
