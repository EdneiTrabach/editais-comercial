<template>
  <div class="acoes-column">
    <button 
      class="btn-icon edit" 
      @click="$emit('edit', responsavel)"
      title="Editar responsável">
      <img src="/icons/edicao.svg" alt="Editar" class="icon-small">
    </button>
    
    <button 
      class="btn-icon delete" 
      v-if="podeExcluir"
      @click="$emit('delete', responsavel)"
      title="Excluir responsável">
      <img src="/icons/lixeira.svg" alt="Excluir" class="icon-small">
    </button>
  </div>
</template>

<script>
export default {
  name: 'ResponsaveisAcoesColumn',
  props: {
    responsavel: {
      type: Object,
      required: true
    },
    podeExcluir: {
      type: Boolean,
      default: true
    }
  }
}
</script>

<style scoped>
/* Estilos já estão definidos no arquivo ResponsaveisAdminView.css */
</style>