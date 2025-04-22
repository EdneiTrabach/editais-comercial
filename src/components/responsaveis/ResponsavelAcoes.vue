<template>
  <div class="acoes-column">
    <!-- Botão Editar -->
    <button 
      class="btn-icon edit" 
      @click="$emit('edit', responsavel)"
      title="Editar responsável">
      <img src="/icons/edicao.svg" alt="Editar" class="icon-small">
    </button>
    
    <!-- Botão Ativar/Inativar -->
    <button 
      class="btn-icon" 
      :class="responsavel.status === 'ACTIVE' ? 'deactivate' : 'activate'" 
      @click="$emit('toggle-status', responsavel)"
      :title="responsavel.status === 'ACTIVE' ? 'Inativar responsável' : 'Ativar responsável'">
      <img 
        :src="responsavel.status === 'ACTIVE' ? '/icons/disable.svg' : '/icons/enable.svg'" 
        alt="Status" 
        class="icon-small">
    </button>
    
    <!-- Botão Excluir -->
    <button 
      v-if="podeExcluir"
      class="btn-icon delete" 
      @click="$emit('delete', responsavel)"
      title="Excluir responsável">
      <img src="/icons/lixeira.svg" alt="Excluir" class="icon-small">
    </button>
  </div>
</template>

<script>
export default {
  name: 'ResponsavelAcoes',
  props: {
    responsavel: {
      type: Object,
      required: true
    },
    podeExcluir: {
      type: Boolean,
      default: true
    }
  },
  emits: ['edit', 'toggle-status', 'delete']
}
</script>

<style scoped>
.acoes-column {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
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

.btn-icon.activate {
  background-color: var(--bg-activate-btn, #dcfce7);
  color: var(--text-activate-btn, #16a34a);
}

.btn-icon.deactivate {
  background-color: var(--bg-deactivate-btn, #fef3c7);
  color: var(--text-deactivate-btn, #d97706);
}

.btn-icon:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 5px rgba(0, 0, 0, 0.1);
}

.icon-small {
  width: 16px;
  height: 16px;
}
</style>