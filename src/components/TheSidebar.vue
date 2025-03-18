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

<script src="./TheSidebar.js"></script>
<style src="../assets/styles/TheSidebar.css"></style>