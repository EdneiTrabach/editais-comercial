import { createClient } from '@supabase/supabase-js';
import router from '@/router'; // Adicione esta importação

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Erro: Variáveis de ambiente do Supabase não configuradas corretamente!');
  console.error('VITE_SUPABASE_URL:', supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Definida' : 'Não definida');
}

const options = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, options);

// Adicionando função de verificação de conexão para debugging
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('processos') // Verifica se esta tabela existe
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Erro ao testar conexão com Supabase:', error);
      return false;
    }
    
    console.log('Conexão com Supabase estabelecida com sucesso!');
    return true;
  } catch (err) {
    console.error('Erro de conexão com Supabase:', err);
    return false;
  }
};

// Adicione esta função de helper
const handleSupabaseError = (error) => {
  console.error('Supabase error:', error);
  if (error.code === '42P07') { // Relation already exists
    return null;
  }
  throw error;
};

// Função helper para consultas
async function handleQuery(promise) {
  try {
    const { data, error } = await promise;
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro na consulta:', error);
    return { data: null, error };
  }
}

// Em supabase.js
const makeRequest = async (url) => {
  if (!url) {
    console.error('URL inválida');
    return null;
  }
  
  try {
    const response = await fetch(url);
    return response;
  } catch (error) {
    console.error('Erro na requisição:', error);
    return null;
  }
};

// Helper para verificar se é admin
export const checkIsAdmin = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle();

    if (error) {
      console.error('Erro ao verificar admin:', error);
      return false;
    }

    const isAdmin = profile?.role === 'admin';
    localStorage.setItem('userRole', profile?.role || '');
    return isAdmin;

  } catch (error) {
    console.error('Erro ao verificar admin:', error);
    return false;
  }
};

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
      });

      if (error) throw error;

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
          .single();

        if (profileError) handleSupabaseError(profileError);
      }

      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  },

  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  },

  async resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: import.meta.env.VITE_SUPABASE_REDIRECT_URL
    });
    if (error) throw error;
  },

  async deleteUser(userId) {
    try {
      // Verifica se é admin
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile.role !== 'admin') {
        throw new Error('Apenas administradores podem deletar usuários');
      }

      // 1. Primeiro remove todas as referências do usuário
      const { error: refsError } = await supabase.rpc('cleanup_user_references', {
        user_id: userId
      });

      if (refsError) throw refsError;

      // 2. Remove o perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

      // 3. Remove o usuário via função RPC
      const { error: userError } = await supabase.rpc('delete_user', {
        user_id: userId
      });

      if (userError) throw userError;

      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      throw error;
    }
  }
};

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
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async criar(edital) {
    const user = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('editais')
      .insert([{
        ...edital,
        responsavel_id: user.data.user.id
      }])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  async atualizar(id, edital) {
    const { data, error } = await supabase
      .from('editais')
      .update(edital)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  async deletar(id) {
    const { error } = await supabase
      .from('editais')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// API de dados
export const dataApi = {
  async getProfile(userId) {
    return handleQuery(
      supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
    );
  },

  async getPlataformas() {
    return handleQuery(
      supabase
        .from('plataformas')
        .select('*')
        .order('nome', { ascending: true })
    );
  },

  async getRepresentantes() {
    return handleQuery(
      supabase
        .from('representantes')
        .select('*')
        .order('nome', { ascending: true })
    );
  }
};

const deleteUser = async (userId) => {
  try {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) {
      return;
    }

    const { error } = await authApi.deleteUser(userId);
    
    if (error) throw error;
    
    showToast('Usuário excluído com sucesso', 'success');
    await loadUsers(); // Recarrega a lista
    
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    showToast(
      error.message || 'Erro ao excluir usuário', 
      'error'
    );
  }
};

const loadPlataformas = async () => {
  try {
    const { data, error } = await dataApi.getPlataformas();
    if (error) throw error;
    plataformas.value = data || [];
  } catch (error) {
    console.error('Erro ao carregar plataformas:', error);
    showToast('Erro ao carregar plataformas', 'error');
  }
};

const loadRepresentantes = async () => {
  try {
    const { data, error } = await dataApi.getRepresentantes();
    if (error) throw error;
    representantes.value = data || [];
  } catch (error) {
    console.error('Erro ao carregar representantes:', error);
    showToast('Erro ao carregar representantes', 'error'); 
  }
};

async function exportAllTables() {
  const { data, error } = await supabase.rpc('export_all_tables');
  
  if (error) {
    console.error('Erro ao exportar dados:', error);
    throw error;
  }
  
  // Salvar o JSON
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  saveAs(blob, 'database_export.json');
}