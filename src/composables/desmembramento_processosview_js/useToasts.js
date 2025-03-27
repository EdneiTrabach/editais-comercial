import { ref } from 'vue'

export function useToasts() {
  const toasts = ref([])
  
  const showToast = (message, type = 'success', duration = 3000) => {
    const id = Date.now()
    toasts.value.push({ id, message, type })
    
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, duration)
  }
  
  return {
    toasts,
    showToast
  }
}