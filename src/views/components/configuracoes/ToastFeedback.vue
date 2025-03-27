<template>
  <div :class="['toast-cfg-usuarios', `toast-${config.type}`]">
    {{ config.message }}
  </div>
</template>

<script>
export default {
  name: 'ToastFeedback',
  props: {
    config: Object
  }
}
</script>

<style scoped>
/* Todos os estilos para o toast já estão definidos no CSS global */
</style>
