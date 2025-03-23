<template>
  <div class="sidebar-container">
    <nav class="sidebar" :class="{
      'active': isActive,
      'dark': isDarkMode,
      'pinned': isPinned
    }">
      <div class="sidebar-trigger" @click="toggleSidebar" :title="sidebarTriggerTooltip">
        <span>{{ !isActive ? '▶' : (isPinned ? '📌' : '◀') }}</span>
      </div>

      <div class="sidebar-header">
        <div class="sidebar-logo">
          <img src="/icons/logo-licitacao.svg" alt="Logo" class="logo" />
        </div>
        <div class="sidebar-title">Editais</div>
        <button class="tour-button" @click="startTour" title="Iniciar tour guiado">
          <img src="/icons/question-circle.svg" alt="Tour" class="icon" onerror="this.src='/icons/question.svg'"/>
        </button>
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
          <!-- Novo item de menu para Lances -->
          <li class="sidebar-menu-item">
            <router-link to="/lances" class="sidebar-menu-link">
              <img src="/icons/calculadora.svg" alt="Lances" class="icon" />
              <span class="link-text">Lances</span>
            </router-link>
          </li>

          <li class="sidebar-menu-item">
            <router-link to="/declaracoes" class="sidebar-menu-link">
              <img src="/icons/edicao.svg" alt="Declarações" class="icon" />
              <span class="link-text">Declarações</span>
            </router-link>
          </li>
          
          <li>
            <router-link to="/sistemas" class="sidebar-menu-link" v-slot="{ isActive }">
              <img src="/icons/app.svg" alt="Sistemas" class="icon" />
              <span class="link-text">Sistemas</span>
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
          <li class="sidebar-menu-item">
            <router-link to="/responsaveis" class="sidebar-menu-link" v-slot="{ isActive }"
              :class="{ 'disabled': !isAdmin }" @click.prevent="handleAdminClick">
              <img src="/icons/responsavel.svg" alt="Responsáveis" class="icon" />
              <span class="link-text">Responsáveis</span>
            </router-link>
          </li>
          <li class="sidebar-menu-item">
            <router-link to="/configuracoes" class="sidebar-menu-link" v-slot="{ isActive }"
              :class="{ 'disabled': !isAdmin }" @click.prevent="handleAdminClick">
              <img src="/icons/config-usuario.svg" alt="Administração" class="icon" />
              <span class="link-text">Admin. de Usuários</span>
            </router-link>
          </li>
        </ul>

        <div class="bottom-section">
          <div class="theme-selector">
            <button class="theme-toggle sidebar-menu-link" @click="toggleThemeSelector">
              <img src="/icons/palette.svg" alt="Temas" class="icon" />
              <span class="link-text">Temas</span>
            </button>
            
            <!-- Dropdown de temas -->
            <div class="theme-dropdown" v-if="showThemeSelector">
              <button class="theme-option" @click="setTheme('light')" :class="{ active: currentTheme === 'light' }">
                <div class="theme-preview light-preview"></div>
                <span>Claro</span>
              </button>
              <button class="theme-option" @click="setTheme('dark')" :class="{ active: currentTheme === 'dark' }">
                <div class="theme-preview dark-preview"></div>
                <span>Escuro</span>
              </button>
              <button class="theme-option" @click="setTheme('red')" :class="{ active: currentTheme === 'red' }">
                <div class="theme-preview red-preview"></div>
                <span>Vermelho</span>
              </button>
              <button class="theme-option" @click="setTheme('yellow')" :class="{ active: currentTheme === 'yellow' }">
                <div class="theme-preview yellow-preview"></div>
                <span>Amarelo</span>
              </button>
              <button class="theme-option" @click="setTheme('purple')" :class="{ active: currentTheme === 'purple' }">
                <div class="theme-preview purple-preview"></div>
                <span>Roxo</span>
              </button>
              <button class="theme-option" @click="setTheme('green')" :class="{ active: currentTheme === 'green' }">
                <div class="theme-preview green-preview"></div>
                <span>Verde</span>
              </button>
              <button class="theme-option" @click="setTheme('black')" :class="{ active: currentTheme === 'black' }">
                <div class="theme-preview black-preview"></div>
                <span>Preto</span>
              </button>
              <button class="theme-option" @click="setTheme('pink')" :class="{ active: currentTheme === 'pink' }">
                <div class="theme-preview pink-preview"></div>
                <span>Rosa</span>
              </button>
              <button class="theme-option" @click="setTheme('orange')" :class="{ active: currentTheme === 'orange' }">
                <div class="theme-preview orange-preview"></div>
                <span>Laranja</span>
              </button>
              <button class="theme-option" @click="setTheme('baby-blue')" :class="{ active: currentTheme === 'baby-blue' }">
                <div class="theme-preview baby-blue-preview"></div>
                <span>Azul Bebê</span>
              </button>
            </div>
          </div>

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
    <Shepherd :steps="tourSteps" ref="tourGuide" :showButton="false" />
    <NotificationsPanel 
      v-if="showNotificationsPanel" 
      :show="showNotificationsPanel" 
      @close="showNotificationsPanel = false"
      @count-updated="updateNotificationsCount"
    />
  </div>
</template>

<script src="./TheSidebar.js"></script>
<style src="../assets/styles/TheSidebar.css"></style>