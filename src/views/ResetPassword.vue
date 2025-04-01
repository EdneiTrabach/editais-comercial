<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'

const route = useRoute()
const router = useRouter()
const newPassword = ref('')
const confirmPassword = ref('')
const error = ref('')
const success = ref(false)
const loading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// Obter o hash da URL
const accessToken = route.hash.replace('#access_token=', '')

const resetPassword = async () => {
  try {
    loading.value = true
    error.value = ''

    if (!newPassword.value || !confirmPassword.value) {
      error.value = 'Todos os campos são obrigatórios'
      return
    }

    if (newPassword.value !== confirmPassword.value) {
      error.value = 'As senhas não conferem'
      return
    }

    if (newPassword.value.length < 8) {
      error.value = 'A senha deve ter no mínimo 8 caracteres'
      return
    }

    const { error: resetError } = await supabase.auth.updateUser({
      password: newPassword.value
    })

    if (resetError) throw resetError

    success.value = true

    setTimeout(() => {
      router.push('/login')
    }, 3000)

  } catch (err) {
    console.error('Erro ao redefinir senha:', err)
    error.value = err.message || 'Erro ao redefinir senha'
  } finally {
    loading.value = false
  }
}

const togglePasswordVisibility = (field) => {
  if (field === 'password') {
    showPassword.value = !showPassword.value
  } else if (field === 'confirm') {
    showConfirmPassword.value = !showConfirmPassword.value
  }
}
</script>

<template>
  <div class="reset-password-container">
    <div class="reset-password-card">
      <div class="reset-password-illustration">
        <img src="/icons/undraw-password-reset.svg" alt="Password Reset" class="illustration-image">
      </div>

      <div class="reset-password-content">
        <div class="logo-container">
          <img src="/icons/logo-licitacao.svg" alt="Logo" class="reset-logo">
          <h1>Redefinição de Senha</h1>
        </div>

        <div v-if="success" class="success-message">
          <img src="/icons/check.svg" alt="Success" class="success-icon">
          <p>Senha atualizada com sucesso!</p>
          <p class="redirect-message">Você será redirecionado para o login em instantes...</p>
        </div>

        <form v-else @submit.prevent="resetPassword" class="reset-form">
          <p class="reset-instruction">Digite sua nova senha para continuar</p>

          <div class="form-group-reset">
            <div class="input-container">
              <span class="input-icon">
                <img src="/icons/lock.svg" alt="Password" class="icon-black">
              </span>
              <input :type="showPassword ? 'text' : 'password'" v-model="newPassword" class="input-reset"
                placeholder=" " required>
              <label class="label-reset">Nova senha</label>
              <span class="toggle-password" @click="togglePasswordVisibility('password')">
                <img :src="showPassword ? '/icons/eye-off.svg' : '/icons/eye.svg'" alt="Toggle Password"
                  class="icon-black">
              </span>
            </div>
          </div>

          <div class="form-group">
            <div class="input-container">
              <span class="input-icon">
                <img src="/icons/check.svg" alt="Confirm Password" class="icon-black">
              </span>
              <input :type="showConfirmPassword ? 'text' : 'password'" v-model="confirmPassword" class="input-reset"
                placeholder=" " required>
              <label class="label-reset">Confirme sua senha</label>
              <span class="toggle-password" @click="togglePasswordVisibility('confirm')">
                <img :src="showConfirmPassword ? '/icons/eye-off.svg' : '/icons/eye.svg'" alt="Toggle Password"
                  class="icon-black">
              </span>
            </div>
          </div>

          <div v-if="error" class="error-message">
            <img src="/icons/error.svg" alt="Error" class="error-icon">
            <span>{{ error }}</span>
          </div>

          <button type="submit" class="button-reset" :disabled="loading">
            <img v-if="!loading" src="/icons/save-fill.svg" alt="Save" class="button-icon">
            <span>{{ loading ? 'Redefinindo...' : 'Redefinir senha' }}</span>
          </button>

          <div class="back-to-login">
            <a href="/login" class="login-link">
              <img src="/icons/arrow-left-line.svg" alt="Back" class="back-icon">
              <span>Voltar para o login</span>
            </a>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style>
.reset-password-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  min-width: 100vw;
  background: linear-gradient(135deg, #551919 0%, #1f2023 100%);
  position: relative;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

.reset-password-card {
  display: flex;
  width: 100%;
  max-width: 900px;
  background-color: #ffffff;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.reset-password-illustration {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #4c020c;
  padding: 40px;
}

.illustration-image {
  width: 100%;
  max-width: 320px;
  height: auto;
}

.reset-password-content {
  flex: 1;
  padding: 40px;
  display: flex;
  flex-direction: column;
}

.logo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
}

.reset-logo {
  width: 200px;
  height: 70px;
  margin-bottom: 16px;
}

.logo-container h1 {
  font-size: 24px;
  color: #193155;
  text-align: center;
  font-weight: 600;
}

.reset-instruction {
  text-align: center;
  color: #666;
  margin-bottom: 24px;
}

.reset-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group-reset {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: .8rem;
  flex: 1;
}

.input-container {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-black {
  width: 20px;
  height: 20px;
}

.input-reset {
  width: 100%;
  padding: 14px 14px 14px 40px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s ease;
}

.input-reset:focus {
  border-color: #193155;
  box-shadow: 0 0 0 3px rgba(25, 49, 85, 0.2);
  outline: none;
}

.input-reset:focus+.label-reset,
.input-reset:not(:placeholder-shown)+.label-reset {
  transform: translateY(-22px) scale(0.85);
  background-color: #fff;
  padding: 0 4px;
  color: #193155;
}

.label-reset {
  position: absolute;
  left: 40px;
  top: 50%;
  transform: translateY(-50%);
  transition: all 0.3s ease;
  pointer-events: none;
  color: #666;
}

.toggle-password {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.button-reset {
  background: linear-gradient(135deg, #193155 0%, #254677 100%);
  color: white;
  padding: 14px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.button-reset:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(25, 49, 85, 0.2);
}

.button-reset:disabled {
  background: #a0aec0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.button-icon {
  width: 20px;
  height: 20px;
  filter: brightness(0) invert(1);
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #fee2e2;
  color: #b91c1c;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
}

.error-icon {
  width: 18px;
  height: 18px;
}

.success-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background-color: #ecfdf5;
  border-radius: 12px;
}

.success-icon {
  width: 60px;
  height: 60px;
  color: #059669;
  margin-bottom: 16px;
}

.success-message p {
  font-size: 18px;
  color: #059669;
  font-weight: 600;
  margin-bottom: 8px;
  text-align: center;
}

.redirect-message {
  font-size: 14px !important;
  color: #666 !important;
  font-weight: normal !important;
}

.back-to-login {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}

.login-link {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #193155;
  text-decoration: none;
  transition: all 0.2s ease;
}

.login-link:hover {
  color: #254677;
  text-decoration: underline;
}

.back-icon {
  width: 16px;
  height: 16px;
}

/* Responsividade */
@media (max-width: 768px) {
  .reset-password-card {
    flex-direction: column;
  }

  .reset-password-illustration {
    padding: 20px;
    max-height: 200px;
  }

  .reset-password-content {
    padding: 30px 20px;
  }
}
</style>