import { onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'

export function useSubscriptionManager() {
  const subscriptions = new Map()
  
  const addSubscription = (name, channel) => {
    if (subscriptions.has(name)) {
      removeSubscription(name)
    }
    subscriptions.set(name, channel)
  }
  
  const removeSubscription = (name) => {
    if (subscriptions.has(name)) {
      const channel = subscriptions.get(name)
      if (channel) {
        supabase.removeChannel(channel)
      }
      subscriptions.delete(name)
    }
  }
  
  const removeAllSubscriptions = () => {
    subscriptions.forEach((channel, name) => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    })
    subscriptions.clear()
  }
  
  // Limpar automaticamente ao desmontar o componente
  onUnmounted(() => {
    removeAllSubscriptions()
  })
  
  return {
    addSubscription,
    removeSubscription,
    removeAllSubscriptions
  }
}