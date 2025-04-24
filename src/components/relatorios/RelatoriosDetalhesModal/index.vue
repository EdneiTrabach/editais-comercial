<!-- filepath: d:\PROJETOS-EL\editais-comercial\src\components\relatorios\RelatoriosDetalhesModal\index.vue -->
<template>
  <div class="modal-overlay" @click.self="$emit('fechar')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Detalhes do Processo</h3>
        <button class="btn-close" @click="$emit('fechar')">&times;</button>
      </div>
      <div class="modal-body">
        <div v-if="processo">
          <h4>{{ processo.numero_processo }}</h4>
          <div class="detalhes-grid">
            <div class="detalhe-item">
              <strong>Órgão:</strong> {{ processo.orgao }}
            </div>
            <div class="detalhe-item">
              <strong>Data Pregão:</strong> {{ formatarData(processo.data_pregao) }}
            </div>
            <div class="detalhe-item">
              <strong>Valor Estimado:</strong> {{ formatarMoeda(processo.valor_estimado) }}
            </div>
            <div class="detalhe-item">
              <strong>Status:</strong> {{ formatarStatus(processo.status) }}
            </div>
            <div class="detalhe-item full-width">
              <strong>Objeto:</strong> {{ processo.objeto_resumido }}
            </div>
            <div class="detalhe-item full-width">
              <strong>Sistemas:</strong> {{ getSistemasNomes(processo.sistemas_ativos) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./script.js"></script>
<style scoped src="./style.css"></style>