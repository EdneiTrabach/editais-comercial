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
              <input 
                type="email" 
                class="input-login" 
                v-model="email" 
                placeholder=" "
                required
                autocomplete="username"
              >
              <label class="label-login">Email</label>
            </div>
            <div v-if="emailError" class="error-message-login">{{ emailError }}</div>
          </div>
          
          <div class="form-group-login">
            <div class="input-container-login">
              <span class="input-icon-login">
                <img src="/icons/lock.svg" alt="Lock" class="icon-black-login">
              </span>
              <input 
                :type="showPassword ? 'text' : 'password'" 
                class="input-login" 
                v-model="password" 
                placeholder=" "
                required
                autocomplete="current-password"
              >
              <label class="label-login">Senha</label>
              <span 
                class="toggle-password" 
                @click="showPassword = !showPassword"
              >
                <img 
                  :src="showPassword ? '/icons/eye-off.svg' : '/icons/eye.svg'" 
                  alt="Toggle Password" 
                  class="icon-black-login"
                >
              </span>
            </div>
            <div v-if="passwordError" class="error-message-login">{{ passwordError }}</div>
          </div>
          
          <div class="forgot-password-login">
            <a href="#" class="forgot-link-login" @click.prevent="showResetModal = true">Esqueceu sua senha?</a>
          </div>
          
          <button 
            type="submit" 
            class="button-login" 
            :disabled="loading"
          >
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
              <input 
                type="email" 
                class="input-login" 
                v-model="resetEmail" 
                placeholder=" "
                required
                autocomplete="email"
              >
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
    <div 
      v-if="toast.show" 
      class="toast-login" 
      :class="toast.type"
      @click="toast.show = false"
    >
      {{ toast.message }}
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/services/supabase';
import { useSidebarStore } from '@/stores/sidebar';

export default {
  setup() {
    const router = useRouter();
    
    // Usar try/catch para evitar erros se o Pinia não estiver inicializado
    let sidebarStore = null;
    try {
      sidebarStore = useSidebarStore();
    } catch (error) {
      console.warn('SidebarStore não disponível. Isso é esperado em certas situações.');
      // Criar um objeto stub para o caso onde o sidebarStore não está disponível
      sidebarStore = {
        isCollapsed: ref(false),
        isMobileOpen: ref(false),
        toggleSidebar: () => {},
        toggleMobileSidebar: () => {},
        closeMobileSidebar: () => {},
        expandSidebar: () => {},
        collapseSidebar: () => {}
      };
    }

    const email = ref('');
    const password = ref('');
    const loading = ref(false);
    const emailError = ref('');
    const passwordError = ref('');
    const showPassword = ref(false);
    
    // Estado para toast
    const toast = ref({
      show: false,
      message: '',
      type: 'success'
    });
    
    // Estado para modal de resetar senha
    const showResetModal = ref(false);
    const resetEmail = ref('');
    const resetLoading = ref(false);
    
    onMounted(() => {
      // Verificar se o usuário já está logado
      checkUser();
    });
    
    // Verificar se o usuário já está logado
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.push({ name: 'Home' });
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
      }
    };
    
    // Exibir toast
    const showToast = (message, type = 'success') => {
      toast.value = {
        show: true,
        message,
        type
      };
      
      // Esconder o toast após 5 segundos
      setTimeout(() => {
        toast.value.show = false;
      }, 5000);
    };
    
    // Validar email
    const validateEmail = () => {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!regex.test(email.value)) {
        emailError.value = 'Email inválido';
        return false;
      }
      emailError.value = '';
      return true;
    };
    
    // Validar senha
    const validatePassword = () => {
      if (password.value.length < 6) {
        passwordError.value = 'A senha deve ter pelo menos 6 caracteres';
        return false;
      }
      passwordError.value = '';
      return true;
    };
    
    // Tratar login
    const handleLogin = async () => {
      if (!validateEmail() || !validatePassword()) {
        return;
      }
      
      loading.value = true;
      
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.value,
          password: password.value
        });
        
        if (error) {
          showToast(error.message, 'error');
          loading.value = false;
          return;
        }

        if (data?.user) {
          // Buscar dados do perfil do usuário (opcional)
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
          
          if (!profileError && profileData) {
            // Você pode fazer algo com os dados do perfil aqui
            console.log('Perfil do usuário:', profileData);
          }
          
          // Redirecionar para a Home
          router.push({ name: 'Home' });
        }
      } catch (error) {
        showToast('Ocorreu um erro ao fazer login. Por favor, tente novamente.', 'error');
      } finally {
        loading.value = false;
      }
    };
    
    // Tratar resetar senha
    const handleResetPassword = async () => {
      if (!resetEmail.value) {
        showToast('Por favor, insira seu email', 'error');
        return;
      }
      
      resetLoading.value = true;
      
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(
          resetEmail.value,
          { redirectTo: `${import.meta.env.VITE_SUPABASE_REDIRECT_URL || window.location.origin}/reset-password` }
        );
        
        if (error) {
          showToast(error.message, 'error');
          resetLoading.value = false;
          return;
        }
        
        showToast('Link de redefinição de senha enviado para seu email!', 'success');
        showResetModal.value = false;
        resetEmail.value = '';
      } catch (error) {
        showToast('Ocorreu um erro ao solicitar redefinição de senha. Por favor, tente novamente.', 'error');
      } finally {
        resetLoading.value = false;
      }
    };
    
    return {
      email,
      password,
      loading,
      emailError,
      passwordError,
      showPassword,
      toast,
      showResetModal,
      resetEmail,
      resetLoading,
      handleLogin,
      handleResetPassword
    };
  }
};
</script>

<style>
@import '../assets/styles/LoginView.css';
</style>
