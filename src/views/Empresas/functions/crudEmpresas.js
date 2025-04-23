import { supabase } from '@/lib/supabase'

/**
 * Carrega a lista de empresas do banco de dados
 * @returns {Promise<{data: Array, error: any}>} Empresas carregadas ou erro
 */
export async function loadEmpresas() {
  try {
    console.log('[DEBUG] Iniciando carregamento de empresas...')
    
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .order('nome')

    if (error) {
      console.error('[DEBUG] Erro retornado pelo Supabase:', error)
      throw error
    }
    
    console.log('[DEBUG] Empresas carregadas:', data?.length || 0)
    return { data, error: null }
  } catch (error) {
    console.error('[DEBUG] Erro ao carregar empresas:', error)
    return { data: [], error: 'Falha ao carregar empresas. Por favor, tente novamente.' }
  }
}

/**
 * Salva uma empresa (cria nova ou atualiza existente)
 * @param {Object} empresaData - Dados da empresa
 * @param {boolean} isEditing - Se está editando uma empresa existente
 * @param {string|null} editingId - ID da empresa em edição
 * @returns {Promise<{success: boolean, error: any, message: string}>} Resultado da operação
 */
export async function saveEmpresa(empresaData, isEditing = false, editingId = null) {
  try {
    // Remove caracteres não numéricos do CNPJ
    const cnpjLimpo = empresaData.cnpj.replace(/[^\d]/g, '')
    
    const dataToSave = {
      nome: empresaData.nome,
      cnpj: cnpjLimpo,
      razao_social: empresaData.razao_social,
      contato: empresaData.contato,
      telefone: empresaData.telefone,
      email: empresaData.email,
      color: empresaData.color,
      updated_at: new Date().toISOString()
    }

    let error

    if (isEditing && editingId) {
      // Atualizar empresa existente
      const result = await supabase
        .from('empresas')
        .update(dataToSave)
        .eq('id', editingId)
      
      error = result.error
      
      if (error) throw error
      return { 
        success: true, 
        error: null, 
        message: 'Empresa atualizada com sucesso!' 
      }
    } else {
      // Inserir nova empresa
      const result = await supabase
        .from('empresas')
        .insert(dataToSave)
      
      error = result.error
      
      if (error) throw error
      return { 
        success: true, 
        error: null, 
        message: 'Empresa cadastrada com sucesso!' 
      }
    }
  } catch (error) {
    console.error('Erro ao salvar empresa:', error)
    
    // Tratamento específico para CNPJ duplicado
    if (error.code === '23505') {
      return { 
        success: false, 
        error, 
        message: 'CNPJ já cadastrado no sistema' 
      }
    }
    
    return { 
      success: false, 
      error, 
      message: 'Erro ao salvar empresa. Por favor, tente novamente.' 
    }
  }
}

/**
 * Verifica se uma empresa tem vinculações antes de excluí-la
 * @param {Object} empresa - Empresa a ser verificada
 * @returns {Promise<{empresa: Object, error: any}>} Empresa com informações de vinculação
 */
export async function checkEmpresaVinculacoes(empresa) {
  try {
    // Verifica se existem dados vinculados
    const { data: vinculacoes, error } = await supabase
      .from('empresa_plataforma_dados')
      .select('id')
      .eq('empresa_id', empresa.id)
    
    if (error) throw error
    
    // Adiciona informações de vinculação à empresa
    return {
      empresa: {
        ...empresa,
        temVinculacoes: vinculacoes && vinculacoes.length > 0,
        qtdVinculacoes: vinculacoes ? vinculacoes.length : 0
      },
      error: null
    }
  } catch (error) {
    console.error('Erro ao verificar vinculações da empresa:', error)
    return { 
      empresa: null, 
      error: 'Erro ao verificar vinculações da empresa' 
    }
  }
}

/**
 * Exclui uma empresa e suas vinculações, se houver
 * @param {Object} empresa - Empresa a ser excluída
 * @returns {Promise<{success: boolean, error: any, message: string}>} Resultado da operação
 */
export async function deleteEmpresa(empresa) {
  try {
    if (empresa.temVinculacoes) {
      // Exclui primeiro as vinculações
      const { error: deleteVinculacoesError } = await supabase
        .from('empresa_plataforma_dados')
        .delete()
        .eq('empresa_id', empresa.id)
      
      if (deleteVinculacoesError) throw deleteVinculacoesError
    }

    // Agora exclui a empresa
    const { error } = await supabase
      .from('empresas')
      .delete()
      .eq('id', empresa.id)

    if (error) throw error
    
    return { 
      success: true, 
      error: null, 
      message: 'Empresa excluída com sucesso!' 
    }
  } catch (error) {
    console.error('Erro ao excluir empresa:', error)
    return { 
      success: false, 
      error, 
      message: error.message || 'Erro ao excluir empresa' 
    }
  }
}