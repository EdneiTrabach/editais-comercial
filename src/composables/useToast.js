import { ref } from 'vue'

export function useToast() {
  const toast = ref({
    show: false,
    message: '',
    type: 'success', // success, error, warning, info
    timeout: 3000 // tempo em milissegundos
  })

  let toastTimeout = null

  const showToast = (message, type = 'success', timeout = 3000) => {
    // Limpa qualquer toast anterior
    if (toastTimeout) {
      clearTimeout(toastTimeout)
    }

    // Define o novo toast
    toast.value = {
      show: true,
      message,
      type,
      timeout
    }

    // Define o timeout para ocultar
    toastTimeout = setTimeout(() => {
      hideToast()
    }, timeout)
  }

  const hideToast = () => {
    toast.value.show = false
  }

  return {
    toast,
    showToast,
    hideToast
  }
}
