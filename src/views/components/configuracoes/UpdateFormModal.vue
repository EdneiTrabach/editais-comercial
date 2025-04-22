<template>
  <div class="modal-backdrop">
    <div class="modal">
      <h3>{{ editingUpdate ? 'Editar' : 'Nova' }} Atualização</h3>
      
      <form @submit.prevent="$emit('save')">
        <div class="form-group">
          <label>Título</label>
          <input v-model="updateForm.title" required />
        </div>
        
        <div class="form-group">
          <label>Versão</label>
          <input v-model="updateForm.version" placeholder="Ex: 1.0.0" />
        </div>
        
        <div class="form-group">
          <label>Importância</label>
          <select v-model="updateForm.importance">
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Descrição (suporta formatação básica)</label>
          <textarea 
            v-model="updateForm.description" 
            rows="2" 
            required
            placeholder="Descreva as novidades. Use ** para negrito, * para itálico e [texto](url) para links."
          ></textarea>
        </div>
        
        <div class="form-actions">
          <button type="button" @click="$emit('close')">
            Cancelar
          </button>
          <button type="submit" :disabled="loading">
            Salvar
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'UpdateFormModal',
  props: {
    updateForm: {
      type: Object,
      required: true
    },
    editingUpdate: {
      type: Object,
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'save'],
  setup(props) {
    // Validação básica integrada ao componente
    const validateForm = () => {
      const errors = {};
      
      if (!props.updateForm.title || props.updateForm.title.trim() === '') {
        errors.title = 'O título é obrigatório';
      }
      
      if (!props.updateForm.description || props.updateForm.description.trim() === '') {
        errors.description = 'A descrição é obrigatória';
      }
      
      return {
        isValid: Object.keys(errors).length === 0,
        errors
      };
    };

    return {
      validateForm
    };
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 650px;
  max-height: 90vh;
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  padding: 2rem;
  overflow: auto;
}

.modal h3 {
  color: #193155;
  font-size: 1.5rem;
  margin-top: 0;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #374151;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.95rem;
}

.form-group textarea {
  resize: vertical;
  min-height: 150px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.form-actions button {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.form-actions button:first-child {
  background: #f3f4f6;
  color: #4b5563;
  border: none;
}

.form-actions button:first-child:hover {
  background: #e5e7eb;
}

.form-actions button:last-child {
  background: linear-gradient(135deg, #193155 0%, #254677 100%);
  color: white;
  border: none;
  box-shadow: 0 4px 6px rgba(25, 49, 85, 0.12);
}

.form-actions button:last-child:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(25, 49, 85, 0.2);
}

.form-actions button:last-child:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
</style>