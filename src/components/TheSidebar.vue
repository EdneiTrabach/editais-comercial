<template>
  <div class="sidebar-container">
    <nav class="sidebar" :class="{
      'active': isActive,
      'dark': isDarkMode
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
        </ul>

        <div class="bottom-section">
          <button class="theme-toggle sidebar-menu-link" @click="toggleDarkMode">
            <img :src="isDarkMode ? '/icons/sun.svg' : '/icons/moon.svg'" :alt="isDarkMode ? 'Light Mode' : 'Dark Mode'"
              class="icon" />
            <span class="link-text">{{ isDarkMode ? 'Light Mode' : 'Dark Mode' }}</span>
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
  isActive.value = !isActive.value
  emit('sidebarToggle', isActive.value)
  // Persistir o estado no localStorage
  localStorage.setItem('sidebarState', isActive.value.toString())
  
  // Ajustar margin do main-content
  const mainContents = document.querySelectorAll('.main-content')
  mainContents.forEach(content => {
    content.style.marginLeft = isActive.value ? '260px' : '0'
    content.style.transition = 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  })
}

// Recuperar estado ao montar
onMounted(() => {
  const savedState = localStorage.getItem('sidebarState')
  if (savedState === 'true') {
    isActive.value = true
  }
  checkAdminStatus()
})

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value
  document.body.classList.toggle('dark-mode')
}

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
  emit('sidebarToggle', isPinned.value)
}

// Fechar sidebar quando clicar fora
document.addEventListener('click', (e) => {
  const sidebar = document.querySelector('.sidebar')
  const trigger = document.querySelector('.sidebar-trigger')
  if (sidebar && trigger && !sidebar.contains(e.target) && !trigger.contains(e.target) && !isPinned.value) {
    isActive.value = false
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
.sidebar-container {
  position: relative;
}

.sidebar {
  position: fixed;
  left: -290px;
  top: 0;
  height: 100vh;
  width: 260px; /* Ajustado para 260px para manter consistência */
  background: linear-gradient(180deg, #193155 0%, #0f1f35 100%);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
  padding: 2rem 1rem;
  box-shadow: 5px 0 15px rgba(0, 0, 0, 0.2);
}

.sidebar.active {
  left: 0;
  box-shadow: 5px 0 25px rgba(0, 0, 0, 0.3);
}

/* Remova o hover que expande o sidebar */
.sidebar:hover {
  /* Removido para não expandir no hover */
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
  background: var(--company-red, #193155); /* Cor principal do projeto */
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

.sidebar-menu {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 200px);
  justify-content: space-between;
}

.nav-links {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar-menu-item {
  margin-bottom: 0.5rem;
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

.bottom-section {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 1rem;
  margin-top: auto;
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
</style>