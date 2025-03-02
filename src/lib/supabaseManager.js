// src/lib/supabaseManager.js
import { supabase } from '@/lib/supabase'

export class SupabaseManager {
  static subscriptions = new Map()
  static reconnecting = false
  static reconnectTimeout = null

  static async handleReconnect() {
    // Evita múltiplas reconexões simultâneas
    if (this.reconnecting) return;
    
    try {
      this.reconnecting = true;
      
      // Tenta renovar a sessão
      const { error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Erro ao renovar sessão:', error);
        return;
      }
      
      // Reativa inscrições
      for (const [channelName, channel] of this.subscriptions.entries()) {
        await channel.subscribe();
        console.log(`Reativado canal: ${channelName}`);
      }
      
    } catch (err) {
      console.error('Erro ao reconectar:', err);
    } finally {
      this.reconnecting = false;
      
      // Limpa timeout anterior se houver
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }
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