<template>
  <div class="processo-selection">
    <h2>Selecione o Processo</h2>
    <div class="processos-grid">
      <div 
        v-for="processo in processos" 
        :key="processo.id"
        class="processo-card"
        :class="{ 'selected': selectedProcesso === processo.id }"
        @click="$emit('select-processo', processo)"
      >
        <h3>{{ processo.numero_processo }}</h3>
        <div class="processo-info">
          <p><strong>Órgão:</strong> {{ processo.orgao }}</p>
          <p><strong>Data:</strong> {{ formatDate(processo.data_pregao) }}</p>
          <p><strong>Hora:</strong> {{ processo.hora_pregao }}</p>
          <p class="objeto">{{ processo.objeto_resumido }}</p>
        </div>
        <div class="processo-status">
          {{ formatStatus(processo.status) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
import { useProcessos } from '@/composables/useProcessos'

const props = defineProps({
  processos: Array,
  selectedProcesso: Number
})

defineEmits(['select-processo'])

const { formatStatus, formatDate } = useProcessos()
</script>

<style src="@/assets/styles/ProcessoSelection.css"></style>
