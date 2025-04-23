<template>
  <div class="modal-overlay" @click.self="$emit('cancel')">
    <div class="confirm-dialog">
      <h3>Confirmar Exclusão</h3>
      <p class="confirm-message">
        Tem certeza que deseja excluir a empresa
        <span class="confirm-highlight">{{ empresa.nome }}</span>?
      </p>
      <p class="confirm-message">
        Esta ação não poderá ser desfeita.
      </p>
      <div class="confirm-actions">
        <button class="btn-cancel" @click="$emit('cancel')">Cancelar</button>
        <button class="btn-confirm delete" @click="$emit('confirm')">Excluir</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'EmpresaDeleteDialog',
  props: {
    empresa: {
      type: Object,
      required: true
    }
  },
  emits: ['confirm', 'cancel']
}
</script>

<style scoped>
/* Os estilos estão no arquivo EmpresasView.css */
</style>