// src/lib/supabaseManager.js
import { supabase } from '@/lib/supabase'

/**
 * Gerencia as inscrições do Supabase Realtime
 */
export const SupabaseManager = {
  subscriptions: new Map(),
  reconnecting: false,
  reconnectTimeout: null,

  async handleReconnect() {
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
  },

  addSubscription(name, channel) {
    // Remove inscrição existente com o mesmo nome, se houver
    if (this.subscriptions.has(name)) {
      supabase.removeChannel(this.subscriptions.get(name))
    }
    this.subscriptions.set(name, channel)
  },

  removeSubscription(name) {
    this.subscriptions.delete(name)
  },

  getSubscription(channelName) {
    return this.subscriptions.get(channelName)
  },

  removeAllSubscriptions() {
    for (const [name, channel] of this.subscriptions.entries()) {
      try {
        supabase.removeChannel(channel)
      } catch (error) {
        console.error(`Erro ao remover canal ${name}:`, error)
      }
    }
    this.subscriptions.clear()
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