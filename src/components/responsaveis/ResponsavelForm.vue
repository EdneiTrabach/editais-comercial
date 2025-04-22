<template>
  <div v-if="show" class="modal-overlay">
    <div class="modal-content">
      <h2 class="modal-title">{{ isEditing ? 'Editar Responsável' : 'Novo Responsável' }}</h2>
      
      <form @submit.prevent="$emit('save')" class="form">
        <div class="form-group">
          <label for="nome">Nome</label>
          <input 
            id="nome" 
            v-model="formData.nome" 
            type="text" 
            class="input" 
            required 
            placeholder="Nome completo"
            :disabled="loading"
          >
        </div>
        
        <div class="form-group">
          <label for="email">Email</label>
          <input 
            id="email" 
            v-model="formData.email" 
            type="email" 
            class="input" 
            required 
            placeholder="email@exemplo.com"
            :disabled="isEditing || loading"
          >
          <small v-if="isEditing" class="form-helper-text">O email não pode ser alterado após o cadastro.</small>
        </div>
        
        <div class="form-group">
          <label for="departamento">Departamento</label>
          <input 
            id="departamento" 
            v-model="formData.departamento" 
            type="text" 
            class="input" 
            placeholder="Departamento (opcional)"
            :disabled="loading"
          >
        </div>

        <div class="form-group" v-if="isEditing">
          <label for="status">Status</label>
          <select id="status" v-model="formData.status" class="input" :disabled="loading">
            <option value="ACTIVE">Ativo</option>
            <option value="INACTIVE">Inativo</option>
          </select>
        </div>
        
        <div class="modal-actions">
          <button type="button" class="btn-cancel" @click="$emit('close')" :disabled="loading">
            Cancelar
          </button>
          <button type="submit" class="btn-confirm" :disabled="loading">
            <span v-if="loading" class="loader"></span>
            {{ isEditing ? 'Atualizar' : 'Salvar' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ResponsavelForm',
  props: {
    show: {
      type: Boolean,
      required: true
    },
    formData: {
      type: Object,
      required: true
    },
    isEditing: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'save']
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.modal-content {
  background: var(--bg-card, white);
  border-radius: 8px;
  padding: 1.5rem;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-title, #193155);
  margin-top: 0;
  margin-bottom: 1.5rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-label, #495057);
}

.input {
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid var(--border-primary, #ced4da);
  font-size: 0.9rem;
  transition: border-color 0.2s;
}

.input:focus {
  outline: none;
  border-color: var(--primary, #193155);
  box-shadow: 0 0 0 2px rgba(25, 49, 85, 0.1);
}

.form-helper-text {
  font-size: 0.8rem;
  color: var(--text-muted, #6c757d);
  margin-top: 0.25rem;
  font-style: italic;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn-cancel {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: 1px solid var(--border-primary, #dee2e6);
  background-color: var(--bg-btn-cancel, white);
  color: var(--text-primary, #495057);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel:hover {
  background-color: var(--bg-btn-cancel-hover, #f8f9fa);
}

.btn-confirm {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: none;
  background-color: var(--primary, #193155);
  color: white;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-confirm:hover {
  background-color: var(--primary-hover, #254677);
}

.btn-confirm:disabled {
  background-color: var(--disabled, #adb5bd);
  cursor: not-allowed;
}

.loader {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Responsividade */
@media (max-width: 768px) {
  .modal-content {
    width: 90%;
    max-width: none;
    padding: 1rem;
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .btn-cancel,
  .btn-confirm {
    width: 100%;
  }
}
</style>