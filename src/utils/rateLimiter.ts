// src/utils/rateLimiter.ts
export class RateLimiter {
     private attempts: Map<string, number[]>
     private maxAttempts: number
     private timeWindow: number
     private static readonly CLEANUP_INTERVAL = 5 * 60 * 1000 // Limpar a cada 5 minutos

     constructor(maxAttempts = 5, timeWindow = 60000) {
          this.attempts = new Map()
          this.maxAttempts = maxAttempts
          this.timeWindow = timeWindow
          setInterval(() => this.cleanup(), RateLimiter.CLEANUP_INTERVAL)
     }

     isRateLimited(key: string): boolean {
          const now = Date.now()
          const userAttempts = this.attempts.get(key) || []

          // Remove tentativas antigas
          const recentAttempts = userAttempts.filter(
               timestamp => now - timestamp < this.timeWindow
          )

          if (recentAttempts.length >= this.maxAttempts) {
               return true
          }

          recentAttempts.push(now)
          this.attempts.set(key, recentAttempts)
          return false
     }

     private cleanup(): void {
          const now = Date.now()
          Array.from(this.attempts.entries()).forEach(([key, attempts]) => {
               const valid = attempts.filter(time => now - time < this.timeWindow)
               if (valid.length === 0) {
                    this.attempts.delete(key)
               } else {
                    this.attempts.set(key, valid)
               }
          })
     }
}

// Uso no login
const rateLimiter = new RateLimiter(5, 60000) // 5 tentativas por minuto

async function handleLogin(request: Request) {
     const userIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '0.0.0.0'
     if (rateLimiter.isRateLimited(userIP.toString())) {
          throw new Error('Too many login attempts. Please try again later.')
     }
     // ... resto do código de login
}