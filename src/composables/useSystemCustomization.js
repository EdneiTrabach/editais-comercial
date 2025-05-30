import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export function useSystemCustomization() {
  const processando = ref(false)
  const erro = ref(null)
  
  /**
   * Cria um setor para sistemas personalizados se não existir
   */
  const criarSetorPersonalizado = async () => {
    const NOME_SETOR = 'SISTEMA PERSONALIZADO PARA ANALISE'
    
    try {
      processando.value = true
      
      // Verificar se já existe
      const { data, error } = await supabase
        .from('setores')
        .select('id')
        .ilike('nome', NOME_SETOR)
        .maybeSingle()
        
      if (error) throw error
      
      // Se não existir, criar
      if (!data) {
        const { error: errorInsert } = await supabase
          .from('setores')
          .insert({
            nome: NOME_SETOR,
            created_at: new Date().toISOString()
          })
          
        if (errorInsert) throw errorInsert
      }
      
      return { success: true, message: 'Setor verificado/criado com sucesso' }
    } catch (e) {
      erro.value = e.message || 'Erro ao criar setor personalizado'
      return { success: false, message: erro.value }
    } finally {
      processando.value = false
    }
  }
  
  /**
   * Atualiza sistemas personalizados para terem o setor correto
   */
  const atualizarSistemasPersonalizados = async () => {
    try {
      processando.value = true
      
      // Primeiro garantir que o setor existe
      const resultado = await criarSetorPersonalizado()
      if (!resultado.success) {
        return resultado
      }
      
      // Buscar o ID do setor
      const { data: setorData, error: setorError } = await supabase
        .from('setores')
        .select('id')
        .ilike('nome', 'SISTEMA PERSONALIZADO PARA ANALISE')
        .single()
        
      if (setorError) throw setorError
      
      // Atualizar todos os sistemas com status CUSTOM
      const { data: sistemasAtualizados, error: updateError } = await supabase
        .from('sistemas')
        .update({
          setor_id: setorData.id,
          updated_at: new Date().toISOString()
        })
        .eq('status', 'CUSTOM')
        .is('setor_id', null)
        
      if (updateError) throw updateError
      
      return { 
        success: true, 
        message: 'Sistemas personalizados atualizados com sucesso',
        count: sistemasAtualizados?.length || 0
      }
    } catch (e) {
      erro.value = e.message || 'Erro ao atualizar sistemas personalizados'
      return { success: false, message: erro.value }
    } finally {
      processando.value = false
    }
  }
  
  /**
   * Configura automaticamente um novo sistema personalizado
   */
  const configurarSistemaPersonalizado = async (sistemaId, nome = 'Novo Item') => {
    try {
      processando.value = true
      
      // Garantir que o setor existe
      const resultado = await criarSetorPersonalizado()
      if (!resultado.success) {
        return resultado
      }
      
      // Buscar o ID do setor
      const { data: setorData, error: setorError } = await supabase
        .from('setores')
        .select('id')
        .ilike('nome', 'SISTEMA PERSONALIZADO PARA ANALISE')
        .single()
        
      if (setorError) throw setorError
      
      // Atualizar o sistema específico
      const { error: updateError } = await supabase
        .from('sistemas')
        .update({
          setor_id: setorData.id,
          nome: nome || 'Novo Item (Personalizado)',
          status: 'CUSTOM',
          updated_at: new Date().toISOString()
        })
        .eq('id', sistemaId)
        
      if (updateError) throw updateError
      
      return { success: true, message: 'Sistema personalizado configurado com sucesso' }
    } catch (e) {
      erro.value = e.message || 'Erro ao configurar sistema personalizado'
      return { success: false, message: erro.value }
    } finally {
      processando.value = false
    }
  }
  
  return {
    processando,
    erro,
    criarSetorPersonalizado,
    atualizarSistemasPersonalizados,
    configurarSistemaPersonalizado
  }
}
