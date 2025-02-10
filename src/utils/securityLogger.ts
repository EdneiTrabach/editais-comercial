// src/utils/securityLogger.ts
import { supabase } from '../lib/supabaseClient'

interface SecurityEvent {
     type: string
     userId?: string
     ip?: string
     details: any
     timestamp: Date
}

export class SecurityLogger {
     private static async logToServer(event: SecurityEvent) {
          try {
               await supabase
                    .from('security_logs')
                    .insert([event])
          } catch (error) {
               console.error('Failed to log security event:', error)
          }
     }

     static logLoginAttempt(userId: string, success: boolean, ip?: string) {
          this.logToServer({
               type: 'LOGIN_ATTEMPT',
               userId,
               ip,
               details: { success },
               timestamp: new Date()
          })
     }

     static logSuspiciousActivity(details: any, userId?: string) {
          this.logToServer({
               type: 'SUSPICIOUS_ACTIVITY',
               userId,
               details,
               timestamp: new Date()
          })
     }
}