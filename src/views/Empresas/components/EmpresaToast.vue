<template>
  <div class="toast" :class="{ 'toast-success': type === 'success', 'toast-error': type === 'error' }">
    <i :class="type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"></i>
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