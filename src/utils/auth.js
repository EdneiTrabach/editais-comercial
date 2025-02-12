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