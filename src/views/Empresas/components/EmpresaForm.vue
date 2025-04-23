<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <h2>{{ isEditing ? 'Editar Empresa' : 'Nova Empresa' }}</h2>
      <form @submit.prevent="handleSubmit">
        <div class="form-container">
          <!-- Primeira coluna -->
          <div class="form-section">
            <h3>Dados da Empresa</h3>
            <div class="form-group">
              <label for="nome">Nome Fantasia</label>
              <input 
                id="nome"
                v-model="localFormData.nome" 
                required
              >
            </div>
            
            <div class="form-group">
              <label for="cnpj">CNPJ</label>
              <input 
                id="cnpj"
                v-model="localFormData.cnpj" 
                @input="formatarCNPJInput"
                placeholder="00.000.000/0000-00" 
                required
                :class="{ 'input-error': cnpjError }"
              >
              <span v-if="cnpjError" class="error-message">{{ cnpjError }}</span>
            </div>
            
            <div class="form-group">
              <label for="razao">Razão Social</label>
              <input 
                id="razao"
                v-model="localFormData.razao_social" 
                required
              >
            </div>
          </div>
          
          <!-- Segunda coluna -->
          <div class="form-section">
            <h3>Informações de Contato</h3>
            <div class="form-group">
              <label for="contato">Nome do Contato</label>
              <input 
                id="contato"
                v-model="localFormData.contato"
              >
            </div>
            
            <div class="form-group">
              <label for="telefone">Telefone</label>
              <input 
                id="telefone"
                v-model="localFormData.telefone" 
                @input="formatarTelefoneInput"
                placeholder="(00) 00000-0000"
              >
            </div>
            
            <div class="form-group">
              <label for="email">Email</label>
              <input 
                id="email"
                type="email" 
                v-model="localFormData.email"
              >
            </div>
          </div>
          
          <!-- Terceira coluna - Cores -->
          <div class="form-section color-section">
            <h3>Personalização</h3>
            <div class="form-group">
              <label for="color">Cor de Identificação</label>
              <div class="color-picker">
                <input 
                  type="color" 
                  id="color" 
                  v-model="localFormData.color" 
                  class="color-input"
                >
                <span class="color-preview" :style="{ backgroundColor: localFormData.color }"></span>
                <span class="color-value">{{ localFormData.color }}</span>
              </div>
              
              <div class="color-palette-container">
                <p class="color-palette-label">Selecionar das cores predefinidas:</p>
                <div class="predefined-colors">
                  <div 
                    v-for="(color, index) in colors" 
                    :key="index" 
                    class="color-option"
                    :class="{ 'selected': localFormData.color === color }"
                    :style="{ backgroundColor: color }"
                    @click="localFormData.color = color"
                  ></div>
                </div>
              </div>
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
import { formatarCNPJ, formatarTelefone } from '../functions/formatacao';
import { validateCNPJ } from '../functions/validacao';

export default {
  name: 'EmpresaForm',
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
    // Cores predefinidas que antes estava no store
    const colors = [
      '#FFFFFF', // Branco
      '#193155', // Azul escuro (cor da E&L)
      '#4285F4', // Azul Google
      '#34A853', // Verde Google
      '#FBBC05', // Amarelo Google
      '#EA4335', // Vermelho Google
      '#9C27B0', // Roxo
      '#3F51B5', // Índigo
      '#00BCD4', // Ciano
      '#009688', // Verde-azulado
      '#8BC34A', // Verde claro
      '#FFEB3B', // Amarelo
      '#FF9800', // Laranja
      '#795548', // Marrom
      '#607D8B'  // Azul acinzentado
    ];
    
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

      const cnpj = localFormData.value.cnpj.replace(/[^\d]/g, '');
      
      if (cnpj.length !== 14) {
        cnpjError.value = 'CNPJ inválido';
        emit('update:cnpjError', cnpjError.value);
        return false;
      }
      
      // Para validações adicionais ou verificação de duplicidade, 
      // usar validateCNPJ do arquivo de funções
      
      cnpjError.value = '';
      emit('update:cnpjError', cnpjError.value);
      return true;
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
      colors,
      formatarCNPJInput,
      formatarTelefoneInput,
      validateCNPJInput,
      handleSubmit
    };
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 900px;
  max-width: 95%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-content h2 {
  color: #193155;
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  border-bottom: 2px solid #f3f4f6;
  padding-bottom: 0.75rem;
}

.form-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.form-section {
  display: flex;
  flex-direction: column;
}

.form-section h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1rem;
  color: #4b5563;
  font-weight: 600;
}

.color-section {
  align-self: flex-start;
}

.form-group {
  margin-bottom: 1.25rem;
  position: relative;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
  font-size: 0.9rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.95rem;
  background-color: #f9fafb;
  transition: all 0.2s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #193155;
  background-color: #fff;
  box-shadow: 0 0 0 3px rgba(25, 49, 85, 0.1);
}

.form-group .input-error {
  border-color: #ef4444;
  background-color: #fef2f2;
}

.error-message {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  display: block;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
}

.btn-cancel {
  padding: 0.75rem 1.5rem;
  background-color: #f3f4f6;
  color: #4b5563;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel:hover {
  background-color: #e5e7eb;
}

.btn-confirm {
  padding: 0.75rem 1.5rem;
  background-color: #193155;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-confirm:hover {
  background-color: #254677;
}

/* Estilos para o seletor de cor */
.color-picker {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 10px;
  background-color: #f9fafb;
  border-radius: 8px;
}

.color-input {
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.color-preview {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.color-value {
  font-family: monospace;
  font-size: 0.9rem;
  color: #6b7280;
  background-color: #ffffff;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.color-palette-container {
  margin-top: 10px;
}

.color-palette-label {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 0 0 8px 0;
}

.predefined-colors {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.color-option {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.color-option:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.color-option.selected {
  box-shadow: 0 0 0 2px #193155;
}

/* Responsividade */
@media (max-width: 768px) {
  .form-container {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .modal-content {
    padding: 1.5rem;
    width: 95%;
  }
}
</style>