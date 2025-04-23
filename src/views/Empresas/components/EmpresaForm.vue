<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <h2>{{ isEditing ? 'Editar Empresa' : 'Nova Empresa' }}</h2>
      <form @submit.prevent="handleSubmit">
        <div class="form-grid">
          <div class="form-column">
            <div class="form-group">
              <label>Nome Fantasia</label>
              <input v-model="localFormData.nome" required>
            </div>
            <div class="form-group">
              <label>CNPJ</label>
              <input 
                v-model="localFormData.cnpj" 
                @input="formatarCNPJInput" 
                placeholder="00.000.000/0000-00"
                required
                @blur="validateCNPJInput"
                :class="{ 'invalid': cnpjError }"
              >
              <span v-if="cnpjError" class="error-message">{{ cnpjError }}</span>
            </div>
            <div class="form-group">
              <label>Razão Social</label>
              <input v-model="localFormData.razao_social" required>
            </div>
            
            <!-- Componente de seleção de cor -->
            <EmpresaColorPicker v-model="localFormData.color" />
          </div>
          
          <div class="form-column">
            <div class="form-group">
              <label>Contato</label>
              <input v-model="localFormData.contato">
            </div>
            <div class="form-group">
              <label>Telefone</label>
              <input 
                v-model="localFormData.telefone" 
                @input="formatarTelefoneInput"
                placeholder="(00) 00000-0000"
              >
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" v-model="localFormData.email">
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn-cancel" @click="$emit('cancel')">Cancelar</button>
          <button type="submit" class="btn-confirm">Salvar</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue';
import EmpresaColorPicker from './EmpresaColorPicker.vue';
import { formatarCNPJ, formatarTelefone } from '../functions/formatacao';
import { validateCNPJ } from '../functions/validacao';

export default {
  name: 'EmpresaForm',
  components: {
    EmpresaColorPicker
  },
  props: {
    formData: {
      type: Object,
      required: true
    },
    isEditing: {
      type: Boolean,
      default: false
    },
    editingId: {
      type: [String, Number],
      default: null
    }
  },
  emits: ['submit', 'cancel', 'update:cnpjError'],
  setup(props, { emit }) {
    const localFormData = ref({
      nome: '',
      cnpj: '',
      razao_social: '',
      contato: '',
      telefone: '',
      email: '',
      color: '#FFFFFF'
    });
    
    const cnpjError = ref('');
    
    // Inicializar o formulário quando as props mudarem
    watch(() => props.formData, (newValue) => {
      if (newValue) {
        localFormData.value = { ...newValue };
      }
    }, { immediate: true, deep: true });
    
    const formatarCNPJInput = (e) => {
      localFormData.value.cnpj = formatarCNPJ(e);
    };
    
    const formatarTelefoneInput = (e) => {
      localFormData.value.telefone = formatarTelefone(e);
    };
    
    const validateCNPJInput = async () => {
      if (!localFormData.value.cnpj) {
        cnpjError.value = 'CNPJ é obrigatório';
        emit('update:cnpjError', cnpjError.value);
        return false;
      }

      // Validação básica de comprimento
      const cnpjLimpo = localFormData.value.cnpj.replace(/[^\d]/g, '');
      if (cnpjLimpo.length !== 14) {
        cnpjError.value = 'CNPJ inválido';
        emit('update:cnpjError', cnpjError.value);
        return false;
      }

      // Validação de duplicidade
      const result = await validateCNPJ(
        localFormData.value.cnpj, 
        props.isEditing,
        props.editingId
      );
      
      cnpjError.value = result.error;
      emit('update:cnpjError', cnpjError.value);
      return result.valid;
    };
    
    const handleSubmit = async () => {
      // Validação do CNPJ
      const isValid = await validateCNPJInput();
      
      if (!isValid) {
        return;
      }
      
      emit('submit', localFormData.value);
    };
    
    return {
      localFormData,
      cnpjError,
      formatarCNPJInput,
      formatarTelefoneInput,
      validateCNPJInput,
      handleSubmit
    };
  }
}
</script>