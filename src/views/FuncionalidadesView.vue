<template>
  <div class="layout">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />
    
    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <div class="welcome-banner">
        <h1>Funcionalidades do Sistema</h1>
      </div>

      <div class="features-grid">
        <FeatureCard
          v-for="feature in features"
          :key="feature.title"
          v-bind="feature"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import TheSidebar from '@/components/TheSidebar.vue'
import FeatureCard from '@/components/FeatureCard.vue'

const router = useRouter()
const isSidebarExpanded = ref(true)

const features = [
  {
    icon: '/icons/configuracoes.svg',
    title: 'Dashboard',
    description: 'Visualize estatísticas e indicadores',
    route: '/Dashboard'  // Rota para a página inicial/dashboard
  },
  {
    icon: '/icons/certificado.svg',
    title: 'Publicação de Processo',
    description: 'Cadastre e gerencie processos licitatórios',
    route: '/editais/novo'
  },
  {
    icon: '/icons/check.svg',
    title: 'Processos',
    description: 'Visualize e gerencie todos os processos',
    route: '/processos'
  },
  {
    icon: '/icons/adicao.svg',
    title: 'Documentos',
    description: 'Controle seus documentos e certificados',
    route: '/documentos'
  },
  {
    icon: '/icons/check.svg',
    title: 'Relatórios',
    description: 'Visualize relatórios e estatísticas',
    route: '/relatorios'
  },
  {
    icon: '/icons/add-usuario.svg',
    title: 'Usuários',
    description: 'Gerencie usuários e permissões',
    route: '/usuarios'
  },
  {
    icon: '/icons/config-usuario.svg',
    title: 'Configurações',
    description: 'Configure parâmetros do sistema',
    route: '/configuracoes'
  }
]

const handleSidebarToggle = (expanded) => {
  isSidebarExpanded.value = expanded
}
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.main-content {
  margin-left: 300px;
  padding: 2rem;
  transition: margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
}

.main-content.expanded {
  margin-left: 80px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  padding: 2rem 0;
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 70px;
    padding: 1rem;
  }

  .main-content.expanded {
    margin-left: 0;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>