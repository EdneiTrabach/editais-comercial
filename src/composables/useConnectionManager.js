import { onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { ref } from 'vue'

export function useConnectionManager(loadDataCallback) {
  const isReconnecting = ref(false)

  // Função para verificar e reconectar
  const handleConnectionRestore = async () => {
    try {
      if (!document.hidden) {
        console.log('Aba visível novamente, verificando conexão...')
        
        // Verificar se a conexão realtime ainda está funcional
        const { error } = await supabase
          .from('processos')
          .select('id')
          .limit(1)
          .maybeSingle()
          
        if (error && (error.code === 'JWT_INVALID' || error.code === 'PGRST301')) {
          console.log('Detectado problema de conexão, reconectando...')
          
          // Reconectar ao Realtime
          await supabase.realtime.disconnect()
          await new Promise(resolve => setTimeout(resolve, 300))
          await supabase.realtime.connect()
          
          // Atualizar a sessão
          await supabase.auth.refreshSession()
          
          // Recarregar dados
          if (typeof loadDataCallback === 'function') {
            await loadDataCallback()
          }
        }
      }
    } catch (err) {
      console.error('Erro na verificação de conexão:', err)
    }
  }

  // Eventos para monitorar quando reconectar
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      handleConnectionRestore()
    }
  }

  const handleOnline = () => {
    handleConnectionRestore()
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