import { onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { ref } from 'vue'

export function useConnectionManager(loadDataCallback) {
  const isReconnecting = ref(false)

  // Função melhorada para gerenciar reconexão
  const handleVisibilityChange = async () => {
    if (!document.hidden && !isReconnecting.value) {
      console.log('Página visível novamente, reconectando...')
      try {
        isReconnecting.value = true
        
        // Verifica a sessão do usuário e atualiza se necessário
        const { data } = await supabase.auth.getSession()
        if (data?.session) {
          await supabase.auth.refreshSession()
        }
        
        // Reconecta o cliente Realtime
        await supabase.realtime.disconnect()
        
        // Pequeno delay para garantir desconexão completa
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // Reconecta
        await supabase.realtime.connect()
        
        // Carrega os dados necessários
        if (typeof loadDataCallback === 'function') {
          await loadDataCallback()
        }
      } catch (error) {
        console.error('Erro ao reconectar:', error)
      } finally {
        isReconnecting.value = false
      }
    }
  }

  // Configura os event listeners
  onMounted(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleVisibilityChange)
    window.addEventListener('online', handleVisibilityChange)
  })

  // Remove os event listeners
  onUnmounted(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('focus', handleVisibilityChange)
    window.removeEventListener('online', handleVisibilityChange)
  })

  return {
    forceReconnect: handleVisibilityChange
  }
}