<template>
  <div class="toast" :class="type">
    {{ message }}
  </div>
</template>

<script>
export default {
  name: 'EmpresaToast',
  props: {
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      default: 'success',
      validator: (value) => ['success', 'error', 'info', 'warning'].includes(value)
    }
  }
}
</script>

<style scoped>
/* Os estilos estão no arquivo EmpresasView.css */
</style>