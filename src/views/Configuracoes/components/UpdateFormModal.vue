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
import { validateUpdateForm } from './functions/validation';

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
    // Podemos adicionar outras lógicas específicas do componente aqui
    return {
      validateForm: () => validateUpdateForm(props.updateForm)
    };
  }
}
</script>

<style src="./css/UpdateFormModal.css" scoped></style>