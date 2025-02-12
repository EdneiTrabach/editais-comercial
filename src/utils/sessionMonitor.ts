// src/utils/sessionMonitor.ts
import router from '@/router'
import { supabase } from '@/lib/supabaseClient'

export class SessionMonitor {
     private static readonly SESSION_TIMEOUT = 15 * 60 * 1000 // Reduzir para 15 minutos
     private static readonly WARN_BEFORE = 60 * 1000 // Avisar 1 minuto antes
     private static timer: NodeJS.Timeout

     static startMonitoring(): void {
          this.resetTimer()
          document.addEventListener('mousemove', () => this.resetTimer())
          document.addEventListener('keypress', () => this.resetTimer())
          window.addEventListener('storage', this.checkStorageChange)
     }

     private static resetTimer(): void {
          if (this.timer) clearTimeout(this.timer)

          this.timer = setTimeout(() => {
               supabase.auth.signOut()
               router.push('/login')
          }, this.SESSION_TIMEOUT)
     }

     private static checkStorageChange(e: StorageEvent): void {
          if (e.key === 'logout') {
               supabase.auth.signOut()
               router.push('/login')
          }
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
