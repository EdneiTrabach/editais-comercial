<!-- filepath: d:\PROJETOS-EL\editais-comercial\src\components\relatorios\RelatoriosFiltros\index.vue -->
<template>
  <div class="filter-section">
    <div class="filter-group">
      <label>Status:</label>
      <select 
        :value="status" 
        @input="$emit('update:status', $event.target.value)" 
        class="filter-select"
      >
        <option value="">Todos</option>
        <option value="vamos_participar">Vamos Participar</option>
        <option value="ganhamos">Ganhamos</option>
        <option value="perdemos">Perdemos</option>
      </select>
    </div>

    <div class="filter-group">
      <label>Responsável:</label>
      <input 
        type="text" 
        :value="responsavel"
        @input="$emit('update:responsavel', $event.target.value)" 
        placeholder="Filtrar por responsável" 
        class="filter-input"
      >
    </div>

    <button class="btn btn-outline-primary" @click="$emit('limpar')">
      Limpar Filtros
    </button>
  </div>
</template>

<script src="./script.js"></script>
<style scoped src="./style.css"></style>