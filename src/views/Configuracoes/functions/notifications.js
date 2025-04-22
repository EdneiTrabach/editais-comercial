import { createNotification } from "@/api/notificationsApi";
import { showToastMessage } from './uiHelpers';

/**
 * Abre o modal para enviar notificação
 */
export const openSendNotificationModal = (selectedUserIds, notificationForm, showSendNotificationModal) => {
  selectedUserIds.value = [];
  notificationForm.value = {
    title: "",
    message: "",
    tipo: "usuario",
    nivel: "medio",
    processo_id: null,
  };
  showSendNotificationModal.value = true;
};

/**
 * Seleciona/desseleciona todos os usuários
 */
export const toggleSelectAllUsers = (event, users, selectedUserIds) => {
  if (event.target.checked) {
    selectedUserIds.value = users.value
      .filter((user) => user.status === "ACTIVE")
      .map((user) => user.id);
  } else {
    selectedUserIds.value = [];
  }
};

/**
 * Seleciona/desseleciona um usuário específico
 */
export const toggleSelectUser = (userId, selectedUserIds) => {
  const index = selectedUserIds.value.indexOf(userId);
  if (index === -1) {
    selectedUserIds.value.push(userId);
  } else {
    selectedUserIds.value.splice(index, 1);
  }
};

/**
 * Envia notificação para usuários selecionados
 */
export const sendNotification = async (selectedUserIds, notificationForm, loading, showSendNotificationModal, toastConfig, showToast) => {
  try {
    loading.value = true;

    if (selectedUserIds.value.length === 0) {
      showToastMessage(toastConfig, showToast, "Selecione pelo menos um usuário", "error");
      return;
    }

    if (!notificationForm.value.title || !notificationForm.value.message) {
      showToastMessage(toastConfig, showToast, "Preencha todos os campos obrigatórios", "error");
      return;
    }

    const result = await createNotification(
      notificationForm.value,
      selectedUserIds.value
    );

    if (result.success) {
      showToastMessage(toastConfig, showToast, "Notificação enviada com sucesso!");
      showSendNotificationModal.value = false;
    } else {
      throw new Error(
        result.error?.message || "Erro ao enviar notificação"
      );
    }
  } catch (error) {
    console.error("Erro ao enviar notificação:", error);
    showToastMessage(toastConfig, showToast, "Erro ao enviar notificação", "error");
  } finally {
    loading.value = false;
  }
};