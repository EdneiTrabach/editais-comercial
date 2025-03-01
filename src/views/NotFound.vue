<template>
  <div class="not-found">
    <h1>404 - Página não encontrada</h1>
    <p>A página que você está procurando não existe ou foi movida.</p>
    <router-link to="/" class="btn-home">Voltar para a página inicial</router-link>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useConnectionManager } from '@/composables/useConnectionManager'

const router = useRouter()
const loadData = async () => {}

// Use o composable de reconexão
useConnectionManager(loadData)
</script>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
  padding: 0 20px;
}

h1 {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #193155;
}

p {
  margin-bottom: 2rem;
  color: #666;
}

.btn-home {
  padding: 0.75rem 1.5rem;
  background-color: #193155;
  color: white;
  border-radius: 4px;
  text-decoration: none;
  transition: background-color 0.3s ease;
}

.btn-home:hover {
  background-color: #254677;
}
</style>