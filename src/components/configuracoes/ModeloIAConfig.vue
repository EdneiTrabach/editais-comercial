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
        <option value="gemini">Google Gemini</option>
        <option value="openai">OpenAI (GPT-4/GPT-3.5)</option>
        <option value="local">Modelo Local (Ollama)</option>
        <option value="mistral">Mistral AI</option>
        <option value="claude">Anthropic Claude</option>
        <option value="deepseek">DeepSeek</option>
        <option value="copilot">Microsoft Copilot</option>
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
          <option value="gemma3:1b">Gemma 3:1B (recomendado)</option>
          <option value="mistral">Mistral</option>
          <option value="llama2">Llama 2</option>
          <option value="orca-mini">Orca Mini</option>
        </select>
        <p class="form-help">
          Modelo a ser usado no Ollama. Certifique-se de tê-lo baixado usando o comando: <code>ollama pull gemma3:1b</code> (ou outro modelo selecionado)
        </p>
      </div>
      
      <div class="form-group">
        <div class="notification info-notification">
          <p><strong>Dica para instalação do Gemma 3:1B:</strong></p>
          <p>Para instalar o modelo Gemma 3:1B, execute no terminal:</p>
          <pre>ollama pull gemma3:1b</pre>
          <p>Tamanho aproximado: 815 MB</p>
        </div>
        
        <!-- Adicionando diagnóstico de conexão -->
        <OllamaStatusDiagnostic 
          @tentar-conexao="$emit('testar-conexao-ollama')" 
          @success="ollamaConectado = true"
        />
        
        <div v-if="ollamaConectado" class="notification success-notification">
          <p><strong>Ollama conectado!</strong> O sistema está pronto para usar o modelo local.</p>
          <p>Modelo configurado: <strong>{{ modeloConfig.ollama_modelo }}</strong></p>
        </div>
        
        <button @click="$emit('testar-conexao-local')" class="btn-secondary">
          <span v-if="testando" class="spinner"></span>
          {{ testando ? 'Testando...' : 'Verificar Disponibilidade' }}
        </button>
      </div>
    </div>
    
    <div v-if="modeloConfig.ia_avancada_ativa && modeloConfig.modelo_ia === 'claude'">
      <div class="form-group">
        <label for="claude-api-key">Chave API Claude (Anthropic)</label>
        <div class="input-with-buttons">
          <input 
            :type="mostrarChavesClaude ? 'text' : 'password'" 
            id="claude-api-key" 
            v-model="modeloConfig.claude_api_key"
            placeholder="sk-ant-..." 
            class="full-width"
          >
          <button class="btn-icon-only" @click="mostrarChavesClaude = !mostrarChavesClaude">
            <img :src="mostrarChavesClaude ? '/icons/eye-off.svg' : '/icons/eye.svg'" alt="Mostrar/Ocultar">
          </button>
        </div>
        <p class="form-help">
          Obtenha uma chave API em <a href="https://console.anthropic.com/keys" target="_blank">console.anthropic.com</a>
        </p>
      </div>
      
      <div class="form-group">
        <label for="claude-modelo">Modelo Claude</label>
        <select id="claude-modelo" v-model="modeloConfig.claude_modelo" class="full-width">
          <option value="claude-3-opus-20240229">Claude 3 Opus</option>
          <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
          <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
          <option value="claude-2.1">Claude 2.1</option>
        </select>
        <p class="form-help">
          Selecione o modelo Claude a ser utilizado. Opus é o mais potente, Haiku é o mais rápido.
        </p>
      </div>
    </div>
    
    <div v-if="modeloConfig.ia_avancada_ativa && modeloConfig.modelo_ia === 'gemini'">
      <div class="form-group">
        <label for="gemini-api-key">Chave API Google Gemini</label>
        <div class="input-with-buttons">
          <input 
            :type="mostrarChavesGemini ? 'text' : 'password'" 
            id="gemini-api-key" 
            v-model="modeloConfig.gemini_api_key"
            placeholder="AIza..." 
            class="full-width"
          >
          <button class="btn-icon-only" @click="mostrarChavesGemini = !mostrarChavesGemini">
            <img :src="mostrarChavesGemini ? '/icons/eye-off.svg' : '/icons/eye.svg'" alt="Mostrar/Ocultar">
          </button>
        </div>
        <p class="form-help">
          Obtenha uma chave API em <a href="https://ai.google.dev/tutorials/setup" target="_blank">Google AI Studio</a>
        </p>
      </div>
      
      <div class="form-group">
        <label for="gemini-modelo">Modelo Gemini</label>
        <select id="gemini-modelo" v-model="modeloConfig.gemini_modelo" class="full-width">
          <option value="gemini-1.0-pro">Gemini 1.0 Pro</option>
          <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
          <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
        </select>
      </div>
    </div>
    
    <div v-if="modeloConfig.ia_avancada_ativa && modeloConfig.modelo_ia === 'deepseek'">
      <div class="form-group">
        <label for="deepseek-api-key">Chave API DeepSeek</label>
        <div class="input-with-buttons">
          <input 
            :type="mostrarChavesDeepseek ? 'text' : 'password'" 
            id="deepseek-api-key" 
            v-model="modeloConfig.deepseek_api_key"
            placeholder="sk-..." 
            class="full-width"
          >
          <button class="btn-icon-only" @click="mostrarChavesDeepseek = !mostrarChavesDeepseek">
            <img :src="mostrarChavesDeepseek ? '/icons/eye-off.svg' : '/icons/eye.svg'" alt="Mostrar/Ocultar">
          </button>
        </div>
        <p class="form-help">
          Obtenha uma chave API em <a href="https://platform.deepseek.com/" target="_blank">platform.deepseek.com</a>
        </p>
      </div>
      
      <div class="form-group">
        <label for="deepseek-modelo">Modelo DeepSeek</label>
        <select id="deepseek-modelo" v-model="modeloConfig.deepseek_modelo" class="full-width">
          <option value="deepseek-chat">DeepSeek Chat</option>
          <option value="deepseek-coder">DeepSeek Coder</option>
        </select>
      </div>
    </div>
    
    <div v-if="modeloConfig.ia_avancada_ativa && modeloConfig.modelo_ia === 'copilot'">
      <div class="form-group">
        <label for="copilot-api-key">Chave API Microsoft Copilot</label>
        <div class="input-with-buttons">
          <input 
            :type="mostrarChavesCopilot ? 'text' : 'password'" 
            id="copilot-api-key" 
            v-model="modeloConfig.copilot_api_key"
            placeholder="..." 
            class="full-width"
          >
          <button class="btn-icon-only" @click="mostrarChavesCopilot = !mostrarChavesCopilot">
            <img :src="mostrarChavesCopilot ? '/icons/eye-off.svg' : '/icons/eye.svg'" alt="Mostrar/Ocultar">
          </button>
        </div>
        <p class="form-help">
          Para usar o Microsoft Copilot, é necessário ter uma assinatura válida da Microsoft.
        </p>
      </div>
      
      <div class="notification info-notification">
        <p><strong>Nota:</strong> A integração com Microsoft Copilot é limitada e requer configurações adicionais de autenticação Microsoft.</p>
      </div>
    </div>
    
    <div v-if="modeloConfig.ia_avancada_ativa && modeloConfig.modelo_ia === 'mistral'">
      <div class="form-group">
        <label for="mistral-api-key">Chave API Mistral AI</label>
        <div class="input-with-buttons">
          <input 
            :type="mostrarChavesMistral ? 'text' : 'password'" 
            id="mistral-api-key" 
            v-model="modeloConfig.mistral_api_key"
            placeholder="..." 
            class="full-width"
          >
          <button class="btn-icon-only" @click="mostrarChavesMistral = !mostrarChavesMistral">
            <img :src="mostrarChavesMistral ? '/icons/eye-off.svg' : '/icons/eye.svg'" alt="Mostrar/Ocultar">
          </button>
        </div>
        <p class="form-help">
          Obtenha uma chave API em <a href="https://console.mistral.ai/" target="_blank">console.mistral.ai</a>
        </p>
      </div>
      
      <div class="form-group">
        <label for="mistral-modelo">Modelo Mistral</label>
        <select id="mistral-modelo" v-model="modeloConfig.mistral_modelo" class="full-width">
          <option value="mistral-tiny">Mistral Tiny</option>
          <option value="mistral-small">Mistral Small</option>
          <option value="mistral-medium">Mistral Medium</option>
          <option value="mistral-large">Mistral Large</option>
        </select>
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
import { ref, watch, onMounted } from 'vue';
import OllamaStatusDiagnostic from './OllamaStatusDiagnostic.vue';
import { ollamaService } from '@/services/ollamaService';

export default {
  name: 'ModeloIAConfig',
  
  components: {
    OllamaStatusDiagnostic
  },
  
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
    const mostrarChavesClaude = ref(false);
    const mostrarChavesGemini = ref(false);
    const mostrarChavesDeepseek = ref(false);
    const mostrarChavesCopilot = ref(false);
    const mostrarChavesMistral = ref(false);
    
    const modeloConfig = ref({ 
      ...props.configuracoes,
      claude_api_key: '',
      claude_modelo: 'claude-3-sonnet-20240229',
      gemini_api_key: '',
      gemini_modelo: 'gemini-1.5-pro',
      deepseek_api_key: '',
      deepseek_modelo: 'deepseek-chat',
      copilot_api_key: '',
      mistral_api_key: '',
      mistral_modelo: 'mistral-medium'
    });
    
    const ollamaConectado = ref(false);
    
    // Sincronizar mudanças dos props para a ref local
    watch(() => props.configuracoes, (newConfig) => {
      // Manter as chaves existentes mas adicionar as novas propriedades
      modeloConfig.value = { 
        ...newConfig,
        claude_api_key: modeloConfig.value.claude_api_key || '',
        claude_modelo: modeloConfig.value.claude_modelo || 'claude-3-sonnet-20240229',
        gemini_api_key: modeloConfig.value.gemini_api_key || '',
        gemini_modelo: modeloConfig.value.gemini_modelo || 'gemini-1.5-pro',
        deepseek_api_key: modeloConfig.value.deepseek_api_key || '',
        deepseek_modelo: modeloConfig.value.deepseek_modelo || 'deepseek-chat',
        copilot_api_key: modeloConfig.value.copilot_api_key || '',
        mistral_api_key: modeloConfig.value.mistral_api_key || '',
        mistral_modelo: modeloConfig.value.mistral_modelo || 'mistral-medium'
      };
    }, { deep: true });
    
    // Sincronizar mudanças da ref local para o componente pai
    watch(modeloConfig, (newConfig) => {
      // Apenas emitir eventos para alterações específicas de usuário, não para sincronização
    }, { deep: true });
    
    const salvar = () => {
      emit('salvar', modeloConfig.value);
    };
    
    // Verificar status da conexão Ollama ao montar o componente
    onMounted(async () => {
      try {
        // Verificar silenciosamente se o Ollama está disponível
        const modelos = await ollamaService.getModelos();
        ollamaConectado.value = modelos && modelos.length > 0;
        
        // Mover os console.log para dentro do onMounted
        console.log("Configurações ao testar conexão:", {
          modeloSelecionado: props.configuracoes.modelo_ia,
          geminiApiKey: props.configuracoes.gemini_api_key ? "Configurada" : "Não configurada"
        });
      } catch (error) {
        console.log('Ollama ainda não está conectado:', error);
        ollamaConectado.value = false;
      }
    });
    
    return {
      mostrarChave,
      mostrarChavesClaude,
      mostrarChavesGemini,
      mostrarChavesDeepseek,
      mostrarChavesCopilot,
      mostrarChavesMistral,
      modeloConfig,
      ollamaConectado,
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

.notification {
  padding: 12px 15px;
  border-radius: 6px;
  margin-bottom: 15px;
}

.info-notification {
  background-color: #e3f2fd;
  border-left: 4px solid #2196f3;
  color: #0d47a1;
}

.info-notification pre {
  background-color: rgba(255, 255, 255, 0.5);
  padding: 8px;
  border-radius: 4px;
  font-family: monospace;
  margin: 8px 0;
}

.notification.success-notification {
  background-color: #e8f5e9;
  border-left: 4px solid #4caf50;
  color: #1b5e20;
}
</style>
