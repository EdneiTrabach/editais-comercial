import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export function useNotificacoes() {
  const checkPendingNotifications = async () => {
    try {
      // Buscar notificações para hoje
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('notification_schedules')
        .select('*, processos(*)')
        .eq('active', true)
        .gte('next_notification', today + 'T00:00:00')
        .lte('next_notification', today + 'T23:59:59')
      
      if (error) throw error
      
      // Retornar as notificações pendentes
      return data || []
    } catch (error) {
      console.error('Erro ao verificar notificações:', error)
      return []
    }
  }
  
  const processScheduledNotifications = async () => {
    try {
      // Buscar notificações que precisam ser processadas
      const now = new Date()
      const { data, error } = await supabase
        .from('notification_schedules')
        .select('*')
        .eq('active', true)
        .lt('next_notification', now.toISOString())
      
      if (error) throw error
      
      if (!data || data.length === 0) {
        return { success: true, count: 0 }
      }
      
      // Processar cada notificação
      const processedIds = []
      
      for (const notification of data) {
        // Marcar como processada
        const { error: updateError } = await supabase
          .from('notification_schedules')
          .update({ active: false, processed_at: now.toISOString() })
          .eq('id', notification.id)
        
        if (!updateError) {
          processedIds.push(notification.id)
        }
      }
      
      return { success: true, count: processedIds.length }
    } catch (error) {
      console.error('Erro ao processar notificações agendadas:', error)
      return { success: false, error: error.message }
    }
  }
  
  const agendarNotificacao = async ({ processo_id, data, hora, tipo, mensagem }) => {
    try {
      const dataHora = new Date(`${data}T${hora}`)
      
      const notificacaoData = {
        processo_id,
        tipo,
        mensagem,
        data_notificacao: dataHora.toISOString(),
        created_at: new Date().toISOString(),
        active: true
      }
      
      const { error } = await supabase
        .from('notification_schedules')
        .insert(notificacaoData)
      
      if (error) throw error
      
      return { success: true }
    } catch (error) {
      console.error('Erro ao agendar notificação:', error)
      throw error
    }
  }
  
  return {
    checkPendingNotifications,
    processScheduledNotifications,
    agendarNotificacao
  }
}