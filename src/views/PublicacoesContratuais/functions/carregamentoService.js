import { supabase } from '@/lib/supabase';

/**
 * Carrega os dados necessários para o funcionamento da página de publicações contratuais
 * @returns {Promise<Object>} Um objeto contendo os processos, empresas e sistemas carregados
 */
export async function carregarDados() {
  try {
    // Carregar processos
    const { data: processos, error: processosError } = await supabase
      .from('processos')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (processosError) throw processosError;
    
    // Carregar empresas
    const { data: empresas, error: empresasError } = await supabase
      .from('empresas')
      .select('*')
      .order('nome', { ascending: true });
      
    if (empresasError) throw empresasError;
    
    // Carregar sistemas
    const { data: sistemas, error: sistemasError } = await supabase
      .from('sistemas')
      .select('*')
      .order('nome', { ascending: true });
      
    if (sistemasError) throw sistemasError;
    
    return {
      processos,
      empresas,
      sistemas
    };
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    throw error;
  }
}