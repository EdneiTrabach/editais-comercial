<template>
  <div class="acoes-container">
    <button @click="$emit('edit', empresa)" class="btn-icon edit" title="Editar Empresa">
      <i class="fas fa-edit"></i>
    </button>
    <button @click="$emit('delete', empresa)" class="btn-icon delete" title="Excluir Empresa">
      <i class="fas fa-trash-alt"></i>
    </button>
  </div>
</template>

<script>
export default {
  name: 'AcoesCell',
  props: {
    empresa: {
      type: Object,
      required: true
    }
  },
  emits: ['edit', 'delete']
}
</script>

<style scoped>
/* Os estilos estão no arquivo EmpresasView.css */
</style>