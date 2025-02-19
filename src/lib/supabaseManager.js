// src/lib/supabaseManager.js
import { supabase } from './supabase'

export class SupabaseManager {
  static subscriptions = new Map()

  static async handleReconnect() {
    try {
      // Primeiro desconecta os canais existentes
      for (const [channelName, channel] of this.subscriptions) {
        try {
          if (channel && typeof channel.unsubscribe === 'function') {
            await channel.unsubscribe()
          }
          await supabase.removeChannel(channel)
        } catch (err) {
          console.warn(`Erro ao remover canal ${channelName}:`, err)
        }
      }

      // Limpa o mapa de subscrições
      this.subscriptions.clear()

      // Reconecta o cliente realtime
      try {
        await supabase.realtime.disconnect()
        await new Promise(resolve => setTimeout(resolve, 1000)) // Espera 1s
        await supabase.realtime.connect()
      } catch (err) {
        console.warn('Erro ao reconectar realtime:', err)
      }

      return true
    } catch (error) {
      console.error('Erro na reconexão do Supabase:', error)
      return false
    }
  }

  static addSubscription(channelName, channel) {
    if (channel && channel.unsubscribe) {
      this.subscriptions.set(channelName, channel)
    } else {
      console.warn('Tentativa de adicionar canal inválido:', channelName)
    }
  }

  static removeSubscription(channelName) {
    this.subscriptions.delete(channelName)
  }

  static getSubscription(channelName) {
    return this.subscriptions.get(channelName)
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