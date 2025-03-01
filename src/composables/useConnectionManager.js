import { onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { ref } from 'vue'

export function useConnectionManager(loadDataCallback) {
  const isReconnecting = ref(false)

  // Função para verificar e reconectar
  const checkConnection = async () => {
    try {
      // Verificar se ainda há conexão com o Supabase
      const { error } = await supabase.from('profiles').select('id').limit(1)
      
      if (error) {
        console.log('Erro de conexão detectado, reconectando...')
        await supabase.realtime.disconnect()
        await new Promise(resolve => setTimeout(resolve, 500))
        await supabase.realtime.connect()
        
        // Atualiza a sessão também para evitar erros de autenticação
        await supabase.auth.refreshSession()
        
        // Recarregar os dados
        if (loadDataCallback) await loadDataCallback()
      }
    } catch (err) {
      console.error('Erro ao verificar conexão:', err)
    }
  }

  // Eventos para monitorar quando reconectar
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      checkConnection()
    }
  }

  const handleOnline = () => {
    checkConnection()
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
    forceReconnect: handleVisibilityChange
  }
}