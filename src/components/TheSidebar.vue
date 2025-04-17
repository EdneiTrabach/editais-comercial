<template>
  <div class="sidebar-container">
    <nav class="sidebar" :class="{
      'active': isActive,
      'dark': isDarkMode,
      'pinned': isPinned
    }">
      <div class="sidebar-trigger" @click="toggleSidebar" :title="sidebarTriggerTooltip">
        <span v-if="!isActive">▶</span>
        <img v-else-if="isPinned" src="/icons/pin.svg" alt="Fixado" class="icon-pin" />
        <span v-else>◀</span>
      </div>

      <div class="sidebar-header">
        <div class="sidebar-logo">
          <img src="/icons/logo-licitacao.svg" alt="Logo" class="logo" />
        </div>
        <div class="sidebar-title">Editais</div>
        <button class="tour-button" @click="startTour" title="Iniciar tour guiado">
          <img src="/icons/question-circle.svg" alt="Tour" class="icon" onerror="this.src='/icons/question.svg'" />
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
            <router-link to="/analises" class="sidebar-menu-link">
              <img src="/icons/analises.svg" alt="Análises" class="icon" />
              <span class="link-text">Análises</span>
            </router-link>
          </li>
<!-- 
          <li class="sidebar-menu-item">
            <router-link to="/declaracoes" class="sidebar-menu-link">
              <img src="/icons/edicao.svg" alt="Declarações" class="icon" />
              <span class="link-text">Declarações</span>
            </router-link>
          </li> -->

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
          <!-- <li class="sidebar-menu-item">
            <router-link to="/relatorios" class="sidebar-menu-link">
              <img src="/icons/check.svg" alt="Relatórios" class="icon" />
              <span class="link-text">Relatórios</span>
            </router-link>
          </li> -->
          <!-- Novo item de menu para Publicações Contratuais -->
          <li class="sidebar-menu-item">
            <router-link to="/publicacoes-contratuais" class="sidebar-menu-link">
              <img src="/icons/contract.svg" alt="Publicações Contratuais" class="icon" />
              <span class="link-text">Publicações Contratuais</span>
            </router-link>
          </li>
          
          <!-- Adicione este item ao menu do TheSidebar.vue -->
          <li class="sidebar-menu-item" v-if="isAdmin">
            <router-link to="/configuracoes-ia" class="sidebar-menu-link">
              <img src="/icons/settings-ia.svg" alt="Configurações IA" class="icon" />
              <span class="link-text">Configurações IA</span>
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
              <button class="theme-option" @click="setTheme('light')" :class="{ active: currentTheme === 'light' }"
                title="Tema padrão com alto contraste entre texto e fundo. Recomendado para uso geral e pessoas com visão normal.">
                <div class="theme-preview light-preview"></div>
                <span>Padrão</span>
              </button>
              <button class="theme-option" @click="setTheme('dark')" :class="{ active: currentTheme === 'dark' }"
                title="Tema escuro que reduz a fadiga ocular e o brilho da tela. Ideal para uso noturno, pessoas com sensibilidade à luz e astigmatismo.">
                <div class="theme-preview dark-preview"></div>
                <span>Escuro</span>
              </button>
              <button class="theme-option" @click="setTheme('red')" :class="{ active: currentTheme === 'red' }"
                title="Tema vermelho que facilita a percepção para pessoas com deuteranopia (dificuldade para ver verde) e protanopia (dificuldade para ver vermelho). Útil também para pessoas com ceratocone.">
                <div class="theme-preview red-preview"></div>
                <span>Vermelho</span>
              </button>
              <button class="theme-option" @click="setTheme('yellow')" :class="{ active: currentTheme === 'yellow' }"
                title="Tema amarelo com maior contraste para pessoas com baixa visão e catarata. O amarelo é uma das cores mais fáceis de identificar para a maioria dos tipos de daltonismo.">
                <div class="theme-preview yellow-preview"></div>
                <span>Amarelo</span>
              </button>
              <button class="theme-option" @click="setTheme('purple')" :class="{ active: currentTheme === 'purple' }"
                title="Tema roxo que ajuda pessoas com tritanopia (dificuldade com azul). Também reduz a fadiga visual em sessões prolongadas de uso.">
                <div class="theme-preview purple-preview"></div>
                <span>Roxo</span>
              </button>
              <button class="theme-option" @click="setTheme('green')" :class="{ active: currentTheme === 'green' }"
                title="Tema verde que proporciona calma visual e é mais fácil para pessoas com certos tipos de fotofobia. Benéfico para quem sofre de migraines visuais.">
                <div class="theme-preview green-preview"></div>
                <span>Verde</span>
              </button>
              <button class="theme-option" @click="setTheme('black')" :class="{ active: currentTheme === 'black' }"
                title="Tema preto com máximo contraste para pessoas com severa baixa visão, miopia avançada e retinopatias. Reduz significativamente o consumo de bateria em telas OLED/AMOLED.">
                <div class="theme-preview black-preview"></div>
                <span>Preto</span>
              </button>
              <button class="theme-option" @click="setTheme('pink')" :class="{ active: currentTheme === 'pink' }"
                title="Tema rosa que pode ser mais confortável para pessoas com dificuldade de percepção em espectros específicos. Útil para pessoas com certas formas de acromatopsia.">
                <div class="theme-preview pink-preview"></div>
                <span>Rosa</span>
              </button>
              <button class="theme-option" @click="setTheme('orange')" :class="{ active: currentTheme === 'orange' }"
                title="Tema laranja que oferece bom contraste para pessoas com deficiência visual moderada e certos tipos de daltonismo. Ajuda na redução da fadiga ocular.">
                <div class="theme-preview orange-preview"></div>
                <span>Laranja</span>
              </button>
              <button class="theme-option" @click="setTheme('baby-blue')"
                :class="{ active: currentTheme === 'baby-blue' }"
                title="Tema azul claro que reduz o cansaço visual e é benéfico para pessoas com hipermetropia e presbiopia. A cor azul suave ajuda a diminuir a tensão ocular durante o uso prolongado.">
                <div class="theme-preview baby-blue-preview"></div>
                <span>Azul</span>
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
    <NotificationsPanel v-if="showNotificationsPanel" :show="showNotificationsPanel"
      @close="showNotificationsPanel = false" @count-updated="updateNotificationsCount" />
  </div>
</template>

<script src="./TheSidebar.js"></script>
<style src="../assets/styles/TheSidebar.css"></style>