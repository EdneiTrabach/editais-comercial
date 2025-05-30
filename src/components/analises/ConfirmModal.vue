<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <h3>Alterações não salvas</h3>
      <p>Existem alterações não salvas. O que deseja fazer?</p>
      <div class="modal-actions">
        <button @click="$emit('confirmar')" class="btn-secondary">
          Sair sem salvar
        </button>
        <button @click="$emit('salvar')" class="btn-primary">
          Salvar e sair
        </button>
        <button @click="$emit('cancelar')" class="btn-cancel">
          Continuar editando
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ConfirmModal',
  emits: ['confirmar', 'salvar', 'cancelar']
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-primary {
  background: #2563eb;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-secondary {
  background: #f1f5f9;
  color: #475569;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-cancel {
  background: #ffffff;
  color: #475569;
  border: 1px solid #e2e8f0;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.btn-secondary:hover {
  background: #e2e8f0;
}

.btn-cancel:hover {
  background: #f8fafc;
}
</style>
