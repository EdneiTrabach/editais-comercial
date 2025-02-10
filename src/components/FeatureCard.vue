<template>
  <div class="feature-card" @click="handleClick">
    <div class="feature-icon">
      <img :src="icon" :alt="title" />
    </div>
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>

    <!-- Modal de Processo -->
    <ProcessoModal 
      v-if="showModal" 
      :show="showModal"
      @close="showModal = false"
      @saved="handleSaved"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ProcessoModal from '@/components/ProcessoModal.vue'

const router = useRouter()
const showModal = ref(false)

const props = defineProps({
  icon: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  route: {
    type: String,
    required: true
  }
})

const handleClick = () => {
  router.push(props.route)
}

const handleSaved = () => {
  showModal.value = false
  // Aqui você pode adicionar alguma lógica após salvar
  // Como recarregar dados ou mostrar uma mensagem
}
</script>

<style scoped>
.feature-card {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  border: 1px solid rgba(25, 49, 85, 0.1);
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(25, 49, 85, 0.12);
}

.feature-icon {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

.feature-icon img {
  width: 40px;
  height: 40px;
  filter: brightness(0) saturate(100%) invert(19%) sepia(38%) saturate(1121%) hue-rotate(182deg) brightness(94%) contrast(88%);
}

h3 {
  color: #193155;
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

p {
  color: #6c757d;
  font-size: 0.9rem;
  line-height: 1.5;
}
</style>