// src/lib/supabaseManager.js
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

class SupabaseChannelManager {
  constructor() {
    this.subscriptions = new Map()
    this.reconnecting = false
  }

  addSubscription(name, channel) {
    if (this.subscriptions.has(name)) {
      console.warn(`Canal '${name}' já existe. Removendo o anterior.`)
      this.removeSubscription(name)
    }
    this.subscriptions.set(name, channel)
    return channel
  }

  removeSubscription(name) {
    const channel = this.subscriptions.get(name)
    if (channel) {
      try {
        supabase.removeChannel(channel)
      } catch (e) {
        console.warn(`Erro ao remover canal ${name}:`, e)
      }
      this.subscriptions.delete(name)
    }
  }

  getSubscription(name) {
    return this.subscriptions.get(name)
  }

  async handleReconnect() {
    if (this.reconnecting) {
      console.log('Reconexão já em andamento, ignorando solicitação...')
      return
    }
    
    try {
      this.reconnecting = true
      console.log('Tentando reconectar canais...')
      
      // Tentar renovar a sessão primeiro
      try {
        await supabase.auth.refreshSession()
      } catch (e) {
        console.warn('Erro ao renovar sessão:', e)
      }
      
      // Para cada canal existente
      for (const [name, channel] of this.subscriptions.entries()) {
        if (!channel) continue
        
        try {
          // Verificar o estado do canal antes de tentar reconectar
          if (channel.state === 'joined' || channel.state === 'joining') {
            console.log(`Canal ${name} já está ativo (estado: ${channel.state})`)
          } else {
            // Se o canal estiver em estado problemático, recriá-lo
            console.log(`Recriando canal ${name} (estado atual: ${channel.state})`)
            
            // Salvar tópico e callbacks
            const topic = channel._topic || channel.topic
            const callbacks = channel._listeners?.postgres_changes || []
            
            // Remover canal antigo
            try {
              await supabase.removeChannel(channel)
            } catch (e) {
              console.warn(`Erro ao remover canal antigo ${name}:`, e)
            }
            
            // Criar novo canal
            const newChannel = supabase.channel(name)
            
            // Recriar callbacks
            for (const callback of callbacks) {
              if (callback && callback.event && callback.schema && callback.table && callback.callback) {
                newChannel.on('postgres_changes', 
                  { event: callback.event, schema: callback.schema, table: callback.table }, 
                  callback.callback)
              }
            }
            
            // Inscrever no novo canal
            await newChannel.subscribe()
            
            // Substituir no map
            this.subscriptions.set(name, newChannel)
            console.log(`Canal ${name} recriado com sucesso`)
          }
        } catch (err) {
          console.warn(`Erro ao reconectar canal ${name}:`, err)
        }
      }
      
    } catch (err) {
      console.error('Erro ao reconectar:', err)
    } finally {
      this.reconnecting = false
    }
  }
}

export const SupabaseManager = new SupabaseChannelManager()

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