// src/utils/csrf.ts
import axios from 'axios';

// Armazenamento mais seguro
const secureStorage = {
  get: (key: string): string | null => {
    const value = sessionStorage.getItem(key)
    return value ? decodeURIComponent(value) : null
  },
  set: (key: string, value: string): void => {
    sessionStorage.setItem(key, encodeURIComponent(value))
  }
};

// Melhorar geração do token CSRF
export function generateCSRFToken(): string {
  const buffer = new Uint8Array(32)
  crypto.getRandomValues(buffer)
  return Array.from(buffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// Adicionar token nas requisições
axios.interceptors.request.use(config => {
     const token = secureStorage.get('csrf_token')
     if (token) {
          config.headers['X-CSRF-Token'] = token
     }
     return config
})