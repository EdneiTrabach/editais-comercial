<template>
  <div class="modal-overlay">
    <div class="confirm-dialog">
      <div class="confirm-content">
        <h3>Confirmar Exclusão</h3>
        
        <div v-if="empresa && empresa.temVinculacoes" class="warning-detail">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Esta empresa possui <strong>{{ empresa.qtdVinculacoes }}</strong> vinculações com plataformas.</p>
          <p>Todas essas vinculações também serão excluídas.</p>
        </div>
        
        <p>Deseja realmente excluir a empresa <strong>{{ empresa?.nome }}</strong>?</p>
        <p class="warning-text">Esta ação não poderá ser desfeita!</p>
        
        <div class="confirm-actions">
          <button type="button" class="btn-cancel" @click="handleCancel">
            Cancelar
          </button>
          <button type="button" class="btn-confirm delete" @click="handleConfirm">
            Excluir
          </button>
        </div>
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
  emits: ['confirm', 'cancel'],
  setup(props, { emit }) {
    const handleCancel = () => {
      console.log('Cancelando exclusão de empresa');
      emit('cancel');
    };
    
    const handleConfirm = () => {
      console.log('Confirmando exclusão de empresa:', props.empresa?.nome);
      emit('confirm');
    };
    
    return {
      handleCancel,
      handleConfirm
    };
  }
}
</script>

<style scoped>
/* Adicione seus estilos aqui ou importe um arquivo CSS */
</style>