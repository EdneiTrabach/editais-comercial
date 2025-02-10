// src/utils/sessionMonitor.ts
import router from '@/router';
import { supabase } from '@/lib/supabaseClient';
export class SessionMonitor {
    static SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos
    static timer;
    static startMonitoring() {
        this.resetTimer();
        document.addEventListener('mousemove', () => this.resetTimer());
        document.addEventListener('keypress', () => this.resetTimer());
    }
    static resetTimer() {
        if (this.timer)
            clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            supabase.auth.signOut();
            router.push('/login');
        }, this.SESSION_TIMEOUT);
    }
}
// Uso no App.vue
onMounted(() => {
    SessionMonitor.startMonitoring();
});
function onMounted(callback) {
    if (typeof window !== 'undefined') {
        window.addEventListener('DOMContentLoaded', callback);
    }
}
