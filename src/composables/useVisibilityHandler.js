// src/composables/useVisibilityHandler.js
import { ref, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { SupabaseManager } from '@/lib/supabaseManager'

export function useVisibilityHandler() {
  const isVisible = ref(true)
  const lastActiveTime = ref(Date.now())

  const handleVisibilityChange = async () => {
    isVisible.value = !document.hidden
    
    if (isVisible.value) {
      const timeSinceLastActive = Date.now() - lastActiveTime.value
      
      if (timeSinceLastActive > 60000) {
        await SupabaseManager.handleReconnect()
      }
    } else {
      lastActiveTime.value = Date.now()
    }
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleVisibilityChange)
    window.addEventListener('online', handleVisibilityChange)
  })

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('focus', handleVisibilityChange) 
    window.removeEventListener('online', handleVisibilityChange)
  })

  return {
    isVisible
  }
}