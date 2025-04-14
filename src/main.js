import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createAppService } from './services/appService'
import './assets/styles/themes/theme.css'
import './assets/styles/themes/dark-mode.css'
import './assets/styles/components/colored-dropdown.css'
import EmpresaVencedoraColuna from './components/EmpresaVencedoraColuna.vue'
import '@/assets/sharedStyles.css'
import '@fortawesome/fontawesome-free/css/all.css'

// Não precisamos mais da configuração CSP via meta tag
// import { configurarCSP } from './services/cspConfig'

// Comentado pois agora é feito via cabeçalhos no servidor Vite
// configurarCSP()

// Função para reconectar quando a aplicação voltar a ser visível
const setupVisibilityHandling = () => {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      // Reconectar service worker
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'RECONNECT'
        })
      }
    }
  })
}

const app = createApp(App)

// Cria o serviço de aplicação e o fornece para toda a aplicação
// const appService = createAppService(router)
// app.provide('appService', appService)

app.use(router)
app.component('EmpresaVencedoraColuna', EmpresaVencedoraColuna)

// Configurar tratamento de visibilidade
setupVisibilityHandling()

app.mount('#app')