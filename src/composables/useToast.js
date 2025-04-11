import { ref, reactive } from 'vue';

// Criar um estado singleton compartilhado entre todas as instâncias
const toasts = ref([]);
const toastId = ref(0);
const toastHistory = ref(new Map());

export function useToast() {
  // Limite de toasts visíveis simultaneamente
  const maxVisibleToasts = 3;

  const showToast = (message, type = 'success', duration = 5000) => {
    // Limpar todos os toasts existentes com a mesma mensagem, independente do tipo
    const duplicateIndices = toasts.value
      .map((toast, index) => toast.message === message ? index : -1)
      .filter(index => index !== -1)
      .sort((a, b) => b - a); // Ordenar em ordem decrescente para remover de trás para frente

    // Remover todos os duplicados
    duplicateIndices.forEach(index => {
      if (toasts.value[index].timeoutId) {
        clearTimeout(toasts.value[index].timeoutId);
      }
      toasts.value.splice(index, 1);
    });

    // Limitar o número de toasts visíveis
    while (toasts.value.filter(t => t.show).length >= maxVisibleToasts) {
      // Remover o toast mais antigo
      const oldestToast = toasts.value
        .filter(t => t.show)
        .sort((a, b) => a.id - b.id)[0];
      
      if (oldestToast) {
        removeToast(oldestToast.id);
      } else {
        break;
      }
    }
    
    // Verificar histórico recente para evitar spam (últimos 3 segundos)
    const historyKey = `${type}:${message}`;
    const lastShown = toastHistory.value.get(historyKey);
    const now = Date.now();
    
    if (lastShown && (now - lastShown < 3000)) {
      // Apenas atualizar o timestamp no histórico, sem mostrar novo toast
      toastHistory.value.set(historyKey, now);
      return;
    }
    
    // Registrar no histórico
    toastHistory.value.set(historyKey, now);
    
    // Criar e mostrar o toast
    const id = toastId.value++;
    
    const timeoutId = setTimeout(() => {
      removeToast(id);
    }, duration);
    
    toasts.value.push({
      id,
      message,
      type,
      show: true,
      timeoutId
    });
  };

  // Função para remover um toast específico
  const removeToast = (id) => {
    const index = toasts.value.findIndex(toast => toast.id === id);
    if (index > -1) {
      // Limpar o timeout associado
      if (toasts.value[index].timeoutId) {
        clearTimeout(toasts.value[index].timeoutId);
      }
      
      // Esconder com animação primeiro
      toasts.value[index].show = false;
      
      // Remover do array após a animação terminar
      setTimeout(() => {
        const currentIndex = toasts.value.findIndex(toast => toast.id === id);
        if (currentIndex > -1) {
          toasts.value.splice(currentIndex, 1);
        }
      }, 300);
    }
  };

  // Limpar todos os toasts
  const clearToasts = () => {
    // Limpar todos os timeouts primeiro
    toasts.value.forEach(toast => {
      if (toast.timeoutId) {
        clearTimeout(toast.timeoutId);
      }
    });
    
    // Remover todos os toasts
    toasts.value = [];
  };

  return {
    toasts,
    showToast,
    removeToast,
    clearToasts
  };
}
