<template>
  <div class="texto-publicacao-input">
    <h2>Texto da Publicação</h2>
    <textarea 
      v-model="textoLocal"
      placeholder="Cole aqui o texto completo da publicação contratual..."
      @input="atualizarTexto"
      rows="10"
      class="texto-area"
    ></textarea>
    
    <div class="acoes-container">
      <button 
        class="btn-identificar"
        @click="$emit('identificar')"
        :disabled="!podeIdentificar || identificando"
      >
        <span v-if="identificando">Identificando...</span>
        <span v-else>Identificar Processo</span>
      </button>
      
      <button
        class="btn-analisar"
        @click="$emit('analisar')"
        :disabled="!podeAnalisar || analisando"
      >
        <span v-if="analisando">Analisando...</span>
        <span v-else>Analisar Contrato</span>
      </button>
      
      <button
        class="btn-limpar"
        @click="limparTexto"
      >
        Limpar
      </button>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue';

export default {
  name: 'TextoPublicacaoInput',
  
  props: {
    texto: {
      type: String,
      default: ''
    },
    podeIdentificar: {
      type: Boolean,
      default: false
    },
    identificando: {
      type: Boolean,
      default: false
    },
    podeAnalisar: {
      type: Boolean,
      default: false
    },
    analisando: {
      type: Boolean,
      default: false
    }
  },
  
  emits: ['update-texto', 'identificar', 'analisar', 'limpar'],
  
  setup(props, { emit }) {
    const textoLocal = ref(props.texto);
    
    // Sincronizar o texto local com o prop
    watch(() => props.texto, (newValue) => {
      textoLocal.value = newValue;
    });
    
    const atualizarTexto = () => {
      emit('update-texto', textoLocal.value);
    };
    
    const limparTexto = () => {
      textoLocal.value = '';
      emit('update-texto', '');
      emit('limpar');
    };
    
    return {
      textoLocal,
      atualizarTexto,
      limparTexto
    };
  }
}
</script>

<style scoped>
.texto-publicacao-input {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
}

h2 {
  margin-top: 0;
  color: #193155;
  font-size: 1.4rem;
  margin-bottom: 15px;
}

.texto-area {
  width: 100%;
  min-height: 200px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  resize: vertical;
  margin-bottom: 15px;
  box-sizing: border-box;
}

.acoes-container {
  display: flex;
  gap: 10px;
  justify-content: flex-start;
}

button {
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-identificar {
  background-color: #4CAF50;
  color: white;
}

.btn-analisar {
  background-color: #2196F3;
  color: white;
}

.btn-limpar {
  background-color: #f2f2f2;
  color: #333;
}

.btn-identificar:not(:disabled):hover {
  background-color: #45a049;
}

.btn-analisar:not(:disabled):hover {
  background-color: #0b7dda;
}

.btn-limpar:hover {
  background-color: #e0e0e0;
}
</style>