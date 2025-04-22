import { nextTick } from 'vue';

/**
 * Exibe uma mensagem toast
 */
export const showToastMessage = (toastConfig, showToast, message, type = "success") => {
  toastConfig.message = message;
  toastConfig.type = type;
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
};

/**
 * Esconde diálogo de confirmação
 */
export const hideConfirmDialog = (showConfirmDialog) => {
  showConfirmDialog.value = false;
};

/**
 * Redireciona para a tela inicial após acesso negado
 */
export const redirectToHome = (showAccessDeniedModal, router) => {
  showAccessDeniedModal.value = false;
  router.push("/");
};

/**
 * Trata o evento de alteração do sidebar
 */
export const handleSidebarToggle = (expanded, isSidebarExpanded) => {
  console.log("Sidebar toggle:", expanded);
  
  isSidebarExpanded.value = expanded;
  
  nextTick(() => {
    const mainContent = document.querySelector(".main-content");
    if (mainContent) {
      if (expanded) {
        mainContent.classList.remove("expanded");
      } else {
        mainContent.classList.add("expanded");
      }
    }
  });
};

/**
 * Manipula eventos de armazenamento para manter o estado do sidebar sincronizado
 */
export const handleStorage = (event, isSidebarExpanded) => {
  if (event.key === "sidebarState") {
    const newValue = event.newValue === "true";
    if (isSidebarExpanded.value !== newValue) {
      console.log("Sincronizando estado do sidebar do localStorage:", newValue);
      isSidebarExpanded.value = newValue;
      
      nextTick(() => {
        const mainContent = document.querySelector(".main-content");
        if (mainContent) {
          if (newValue) {
            mainContent.classList.remove("expanded");
          } else {
            mainContent.classList.add("expanded");
          }
        }
      });
    }
  }
};