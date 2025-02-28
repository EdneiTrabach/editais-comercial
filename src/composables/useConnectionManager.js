import { onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { SupabaseManager } from '@/lib/supabaseManager'

export function useConnectionManager(loadDataCallback) {
  // Gerenciador centralizado de visibilidade do documento
  const handleVisibilityChange = async () => {
    if (!document.hidden) {
      console.log('Página visível novamente, reconectando...')
      try {
        // Primeiro reconecta o Supabase
        await SupabaseManager.handleReconnect()
        
        // Depois carrega os dados necessários
        if (typeof loadDataCallback === 'function') {
          await loadDataCallback()
        }
      } catch (error) {
        console.error('Erro ao reconectar:', error)
      }
    }
  }

  // Configura os event listeners quando o componente é montado
  onMounted(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleVisibilityChange)
    window.addEventListener('online', handleVisibilityChange)
  })

  // Remove os event listeners quando o componente é desmontado
  onUnmounted(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('focus', handleVisibilityChange)
    window.removeEventListener('online', handleVisibilityChange)
  })

  return {
    reconnect: async () => {
      await SupabaseManager.handleReconnect()
      if (typeof loadDataCallback === 'function') {
        await loadDataCallback()
      }
    }
  }
}