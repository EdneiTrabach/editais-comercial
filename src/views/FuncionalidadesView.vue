<template>
  <div class="layout">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />

    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <div class="header">
        <h1>Funcionalidades do Sistema</h1>
      </div>

      <div class="features-grid">
        <template v-for="feature in features" :key="feature.title">
          <div v-if="feature.isDeveloperCard" class="developer-feature-card">
            <div class="initials-avatar" @dblclick="triggerEasterEgg" :class="{ 'abducted': showEasterEgg }">
              {{ feature.initials }}
            </div>
            <div class="ufo" :class="{ 'active': showEasterEgg }">🛸</div>
            <h3>Desenvolvido por</h3>
            <h2 :class="{ 'hidden': showEasterEgg }">{{ feature.title }}</h2>
            <!-- <h2 v-if="showEasterEgg" class="hello-world">Hello World! 👽</h2> -->
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
import { useConnectionManager } from '@/composables/useConnectionManager'

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
    icon: '/icons/calculadora.svg',
    title: 'Planilha de Lances',
    description: 'Registre e gerencie lances de processos',
    route: '/lances'
  },
  {
    icon: '/icons/certificado.svg',
    title: 'Novo Processo',
    description: 'Cadastre e gerencie processos licitatórios',
    route: '/editais'
  },
    {
    icon: '/icons/app.svg',
    title: 'Sistemas',
    description: 'Conheça nossos sistemas e soluções',
    route: '/sistemas'
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
    icon: '/icons/links.svg',
    title: 'Plataformas',
    description: 'Cadastre e gerencie plataformas',
    route: '/plataformas'
  },
  {
    icon: '/icons/empresa.svg',
    title: 'Empresas',
    description: 'Cadastre e gerencie empresas',
    route: '/empresas'
  },
  {
    icon: '/icons/check.svg',
    title: 'Relatórios',
    description: 'Visualize relatórios e estatísticas',
    route: '/relatorios'
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

const showEasterEgg = ref(false)

const triggerEasterEgg = () => {
  showEasterEgg.value = true
  setTimeout(() => {
    showEasterEgg.value = false
  }, 4500) // Aumentado para 4.5 segundos para acomodar toda a sequência
}

const loadData = async () => {
  await loadProcessos() // ou qualquer outra função que carregue seus dados
}

// Use o composable
useConnectionManager(loadData)
</script>

<style src="../assets/styles/FuncionalidadesView.css"></style>
