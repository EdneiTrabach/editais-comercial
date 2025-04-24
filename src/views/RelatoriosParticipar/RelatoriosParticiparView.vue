<!-- filepath: d:\PROJETOS-EL\editais-comercial\src\views\RelatoriosParticiparView.vue -->
<template>
  <div class="relatorios-participar-container">
    <TheSidebar @toggle="handleSidebarToggle" />

    <div class="main-content" :class="{ 'sidebar-expanded': isSidebarExpanded }">
      <div class="content-wrapper">
        <!-- Cabeçalho -->
        <RelatoriosHeader 
          @sincronizar="sincronizarTodosProcessos" 
          @exportar-excel="exportarExcel" 
        />

        <!-- Seleção de Ano -->
        <AnoSelection 
          :anos="anosDisponiveis" 
          :processos="processos" 
          :selectedAno="anoSelecionado"
          @select-ano="selecionarAno" 
        />

        <!-- Filtros -->
        <RelatoriosFiltros
          v-model:status="filtros.status"
          v-model:responsavel="filtros.responsavel"
          @limpar="limparFiltros"
        />

        <!-- Tabela de Processos -->
        <RelatoriosTabela
          :processos="processosFiltrados"
          :loading="loading"
          :responsaveis="responsaveis"
          :sistemas="sistemas"
          @ver-detalhes="verDetalhes"
          @ir-para-processo="irParaProcesso"
        />

        <!-- Modal de Detalhes -->
        <RelatoriosDetalhesModal
          v-if="modalDetalhes.show"
          :processo="modalDetalhes.processo"
          :sistemas="sistemas"
          @fechar="fecharModal"
        />
      </div>
    </div>
  </div>
</template>

<script src="./RelatoriosParticipar/script.js"></script>
<style src="./RelatoriosParticipar/style.css"></style>