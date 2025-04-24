<!-- filepath: d:\PROJETOS-EL\editais-comercial\src\components\relatorios\RelatoriosFiltros\index.vue -->
<template>
  <div class="filtros-container">
    <div class="filtros-header">
      <h3>Filtros</h3>
      <button class="btn-limpar" @click="$emit('limpar')">Limpar Filtros</button>
    </div>
    <div class="filtros-body">
      <div class="filtro-item">
        <label>Status:</label>
        <select v-model="statusLocal" @change="emitirStatusChange">
          <option value="todos">Todos</option>
          <option value="vamos_participar">Vamos Participar</option>
          <option value="ganhamos">Ganhamos</option>
          <option value="perdemos">Perdemos</option>
        </select>
      </div>
      <div class="filtro-item">
        <label>Responsável:</label>
        <input 
          type="text" 
          v-model="responsavelLocal" 
          @input="emitirResponsavelChange" 
          placeholder="Buscar por responsável"
        >
      </div>
    </div>
  </div>
</template>

<script src="./script.js"></script>
<style scoped src="./style.css"></style>