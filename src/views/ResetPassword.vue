<template>
  <div class="reset-container">
    <div class="reset-card">
      <h2>Redefinir Senha</h2>
      <form @submit.prevent="handleResetSubmit" class="reset-form">
        <div class="input-container">
          <input 
            type="password" 
            v-model="password"
            placeholder="Nova senha"
            required
          />
        </div>
        <div class="input-container">
          <input 
            type="password" 
            v-model="confirmPassword"
            placeholder="Confirme a senha"
            required
          />
        </div>
        <button type="submit" class="reset-button">
          Redefinir Senha
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'vue-router'

const router = useRouter()
const password = ref('')
const confirmPassword = ref('')

const handleResetSubmit = async () => {
  if (password.value !== confirmPassword.value) {
    alert('As senhas não conferem')
    return
  }

  try {
    const { error } = await supabase.auth.updateUser({
      password: password.value
    })

    if (error) throw error

    alert('Senha atualizada com sucesso!')
    router.push('/login')
  } catch (err) {
    console.error('Erro ao atualizar senha:', err)
    alert('Erro ao atualizar senha')
  }
}
</script>