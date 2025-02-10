<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'

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
    .map(() => String.fromCharCode(33 + Math.floor(Math.random() * 94)))
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
    error.value = ''

    if (!email.value || !password.value) {
      error.value = 'Email e senha são obrigatórios'
      return
    }

    const credentials = {
      email: email.value,
      password: password.value
    }

    const { data, error: authError } = await supabase.auth.signInWithPassword(credentials)

    if (authError) {
      console.error('Erro de autenticação:', authError)
      error.value = 'Email ou senha incorretos'
      return
    }

    console.log('Login bem sucedido:', data)
    showToast('Login realizado com sucesso!', 'success')
    await router.push('/processos') // Alterado aqui
  } catch (err) {
    console.error('Erro detalhado:', err)
    error.value = 'Erro ao fazer login'
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

const handleSignUp = async () => {
  try {
    loading.value = true
    error.value = ''

    const signUpData = {
      email: email.value,
      password: 'Flytolive97@',
      options: {
        data: {
          role: 'user'
        }
      }
    }

    const { data, error } = await supabase.auth.signUp(signUpData)

    if (error) {
      console.error('Erro no cadastro:', error)
      error.value = error.message
      return
    }

    // Mostra as credenciais ao usuário
    showToast(`Conta criada! Use o email: ${email.value} e senha: Flytolive97@`, 'success')
    
  } catch (err) {
    console.error('Erro:', err)
    error.value = 'Erro ao criar conta'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <!-- Toast notification -->
    <div v-if="toast.show" :class="['toast', toast.type]">
      {{ toast.message }}
    </div>

    <!-- Matrix Effect -->
    <div class="matrix-effect" v-if="showMatrix">
      <div v-for="i in 50" :key="i" class="matrix-column" :style="{
        left: `${Math.random() * 100}%`,
        animationDuration: `${2 + Math.random() * 3}s`,
        animationDelay: `${Math.random() * 2}s`
      }">
        {{ generateRandomChars() }}
      </div>
    </div>

    <!-- Login Card -->
    <div class="login-card">
      <div class="logo-container">
        <img src="/icons/logo-licitacao.svg" alt="Logo" class="logo" />
        <h1>Conecte-se</h1>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <div class="input-container">
            <span class="input-icon">👤</span>
            <input 
              type="email" 
              v-model="email" 
              required
              placeholder=" "
            />
            <label>Email</label>
          </div>
        </div>

        <div class="form-group">
          <div class="input-container">
            <span class="input-icon">🔒</span>
            <input 
              type="password" 
              v-model="password" 
              required
              placeholder=" "
            />
            <label>Senha</label>
          </div>
          <span v-if="error" class="error-message">{{ error }}</span>
        </div>

        <div class="forgot-password">
          <a href="#" class="forgot-link" @click="handleForgotClick">Esqueci minha senha</a>
        </div>

        <button type="submit" class="login-button" :disabled="loading">
          {{ loading ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>

      <button @click="handleSignUp" class="signup-button" :disabled="loading">
        Criar Conta
      </button>
    </div>

    <!-- Modal de Recuperação de Senha -->
    <div v-if="showForgotModal" class="modal-overlay">
      <div class="modal-content">
        <h2>Recuperação de Senha</h2>
        <form @submit.prevent="handleResetPassword" class="reset-form">
          <div class="form-group">
            <div class="input-container">
              <span class="input-icon">📧</span>
              <input type="email" v-model="resetEmail" placeholder=" " required />
              <label>Email</label>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" @click="showForgotModal = false" class="btn-cancelar">
              Cancelar
            </button>
            <button type="submit" class="btn-enviar" :disabled="loading">
              {{ loading ? 'Enviando...' : 'Enviar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Copie todo o CSS fornecido aqui */
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  min-width: 100vw;  /* Adicionado */
  background: linear-gradient(135deg, #193155 0%, #254677 100%);
  position: relative;
  overflow: hidden;
  margin: 0;         /* Adicionado */
  padding: 0;        /* Adicionado */
}

.icon-black {
  font-size: 1.2rem;
  width: 24px;
  text-align: center;
  filter: invert(1);
}

/* Efeito de grade digital */
.login-container::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: gridMove 20s linear infinite;
  pointer-events: none;
  /* Permite clicar através da camada */
  z-index: 1;
  /* Garante que fique abaixo do card */
}

/* Efeito de pulso tecnológico */
.login-container::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at center,
      rgba(255, 255, 255, 0.1) 0%,
      transparent 60%);
  animation: techPulse 4s ease-in-out infinite;
  pointer-events: none;
  /* Permite clicar através da camada */
  z-index: 1;
  /* Garante que fique abaixo do card */
}

@keyframes gridMove {
  0% {
    transform: translateY(0) scale(1);
  }

  50% {
    transform: translateY(-25px) scale(1.1);
  }

  100% {
    transform: translateY(0) scale(1);
  }
}

@keyframes techPulse {

  0%,
  100% {
    opacity: 0.3;
    transform: scale(1);
  }

  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}

@keyframes backgroundPulse {}

@keyframes digitalMove {}

@keyframes glowPulse {}

/* Card de login com efeito de vidro */
.login-card {
  position: relative;
  z-index: 2;
  /* Garante que o card fique acima dos efeitos */
  background: rgba(255, 255, 255, 0.95);
  padding: 2.5rem;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  width: 90%;        /* Alterado */
  max-width: 400px;
  transition: all 0.3s ease;
  margin: 1rem;      /* Adicionado */
}

.login-card:hover {
  transform: translateY(-5px);
}

/* Efeito de gradiente nos botões */
.login-button {
  background: linear-gradient(135deg, #193155 0%, #254677 100%);
  color: white;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  font-family: 'JetBrains Mono', monospace;
  cursor: pointer;
  transition: all 0.3s ease;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(25, 49, 85, 0.2);
}

.signup-button {
  background: linear-gradient(135deg, #193155 0%, #254677 100%);
  color: white;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  font-family: 'JetBrains Mono', monospace;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
}

.signup-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(25, 49, 85, 0.2);
}

.logo-container {
  text-align: center;
  margin-bottom: 2rem;
}

.logo {
  width: 120px;
  height: auto;
  margin-bottom: 1rem;
  animation: fadeIn 1s ease;
}

.logo-container h1 {
  color: #193155;
  font-size: 1.8rem;
  margin: 0;
  font-weight: 600;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  position: relative;
  margin-bottom: 1.5rem;
}

label {
  position: absolute;
  left: 3rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  background: transparent;
  padding: 0 0.5rem;
  pointer-events: none;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 1rem;
  color: #193155;
  opacity: 0.8;
  z-index: 1;
}

input {
  width: 100%;
  padding: 0.75rem;
  padding-left: 3rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-family: 'JetBrains Mono', monospace;
  transition: all 0.3s ease;
  background: white;
}

/* Efeito de flutuação da label */
input:focus+label,
input:not(:placeholder-shown)+label {
  top: -2rem;
  transform: translateX(-55px);
  font-size: 0.8rem;
  color: #193155;
  /* background: white; */
}

input:focus {
  outline: none;
  border-color: #193155;
  box-shadow: 0 0 0 3px rgba(25, 49, 85, 0.1);
}

input.error {
  border-color: #dc3545;
}

.error-message {
  color: #dc3545;
  font-size: 0.85rem;
}

.forgot-password {
  text-align: right;
}

.forgot-link {
  color: #193155;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.3s ease;
}

.forgot-link:hover {
  color: #254677;
  text-decoration: underline;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .login-card {
    padding: 1.5rem;
  }
}

/* Matrix effect styling */
.matrix-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  z-index: 999;
  animation: matrixFade 0.5s ease-in;
}

.matrix-container::before {
  content: '01';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  color: #00ff00;
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.5rem;
  text-shadow: 0 0 5px #00ff00;
  animation: matrixRain 2s linear infinite;
  pointer-events: none;
}

@keyframes matrixFade {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes matrixRain {
  0% {
    transform: translateY(-100%);
  }

  100% {
    transform: translateY(100%);
  }
}

.matrix-effect {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  z-index: 999;
  overflow: hidden;
}

.matrix-column {
  position: absolute;
  top: -100%;
  color: rgb(0, 255, 0);
  font-family: 'Courier New', monospace;
  font-size: 1.2rem;
  line-height: 2em;
  white-space: pre;
  text-shadow: 0 0 8px rgba(125, 129, 125, 0.8);
  animation: matrix-rain linear infinite;
}

@keyframes matrix-rain {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }

  to {
    transform: translateY(100vh);
    opacity: 0;
  }
}

/* Adicione estes estilos */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
}

.reset-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.recaptcha-container {
  display: flex;
  justify-content: center;
  margin: 1rem 0;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

.btn-cancelar,
.btn-enviar {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cancelar {
  background-color: #6c757d;
  color: white;
}

.btn-enviar {
  background-color: #193155;
  color: white;
}

.btn-enviar:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 1rem 2rem;
  border-radius: 8px;
  color: white;
  z-index: 9999;
  animation: slideIn 0.3s ease-out;
}

.toast.success {
  background: linear-gradient(135deg, #28a745 0%, #218838 100%);
}

.toast.error {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

/* Modal Content */
.modal-content {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;
}

.modal-content h2 {
  color: #193155;
  font-size: 1.5rem;
  margin-bottom: 3rem;
  font-weight: 600;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e4e8;
}

/* Form Styling */
.form-group {
  margin-bottom: 1.5rem;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 1rem;
  color: #193155;
  opacity: 0.8;
  z-index: 1;
}

input {
  width: 100%;
  padding: 0.75rem;
  padding-left: 3rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-family: 'JetBrains Mono', monospace;
  transition: all 0.3s ease;
}

input:focus {
  outline: none;
  border-color: #193155;
  box-shadow: 0 0 0 3px rgba(25, 49, 85, 0.1);
}

/* Modal Actions */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 0rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e0e4e8;
}

.btn-cancelar,
.btn-enviar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cancelar {
  background-color: #6c757d;
  color: white;
}

.btn-enviar {
  background-color: #193155;
  color: white;
}

.btn-cancelar:hover,
.btn-enviar:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.btn-cancelar:hover {
  background-color: #5a6268;
}

.btn-enviar:hover {
  background-color: #254677;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Responsiveness */
@media (max-width: 768px) {
  .modal-content {
    padding: 1.5rem;
    width: 95%;
  }

  .modal-actions {
    flex-direction: column;
    gap: 0.5rem;
  }

  .btn-cancelar,
  .btn-enviar {
    width: 100%;
    justify-content: center;
  }
}

</style>
