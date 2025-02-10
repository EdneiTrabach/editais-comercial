// src/utils/securityLogger.ts
import { supabase } from '../lib/supabaseClient';
export class SecurityLogger {
    static async logToServer(event) {
        try {
            await supabase
                .from('security_logs')
                .insert([event]);
        }
        catch (error) {
            console.error('Failed to log security event:', error);
        }
    }
    static logLoginAttempt(userId, success, ip) {
        this.logToServer({
            type: 'LOGIN_ATTEMPT',
            userId,
            ip,
            details: { success },
            timestamp: new Date()
        });
    }
    static logSuspiciousActivity(details, userId) {
        this.logToServer({
            type: 'SUSPICIOUS_ACTIVITY',
            userId,
            details,
            timestamp: new Date()
        });
    }
}
