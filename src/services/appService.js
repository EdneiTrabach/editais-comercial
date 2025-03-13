// src/services/appService.js
import { ref, inject } from 'vue'
import { supabase } from '@/lib/supabase'

export const createAppService = (router) => {
  // Cache centralizado
  const cache = {
    dados: new Map(),
    coordenadas: new Map(),
    orgaos: new Map(),
    sistemas: null,
    plataformas: null,
    representantes: null,
    lastUpdate: null,
    CACHE_DURATION: 120000,
    
    limparCache() {
      this.dados.clear()
      this.coordenadas.clear()
      this.orgaos.clear()
      this.sistemas = null
      this.plataformas = null
      this.representantes = null
      this.lastUpdate = null
      console.log('Cache limpo com sucesso')
    },
    
    get(key, tipo = 'dados') {
      const item = this[tipo].get(key)
      if (!item) return null
      if (Date.now() - item.timestamp > this.CACHE_DURATION) {
        this[tipo].delete(key)
        return null
      }
      return item.dados
    },
    
    set(key, dados, tipo = 'dados') {
      this[tipo].set(key, {
        dados,
        timestamp: Date.now()
      })
    }
  }
  
  // Gerenciamento de canais Supabase
  const channels = new Map()
  const reconnecting = ref(false)
  
  const createChannel = (name, table, callback) => {
    // Limpa canal existente se houver
    if (channels.has(name)) {
      try {
        supabase.removeChannel(channels.get(name))
      } catch (e) {
        console.log(`Erro ao remover canal existente ${name}:`, e)
      }
      channels.delete(name)
    }
    
    try {
      const channel = supabase.channel(name)
        .on('postgres_changes', 
          { event: '*', schema: 'public', table }, 
          callback)
        .subscribe((status) => {
          console.log(`Canal ${name} status:`, status)
        })
        
      channels.set(name, channel)
      return channel
    } catch (e) {
      console.error(`Erro ao criar canal ${name}:`, e)
      return null
    }
  }
  
  const removeChannel = (name) => {
    if (channels.has(name)) {
      try {
        supabase.removeChannel(channels.get(name))
      } catch (e) {
        console.log(`Erro ao remover canal ${name}:`, e)
      }
      channels.delete(name)
    }
  }
  
  const removeAllChannels = () => {
    for (const [name, channel] of channels.entries()) {
      try {
        supabase.removeChannel(channel)
      } catch (e) {
        console.log(`Erro ao remover canal ${name}:`, e)
      }
    }
    channels.clear()
  }
  
  // Autenticação e verificação de admin
  const isAdmin = ref(false)
  const currentUser = ref(null)
  const authError = ref(null)
  
  const checkAuth = async () => {
    try {
      authError.value = null
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Erro ao verificar sessão:', error)
        authError.value = error
        return null
      }
      
      if (!session) {
        currentUser.value = null
        isAdmin.value = false
        return null
      }
      
      currentUser.value = session.user
      
      // Verifica status de admin
      await checkAdminStatus()
      
      return session.user
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
      authError.value = error
      return null
    }
  }
  
  const checkAdminStatus = async () => {
    try {
      if (!currentUser.value) {
        isAdmin.value = false
        return false
      }
      
      // Importante: tratamento especial para evitar erro 500
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.value.id)
        .maybeSingle()
      
      if (error) {
        console.error('Erro ao verificar perfil:', error)
        return false
      }
      
      isAdmin.value = profile?.role === 'admin'
      localStorage.setItem('userRole', profile?.role || '')
      
      return isAdmin.value
    } catch (error) {
      console.error('Erro ao verificar status admin:', error)
      isAdmin.value = false
      return false
    }
  }
  
  // Handler de visibilidade centralizado
  const setupVisibilityHandler = (callback) => {
    const handler = async () => {
      if (!document.hidden) {
        // Evitar múltiplas atualizações simultâneas
        if (reconnecting.value) return
        
        reconnecting.value = true
        
        try {
          // Reconectar e atualizar dados quando voltar à página
          await checkAuth()
          
          // Reativar canais
          for (const [name, channel] of channels.entries()) {
            try {
              // Se o canal não está conectado, reconecta
              await channel.subscribe()
            } catch (e) {
              console.error(`Erro ao reconectar canal ${name}:`, e)
            }
          }
          
          if (callback) await callback()
        } catch (error) {
          console.error('Erro ao reconectar:', error)
        } finally {
          reconnecting.value = false
        }
      }
    }
    
    document.addEventListener('visibilitychange', handler)
    window.addEventListener('focus', handler)
    window.addEventListener('online', handler)
    
    return () => {
      document.removeEventListener('visibilitychange', handler)
      window.removeEventListener('focus', handler)
      window.removeEventListener('online', handler)
    }
  }
  
  // Setup de autenticação
  const authListener = supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth state changed:', event)
    
    if (event === 'SIGNED_OUT') {
      currentUser.value = null
      isAdmin.value = false
      localStorage.removeItem('userRole')
      router.push('/login')
    } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      currentUser.value = session.user
      await checkAdminStatus()
    }
  })
  
  return {
    cache,
    createChannel,
    removeChannel,
    removeAllChannels,
    isAdmin,
    currentUser,
    authError,
    checkAuth,
    checkAdminStatus,
    setupVisibilityHandler,
    authListener
  }
}

// Composable para usar o serviço
export const useAppService = () => {
  const appService = inject('appService')
  if (!appService) {
    throw new Error('appService não encontrado. Certifique-se de fornecer appService no componente raiz.')
  }
  return appService
}