<template>
  <div class="sidebar-container">
    <nav class="sidebar" :class="{ 'collapsed': !isExpanded }">
      <button class="toggle-btn" @click="toggleSidebar">
        {{ isExpanded ? '◀' : '▶' }}
      </button>

      <div class="logo-container">
        <img src="/icons/logo-licitacao.svg" alt="Logo" class="logo" />
        <span v-if="isExpanded">Editais</span>
      </div>

      <ul class="nav-links">
        <li>
          <router-link to="/processos">
            <img src="/icons/certificado.svg" alt="Processos" class="icon" />
            <span v-if="isExpanded" class="link-text">Processos</span>
          </router-link>
        </li>
        <li>
          <router-link to="/funcionalidades">
            <img src="/icons/configuracoes.svg" alt="Funcionalidades" class="icon" />
            <span v-if="isExpanded" class="link-text">Funcionalidades</span>
          </router-link>
        </li>
        <li>
          <router-link to="/editais">
            <img src="/icons/certificado.svg" alt="Editais" class="icon" />
            <span v-if="isExpanded" class="link-text">Novo Processo</span>
          </router-link>
        </li>
        <li>
          <router-link to="/dashboard">
            <img src="/icons/configuracoes.svg" alt="Dashboard" class="icon" />
            <span v-if="isExpanded" class="link-text">Dashboard</span>
          </router-link>
        </li>
      </ul>

      <div class="logout-section">
        <button @click="handleLogout" class="logout-btn">
          <img src="/icons/sair.svg" alt="Sair" class="icon" />
          <span v-if="isExpanded" class="link-text">Sair</span>
        </button>
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
const isExpanded = ref(true)

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
  isExpanded.value = !isExpanded.value
  // Emite evento para o componente pai
  emit('sidebarToggle', isExpanded.value)
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

onMounted(() => {
  checkAdminStatus()
})
</script>

<style scoped>
.sidebar-container {
  position: relative;
}

.sidebar {
  background: linear-gradient(180deg, #193155 0%, #0f1f35 100%);
  color: white;
  height: 100vh;
  width: 280px;
  position: fixed;
  left: 0;
  top: 0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 10px rgba(0, 0, 0, 0.1);
  padding: 1.5rem 1rem;
}

.sidebar.collapsed {
  width: 80px;
  padding: 1.5rem 0.5rem;
}

.toggle-btn {
  position: absolute;
  right: -15px;
  top: 25px;
  background: #ffffff;
  color: #193155;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.toggle-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
}

.logo-container {
  padding: 0.5rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo {
  width: 35px;
  height: 35px;
  transition: all 0.3s ease;
}

.sidebar.collapsed .logo {
  width: 30px;
  height: 30px;
}

.nav-links {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
}

.nav-links li {
  margin-bottom: 0.75rem;
}

.nav-links a {
  color: #ffffff;
  text-decoration: none;
  padding: 0.9rem 1.2rem;
  display: flex;
  align-items: center;
  gap: 1.2rem;
  transition: all 0.3s ease;
  border-radius: 10px;
  font-weight: 500;
}

.nav-links a:hover,
.nav-links a.router-link-active {
  background: rgba(255, 255, 255, 0.15);
  transform: translateX(5px);
}

.logout-section {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 1rem;
  margin-top: auto;
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 1.2rem;
  padding: 0.9rem 1.2rem;
  background: none;
  border: none;
  color: #ffffff;
  cursor: pointer;
  font-family: 'JetBrains Mono', monospace;
  transition: all 0.3s ease;
  border-radius: 10px;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateX(5px);
}

.icon {
  font-size: 1.3rem;
  width: 24px;
  height: 24px;
  transition: all 0.3s ease;
  filter: brightness(0) invert(1);
  opacity: 0.9;
}

.nav-links a:hover .icon,
.logout-btn:hover .icon {
  opacity: 1;
  transform: scale(1.1);
}

.link-text {
  white-space: nowrap;
  opacity: 1;
  transition: all 0.3s ease;
  font-size: 0.95rem;
  letter-spacing: 0.3px;
}

.collapsed .link-text {
  opacity: 0;
  width: 0;
  overflow: hidden;
}

@media (max-width: 768px) {
  .sidebar {
    width: 70px;
    padding: 1.5rem 0.5rem;
  }

  .sidebar.collapsed {
    width: 0;
    padding: 0;
    opacity: 0;
  }

  .link-text {
    display: none;
  }

  .toggle-btn {
    right: -12px;
    top: 15px;
    width: 25px;
    height: 25px;
    font-size: 12px;
  }

  .logo {
    width: 28px;
    height: 28px;
  }
}
</style>