<template>
  <div class="acoes-container">
    <!-- Botão de detalhes/visualização -->
    <!-- <button 
      class="btn-icon view" 
      @click="handleView"
      title="Visualizar detalhes">
      <img src="/icons/eye.svg" alt="Ver" class="icon-small">
    </button> -->
    
    <!-- Botão de edição -->
    <!-- <button 
      class="btn-icon edit" 
      @click="handleEdit"
      title="Editar processo">
      <img src="/icons/edicao.svg" alt="Editar" class="icon-small">
    </button> -->
    
    <!-- Botão de duplicação -->
    <button 
      class="btn-icon duplicate" 
      @click="handleDuplicate"
      title="Duplicar processo">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-small">
        <rect x="8" y="8" width="12" height="12" rx="2" ry="2"></rect>
        <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"></path>
      </svg>
    </button>
    
    <!-- Botão de exclusão -->
    <button 
      class="btn-icon delete" 
      @click="handleDelete"
      title="Excluir processo">
      <img src="/icons/lixeira.svg" alt="Excluir" class="icon-small">
    </button>
  </div>
</template>

<script>
export default {
  name: 'AcoesColumn',
  props: {
    processo: {
      type: Object,
      required: true
    }
  },
  methods: {
    handleView() {
      // Navegar para a página de detalhes deste processo
      this.$router.push(`/processos/${this.processo.id}`);
    },
    
    handleEdit() {
      // Navegar para a página de edição deste processo
      this.$router.push(`/processos/${this.processo.id}/editar`);
    },
    
    handleDuplicate() {
      // Emitir evento para ser capturado pelo componente pai
      this.$emit('duplicate', this.processo);
    },
    
    handleDelete() {
      // Emitir evento para ser capturado pelo componente pai
      this.$emit('delete', this.processo);
    }
  }
}
</script>

<style scoped>
.acoes-container {
  display: flex;
  justify-content: center;
}

.btn-icon {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.btn-icon:hover {
  background-color: #f0f0f0;
}

.btn-icon.view:hover {
  background-color: #e3f2fd;
  color: #1976d2;
}

.btn-icon.edit:hover {
  background-color: #e8f5e9;
  color: #388e3c;
}

.btn-icon.duplicate:hover {
  background-color: #e1ffe3;
  color: #0200ff;
}

.btn-icon.delete:hover {
  background-color: #ffebee;
  color: #d32f2f;
}

.icon-small {
  width: 18px;
  height: 18px;
}

/* Cores dos ícones */
.btn-icon.view {
  color: #1976d2;
}

.btn-icon.edit {
  color: #388e3c;
}

.btn-icon.duplicate {
  background-color: #e8f5e9;
  color: #000000;
}

.btn-icon.delete {
  color: #d32f2f;
}
</style>