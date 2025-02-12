import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltam variáveis de ambiente do Supabase')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    enabled: true
  },
  db: {
    schema: 'public'
  },
  debug: true // Ativa logs detalhados
})

// Adicione esta função de helper
const handleSupabaseError = (error) => {
  console.error('Supabase error:', error)
  if (error.code === '42P07') { // Relation already exists
    return null
  }
  throw error
}

// API de Autenticação
export const authApi = {
  async signUp(email, password) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'user'
          }
        }
      })

      if (error) throw error

      // Criar perfil apenas se o usuário for criado com sucesso
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            role: 'user',
            created_at: new Date().toISOString()
          })
          .single()

        if (profileError) handleSupabaseError(profileError)
      }

      return data
    } catch (error) {
      handleSupabaseError(error)
    }
  },

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
  },

  async deleteUser(userId) {
    try {
      // Primeiro verifica se é admin
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile.role !== 'admin') {
        throw new Error('Apenas administradores podem deletar usuários')
      }

      // Remove o perfil primeiro
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (profileError) throw profileError

      // Remove o usuário do auth
      const { error: userError } = await supabase.auth.admin.deleteUser(userId)

      if (userError) throw userError

      return { success: true }
    } catch (error) {
      console.error('Erro ao deletar usuário:', error)
      throw error
    }
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

const deleteUser = async (userId) => {
  try {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) {
      return
    }

    await authApi.deleteUser(userId)
    showToast('Usuário excluído com sucesso', 'success')
    
    // Recarregar lista de usuários
    await loadUsers()
  } catch (error) {
    console.error('Erro ao excluir usuário:', error)
    showToast(error.message, 'error')
  }
}