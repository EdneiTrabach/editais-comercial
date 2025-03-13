import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createAppService } from './services/appService'
import './assets/styles/theme.css'
import './assets/styles/dark-mode.css'

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

// Configurar tratamento de visibilidade
setupVisibilityHandling()

app.mount('#app')