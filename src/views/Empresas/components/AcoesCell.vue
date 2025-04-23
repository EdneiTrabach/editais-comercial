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
.acoes-cell {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-icon.edit {
  background-color: var(--bg-edit-btn, #e8f5e9);
  color: var(--text-edit-btn, #388e3c);
}

.btn-icon.delete {
  background-color: var(--bg-delete-btn, #fee2e2);
  color: var(--text-delete-btn, #d32f2f);
}

.btn-icon:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.btn-icon.edit:hover {
  background-color: var(--bg-edit-btn-hover, #c8e6c9);
}

.btn-icon.delete:hover {
  background-color: var(--bg-delete-btn-hover, #ffcdd2);
}

.icon-small {
  width: 16px;
  height: 16px;
}

/* Tema escuro */
.dark .btn-icon.edit {
  background-color: var(--bg-edit-btn-dark, rgba(56, 142, 60, 0.2));
  color: var(--text-edit-btn-dark, #81c784);
}

.dark .btn-icon.delete {
  background-color: var(--bg-delete-btn-dark, rgba(211, 47, 47, 0.2));
  color: var(--text-delete-btn-dark, #ef5350);
}
</style>