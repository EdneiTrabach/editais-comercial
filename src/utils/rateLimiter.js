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

export class RateLimiter {
  async isRateLimited(key) {
    try {
      await rateLimiterRedis.consume(key);
      return false;
    } catch (error) {
      return true;
    }
  }

  async resetLimit(key) {
    await rateLimiterRedis.delete(key);
  }
}

// Uso no login
const rateLimiter = new RateLimiter();
async function handleLogin(request) {
    const userIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '0.0.0.0';
    if (await rateLimiter.isRateLimited(userIP.toString())) {
        throw new Error('Too many login attempts. Please try again later.');
    }
    // ... resto do código de login
}
