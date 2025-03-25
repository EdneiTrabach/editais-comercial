import { supabase } from '@/lib/supabase'

export function useSystemLog() {
  const logSystemAction = async (dados) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false
      
      const logData = {
        usuario_id: user.id,
        usuario_email: user.email,
        tipo: dados.tipo || 'atualizacao',
        tabela: dados.tabela || 'processos',
        registro_id: dados.registro_id,
        campo_alterado: dados.campo_alterado,
        dados_anteriores: dados.dados_anteriores,
        dados_novos: dados.dados_novos,
        data_hora: new Date().toISOString()
      }
      
      const { error } = await supabase.from('system_logs').insert(logData)
      if (error) throw error
      
      return true
    } catch (error) {
      console.warn('Erro no logging (não crítico):', error)
      return false
    }
  }

  return {
    logSystemAction
  }
}