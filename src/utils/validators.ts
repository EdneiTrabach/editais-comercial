// src/utils/validators.ts
export const validators = {
     required: (value: any): boolean => {
          return value !== null && value !== undefined && value !== ''
     },

     email: (value: string): boolean => {
          const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          return pattern.test(value)
     },

     minLength: (value: string, min: number): boolean => {
          return value.length >= min
     },

     maxLength: (value: string, max: number): boolean => {
          return value.length <= max
     },

     numeric: (value: string): boolean => {
          return /^\d+$/.test(value)
     },

     alphanumeric: (value: string): boolean => {
          return /^[a-zA-Z0-9]+$/.test(value)
     },

     cpf: (cpf: string): boolean => {
          cpf = cpf.replace(/[^\d]/g, '')
          if (cpf.length !== 11) return false

          let sum = 0
          let remainder

          for (let i = 1; i <= 9; i++) {
               sum += parseInt(cpf.substring(i - 1, i)) * (11 - i)
          }
          remainder = (sum * 10) % 11
          if (remainder === 10 || remainder === 11) remainder = 0
          if (remainder !== parseInt(cpf.substring(9, 10))) return false

          sum = 0
          for (let i = 1; i <= 10; i++) {
               sum += parseInt(cpf.substring(i - 1, i)) * (12 - i)
          }
          remainder = (sum * 10) % 11
          if (remainder === 10 || remainder === 11) remainder = 0
          if (remainder !== parseInt(cpf.substring(10, 11))) return false

          return true
     }
}

// Uso nos componentes
const validate = (field: string, value: any): string[] => {
     const errors: string[] = []

     if (field === 'email' && !validators.email(value)) {
          errors.push('Email inválido')
     }

     if (field === 'password' && !validators.minLength(value, 8)) {
          errors.push('Senha deve ter no mínimo 8 caracteres')
     }

     return errors
}