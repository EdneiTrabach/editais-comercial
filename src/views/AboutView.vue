<template>
  <div class="about">
    <h1>This is an about page</h1>
  </div>
</template>

<script setup>
import { useConnectionManager } from '@/composables/useConnectionManager'

const loadData = async () => {
  await loadProcessos() // ou qualquer outra função que carregue seus dados
}

useConnectionManager(loadData)
</script>

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
