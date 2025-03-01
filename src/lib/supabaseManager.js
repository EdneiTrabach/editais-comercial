// src/lib/supabaseManager.js
import { supabase } from '@/supabase' // ajuste o caminho conforme seu projeto

export class SupabaseManager {
  static subscriptions = new Map()

  static async handleReconnect() {
    try {
      console.log('Iniciando processo de reconexão...')
      
      // Desconecta todos os canais existentes
      for (const [channelName, channel] of this.subscriptions) {
        await supabase.removeChannel(channel)
      }

      // Limpa o mapa
      this.subscriptions.clear()

      // Reconecta o cliente realtime e refresca a sessão
      await supabase.realtime.disconnect()
      await new Promise(resolve => setTimeout(resolve, 500))
      await supabase.realtime.connect()
      await supabase.auth.refreshSession()
      
      return true
    } catch (error) {
      console.error('Erro na reconexão do Supabase:', error)
      return false
    }
  }

  static addSubscription(name, channel) {
    this.subscriptions.set(name, channel)
  }

  static removeSubscription(name) {
    this.subscriptions.delete(name)
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