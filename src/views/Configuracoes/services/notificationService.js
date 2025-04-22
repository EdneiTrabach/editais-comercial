import { createNotification } from "@/api/notificationsApi";

/**
 * Gerencia operações relacionadas às notificações
 */
export const notificationService = {
  /**
   * Cria uma nova notificação
   */
  async createNotification(notificationData, userIds) {
    try {
      const result = await createNotification(notificationData, userIds);
      return result;
    } catch (error) {
      console.error("Erro ao criar notificação:", error);
      return { success: false, error };
    }
  }
};