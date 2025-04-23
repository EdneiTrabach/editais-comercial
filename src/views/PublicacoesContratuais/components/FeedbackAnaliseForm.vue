<template>
  <div class="feedback-analise">
    <h2>Feedback da Análise</h2>
    
    <div v-if="feedbackEnviado" class="feedback-enviado">
      <div class="feedback-icon">
        <i class="fas fa-check-circle"></i>
      </div>
      <p>Obrigado pelo seu feedback! Ele ajudará a melhorar nossa IA.</p>
    </div>
    
    <div v-else class="feedback-container">
      <div v-if="!mostrarFormCorrecao" class="feedback-opcoes">
        <button 
          class="btn-feedback btn-correto"
          @click="enviarFeedbackCorreto"
          :disabled="enviandoFeedback"
        >
          <i class="fas fa-thumbs-up"></i>
          A análise está correta
        </button>
        
        <button 
          class="btn-feedback btn-incorreto"
          @click="$emit('abrir-form')"
          :disabled="enviandoFeedback"
        >
          <i class="fas fa-thumbs-down"></i>
          A análise precisa de correções
        </button>
      </div>
      
      <div v-else class="feedback-form">
        <h3>Correção de Análise</h3>
        
        <div class="form-group">
          <label>Empresa Correta:</label>
          <select v-model="correcoesLocais.empresa_id">
            <option value="">Selecione a empresa correta</option>
            <option v-for="empresa in empresas" :key="empresa.id" :value="empresa.id">
              {{ empresa.nome }}
            </option>
            <option value="nova">Nova Empresa (não cadastrada)</option>
          </select>
          
          <div v-if="correcoesLocais.empresa_id === 'nova'" class="nova-empresa">
            <input 
              type="text" 
              v-model="correcoesLocais.nova_empresa.nome" 
              placeholder="Nome da Empresa"
            >
            <input 
              type="text" 
              v-model="correcoesLocais.nova_empresa.cnpj" 
              placeholder="CNPJ da Empresa"
            >
          </div>
        </div>
        
        <div class="form-group">
          <label>Valor do Contrato Correto:</label>
          <input 
            type="text" 
            v-model="correcoesLocais.valor_contrato" 
            placeholder="Valor do contrato"
          >
        </div>
        
        <div class="form-group">
          <label>Observações:</label>
          <textarea 
            v-model="correcoesLocais.observacoes" 
            placeholder="Descreva quais informações estavam incorretas e por quê"
            rows="4"
          ></textarea>
        </div>
        
        <div class="form-actions">
          <button 
            class="btn-cancelar" 
            @click="$emit('cancelar-correcao')"
            :disabled="enviandoFeedback"
          >
            Cancelar
          </button>
          <button 
            class="btn-enviar" 
            @click="enviarFeedbackCorrecao"
            :disabled="enviandoFeedback"
          >
            <span v-if="enviandoFeedback">Enviando...</span>
            <span v-else>Enviar Correção</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue';

export default {
  name: 'FeedbackAnaliseForm',
  
  props: {
    empresas: {
      type: Array,
      default: () => []
    },
    resultado: {
      type: Object,
      default: null
    },
    enviandoFeedback: {
      type: Boolean,
      default: false
    },
    feedbackCorreto: {
      type: Boolean,
      default: false
    },
    mostrarFormCorrecao: {
      type: Boolean,
      default: false
    },
    correcoes: {
      type: Object,
      default: () => ({})
    },
    feedbackEnviado: {
      type: Boolean,
      default: false
    }
  },
  
  emits: ['enviar-feedback', 'abrir-form', 'cancelar-correcao', 'update-correcoes'],
  
  setup(props, { emit }) {
    const correcoesLocais = ref({
      empresa_id: '',
      valor_contrato: '',
      observacoes: '',
      nova_empresa: {
        nome: '',
        cnpj: ''
      }
    });
    
    // Sincronizar com o prop
    watch(() => props.correcoes, (newVal) => {
      Object.assign(correcoesLocais.value, newVal);
    }, { deep: true });
    
    // Sincronizar mudanças de volta para o componente pai
    watch(correcoesLocais, (newVal) => {
      emit('update-correcoes', newVal);
    }, { deep: true });
    
    const enviarFeedbackCorreto = () => {
      emit('enviar-feedback', true);
    };
    
    const enviarFeedbackCorrecao = () => {
      emit('enviar-feedback', false);
    };
    
    return {
      correcoesLocais,
      enviarFeedbackCorreto,
      enviarFeedbackCorrecao
    };
  }
}
</script>

<style scoped>
.feedback-analise {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

h2 {
  margin-top: 0;
  color: #193155;
  font-size: 1.4rem;
  margin-bottom: 20px;
}

h3 {
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 15px;
}

.feedback-enviado {
  text-align: center;
  padding: 20px;
}

.feedback-icon {
  font-size: 3rem;
  color: #4CAF50;
  margin-bottom: 15px;
}

.feedback-opcoes {
  display: flex;
  gap: 15px;
  justify-content: center;
  padding: 20px;
}

.btn-feedback {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 15px 25px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-feedback i {
  font-size: 1.5rem;
}

.btn-feedback:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-correto {
  background-color: #e8f5e9;
  color: #4caf50;
}

.btn-incorreto {
  background-color: #ffebee;
  color: #f44336;
}

.btn-correto:hover:not(:disabled) {
  background-color: #c8e6c9;
}

.btn-incorreto:hover:not(:disabled) {
  background-color: #ffcdd2;
}

.feedback-form {
  padding: 10px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  box-sizing: border-box;
}

.nova-empresa {
  margin-top: 10px;
  display: grid;
  gap: 10px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.btn-cancelar {
  background-color: #f2f2f2;
  color: #333;
  border: none;
  padding: 10px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-enviar {
  background-color: #2196F3;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
}

.btn-cancelar:hover:not(:disabled) {
  background-color: #e0e0e0;
}

.btn-enviar:hover:not(:disabled) {
  background-color: #0b7dda;
}

.btn-cancelar:disabled,
.btn-enviar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>