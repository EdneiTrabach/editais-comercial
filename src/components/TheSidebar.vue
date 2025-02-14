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
          <li class="sidebar-menu-item">
            <router-link to="/relatorios" class="sidebar-menu-link">
              <img src="/icons/check.svg" alt="Relatórios" class="icon" />
              <span class="link-text">Relatórios</span>
            </router-link>
          </li>
          <li v-if="isAdmin" class="sidebar-menu-item">
            <router-link to="/configuracoes" class="sidebar-menu-link">
              <img src="/icons/config-usuario.svg" alt="Administração" class="icon" />
              <span class="link-text">Admin. de Usuários</span>
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
import { ref, onMounted, onUnmounted } from 'vue'
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
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      isAdmin.value = false
      return
    }

    // Buscar perfil do usuário
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (error) {
      // Se o perfil não existir, criar um
      if (error.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            role: 'admin' // ou 'user' dependendo da sua lógica
          })
          .select('role')
          .single()

        if (createError) {
          console.error('Erro ao criar perfil:', createError)
          isAdmin.value = false
          return
        }

        isAdmin.value = newProfile.role === 'admin'
        localStorage.setItem('userRole', newProfile.role)
        return
      }

      console.error('Erro ao verificar perfil:', error)
      isAdmin.value = false
      return
    }

    isAdmin.value = profile?.role === 'admin'
    localStorage.setItem('userRole', profile?.role || '')
  } catch (error) {
    console.error('Erro ao verificar status de admin:', error)
    isAdmin.value = false
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

onMounted(async () => {
  // Primeiro tenta pegar do localStorage para resposta rápida
  const cachedRole = localStorage.getItem('userRole')
  if (cachedRole) {
    isAdmin.value = cachedRole === 'admin'
  }

  // Depois verifica com o servidor
  await checkAdminStatus()
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

import { watch } from 'vue'

// Observar mudanças na autenticação
const unsubscribe = supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN') {
    await checkAdminStatus()
  } else if (event === 'SIGNED_OUT') {
    isAdmin.value = false
    localStorage.removeItem('userRole')
  }
})

// Limpar o listener quando o componente for destruído
onUnmounted(() => {
  unsubscribe.data.subscription.unsubscribe()
})
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
  height: 95%;
  width: 260px;
  background: linear-gradient(180deg, #722F37 0%, #521920 100%); /* Bordô elegante */
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
  background: #722F37; /* Mantém consistente com o sidebar */
}

.sidebar.pinned .sidebar-trigger {
  background: #521920; /* Tom mais escuro quando fixado */
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
  background: linear-gradient(180deg, #461D22 0%, #2D1013 100%); /* Bordô escuro para modo dark */
}

.sidebar.pinned {
  left: 0;
}

.sidebar-trigger {
  position: absolute;
  right: -32px;
  top: 50%;
  transform: translateY(-50%);
  background: #722F37 !important; /* Mesma cor do topo do sidebar */
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
  z-index: 999;
}

.sidebar-trigger:hover {
  background: #8B4B52; /* Tom mais claro para hover */
  width: 40px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 1.5rem;
  position: relative;
}

.sidebar-logo {
  width: 40px;
  height: 40px;
}

.logo {
  width: 90px;
  height: 100%;
}

.sidebar-title {
  color: white;
  font-size: 1.2rem;
  font-weight: 600;
}


/* Ajuste do trigger */
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
  overflow-x: hidden;
  /* Impede scroll horizontal */
  padding-right: 8px;
  /* Aumentado para acomodar a scrollbar */
  padding-left: 0;
  width: 100%;
  /* Garante que ocupe toda a largura disponível */
  margin: 0;
  /* Remove margens */
  scrollbar-width: thin;
  /* Para Firefox */
  scrollbar-color: rgba(255, 255, 255, 0.5) rgba(255, 255, 255, 0.1);
  /* Para Firefox */
}

/* Scrollbar personalizada */
.nav-links::-webkit-scrollbar {
  width: 6px;
  /* Largura da scrollbar */
}

.nav-links::-webkit-scrollbar-track {
  background: rgba(181, 102, 111, 0.1); /* Track em bordô sutil */
  border-radius: 3px;
}

.nav-links::-webkit-scrollbar-thumb {
  background: rgba(181, 102, 111, 0.3); /* Thumb em bordô */
  border-radius: 3px;
  cursor: pointer;
}

/* Hover na scrollbar */
.nav-links::-webkit-scrollbar-thumb:hover {
  background: rgba(181, 102, 111, 0.5); /* Hover em bordô mais forte */
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
  white-space: nowrap;
  /* Evita quebra de texto */
  width: 80%;
  /* Ocupa toda largura disponível */
}

.sidebar-menu-link:hover,
.sidebar-menu-link.router-link-active {
  background: rgba(181, 102, 111, 0.25); /* Bordô transparente para hover */
  border-left: 3px solid #D98E77; /* Detalhe em cobre */
  padding-left: calc(1.2rem - 3px); /* Compensa a borda */
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
  border-radius: 10px;
  border-top: 1px solid rgba(217, 142, 119, 0.2); /* Separador em cobre sutil */
  background: linear-gradient(180deg, rgba(114, 47, 55, 0.95) 0%, rgba(82, 25, 32, 0.95) 100%);
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
  background-color: #D98E77; /* Notificações em cobre */
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
</style>