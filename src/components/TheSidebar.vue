<template>
  <div class="sidebar-container">
    <nav class="sidebar" :class="{ 'collapsed': !isExpanded }">
      <button class="toggle-btn" @click="toggleSidebar">
        {{ isExpanded ? '◀' : '▶' }}
      </button>
      
      <div class="logo-section">
        <img src="/icons/logo-licitacao.svg" alt="Logo" class="logo" />
        <span v-if="isExpanded">Editais</span>
      </div>

      <ul class="nav-links">
        <li>
          <router-link to="/">
            <img src="/icons/home.svg" alt="Home" class="icon" />
            <span v-if="isExpanded" class="link-text">Home</span>
          </router-link>
        </li>
        <li>
          <router-link to="/dashboard">
            <img src="/icons/grafico.svg" alt="Dashboard" class="icon" />
            <span v-if="isExpanded" class="link-text">Dashboard</span>
          </router-link>
        </li>
        <li>
          <router-link to="/usuarios">
            <img src="/icons/add-usuario.svg" alt="Cadastro de Usuário" class="icon" />
            <span v-if="isExpanded" class="link-text">Cadastro de Alunos</span>
          </router-link>
        </li>
        <li>
          <router-link to="/lista-usuarios">
            <img src="/icons/config-usuario.svg" alt="Gestão" class="icon" />
            <span v-if="isExpanded" class="link-text">Gestão de Alunos</span>
          </router-link>
        </li>
        <li>
          <router-link to="/certificados">
            <img src="/icons/certificado.svg" alt="Certificados" class="icon" />
            <span v-if="isExpanded" class="link-text">Certificados</span>
          </router-link>
        </li>
        <li>
          <router-link to="/lista-cursos">
            <img src="/icons/livros.svg" alt="Cursos" class="icon" />
            <span v-if="isExpanded" class="link-text">Cursos</span>
          </router-link>
        </li>
      </ul>

      <div class="logout-section">
        <button @click="handleLogout" class="logout-btn">
          <img src="/icons/logout.svg" alt="Sair" class="icon" />
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
  background-color: #193155;
  color: white;
  height: 100vh;
  width: 250px;
  position: fixed;
  left: 0;
  top: 0;
  transition: all 0.3s ease;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.sidebar.collapsed {
  width: 60px;
}

.toggle-btn {
  position: absolute;
  right: 10px;
  top: 20px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.3s ease;
}

.toggle-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.logo-section {
  padding: 1rem;
  padding-right: 3rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
  width: 30px;
  height: 30px;
}

.nav-links {
  list-style: none;
  padding: 1rem 0;
  margin: 0;
  flex: 1;
}

.nav-links li {
  margin-bottom: 0.5rem;
}

.nav-links a {
  color: white;
  text-decoration: none;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
}

.nav-links a:hover,
.nav-links a.router-link-active {
  background-color: rgba(255, 255, 255, 0.1);
}

.logout-section {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem;
  margin-top: auto;
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-family: 'JetBrains Mono', monospace;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.icon {
  font-size: 1.2rem;
  width: 24px;
  text-align: center;
  filter: brightness(0) invert(1);
}

.link-text {
  white-space: nowrap;
  opacity: 1;
  transition: opacity 0.3s ease;
}

.collapsed .link-text {
  opacity: 0;
  width: 0;
  overflow: hidden;
}

@media (max-width: 768px) {
  .sidebar {
    width: 60px;
  }
  
  .sidebar.collapsed {
    width: 0;
    padding: 0;
  }
  
  .link-text {
    display: none;
  }
  
  .toggle-btn {
    top: 10px;
  }
}
</style>