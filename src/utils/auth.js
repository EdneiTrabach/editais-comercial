import { supabase } from '@/lib/supabase'
import router from '@/router'
// Adicionar rate limiting para tentativas de login
import { RateLimiter } from './rateLimiter'
const loginLimiter = new RateLimiter(3, 300000) // 3 tentativas a cada 5 minutos

export const authUtils = {
  async checkAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    return !!session
  },

  async login(email, password) {
    const key = email.toLowerCase()
    if (loginLimiter.isRateLimited(key)) {
      throw new Error('Muitas tentativas. Tente novamente em 5 minutos.')
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password 
      })
      
      if (error) throw error
      return data
    } catch (err) {
      console.error('Erro no login:', err)
      throw err
    }
  },

  async logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }
}

// Em src/utils/auth.js ou onde preferir
export const debugUserState = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const { data: { user } } = await supabase.auth.getUser()
    
    console.log('====== DEBUG USER STATE ======')
    console.log('Sessão:', {
      active: !!session,
      token: session?.access_token ? 'Presente' : 'Ausente'
    })
    
    console.log('Usuário:', {
      id: user?.id,
      email: user?.email
    })
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        
      console.log('Perfil:', {
        role: profile?.role,
        status: profile?.status
      })
    }
  } catch (error) {
    console.error('❌ Erro ao debugar estado:', error)
  }
}