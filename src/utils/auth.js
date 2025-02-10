import { supabase } from '@/lib/supabase'
import router from '@/router'

export const authUtils = {
  async checkAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    return !!session
  },

  async login(email, password) {
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