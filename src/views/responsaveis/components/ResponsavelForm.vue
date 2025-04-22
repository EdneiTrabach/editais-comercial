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

<style src="@/assets/styles/components/responsaveis/form.css" scoped></style>