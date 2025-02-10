import { createClient } from '@supabase/supabase-js'
import { supabase } from '../config/supabase'
import axios from 'axios'
import router from '../router'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
})

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  
  return config
})

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      supabase.auth.signOut()
      router.push('/login')
    }
    return Promise.reject(error)
  }
)

// Create api object with Supabase methods
const supabaseApi = {
  // Generic CRUD operations
  get: async (table: string) => {
    const { data, error } = await supabase
      .from(table)
      .select()
    if (error) throw error
    return { data }
  },

  getById: async (table: string, id: string) => {
    const { data, error } = await supabase
      .from(table)
      .select()
      .eq('id', id)
      .single()
    if (error) throw error
    return { data }
  },

  post: async (table: string, payload: any) => {
    const { data, error } = await supabase
      .from(table)
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return { data }
  },

  put: async (table: string, id: string, payload: any) => {
    const { data, error } = await supabase
      .from(table)
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return { data }
  },

  delete: async (table: string, id: string) => {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
    if (error) throw error
    return { success: true }
  },

  // Specific endpoints
  certificados: {
    getAll: () => supabaseApi.get('certificados'),
    getById: (id: string) => supabaseApi.getById('certificados', id),
    create: (data: any) => supabaseApi.post('certificados', data),
    update: (id: string, data: any) => supabaseApi.put('certificados', id, data),
    delete: (id: string) => supabaseApi.delete('certificados', id),
    emitir: async (id: string) => {
      const { data, error } = await supabase
        .from('certificados')
        .update({ status: 'emitido', data_emissao: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      return { data }
    }
  }
}

export const setorService = {
  async listarSetores() {
    const { data, error } = await supabase
      .from('setores')
      .select('*')
      .order('nome')
    
    if (error) throw error
    return data
  },

  async cadastrarSetor(nome: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('setores')
      .insert({
        nome,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

export const usuariosService = {
  async getAll() {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return { data }
  },
  
  async update(id: string, userData: any) {
    const { data, error } = await supabase
      .from('usuarios')
      .update(userData)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return { data }
  },
  
  async delete(id: string) {
    const { data, error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return { data }
  }
}

// Export default api
export default api

// Export other services
export const certificadosService = { /* ... */ }