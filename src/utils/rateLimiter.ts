// src/utils/rateLimiter.ts
export class RateLimiter {
     private attempts: Map<string, number[]>
     private maxAttempts: number
     private timeWindow: number

     constructor(maxAttempts = 5, timeWindow = 60000) {
          this.attempts = new Map()
          this.maxAttempts = maxAttempts
          this.timeWindow = timeWindow
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