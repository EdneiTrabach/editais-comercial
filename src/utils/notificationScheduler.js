import { supabase } from '@/lib/supabase';
import { createNotification } from '@/api/notificationsApi';

/**
 * Status que requerem notificações recorrentes
 */
export const RECURRING_NOTIFICATION_STATUS = ['ADIADO', 'SUSPENSO', 'DEMONSTRACAO'];

/**
 * Nível de prioridade para cada tipo de status
 */
const STATUS_PRIORITY_LEVEL = {
  'ADIADO': 'alto',
  'SUSPENSO': 'alto',
  'DEMONSTRACAO': 'medio'
};

/**
 * Mensagens personalizadas para cada tipo de status
 */
const STATUS_MESSAGES = {
  'ADIADO': 'O processo foi ADIADO e tem uma nova data prevista. Não esqueça de se preparar!',
  'SUSPENSO': 'O processo está SUSPENSO. Fique atento a atualizações.',
  'DEMONSTRACAO': 'Demonstração agendada para o processo. Prepare-se adequadamente.'
};

/**
 * Agenda notificações recorrentes para um processo
 * @param {Object} processo - Objeto do processo
 * @param {string} oldStatus - Status anterior do processo (opcional)
 * @returns {Promise<boolean>} - Sucesso da operação
 */
export async function scheduleRecurringNotifications(processo, oldStatus = null) {
  try {
    // Verificar se o status atual requer notificações recorrentes
    if (!RECURRING_NOTIFICATION_STATUS.includes(processo.status)) {
      // Se o status anterior requeria, mas o atual não, cancelar agendamentos
      if (oldStatus && RECURRING_NOTIFICATION_STATUS.includes(oldStatus)) {
        await cancelRecurringNotifications(processo.id);
      }
      return false;
    }

    // Buscar usuários ativos para enviar as notificações
    const { data: activeUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id')
      .eq('status', 'ACTIVE');

    if (usersError) throw usersError;
    if (!activeUsers || activeUsers.length === 0) return false;

    // Verificar se já existe um agendamento para este processo
    const { data: existingSchedules, error: scheduleError } = await supabase
      .from('notification_schedules')
      .select('*')
      .eq('processo_id', processo.id)
      .eq('status', processo.status)
      .eq('active', true);

    if (scheduleError) throw scheduleError;

    // Se já existir, atualizar a próxima data
    if (existingSchedules && existingSchedules.length > 0) {
      // Atualizar a data da próxima notificação para amanhã
      const nextNotificationDate = new Date();
      nextNotificationDate.setDate(nextNotificationDate.getDate() + 1);
      
      const { error: updateError } = await supabase
        .from('notification_schedules')
        .update({
          next_notification: nextNotificationDate.toISOString(),
          last_updated: new Date().toISOString()
        })
        .eq('id', existingSchedules[0].id);

      if (updateError) throw updateError;
    } else {
      // Criar um novo agendamento
      const nextNotificationDate = new Date();
      nextNotificationDate.setDate(nextNotificationDate.getDate() + 1);
      
      const { error: insertError } = await supabase
        .from('notification_schedules')
        .insert({
          processo_id: processo.id,
          status: processo.status,
          created_at: new Date().toISOString(),
          last_updated: new Date().toISOString(),
          next_notification: nextNotificationDate.toISOString(),
          active: true
        });

      if (insertError) throw insertError;
      
      // Enviar a primeira notificação imediatamente
      await sendStatusNotification(processo, activeUsers);
    }

    return true;
  } catch (error) {
    console.error('Erro ao agendar notificações recorrentes:', error);
    return false;
  }
}

/**
 * Cancela notificações recorrentes para um processo
 * @param {string} processoId - ID do processo
 * @returns {Promise<boolean>} - Sucesso da operação
 */
export async function cancelRecurringNotifications(processoId) {
  try {
    const { error } = await supabase
      .from('notification_schedules')
      .update({ active: false })
      .eq('processo_id', processoId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao cancelar notificações recorrentes:', error);
    return false;
  }
}

/**
 * Envia notificação sobre um status específico para todos os usuários
 * @param {Object} processo - Objeto do processo
 * @param {Array} users - Array de objetos de usuário
 * @returns {Promise<boolean>} - Sucesso da operação
 */
export async function sendStatusNotification(processo, users) {
  try {
    const title = `Lembrete: Processo ${processo.numero_processo} (${processo.status})`;
    const message = STATUS_MESSAGES[processo.status] || 
      `O processo ${processo.numero_processo} está com status ${processo.status}. Fique atento!`;
    
    const notification = {
      title,
      message,
      tipo: 'processo',
      nivel: STATUS_PRIORITY_LEVEL[processo.status] || 'medio',
      processo_id: processo.id
    };
    
    const recipientIds = users.map(user => user.id);
    
    const result = await createNotification(notification, recipientIds);
    return result.success;
  } catch (error) {
    console.error('Erro ao enviar notificação de status:', error);
    return false;
  }
}

/**
 * Verifica e envia notificações agendadas para hoje
 * @returns {Promise<{success: boolean, count: number}>} - Resultado da operação
 */
export async function checkAndSendScheduledNotifications() {
  try {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    // Buscar agendamentos para hoje ou anteriores que estejam ativos
    const { data: schedulesToProcess, error: fetchError } = await supabase
      .from('notification_schedules')
      .select(`
        id,
        processo_id,
        status,
        next_notification,
        processo:processo_id (
          id,
          numero_processo,
          orgao,
          status
        )
      `)
      .eq('active', true)
      .lte('next_notification', today.toISOString());

    if (fetchError) throw fetchError;
    if (!schedulesToProcess || schedulesToProcess.length === 0) {
      return { success: true, count: 0 };
    }

    // Buscar usuários ativos
    const { data: activeUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id')
      .eq('status', 'ACTIVE');

    if (usersError) throw usersError;
    if (!activeUsers || activeUsers.length === 0) {
      return { success: false, count: 0 };
    }

    let notificationsSent = 0;

    // Processar cada agendamento
    for (const schedule of schedulesToProcess) {
      // Verificar se o processo ainda tem o mesmo status
      if (schedule.processo && schedule.processo.status === schedule.status) {
        // Enviar a notificação
        const notificationSent = await sendStatusNotification(schedule.processo, activeUsers);
        
        if (notificationSent) {
          notificationsSent++;
          
          // Atualizar a próxima data de notificação (2 dias a partir de hoje)
          const nextNotification = new Date();
          nextNotification.setDate(nextNotification.getDate() + 2);
          
          await supabase
            .from('notification_schedules')
            .update({
              next_notification: nextNotification.toISOString(),
              last_updated: new Date().toISOString()
            })
            .eq('id', schedule.id);
        }
      } else {
        // Desativar agendamento se o status do processo mudou
        await supabase
          .from('notification_schedules')
          .update({ active: false })
          .eq('id', schedule.id);
      }
    }

    return { success: true, count: notificationsSent };
  } catch (error) {
    console.error('Erro ao verificar e enviar notificações agendadas:', error);
    return { success: false, count: 0 };
  }
}
