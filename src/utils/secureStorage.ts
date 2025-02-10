// src/utils/secureStorage.ts
import CryptoJS from 'crypto-js'

const SECRET_KEY = import.meta.env.VITE_STORAGE_KEY

export const secureStorage = {
     set(key: string, value: any): void {
          const encrypted = CryptoJS.AES.encrypt(
               JSON.stringify(value),
               SECRET_KEY
          ).toString()
          localStorage.setItem(key, encrypted)
     },

     get(key: string): any {
          const encrypted = localStorage.getItem(key)
          if (!encrypted) return null

          try {
               const decrypted = CryptoJS.AES.decrypt(encrypted, SECRET_KEY)
               return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8))
          } catch {
               return null
          }
     },

     remove(key: string): void {
          localStorage.removeItem(key)
     }
}