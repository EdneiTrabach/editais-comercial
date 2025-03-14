import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { SupabaseManager } from '@/lib/supabaseManager'

export function useRealtimeManager() {
  const isLoading = ref(false)
  const refreshInterval = ref(null)
  const processosCache = new Map()
  const processos = ref([])

  const loadProcessos = async () => {
    if (isLoading.value) return

    try {
      isLoading.value = true
      const { data, error } = await supabase
        .from('processos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      processos.value = data

      // Atualiza cache
      data.forEach(processo => {
        processosCache.set(processo.id, processo)
      })
    } catch (error) {
      console.error('Erro ao carregar processos:', error)
    } finally {
      isLoading.value = false
    }
  }

  const setupRealtimeSubscription = () => {
    try {
      const channel = supabase
        .channel('processos-changes')
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'processos'
          },
          (payload) => {
            console.log('Mudança detectada:', payload)
            loadProcessos()
          }
        )
        .subscribe()

      SupabaseManager.addSubscription('processos-changes', channel)
    } catch (error) {
      console.error('Erro ao configurar realtime:', error)
    }
  }

  const startAutoRefresh = () => {
    stopAutoRefresh()
    refreshInterval.value = setInterval(() => {
      loadProcessos().catch(console.error)
    }, 30000)
  }

  const stopAutoRefresh = () => {
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value)
      refreshInterval.value = null
    }
  }

  const loadPageData = async (loadPlataformas, loadRepresentantes, loadSistemas) => {
    if (isLoading.value) return
    
    try {
      isLoading.value = true
      await Promise.all([
        loadProcessos(),
        loadPlataformas(),
        loadRepresentantes(),
        loadSistemas()
      ])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      isLoading.value = false
    }
  }

  const cleanupSubscriptions = () => {
    stopAutoRefresh()
      
    const channelProcessosChanges = SupabaseManager.subscriptions.get('processos-changes')
    if (channelProcessosChanges) {
      supabase.removeChannel(channelProcessosChanges)
      SupabaseManager.removeSubscription('processos-changes')
    }
    
    const channelEditaisUpdates = SupabaseManager.subscriptions.get('editais-updates')
    if (channelEditaisUpdates) {
      supabase.removeChannel(channelEditaisUpdates)
      SupabaseManager.removeSubscription('editais-updates')
    }
  }

  return {
    isLoading,
    processos,
    processosCache,
    loadProcessos,
    setupRealtimeSubscription,
    startAutoRefresh,
    stopAutoRefresh,
    loadPageData,
    cleanupSubscriptions
  }
}