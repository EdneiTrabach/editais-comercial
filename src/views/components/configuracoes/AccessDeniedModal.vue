<template>
  <div class="dialog-overlay-cfg-usuarios">
    <div class="confirm-dialog-cfg-usuarios">
      <div class="confirm-content-cfg-usuarios">
        <h3 class="dialog-title-cfg-usuarios">Acesso Restrito</h3>
        <p class="dialog-message-cfg-usuarios">
          Olá, {{currentUserEmail}}
        </p>
        <p class="warning-text-cfg-usuarios">
          Você não tem permissão para acessar esta área. Esta seção é restrita apenas a administradores do sistema.
        </p>
        <div class="confirm-actions-cfg-usuarios">
          <button 
            class="btn-primary-cfg-usuarios" 
            @click="$emit('redirect')"
          >
            Voltar para o início
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AccessDeniedModal',
  props: {
    currentUserEmail: String
  },
  emits: ['redirect']
}
</script>

<style scoped>
/* Os estilos já estão definidos no CSS global */
</style>
