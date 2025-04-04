/**
 * Utilitários para chamadas à API do Supabase com tratamento de erros
 */

/**
 * Executa uma consulta ao Supabase com tratamento de erro embutido
 * @param {Function} queryFunction - Função que retorna uma Promise da consulta do Supabase
 * @param {Object} options - Opções adicionais
 * @param {boolean} options.silentError - Se verdadeiro, não exibe erros no console (padrão: false)
 * @param {Function} options.onError - Callback opcional para quando um erro ocorre
 * @returns {Promise<{data: any, error: any}>} - Objeto contendo os dados ou erro
 */
export async function safeSupabaseQuery(queryFunction, options = {}) {
  const { silentError = false, onError } = options;
  
  try {
    const result = await queryFunction();
    
    if (result.error) {
      if (!silentError) {
        console.error('Erro na consulta Supabase:', result.error);
      }
      
      if (onError && typeof onError === 'function') {
        onError(result.error);
      }
      
      return { data: null, error: result.error };
    }
    
    return { data: result.data, error: null };
  } catch (error) {
    if (!silentError) {
      console.error('Exceção ao realizar consulta Supabase:', error);
    }
    
    if (onError && typeof onError === 'function') {
      onError(error);
    }
    
    return { data: null, error };
  }
}

/**
 * Versão com retry para chamadas ao Supabase
 * @param {Function} queryFunction - Função que retorna uma Promise da consulta do Supabase
 * @param {Object} options - Opções adicionais
 * @param {number} options.retries - Número de tentativas (padrão: 3)
 * @param {number} options.delay - Atraso em ms entre as tentativas (padrão: 1000)
 * @param {boolean} options.silentError - Se verdadeiro, não exibe erros no console
 * @param {Function} options.onError - Callback opcional para quando um erro ocorre
 * @returns {Promise<{data: any, error: any}>} - Objeto contendo os dados ou erro
 */
export async function retrySupabaseQuery(queryFunction, options = {}) {
  const { 
    retries = 3, 
    delay = 1000, 
    silentError = false,
    onError
  } = options;
  
  let lastError = null;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const result = await queryFunction();
      
      if (!result.error) {
        return { data: result.data, error: null };
      }
      
      lastError = result.error;
      
      if (!silentError) {
        console.warn(`Tentativa ${attempt + 1}/${retries} falhou:`, result.error);
      }
      
      // Espera antes da próxima tentativa
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      lastError = error;
      
      if (!silentError) {
        console.warn(`Tentativa ${attempt + 1}/${retries} falhou com exceção:`, error);
      }
      
      // Espera antes da próxima tentativa
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  if (!silentError) {
    console.error(`Todas as ${retries} tentativas falharam.`, lastError);
  }
  
  if (onError && typeof onError === 'function') {
    onError(lastError);
  }
  
  return { data: null, error: lastError };
}

/**
 * Verificar se um erro do Supabase é relacionado a permissões/autenticação
 * @param {Object} error - Objeto de erro retornado pelo Supabase
 * @returns {boolean} - Verdadeiro se o erro for de permissão/autenticação
 */
export function isAuthError(error) {
  if (!error) return false;
  
  // Verifica códigos de erro comuns de permissão/autenticação
  const authErrorCodes = [401, 403, 'PGRST116', 'auth-error'];
  
  return (
    (error.code && authErrorCodes.includes(error.code)) ||
    (error.status && authErrorCodes.includes(error.status)) ||
    (error.message && error.message.toLowerCase().includes('permission denied'))
  );
}