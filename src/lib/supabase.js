import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// API de Autenticação
export const authApi = {
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  },

  async resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: import.meta.env.VITE_SUPABASE_REDIRECT_URL
    })
    if (error) throw error
  }
}

// API de Editais
export const editaisApi = {
  async listar() {
    const { data, error } = await supabase
      .from('editais')
      .select(`
        *,
        profiles (
          nome,
          cargo,
          departamento
        )
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async criar(edital) {
    const user = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('editais')
      .insert([{
        ...edital,
        responsavel_id: user.data.user.id
      }])
      .select()
    
    if (error) throw error
    return data[0]
  },

  async atualizar(id, edital) {
    const { data, error } = await supabase
      .from('editais')
      .update(edital)
      .eq('id', id)
      .select()
    
    if (error) throw error
    return data[0]
  },

  async deletar(id) {
    const { error } = await supabase
      .from('editais')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}