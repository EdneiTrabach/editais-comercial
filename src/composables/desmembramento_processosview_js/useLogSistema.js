import { supabase } from '@/lib/supabase'

export function useLogSistema() {
  const logSystemAction = async (dados) => {
    try {
      // Verificar se dados essenciais foram fornecidos
      if (!dados || !dados.registro_id) {
        console.warn('Dados de log incompletos')
        return
      }
      
      // Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.warn('Usuário não autenticado para logging')
        return
      }
      
      // Preparar dados com valores padrão para evitar undefined
      const logData = {
        usuario_id: user.id,
        usuario_email: user.email,
        tipo: dados.tipo || 'atualizacao',
        tabela: dados.tabela || 'processos',
        registro_id: dados.registro_id,
        campo_alterado: dados.campo_alterado || 'status',
        dados_anteriores: dados.dados_anteriores || null,
        dados_novos: dados.dados_novos || null,
        data_hora: new Date().toISOString()
      }
      
      // Inserir log no banco de dados
      try {
        const { error } = await supabase
          .from('system_logs')
          .insert(logData)
          
        if (error && error.message && error.message.includes('does not exist')) {
          console.warn('Tabela system_logs não encontrada. Logging desativado.')
        } else if (error) {
          console.warn('Erro ao inserir log (não crítico):', error.message || 'Erro desconhecido')
        }
      } catch (error) {
        console.warn('Erro no sistema de logging (não crítico):', error && error.message ? error.message : 'Erro desconhecido')
      }
    } catch (error) {
      console.warn('Erro no processo de logging (não crítico):', error && error.message ? error.message : 'Erro desconhecido')
    }
  }
  
  return {
    logSystemAction
  }
}