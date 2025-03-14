// src/utils/rateLimiter.ts
import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'redis';

const redisClient = Redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  enable_offline_queue: false,
});

const rateLimiterRedis = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'login_attempt',
  points: 5, // Número de tentativas
  duration: 60, // Por 1 minuto
  blockDuration: 300, // Bloqueia por 5 minutos após exceder
});

// Implementação de limitador de taxa baseada em memória para front-end
export class RateLimiter {
  constructor(maxAttempts = 5, timeWindow = 300000) { // 5 tentativas em 5 minutos (300000ms)
    this.attempts = new Map();
    this.maxAttempts = maxAttempts;
    this.timeWindow = timeWindow;
  }

  isRateLimited(key) {
    const now = Date.now();
    const userAttempts = this.attempts.get(key) || [];
    
    // Limpa tentativas antigas
    const recentAttempts = userAttempts.filter(timestamp => 
      now - timestamp < this.timeWindow
    );
    
    // Atualiza a lista de tentativas
    if (recentAttempts.length < this.maxAttempts) {
      recentAttempts.push(now);
      this.attempts.set(key, recentAttempts);
      return false;  // Não está limitado
    }
    
    return true;  // Está limitado
  }

  resetLimit(key) {
    this.attempts.delete(key);
  }
  
  // Limpa as tentativas antigas a cada minuto
  startCleanupInterval() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, timestamps] of this.attempts.entries()) {
        const validTimestamps = timestamps.filter(t => now - t < this.timeWindow);
        if (validTimestamps.length === 0) {
          this.attempts.delete(key);
        } else {
          this.attempts.set(key, validTimestamps);
        }
      }
    }, 60000); // A cada minuto
  }
}

// Criar uma instância padrão
const loginLimiter = new RateLimiter(3, 300000); // 3 tentativas em 5 minutos
loginLimiter.startCleanupInterval();

export { loginLimiter };

// Uso no login
const rateLimiter = new RateLimiter();
async function handleLogin(request) {
    const userIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '0.0.0.0';
    if (await rateLimiter.isRateLimited(userIP.toString())) {
        throw new Error('Too many login attempts. Please try again later.');
    }
    // ... resto do código de login
}
