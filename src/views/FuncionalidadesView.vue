<template>
  <div class="layout">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />

    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <div class="welcome-banner">
        <h1>Funcionalidades do Sistema</h1>
      </div>

      <div class="features-grid">
        <template v-for="feature in features" :key="feature.title">
          <div v-if="feature.isDeveloperCard" class="developer-feature-card">
            <div class="initials-avatar">{{ feature.initials }}</div>
            <div class="status-indicator"></div>
            <h3>Desenvolvido por</h3>
            <h2>{{ feature.title }}</h2>
            <p>{{ feature.description }}</p>
            <div class="social-links">
              <a v-for="link in feature.socialLinks" :key="link.url" :href="link.url" target="_blank" rel="noopener">
                <i>{{ link.icon }}</i> {{ link.label }}
              </a>
            </div>
          </div>
          <FeatureCard v-else v-bind="feature" />
        </template>
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
    icon: '/icons/livro.svg',
    title: 'Processos',
    description: 'Visualize e gerencie todos os processos',
    route: '/processos'
  },
  {
    icon: '/icons/certificado.svg',
    title: 'Novo Processo',
    description: 'Cadastre e gerencie processos licitatórios',
    route: '/editais/novo'
  },
  {
    icon: '/icons/grafico.svg',
    title: 'Dashboard',
    description: 'Visualize estatísticas e indicadores',
    route: '/Dashboard'
  },
  {
    icon: '/icons/cartao-usuario.svg',
    title: 'Representantes',
    description: 'Cadastre e gerencie representantes',
    route: '/representantes'
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
    title: 'Administração de Usuários',
    description: 'Gerencie usuários e permissões',
    route: '/configuracoes'
  },
  {
    initials: 'ET',
    title: 'Ednei Trabach',
    description: 'Desenvolvedor Full Stack',
    socialLinks: [
      {
        icon: '🔗',
        label: 'GitHub',
        url: 'https://github.com/edneitrabach'
      },
      {
        icon: '💼',
        label: 'LinkedIn',
        url: 'https://linkedin.com/in/edneitrabach'
      }
    ],
    isDeveloperCard: true
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

.developer-feature-card {
  background: linear-gradient(180deg, #193155 0%, #0f1f35 100%);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  text-align: center;
  position: relative;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.developer-feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.3);
}

.developer-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 3px solid #2563eb;
  padding: 3px;
  margin-bottom: 1.5rem;
  background: white;
}

.initials-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 3px solid #2563eb;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, #1e40af, #3b82f6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.developer-feature-card h3 {
  color: #94a3b8;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.developer-feature-card h2 {
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.developer-feature-card p {
  color: #cbd5e1;
  font-size: 1rem;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.social-links {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.social-links a {
  color: #cbd5e1;
  text-decoration: none;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.social-links a:hover {
  background: #2563eb;
  color: white;
  transform: translateY(-2px);
}
</style>