import { ref } from 'vue';

export function useToast() {
  const toasts = ref([]);
  const toastId = ref(0);

  const showToast = (message, type = 'success', duration = 3000) => {
    const id = toastId.value++;
    
    toasts.value.push({
      id,
      message,
      type,
      show: true
    });
    
    setTimeout(() => {
      const index = toasts.value.findIndex(toast => toast.id === id);
      if (index > -1) {
        toasts.value[index].show = false;
        setTimeout(() => {
          toasts.value = toasts.value.filter(toast => toast.id !== id);
        }, 300);
      }
    }, duration);
  };

  return {
    toasts,
    showToast
  };
}
