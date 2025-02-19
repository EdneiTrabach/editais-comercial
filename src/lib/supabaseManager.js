// src/lib/supabaseManager.js
import { supabase } from './supabase'

export class SupabaseManager {
  static subscriptions = new Map()

  static async handleReconnect() {
    try {
      // Desconecta todas as subscrições existentes
      for (const [channel] of this.subscriptions) {
        await supabase.removeChannel(channel)
      }

      // Limpa o mapa de subscrições
      this.subscriptions.clear()

      // Reconecta o cliente realtime
      await supabase.realtime.disconnect()
      await supabase.realtime.connect()

      return true
    } catch (error) {
      console.error('Erro na reconexão do Supabase:', error)
      return false
    }
  }

  static addSubscription(channelName, channel) {
    this.subscriptions.set(channelName, channel)
  }

  static removeSubscription(channelName) {
    this.subscriptions.delete(channelName)
  }
}

const setupRealtimeSubscription = () => {
  const channel = supabase
    .channel('processos-changes')
    .on('postgres_changes',
      { 
        event: '*',
        schema: 'public',
        table: 'processos'
      },
      () => {
        loadData()
      }
    )
    .subscribe()

  SupabaseManager.addSubscription('processos-changes', channel)

  onUnmounted(() => {
    const channel = SupabaseManager.subscriptions.get('processos-changes')
    if (channel) {
      supabase.removeChannel(channel)
      SupabaseManager.removeSubscription('processos-changes')
    }
  })
}