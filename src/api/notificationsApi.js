import { supabase } from '@/lib/supabase';

/**
 * Níveis de prioridade para notificações
 */
export const NOTIFICATION_LEVELS = {
  MUITO_ALTO: 'muito_alto',
  ALTO: 'alto',
  MEDIO: 'medio',
  LEVE: 'leve'
};

/**
 * Cria uma nova notificação e a envia para os destinatários especificados
 * @param {Object} notification Dados da notificação
 * @param {string} notification.title Título da notificação
 * @param {string} notification.message Mensagem da notificação
 * @param {string} notification.tipo Tipo da notificação (processo, sistema, usuario, alerta, prazo, impugnacao)
 * @param {string} notification.nivel Nível de prioridade (muito_alto, alto, medio, leve)
 * @param {string|null} notification.processo_id ID do processo relacionado (opcional)
 * @param {Array<string>} recipientIds IDs dos usuários que receberão a notificação
 * @returns {Promise<Object>} Resultado da operação
 */
export async function createNotification(notification, recipientIds) {
  try {
    // Obter usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    // Configurar nível padrão se não for especificado
    const notificationWithDefaults = {
      ...notification,
      nivel: notification.nivel || NOTIFICATION_LEVELS.MEDIO,
      sender_id: user.id
    };

    // Inserir a notificação
    const { data: newNotification, error: notificationError } = await supabase
      .from('notifications')
      .insert(notificationWithDefaults)
      .select()
      .single();

    if (notificationError) throw notificationError;

    // Criar os destinatários da notificação
    const recipients = recipientIds.map(userId => ({
      notification_id: newNotification.id,
      user_id: userId
    }));

    const { error: recipientsError } = await supabase
      .from('notification_recipients')
      .insert(recipients);

    if (recipientsError) throw recipientsError;

    return { success: true, notification: newNotification };
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    return { success: false, error };
  }
}

/**
 * Busca o número de notificações não lidas do usuário atual
 * @returns {Promise<number>} Número de notificações não lidas
 */
export async function getUnreadNotificationsCount() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count, error } = await supabase
      .from('notification_recipients')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('read', false);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Erro ao buscar contagem de notificações não lidas:', error);
    return 0;
  }
}

/**
 * Marca uma notificação como lida
 * @param {string} recipientId ID do registro na tabela notification_recipients
 * @returns {Promise<Object>} Resultado da operação
 */
export async function markNotificationAsRead(recipientId) {
  try {
    const { error } = await supabase
      .from('notification_recipients')
      .update({
        read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', recipientId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    return { success: false, error };
  }
}

/**
 * Resolve uma notificação
 * @param {string} notificationId ID da notificação
 * @param {string} observation Observação opcional
 * @returns {Promise<Object>} Resultado da operação
 */
export async function resolveNotification(notificationId, observation = '') {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('notifications')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: user.id,
        observation
      })
      .eq('id', notificationId)
      .select();

    if (error) throw error;
    return { success: true, notification: data[0] };
  } catch (error) {
    console.error('Erro ao resolver notificação:', error);
    return { success: false, error };
  }
}
