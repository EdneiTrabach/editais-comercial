// src/utils/errorHandler.ts
import { supabase } from '@/config/supabase'
import router from '@/router'

export const handleError = (error: any) => {
     console.error('Error:', error)

     if (error?.response?.status === 401) {
          supabase.auth.signOut()
          router.push('/login')
          return 'Sessão expirada. Por favor, faça login novamente.'
     }

     if (error?.response?.data?.message) {
          return error.response.data.message
     }

     return 'Ocorreu um erro inesperado. Tente novamente.'
}