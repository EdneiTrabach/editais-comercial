<template>
  <div class="sidebar-container">
    <nav class="sidebar" :class="{
      'active': isActive,
      'dark': isDarkMode,
      'pinned': isPinned
    }">
      <div class="sidebar-trigger" @click="toggleSidebar">
        <span>{{ isActive ? '◀' : '▶' }}</span>
      </div>

      <div class="sidebar-header">
        <div class="sidebar-logo">
          <img src="/icons/logo-licitacao.svg" alt="Logo" class="logo" />
        </div>
        <div class="sidebar-title">Editais</div>
      </div>

      <div class="sidebar-menu">
        <ul class="nav-links">
          <li class="sidebar-menu-item">
            <router-link to="/processos" class="sidebar-menu-link">
              <img src="/icons/pasta.svg" alt="Processos" class="icon" />
              <span class="link-text">Processos</span>
            </router-link>
          </li>
          <li class="sidebar-menu-item">
            <router-link to="/funcionalidades" class="sidebar-menu-link">
              <img src="/icons/configuracoes.svg" alt="Funcionalidades" class="icon" />
              <span class="link-text">Funcionalidades</span>
            </router-link>
          </li>
          <li class="sidebar-menu-item">
            <router-link to="/editais" class="sidebar-menu-link">
              <img src="/icons/nova-pasta.svg" alt="Editais" class="icon" />
              <span class="link-text">Novo Processo</span>
            </router-link>
          </li>
          <li class="sidebar-menu-item">
            <router-link to="/dashboard" class="sidebar-menu-link">
              <img src="/icons/grafico.svg" alt="Dashboard" class="icon" />
              <span class="link-text">Dashboard</span>
            </router-link>
          </li>
          <li class="sidebar-menu-item">
            <router-link to="/representantes" class="sidebar-menu-link">
              <img src="/icons/cartao-usuario.svg" alt="Representantes" class="icon" />
              <span class="link-text">Representantes</span>
            </router-link>
          </li>
          <li class="sidebar-menu-item">
            <router-link to="/plataformas" class="sidebar-menu-link">
              <img src="/icons/links.svg" alt="Plataformas" class="icon" />
              <span class="link-text">Plataformas</span>
            </router-link>
          </li>
          <li class="sidebar-menu-item">
            <router-link to="/empresas" class="sidebar-menu-link">
              <img src="/icons/empresa.svg" alt="Empresas" class="icon" />
              <span class="link-text">Empresas</span>
            </router-link>
          </li>
        </ul>

        <div class="bottom-section">
          <button class="theme-toggle sidebar-menu-link" @click="toggleDarkMode">
            <img :src="isDarkMode ? '/icons/sun.svg' : '/icons/moon.svg'" :alt="isDarkMode ? 'Light Mode' : 'Dark Mode'"
              class="icon" />
            <span class="link-text">{{ isDarkMode ? 'Light Mode' : 'Dark Mode' }}</span>
          </button>

          <!-- Novo botão de notificações -->
          <button class="notifications-btn sidebar-menu-link" @click="toggleNotifications">
            <div class="notification-icon-wrapper">
              <img src="/icons/bell.svg" alt="Notificações" class="icon" />
              <span v-if="unreadNotifications" class="notification-badge">{{ unreadNotifications }}</span>
            </div>
            <span class="link-text">Notificações</span>
          </button>

          <button @click="handleLogout" class="logout-btn sidebar-menu-link">
            <img src="/icons/sair.svg" alt="Sair" class="icon" />
            <span class="link-text">Sair</span>
          </button>
        </div>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'

const emit = defineEmits(['sidebarToggle'])

const router = useRouter()
const isAdmin = ref(false)
const isActive = ref(false)
const isDarkMode = ref(false)
const isPinned = ref(false) // Novo estado para controlar se está fixado
const unreadNotifications = ref(0)

const checkAdminStatus = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    isAdmin.value = profile?.role === 'admin'
  }
}

const toggleSidebar = () => {
  if (isActive.value) {
    // Se já está ativo, alterna entre fixo e não fixo
    isPinned.value = !isPinned.value
    if (!isPinned.value) {
      // Se desafixou, fecha o sidebar
      isActive.value = false
    }
  } else {
    // Se não está ativo, expande o sidebar
    isActive.value = true
    isPinned.value = false
  }
  
  emit('sidebarToggle', isActive.value)
  localStorage.setItem('sidebarState', isActive.value.toString())
  localStorage.setItem('sidebarPinned', isPinned.value.toString())
  
  adjustMainContent()
}

// Nova função para ajustar o main-content
const adjustMainContent = () => {
  const mainContents = document.querySelectorAll('.main-content')
  mainContents.forEach(content => {
    if (isActive.value || isPinned.value) {
      content.style.marginLeft = '330px'
    } else {
      content.style.marginLeft = '0'
    }
    content.style.transition = 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  })
}

// Recuperar estado ao montar
onMounted(() => {
  const savedState = localStorage.getItem('sidebarState')
  const savedPinned = localStorage.getItem('sidebarPinned')
  
  if (savedState === 'true') {
    isActive.value = true
  }
  if (savedPinned === 'true') {
    isPinned.value = true
  }
  
  adjustMainContent()
  checkAdminStatus()
  checkNotifications()
})

const toggleDarkMode = () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
  document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark')
  localStorage.setItem('theme', isDark ? 'light' : 'dark')
}

// Recuperar preferência salva
onMounted(() => {
  const savedTheme = localStorage.getItem('theme') || 'light'
  document.documentElement.setAttribute('data-theme', savedTheme)
})

const handleLogout = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    localStorage.clear()
    await router.push('/login')
  } catch (error) {
    console.error('Erro ao fazer logout:', error)
    alert('Erro ao sair do sistema. Tente novamente.')
  }
}

const togglePin = () => {
  isPinned.value = !isPinned.value
  if (isPinned.value) {
    isActive.value = true
  }
  adjustMainContent()
  emit('sidebarToggle', isPinned.value)
}

const toggleNotifications = () => {
  // Aqui você pode adicionar a lógica para abrir/fechar o painel de notificações
  console.log('Toggle notifications')
}

// Adicione esta função para buscar notificações
const checkNotifications = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data, error } = await supabase
        .from('notifications')
        .select('count')
        .eq('user_id', user.id)
        .eq('read', false)
        .single()

      if (error) throw error
      unreadNotifications.value = data?.count || 0
    }
  } catch (error) {
    console.error('Erro ao buscar notificações:', error)
  }
}

// Fechar sidebar quando clicar fora
document.addEventListener('click', (e) => {
  const sidebar = document.querySelector('.sidebar')
  const trigger = document.querySelector('.sidebar-trigger')
  
  if (sidebar && trigger && 
      !sidebar.contains(e.target) && 
      !trigger.contains(e.target)) {
    if (!isPinned.value) {
      // Só fecha se não estiver fixo
      isActive.value = false
      adjustMainContent()
    }
  }
})

// Fechar sidebar com ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !isPinned.value) {
    isActive.value = false
  }
})

const handleSidebarToggle = (isExpanded) => {
  // Ajustar classe do main-content
  const mainContent = document.querySelector('.main-content')
  if (mainContent) {
    mainContent.style.marginLeft = isExpanded ? '260px' : '0'
  }
}
</script>

<style scoped>
/* Reset e container */
.sidebar-container {
  position: relative;
  height: 100%;
  min-height: 100vh;
}

/* Sidebar principal */
.sidebar {
  position: fixed;
  left: -330px;
  top: 0;
  height: 100vh;
  width: 260px;
  background: linear-gradient(180deg, #193155 0%, #0f1f35 100%);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
  padding: 2rem 1rem;
  box-shadow: 5px 0 15px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
}

.sidebar.active,
.sidebar.pinned {
  left: 0;
  box-shadow: 5px 0 25px rgba(0, 0, 0, 0.3);
}

/* Modifique a visibilidade do trigger */
.sidebar.active:not(.pinned) .sidebar-trigger {
  background: #1f2937;
}

.sidebar.pinned .sidebar-trigger {
  background: var(--company-red, #193155);
}

/* Ajuste main-content */
:deep(.main-content) {
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-left: 0;
}

:deep(.main-content.expanded) {
  margin-left: 260px;
}

@media (min-width: 1536px) {
  :deep(.main-content.expanded) {
    margin-left: 280px;
  }
}

.sidebar.dark {
  background: linear-gradient(180deg, #111827 0%, #1f2937 100%);
}

.sidebar.pinned {
  left: 0;
}

.sidebar-trigger {
  position: absolute;
  right: -32px;
  top: 50%;
  transform: translateY(-50%);
  background: var(--company-red, #193155);
  width: 35px;
  height: 75px;
  border-radius: 0 8px 8px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  font-size: 1.2rem;
  transition: all 0.3s ease;
}

.sidebar-trigger:hover {
  background: #1f2937;
  width: 40px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 2rem;
  position: relative;
}

.sidebar-logo {
  width: 40px;
  height: 40px;
}

.logo {
  width: 100%;
  height: 100%;
}

.sidebar-title {
  color: white;
  font-size: 1.2rem;
  font-weight: 600;
}

.pin-icon {
  width: 20px;
  height: 20px;
  opacity: 0.7;
  transition: all 0.3s ease;
}

/* Ajuste do menu para scroll */
.sidebar-menu {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  /* Importante para permitir scroll */
  overflow-y: auto;
}

.nav-links {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden; /* Impede scroll horizontal */
  padding-right: 4px;
  padding-left: 0;
  width: 100%; /* Garante que ocupe toda a largura disponível */
  margin: 0; /* Remove margens */
}

/* Scrollbar personalizada */
.nav-links::-webkit-scrollbar {
  width: 4px;
}

.nav-links::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
}

.nav-links::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.sidebar-menu-item {
  margin-bottom: 0.5rem;
  list-style-type: none;
  /* Garante que não haja marcadores */

}

.sidebar-menu-link {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem 1.2rem;
  color: white;
  text-decoration: none;
  border-radius: 10px;
  transition: all 0.3s ease;
  white-space: nowrap; /* Evita quebra de texto */
  width: 80%; /* Ocupa toda largura disponível */
}

.sidebar-menu-link:hover,
.sidebar-menu-link.router-link-active {
  background: rgba(255, 255, 255, 0.15);
  transform: translateX(5px);
}

.icon {
  width: 24px;
  height: 24px;
  filter: brightness(0) invert(1);
  opacity: 0.9;
}

/* Bottom section sempre visível */
.bottom-section {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: inherit;
}

.theme-toggle,
.logout-btn {
  width: 100%;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
}

.notification-icon-wrapper {
  position: relative;
  display: inline-flex;
}

.notification-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: #dc2626;
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 0.75rem;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notifications-btn {
  width: 100%;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
}

/* Media queries ajustadas */
@media (min-width: 1536px) {
  .sidebar {
    width: 280px;
    /* Aumenta levemente a largura */
    padding: 2rem 1.5rem;
    /* Mais espaço interno */
  }

  .sidebar-menu-link {
    padding: 1rem 1.4rem;
    /* Mais espaço para itens */
  }

  .icon {
    width: 26px;
    /* Ícones um pouco maiores */
    height: 26px;
  }
}

@media (max-width: 768px) {
  .sidebar {
    width: 70px;
    padding: 1.5rem 0.5rem;
  }

  .sidebar-trigger {
    display: none;
  }

  .link-text,
  .sidebar-title {
    display: none;
  }

  .sidebar-logo {
    width: 30px;
    height: 30px;
  }
}

.sidebar.pinned {
  left: 0;
}

/* Ajuste do trigger quando pinado */
.sidebar.pinned .sidebar-trigger {
  display: none;
}
</style>