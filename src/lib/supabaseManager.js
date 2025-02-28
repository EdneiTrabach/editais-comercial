// src/lib/supabaseManager.js
import { supabase } from './supabase'

export class SupabaseManager {
  static subscriptions = new Map()

  static async handleReconnect() {
    try {
      console.log('Iniciando processo de reconexão...')
      
      // Desconecta os canais existentes
      for (const [channelName, channel] of this.subscriptions) {
        try {
          console.log(`Desconectando canal: ${channelName}`)
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
        console.log('Desconectando cliente realtime...')
        await supabase.realtime.disconnect()
        
        // Espera um pouco antes de reconectar
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        console.log('Reconectando cliente realtime...')
        await supabase.realtime.connect()
        
        // Atualiza o token de autenticação também
        const { data } = await supabase.auth.getSession()
        if (data?.session) {
          await supabase.auth.refreshSession()
          console.log('Sessão de autenticação atualizada')
        }
      } catch (err) {
        console.warn('Erro ao reconectar realtime:', err)
      }

      console.log('Processo de reconexão concluído')
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