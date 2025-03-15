<template>
  <div class="navigation-buttons" 
       v-if="shouldShowNavigation"
       :class="{ 'sidebar-expanded': isSidebarExpanded, 'sidebar-collapsed': !isSidebarExpanded }">
    <!-- Modo especial: botão voltar quando estiver em rota de edição/criação -->
    <template v-if="isSpecialRoute">
      <button 
        @click="router.push(getBackRoute)"
        class="nav-btn prev-btn"
      >
        <i class="fa fa-chevron-left icon-white"></i>
        Voltar para Lista
      </button>
    </template>
    
    <!-- Navegação padrão para rotas normais -->
    <template v-else>
      <button 
        @click="goToPrevious" 
        :disabled="!hasPrevious"
        class="nav-btn prev-btn"
      >
        <i class="fa fa-chevron-left icon-white"></i>
        Anterior
      </button>
      <div class="current-page" v-if="!isSpecialRoute">
        {{ navigationRoutes[currentIndex]?.name || 'Página Atual' }}
      </div>
      <button 
        @click="goToNext" 
        :disabled="!hasNext"
        class="nav-btn"
      >
        Próximo
        <i class="fa fa-chevron-right icon-white"></i>
      </button>
    </template>
  </div>
</template>

<script src="../components/NavigationButtons.js"></script>
<style src="../assets/styles/NavigationButtons.css"></style>