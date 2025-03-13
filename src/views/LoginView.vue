<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useConnectionManager } from '@/composables/useConnectionManager'

const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')
const showMatrix = ref(false)
const loading = ref(false)
const showForgotModal = ref(false)
const resetEmail = ref('')

const toast = ref({
  show: false,
  message: '',
  type: 'success'
})

const generateRandomChars = () => {
  return Array(20).fill(0)
    .map(() => String.fromCharCode(33 + Math.random() * 94))
    .join('')
}

const showToast = (message, type = 'success') => {
  toast.value = {
    show: true,
    message,
    type
  }
  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

const handleLogin = async () => {
  try {
    loading.value = true
    
    if (!email.value || !password.value) {
      error.value = 'Email e senha são obrigatórios'
      return
    }

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value
    })

    if (authError) throw authError

    if (data) {
      console.log('✅ Login bem sucedido:', {
        email: email.value,
        userId: data.user.id
      })

      // Buscar perfil para confirmar role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profileError) {
        console.error('Erro ao buscar perfil:', profileError)
      } else {
        localStorage.setItem('userRole', profile?.role || '')
        console.log('Role definida:', profile?.role)
      }

      await router.push('/processos')
    }
  } catch (err) {
    console.error('❌ Erro no login:', err)
    error.value = 'Email ou senha incorretos'
  } finally {
    loading.value = false
  }
}

const handleForgotClick = (e) => {
  e.preventDefault()
  showForgotModal.value = true
}

const handleResetPassword = async () => {
  try {
    loading.value = true

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.value, {
      redirectTo: import.meta.env.VITE_SUPABASE_REDIRECT_URL
    })

    if (error) throw error
    showForgotModal.value = false
    showToast('Email de recuperação enviado com sucesso!', 'success')
  } catch (err) {
    showToast('Erro ao enviar email: ' + err.message, 'error')
  } finally {
    loading.value = false
  }
}

const loadData = async () => {
  await loadProcessos() // ou qualquer outra função que carregue seus dados
}

// Use o composable
useConnectionManager(loadData)
</script>

<template>
  <div class="container-login">
    <!-- Toast notification -->
    <div v-if="toast.show" :class="['toast-login', toast.type]">
      {{ toast.message }}
    </div>

    <!-- Matrix Effect -->
    <div class="matrix-effect-login" v-if="showMatrix">
      <div v-for="i in 50" :key="i" class="matrix-column-login" :style="{
        left: `${Math.random() * 100}%`,
        animationDuration: `${2 + Math.random() * 3}s`,
        animationDelay: `${Math.random() * 2}s`
      }">
        {{ generateRandomChars() }}
      </div>
    </div>

    <!-- Login Card -->
    <div class="card-login">
      <div class="logo-container-login">
        <img src="/icons/logo-licitacao.svg" alt="Logo" class="logo-login" />
        <h1>Conecte-se</h1>
      </div>

      <form @submit.prevent="handleLogin" class="form-login">
        <div class="form-group-login">
          <div class="input-container-login">
            <span class="input-icon-login">👤</span>
            <input 
              type="email" 
              v-model="email" 
              required
              placeholder=" "
              class="input-login"
            />
            <label class="label-login">Email</label>
          </div>
        </div>

        <div class="form-group-login">
          <div class="input-container-login">
            <span class="input-icon-login">🔒</span>
            <input 
              type="password" 
              v-model="password" 
              required
              placeholder=" "
              class="input-login"
            />
            <label class="label-login">Senha</label>
          </div>
          <span v-if="error" class="error-message-login">{{ error }}</span>
        </div>

        <div class="forgot-password-login">
          <a href="#" class="forgot-link-login" @click="handleForgotClick">Esqueci minha senha</a>
        </div>

        <button type="submit" class="button-login" :disabled="loading">
          {{ loading ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>
    </div>

    <!-- Modal de Recuperação de Senha -->
    <div v-if="showForgotModal" class="modal-overlay-login">
      <div class="modal-content-login">
        <h2 class="modal-title-login">Recuperação de Senha</h2>
        <form @submit.prevent="handleResetPassword" class="reset-form-login">
          <div class="form-group-login">
            <div class="input-container-login">
              <span class="input-icon-login">📧</span>
              <input type="email" v-model="resetEmail" placeholder=" " required class="input-login" />
              <label class="label-login">Email</label>
            </div>
          </div>

          <div class="modal-actions-login">
            <button type="button" @click="showForgotModal = false" class="btn-cancelar-login">
              Cancelar
            </button>
            <button type="submit" class="btn-enviar-login" :disabled="loading">
              {{ loading ? 'Enviando...' : 'Enviar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style src="../assets/styles/LoginView.css"></style>
