import { onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { ref } from 'vue'
import { SupabaseManager } from '@/lib/supabaseManager' // Adicione esta importação

export function useConnectionManager(loadDataCallback) {
  // Adicione este controle de estado
  const isReconnecting = ref(false)

  const handleConnectionRestore = async () => {
    if (isReconnecting.value) return

    try {
      isReconnecting.value = true

      // Verifica se está online
      if (navigator.onLine) {
        // Verifica se a sessão Supabase está ativa
        const { data: { session } } = await supabase.auth.getSession()

        // Se tiver sessão ativa, executa o callback
        if (session) {
          await SupabaseManager.handleReconnect()

          // Adicione um pequeno delay para evitar colisões
          await new Promise(resolve => setTimeout(resolve, 500))

          if (typeof loadDataCallback === 'function') {
            await loadDataCallback()
          }
        }
      }
    } catch (err) {
      console.error('Erro na verificação de conexão:', err)
    } finally {
      isReconnecting.value = false
    }
  }

  // Configure os event listeners com controle de debounce
  let reconnectTimer = null

  const handleVisibilityChange = () => {
    if (!document.hidden) {
      // Cancelar timer anterior se houver
      if (reconnectTimer) clearTimeout(reconnectTimer)

      // Aguardar um pouco antes de tentar reconectar
      reconnectTimer = setTimeout(() => {
        handleConnectionRestore()
      }, 1000)
    }
  }

  const handleOnline = () => {
    console.log('Conexão restaurada, tentando reconexão...')
    SupabaseManager.handleReconnect()
    loadDataCallback()
  }

  // Configura os event listeners
  onMounted(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleVisibilityChange)
    window.addEventListener('online', handleOnline)
  })

  // Remove os event listeners
  onUnmounted(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('focus', handleVisibilityChange)
    window.removeEventListener('online', handleOnline)
  })

  return {
    forceReconnect: handleVisibilityChange,
    handleOnline
  }
}