// src/utils/sessionMonitor.ts
import router from '@/router'
import { supabase } from '@/lib/supabaseClient'

export class SessionMonitor {
     private static readonly SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutos
     private static timer: NodeJS.Timeout

     static startMonitoring(): void {
          this.resetTimer()
          document.addEventListener('mousemove', () => this.resetTimer())
          document.addEventListener('keypress', () => this.resetTimer())
     }

     private static resetTimer(): void {
          if (this.timer) clearTimeout(this.timer)

          this.timer = setTimeout(() => {
               supabase.auth.signOut()
               router.push('/login')
          }, this.SESSION_TIMEOUT)
     }
}

// Uso no App.vue
onMounted(() => {
     SessionMonitor.startMonitoring()
})
function onMounted(callback: () => void): void {
     if (typeof window !== 'undefined') {
          window.addEventListener('DOMContentLoaded', callback)
     }
}
