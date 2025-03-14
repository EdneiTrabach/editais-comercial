import { ref, onMounted, onUnmounted } from 'vue'

export function useConnection() {
  const isOnline = ref(navigator.onLine)
  const hasConnectionIssue = ref(false)
  const lastReconnectAttempt = ref(0)
  const reconnectInterval = 5000 // 5 segundos
  
  const checkConnection = async () => {
    try {
      // Simplificar a verificação para usar apenas o status online do navegador
      // ou fazer uma solicitação para uma URL que sabemos que existe
      hasConnectionIssue.value = !navigator.onLine
      
      // Se quiser fazer uma verificação de rede real, use um endpoint que exista
      // Por exemplo: a URL do Supabase ou um arquivo estático
      /* 
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch('/favicon.ico', {  // Use um recurso que existe
        method: 'HEAD',  // HEAD é mais leve que GET
        signal: controller.signal,
        cache: 'no-cache',
        headers: { 'Cache-Control': 'no-cache' }
      })
      
      clearTimeout(timeoutId)
      
      hasConnectionIssue.value = !response.ok
      */
      
      if (!hasConnectionIssue.value && !isOnline.value) {
        isOnline.value = true
      }
    } catch (error) {
      console.warn('Falha na verificação de conexão:', error)
      hasConnectionIssue.value = true
    }
  }
  
  const handleOnline = () => {
    isOnline.value = true
    // Espere um momento antes de verificar a conexão real
    setTimeout(checkConnection, 1000)
  }
  
  const handleOffline = () => {
    isOnline.value = false
    hasConnectionIssue.value = true
  }
  
  // Configura contadores de falha
  let failedAttempts = 0
  const maxFailedAttempts = 3
  
  // Tenta reconectar periodicamente
  const attemptReconnect = async () => {
    const now = Date.now()
    if (now - lastReconnectAttempt.value < reconnectInterval) {
      return
    }
    
    lastReconnectAttempt.value = now
    
    try {
      await checkConnection()
      
      if (!hasConnectionIssue.value) {
        failedAttempts = 0
        return true
      } else {
        failedAttempts++
        if (failedAttempts >= maxFailedAttempts) {
          console.warn(`Múltiplas falhas de conexão (${failedAttempts})`)
          // Aqui você pode implementar uma lógica de backoff exponencial
          // ou mostrar um aviso mais proeminente ao usuário
        }
      }
    } catch (error) {
      console.error('Erro ao tentar reconectar:', error)
      failedAttempts++
    }
    
    return false
  }
  
  onMounted(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Verifica conexão inicial
    checkConnection()
  })
  
  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  })
  
  return {
    isOnline,
    hasConnectionIssue,
    checkConnection,
    attemptReconnect
  }
}