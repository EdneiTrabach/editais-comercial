<template>
  <div class="config-section">
    <h2>Configurações do Modelo</h2>
    
    <div class="form-group switch-group">
      <label>
        <span>Ativar modelo avançado de IA</span>
        <div class="toggle-switch">
          <input 
            type="checkbox" 
            id="modelo-avancado" 
            v-model="modeloConfig.ia_avancada_ativa"
          >
          <span class="slider round"></span>
        </div>
      </label>
      <p class="form-help">
        Quando ativado, o sistema utilizará um modelo avançado de IA para análise de publicações.
        É necessário configurar uma chave API válida.
      </p>
    </div>
    
    <div class="form-group" v-if="modeloConfig.ia_avancada_ativa">
      <label for="modelo-ia">Modelo de IA</label>
      <select 
        id="modelo-ia" 
        v-model="modeloConfig.modelo_ia" 
        class="full-width"
      >
        <option value="openai">OpenAI (GPT-4/GPT-3.5)</option>
        <option value="local">Modelo Local (Ollama)</option>
        <option value="mistral">Mistral AI</option>
        <option value="together">Together.ai</option>
      </select>
      <p class="form-help">
        Selecione o modelo de IA a ser utilizado. Modelos locais não têm custo por token.
      </p>
    </div>

    <div v-if="modeloConfig.ia_avancada_ativa && modeloConfig.modelo_ia === 'openai'">
      <div class="form-group">
        <label for="api-key">Chave API OpenAI</label>
        <div class="input-with-buttons">
          <input 
            :type="mostrarChave ? 'text' : 'password'" 
            id="api-key" 
            v-model="modeloConfig.openai_api_key"
            placeholder="sk-..." 
            class="full-width"
          >
          <button class="btn-icon-only" @click="mostrarChave = !mostrarChave">
            <img :src="mostrarChave ? '/icons/eye-off.svg' : '/icons/eye.svg'" alt="Mostrar/Ocultar">
          </button>
        </div>
        <p class="form-help">
          Obtenha uma chave API em <a href="https://platform.openai.com/api-keys" target="_blank">platform.openai.com</a>
        </p>
      </div>
    </div>

    <div v-if="modeloConfig.ia_avancada_ativa && modeloConfig.modelo_ia === 'local'">
      <div class="form-group">
        <label>URL do Servidor Ollama</label>
        <input 
          type="text" 
          v-model="modeloConfig.ollama_url" 
          class="full-width"
          placeholder="http://localhost:11434"
        >
        <p class="form-help">
          Endereço do servidor Ollama local ou remoto (padrão: http://localhost:11434)
        </p>
      </div>
      
      <div class="form-group">
        <label>Modelo</label>
        <select v-model="modeloConfig.ollama_modelo" class="full-width">
          <option value="mistral">Mistral (recomendado)</option>
          <option value="llama2">Llama 2</option>
          <option value="orca-mini">Orca Mini</option>
        </select>
        <p class="form-help">
          Modelo a ser usado no Ollama. Certifique-se de tê-lo baixado usando o comando: ollama pull [modelo]
        </p>
      </div>
      
      <div class="form-group">
        <button @click="$emit('testar-conexao-local')" class="btn-secondary">
          <span v-if="testando" class="spinner"></span>
          {{ testando ? 'Testando...' : 'Verificar Disponibilidade' }}
        </button>
      </div>
    </div>
    
    <div class="form-group" v-if="modeloConfig.ia_avancada_ativa">
      <label for="historico-limite">Limite de histórico para contexto</label>
      <input 
        type="number" 
        id="historico-limite" 
        v-model.number="modeloConfig.limite_historico_analises"
        min="1" 
        max="20" 
        class="full-width"
      >
      <p class="form-help">
        Número de análises históricas que serão usadas como contexto para melhorar a precisão.
      </p>
    </div>
    
    <div class="actions">
      <button 
        @click="salvar" 
        class="btn-primary" 
        :disabled="salvando"
      >
        <span v-if="salvando" class="spinner"></span>
        {{ salvando ? 'Salvando...' : 'Salvar Configurações' }}
      </button>
      
      <button 
        @click="$emit('testar-conexao')" 
        class="btn-secondary" 
        :disabled="testando || !modeloConfig.ia_avancada_ativa || !modeloConfig.openai_api_key"
      >
        <span v-if="testando" class="spinner"></span>
        {{ testando ? 'Testando...' : 'Testar Conexão' }}
      </button>

      <button @click="$emit('testar-conexao-ollama')" class="btn-secondary">
        <span v-if="testando" class="spinner"></span>
        {{ testando ? 'Testando...' : 'Verificar Disponibilidade do Ollama' }}
      </button>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue';

export default {
  name: 'ModeloIAConfig',
  
  props: {
    configuracoes: {
      type: Object,
      required: true
    },
    salvando: {
      type: Boolean,
      default: false
    },
    testando: {
      type: Boolean,
      default: false
    }
  },
  
  emits: ['salvar', 'testar-conexao', 'testar-conexao-local', 'testar-conexao-ollama'],
  
  setup(props, { emit }) {
    const mostrarChave = ref(false);
    const modeloConfig = ref({ ...props.configuracoes });
    
    // Sincronizar mudanças dos props para a ref local
    watch(() => props.configuracoes, (newConfig) => {
      modeloConfig.value = { ...newConfig };
    }, { deep: true });
    
    // Sincronizar mudanças da ref local para o componente pai
    watch(modeloConfig, (newConfig) => {
      // Apenas emitir eventos para alterações específicas de usuário, não para sincronização
    }, { deep: true });
    
    const salvar = () => {
      emit('salvar', modeloConfig.value);
    };
    
    return {
      mostrarChave,
      modeloConfig,
      salvar
    };
  }
}
</script>

<style scoped>
.config-section {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 25px;
}

h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
  font-size: 1.3rem;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-help {
  color: #666;
  font-size: 0.9rem;
  margin-top: 5px;
}

.full-width {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.switch-group {
  display: flex;
  flex-direction: column;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
  margin-left: 10px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
}

input:checked + .slider {
  background-color: #2196F3;
}

input:focus + .slider {
  box-shadow: 0 0 1px #2196F3;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.slider.round {
  border-radius: 24px;
}

.slider.round:before {
  border-radius: 50%;
}

.input-with-buttons {
  display: flex;
  align-items: center;
}

.input-with-buttons input {
  flex: 1;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.btn-icon-only {
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-left: none;
  height: 42px;
  width: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
}

.btn-icon-only:hover {
  background-color: #e0e0e0;
}

.btn-icon-only img {
  width: 18px;
  height: 18px;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn-primary, .btn-secondary {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: #2196f3;
  color: white;
}

.btn-primary:hover {
  background-color: #1976d2;
}

.btn-primary:disabled {
  background-color: #b3e0ff;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}

.spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  margin-right: 8px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

.btn-secondary .spinner {
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-top-color: #333;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
