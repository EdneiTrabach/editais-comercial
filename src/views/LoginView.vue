<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useConnectionManager } from '@/composables/useConnectionManager'
import eyeOffIcon from '/icons/eye-off.svg'
import eyeIcon from '/icons/eye.svg'

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
  // Não tente carregar dados específicos no login
  console.log('Login bem-sucedido')
}

// Use o composable
useConnectionManager(loadData)
</script>

<template>
  <div class="container-login">
    <div class="login-wrapper">
      <div class="login-illustration">
        <img src="/icons/undraw-login.svg" alt="Login Illustration" class="illustration-image">
      </div>

      <div class="card-login">
        <div class="logo-container-login">
          <img src="/icons/logo-licitacao.svg" alt="Logo" class="logo-login">
          <h1>Sistema de Editais Comerciais</h1>
        </div>

        <form class="form-login" @submit.prevent="handleLogin">
          <div class="form-group-login">
            <div class="input-container-login">
              <span class="input-icon-login">
                <img src="/icons/usuario.svg" alt="User" class="icon-black-login">
              </span>
              <input type="email" class="input-login" v-model="email" placeholder=" " required autocomplete="username">
              <label class="label-login">Email</label>
            </div>
            <div v-if="emailError" class="error-message-login">{{ emailError }}</div>
          </div>

          <div class="form-group-login">
            <div class="input-container-login">
              <span class="input-icon-login">
                <img src="/icons/lock.svg" alt="Lock" class="icon-black-login">
              </span>
              <input :type="showPassword ? 'text' : 'password'" class="input-login" v-model="password" placeholder=" "
                required autocomplete="current-password">
              <label class="label-login">Senha</label>
              <span class="toggle-password" @click="showPassword = !showPassword">
                <img :src="showPassword ? eyeOffIcon : eyeIcon" alt="Toggle Password" class="icon-black-login">
              </span>
            </div>
            <div v-if="passwordError" class="error-message-login">{{ passwordError }}</div>
          </div>

          <div class="forgot-password-login">
            <a href="#" class="forgot-link-login" @click.prevent="showResetModal = true">Esqueceu sua senha?</a>
          </div>

          <button type="submit" class="button-login" :disabled="loading">
            {{ loading ? 'Entrando...' : 'Entrar' }}
          </button>
        </form>

        <div class="login-footer">
          <p>© 2024 Sistema de Editais Comerciais</p>
        </div>
      </div>
    </div>

    <!-- Modal de redefinição de senha -->
    <div v-if="showResetModal" class="modal-overlay-login" @click.self="showResetModal = false">
      <div class="modal-content-login">
        <h2 class="modal-title-login">Redefinir senha</h2>
        <form class="reset-form-login" @submit.prevent="handleResetPassword">
          <div class="form-group-login">
            <div class="input-container-login">
              <span class="input-icon-login">
                <img src="/icons/email.svg" alt="Email" class="icon-black-login">
              </span>
              <input type="email" class="input-login" v-model="resetEmail" placeholder=" " required
                autocomplete="email">
              <label class="label-login">Email de recuperação</label>
            </div>
          </div>
          <div class="modal-actions-login">
            <button type="button" class="btn-cancelar-login" @click="showResetModal = false">
              <img src="/icons/fechar.svg" alt="Cancelar" class="icon-white">
              Cancelar
            </button>
            <button type="submit" class="btn-enviar-login" :disabled="resetLoading">
              <img src="/icons/send.svg" alt="Enviar" class="icon-white">
              {{ resetLoading ? 'Enviando...' : 'Enviar' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Toast para mensagens -->
    <div v-if="toast.show" class="toast-login" :class="toast.type" @click="toast.show = false">
      {{ toast.message }}
    </div>
  </div>
</template>

<style src="../assets/styles/LoginView.css"></style>
