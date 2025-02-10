import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const authApi = {
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  },

  async register(email, password, userData) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
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
      .select(`
        *,
        profiles (
          nome,
          cargo,
          departamento
        )
      `)
    
    if (error) throw error
    return data[0]
  },

  async atualizar(id, edital) {
    const { data, error } = await supabase
      .from('editais')
      .update(edital)
      .eq('id', id)
      .select(`
        *,
        profiles (
          nome,
          cargo,
          departamento
        )
      `)
    
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

import { editaisApi } from '@/lib/supabase'

// Listar editais
const editais = await editaisApi.listar()

// Criar edital
const novoEdital = await editaisApi.criar({
  titulo: 'Novo Edital',
  descricao: 'Descrição do edital',
  data_limite: new Date().toISOString(),
  status: 'ABERTO'
})

// Atualizar edital
const editalAtualizado = await editaisApi.atualizar(id, {
  status: 'FECHADO'
})

// Deletar edital
await editaisApi.deletar(id)