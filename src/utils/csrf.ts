// src/utils/csrf.ts
import axios from 'axios';

const secureStorage = {
    get: (key: string): string | null => localStorage.getItem(key),
    set: (key: string, value: string): void => localStorage.setItem(key, value)
};

export function generateCSRFToken(): string {
     return Math.random().toString(36).substring(2)
}

// Adicionar token nas requisições
axios.interceptors.request.use(config => {
     const token = secureStorage.get('csrf_token')
     if (token) {
          config.headers['X-CSRF-Token'] = token
     }
     return config
})