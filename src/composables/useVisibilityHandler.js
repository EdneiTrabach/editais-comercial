// src/composables/useVisibilityHandler.js
import { ref, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'

export function useVisibilityHandler() {
  const isVisible = ref(true)
  const lastActiveTime = ref(Date.now())

  const handleVisibilityChange = async () => {
    isVisible.value = !document.hidden
    
    if (isVisible.value) {
      const timeSinceLastActive = Date.now() - lastActiveTime.value
      
      // Only reconnect if inactive for more than 1 minute
      if (timeSinceLastActive > 60000) {
        await reconnectSupabase()
      }
    } else {
      lastActiveTime.value = Date.now()
    }
  }

  const reconnectSupabase = async () => {
    try {
      await supabase.realtime.disconnect()
      await supabase.realtime.connect()
    } catch (error) {
      console.error('Error reconnecting to Supabase:', error)
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