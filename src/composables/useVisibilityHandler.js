// src/composables/useVisibilityHandler.js
import { ref, onMounted, onUnmounted } from 'vue'
import { SupabaseManager } from '@/lib/supabaseManager'

// Estado compartilhado
const isReconnecting = ref(false)
const isVisible = ref(document.visibilityState === 'visible')

// Uso de debounce para evitar múltiplas chamadas
let debounceTimer = null

export function useVisibilityHandler(onVisibilityChange = null) {
  // Função para lidar com mudanças de visibilidade
  const handleVisibilityChange = async () => {
    isVisible.value = document.visibilityState === 'visible'
    
    if (isVisible.value && !isReconnecting.value) {
      // Limpar qualquer timer pendente
      if (debounceTimer) clearTimeout(debounceTimer)
      
      // Criar um novo timer com atraso para evitar múltiplas chamadas em sucessão
      debounceTimer = setTimeout(async () => {
        try {
          isReconnecting.value = true
          
          // Reconectar canais do Supabase
          await SupabaseManager.handleReconnect()
          
          // Executar callback personalizada se fornecida
          if (typeof onVisibilityChange === 'function') {
            await onVisibilityChange(isVisible.value)
          }
        } catch (error) {
          console.error('Erro ao processar mudança de visibilidade:', error)
        } finally {
          isReconnecting.value = false
        }
      }, 1000) // Debounce de 1 segundo
    }
  }
  
  // Configurar listeners
  onMounted(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleVisibilityChange)
  })
  
  // Limpar listeners
  onUnmounted(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('focus', handleVisibilityChange)
    
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
  })
  
  return {
    isVisible,
    isReconnecting
  }
}