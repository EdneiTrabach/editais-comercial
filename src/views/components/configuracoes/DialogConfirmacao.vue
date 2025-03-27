<template>
  <div class="dialog-overlay-cfg-usuarios">
    <div class="confirm-dialog-cfg-usuarios">
      <div class="confirm-content-cfg-usuarios">
        <h3 class="dialog-title-cfg-usuarios">{{ config.title }}</h3>
        <p class="dialog-message-cfg-usuarios">{{ config.message }}</p>
        <p v-if="config.warning" class="warning-text-cfg-usuarios">
          {{ config.warning }}
        </p>
        <div class="confirm-actions-cfg-usuarios">
          <button class="btn-secondary-cfg-usuarios" @click="$emit('close')">
            Cancelar
          </button>
          <button 
            class="btn-danger-cfg-usuarios" 
            @click="config.onConfirm"
          >
            {{ config.confirmText || 'Confirmar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DialogConfirmacao',
  props: {
    config: Object
  },
  emits: ['close']
}
</script>

<style scoped>
/* Os estilos já estão definidos no CSS global */
</style>
