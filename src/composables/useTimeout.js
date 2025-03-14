import { ref, onUnmounted } from 'vue'

export function useTimeout() {
  const timeouts = ref(new Set())
  
  const setTimeout = (callback, delay) => {
    const id = window.setTimeout(() => {
      timeouts.value.delete(id)
      callback()
    }, delay)
    
    timeouts.value.add(id)
    return id
  }
  
  const clearTimeout = (id) => {
    if (timeouts.value.has(id)) {
      window.clearTimeout(id)
      timeouts.value.delete(id)
    }
  }
  
  const clearAllTimeouts = () => {
    timeouts.value.forEach(id => {
      window.clearTimeout(id)
    })
    timeouts.value.clear()
  }
  
  onUnmounted(() => {
    clearAllTimeouts()
  })
  
  return {
    setTimeout,
    clearTimeout,
    clearAllTimeouts
  }
}