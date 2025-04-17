<template>
  <div class="layout">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />

    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <div class="header">
        <h1>Funcionalidades do Sistema</h1>
        <div class="icon" @click="startTour" title="Iniciar tour guiado">
          <img src="/icons/question-circle.svg" alt="Tour" />
        </div>
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
  
  <Shepherd 
    ref="tourGuide" 
    :steps="tourSteps" 
    :showButton="false"
    @complete="onTourComplete"
    @cancel="onTourCancel"
  />
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import TheSidebar from '@/components/TheSidebar.vue'
import FeatureCard from '@/components/FeatureCard.vue'
import Shepherd from '@/components/Shepherd.vue'
import { useConnectionManager } from '@/composables/useConnectionManager'

const router = useRouter()
const isSidebarExpanded = ref(true)
const tourGuide = ref(null)

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
    route: '/editais'
  },
  {
    icon: '/icons/calculadora.svg',
    title: 'Lances',
    description: 'Registre e gerencie lances de processos',
    route: '/lances'
  },
  {
    icon: '/icons/analises.svg',
    title: 'Análises',
    description: 'Visualize e gerencie análises de processos',
    route: '/analises'
  },
  // {
  //   icon: '/icons/edicao.svg',
  //   title: 'Declarações',
  //   description: 'Visualize e gerencie declarações de processos',
  //   route: '/declaracoes'
  // },
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
    icon: '/icons/responsavel.svg',
    title: 'Responsáveis',
    description: 'Gerencie responsáveis e permissões',
    route: '/responsaveis'
  },
  {
    icon: '/icons/contract.svg',
    title: 'Publicações Contratuais',
    description: 'Envie publicações contratuais com auxilio das IA',
    route: '/publicacoes-contratuais'
  },
  {
    icon: '/icons/settings-ia.svg',
    title: 'Configurações de IA',
    description: 'Gerencie configurações de Inteligência Artificial',
    route: '/configuracoes-ia'
  },
  {
    icon: '/icons/config-usuario.svg',
    title: 'Admin. de Usuários',
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

// Configuração dos passos do tour
const tourSteps = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao Sistema',
    text: 'Este tour vai mostrar as principais funcionalidades disponíveis.',
    attachTo: {
      element: '.header',
      on: 'bottom'
    },
    buttons: [
      {
        text: 'Pular',
        action: function() { return this.cancel(); },
        classes: 'shepherd-button-secondary'
      },
      {
        text: 'Próximo',
        action: function() { return this.next(); },
        classes: 'shepherd-button-primary'
      }
    ]
  },
  {
    id: 'features-overview',
    title: 'Painel de Funcionalidades',
    text: 'Aqui estão os cards de acesso às principais funcionalidades do sistema.',
    attachTo: {
      element: '.features-grid',
      on: 'top'
    },
    buttons: [
      {
        text: 'Voltar',
        action: function() { return this.back(); },
        classes: 'shepherd-button-secondary'
      },
      {
        text: 'Próximo',
        action: function() { return this.next(); },
        classes: 'shepherd-button-primary'
      }
    ]
  },
  {
    id: 'processos',
    title: 'Processos',
    text: 'Visualize e gerencie todos os processos licitatórios ativos.',
    attachTo: {
      element: '.features-grid > div:nth-child(1)',
      on: 'bottom'
    },
    buttons: [
      {
        text: 'Voltar',
        action: function() { return this.back(); },
        classes: 'shepherd-button-secondary'
      },
      {
        text: 'Próximo',
        action: function() { return this.next(); },
        classes: 'shepherd-button-primary'
      }
    ]
  },
  {
    id: 'novo-processo',
    title: 'Novo Processo',
    text: 'Cadastre e gerencie processos licitatórios de forma simples e eficiente.',
    attachTo: {
      element: '.features-grid > div:nth-child(2)',
      on: 'bottom'
    },
    buttons: [
      {
        text: 'Voltar',
        action: function() { return this.back(); },
        classes: 'shepherd-button-secondary'
      },
      {
        text: 'Próximo',
        action: function() { return this.next(); },
        classes: 'shepherd-button-primary'
      }
    ]
  },
  {
    id: 'planilha-lances',
    title: 'Planilha de Lances',
    text: 'Registre e gerencie lances de processos, facilitando o acompanhamento de licitações.',
    attachTo: {
      element: '.features-grid > div:nth-child(3)',
      on: 'bottom'
    },
    buttons: [
      {
        text: 'Voltar',
        action: function() { return this.back(); },
        classes: 'shepherd-button-secondary'
      },
      {
        text: 'Próximo',
        action: function() { return this.next(); },
        classes: 'shepherd-button-primary'
      }
    ]
  },
  {
    id: 'declaracoes',
    title: 'Declarações dos Processos',
    text: 'Visualize e gerencie declarações necessárias para os processos licitatórios.',
    attachTo: {
      element: '.features-grid > div:nth-child(4)',
      on: 'bottom'
    },
    buttons: [
      {
        text: 'Voltar',
        action: function() { return this.back(); },
        classes: 'shepherd-button-secondary'
      },
      {
        text: 'Próximo',
        action: function() { return this.next(); },
        classes: 'shepherd-button-primary'
      }
    ]
  },
  {
    id: 'sistemas',
    title: 'Sistemas',
    text: 'Conheça nossos sistemas e soluções disponíveis.',
    attachTo: {
      element: '.features-grid > div:nth-child(5)',
      on: 'bottom'
    },
    buttons: [
      {
        text: 'Voltar',
        action: function() { return this.back(); },
        classes: 'shepherd-button-secondary'
      },
      {
        text: 'Próximo',
        action: function() { return this.next(); },
        classes: 'shepherd-button-primary'
      }
    ]
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    text: 'Visualize estatísticas e indicadores importantes para o acompanhamento de processos.',
    attachTo: {
      element: '.features-grid > div:nth-child(6)',
      on: 'bottom'
    },
    buttons: [
      {
        text: 'Voltar',
        action: function() { return this.back(); },
        classes: 'shepherd-button-secondary'
      },
      {
        text: 'Próximo',
        action: function() { return this.next(); },
        classes: 'shepherd-button-primary'
      }
    ]
  },
  {
    id: 'representantes',
    title: 'Representantes',
    text: 'Cadastre e gerencie representantes que participam dos processos licitatórios.',
    attachTo: {
      element: '.features-grid > div:nth-child(7)',
      on: 'bottom'
    },
    buttons: [
      {
        text: 'Voltar',
        action: function() { return this.back(); },
        classes: 'shepherd-button-secondary'
      },
      {
        text: 'Próximo',
        action: function() { return this.next(); },
        classes: 'shepherd-button-primary'
      }
    ]
  },
  {
    id: 'plataformas',
    title: 'Plataformas',
    text: 'Cadastre e gerencie plataformas utilizadas em processos licitatórios.',
    attachTo: {
      element: '.features-grid > div:nth-child(8)',
      on: 'bottom'
    },
    buttons: [
      {
        text: 'Voltar',
        action: function() { return this.back(); },
        classes: 'shepherd-button-secondary'
      },
      {
        text: 'Próximo',
        action: function() { return this.next(); },
        classes: 'shepherd-button-primary'
      }
    ]
  },
  {
    id: 'empresas',
    title: 'Empresas',
    text: 'Cadastre e gerencie empresas participantes e/ou contratantes.',
    attachTo: {
      element: '.features-grid > div:nth-child(9)',
      on: 'bottom'
    },
    buttons: [
      {
        text: 'Voltar',
        action: function() { return this.back(); },
        classes: 'shepherd-button-secondary'
      },
      {
        text: 'Próximo',
        action: function() { return this.next(); },
        classes: 'shepherd-button-primary'
      }
    ]
  },
  {
    id: 'relatorios',
    title: 'Relatórios',
    text: 'Visualize relatórios detalhados e estatísticas sobre processos e operações.',
    attachTo: {
      element: '.features-grid > div:nth-child(10)',
      on: 'bottom'
    },
    buttons: [
      {
        text: 'Voltar',
        action: function() { return this.back(); },
        classes: 'shepherd-button-secondary'
      },
      {
        text: 'Próximo',
        action: function() { return this.next(); },
        classes: 'shepherd-button-primary'
      }
    ]
  },
  {
    id: 'admin-usuarios',
    title: 'Administração de Usuários',
    text: 'Gerencie usuários e suas permissões de acesso ao sistema.',
    attachTo: {
      element: '.features-grid > div:nth-child(11)',
      on: 'bottom'
    },
    buttons: [
      {
        text: 'Voltar',
        action: function() { return this.back(); },
        classes: 'shepherd-button-secondary'
      },
      {
        text: 'Próximo',
        action: function() { return this.next(); },
        classes: 'shepherd-button-primary'
      }
    ]
  },
  {
    id: 'developer',
    title: 'Desenvolvedor',
    text: 'Conheça a equipe responsável pelo desenvolvimento deste sistema.',
    attachTo: {
      element: '.developer-feature-card',
      on: 'bottom'
    },
    buttons: [
      {
        text: 'Voltar',
        action: function() { return this.back(); },
        classes: 'shepherd-button-secondary'
      },
      {
        text: 'Próximo',
        action: function() { return this.next(); },
        classes: 'shepherd-button-primary'
      }
    ]
  },
  {
    id: 'sidebar',
    title: 'Menu Lateral',
    text: 'Use o menu lateral para navegar entre as diferentes seções do sistema. Você pode minimizá-lo para ganhar mais espaço de trabalho.',
    attachTo: {
      element: '.sidebar',
      on: 'right'
    },
    buttons: [
      {
        text: 'Voltar',
        action: function() { return this.back(); },
        classes: 'shepherd-button-secondary'
      },
      {
        text: 'Próximo',
        action: function() { return this.next(); },
        classes: 'shepherd-button-primary'
      }
    ]
  },
  {
    id: 'help-icon',
    title: 'Ajuda Rápida',
    text: 'Sempre que precisar, clique neste ícone para iniciar o tour novamente.',
    attachTo: {
      element: '.tour-icon',
      on: 'left'
    },
    buttons: [
      {
        text: 'Voltar',
        action: function() { return this.back(); },
        classes: 'shepherd-button-secondary'
      },
      {
        text: 'Próximo',
        action: function() { return this.next(); },
        classes: 'shepherd-button-primary'
      }
    ]
  },
  {
    id: 'conclusion',
    title: 'Pronto!',
    text: 'Agora você conhece todas as funcionalidades do sistema e está pronto para utilizá-lo. Bom trabalho!',
    buttons: [
      {
        text: 'Voltar',
        action: function() { return this.back(); },
        classes: 'shepherd-button-secondary'
      },
      {
        text: 'Concluir',
        action: function() { return this.complete(); },
        classes: 'shepherd-button-primary'
      }
    ]
  }
]

const startTour = () => {
  if (tourGuide.value) {
    tourGuide.value.startTour()
  }
}

const onTourComplete = () => {
  console.log('Tour concluído')
}

const onTourCancel = () => {
  console.log('Tour cancelado')
}
</script>

<style src="../assets/styles/FuncionalidadesView.css"></style>

<style>
/* Adicione isto ao final do seu arquivo CSS existente ou no componente acima se usar scoped */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.tour-icon {
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.3s;
}

.tour-icon:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.tour-icon img {
  width: 24px;
  height: 24px;
  filter: invert(45%) sepia(60%) saturate(1000%) hue-rotate(180deg) brightness(90%) contrast(95%);
}
</style>
