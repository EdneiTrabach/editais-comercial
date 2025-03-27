<template>
  <div class="ollama-diagnostico">
    <h3>Diagnóstico de Conexão Ollama</h3>
    
    <div class="diagnostico-status" v-if="testando">
      <div class="spinner"></div>
      <p>Executando diagnóstico de conexão...</p>
    </div>
    
    <div v-else-if="diagnosticoResultado" class="diagnostico-resultado">
      <div class="status-geral" :class="statusConexao">
        <div class="status-icon">
          <span v-if="statusConexao === 'sucesso'" class="icon">✓</span>
          <span v-else-if="statusConexao === 'erro'" class="icon">✕</span>
          <span v-else class="icon">⚠</span>
        </div>
        <div class="status-texto">
          <h4>Status da conexão: {{ statusConexaoTexto }}</h4>
          <p>{{ statusConexaoMensagem }}</p>
        </div>
      </div>
      
      <div class="detalhes-conexao">
        <h5>Detalhes técnicos:</h5>
        
        <div class="urls-testadas">
          <div class="url-item" v-for="(url, index) in diagnosticoResultado.urlsTestadas" :key="index">
            <div class="url-status" :class="urlFoiSucesso(url) ? 'sucesso' : 'erro'">
              <i v-if="urlFoiSucesso(url)" class="fas fa-check"></i>
              <i v-else class="fas fa-times"></i>
            </div>
            <div class="url-texto">{{ url }}</div>
          </div>
        </div>
        
        <div class="resolucao-sugestoes" v-if="statusConexao === 'erro'">
          <h5>Sugestões para corrigir o problema:</h5>
          
          <div class="notification warning-notification">
            <p><strong>Problemas de CSP detectados.</strong> Tente as seguintes ações:</p>
            
            <ol>
              <li>
                <strong>Reinicie o servidor Vite</strong> para aplicar as novas configurações de CSP.
                <pre>npm run dev</pre>
                ou
                <pre>yarn dev</pre>
              </li>
              <li>
                <strong>Verifique se o Ollama está rodando</strong> em http://localhost:11434
                <pre>ollama serve</pre>
              </li>
              <li>
                <strong>Teste o modelo diretamente</strong> para confirmar que está funcionando:
                <pre>ollama run gemma3:1b</pre>
              </li>
            </ol>
          </div>
          
          <ul>
            <li v-if="statusConexao === 'erro'">
              <strong>Verifique se o servidor Ollama está rodando.</strong> 
              Execute <code>ollama serve</code> em um terminal.
            </li>
            <li v-if="diagnosticoResultado.erros.length > 0">
              <strong>Verifique se a porta 11434 está acessível.</strong>
              Certifique-se de que seu firewall não está bloqueando a porta.
            </li>
            <li>
              <strong>Verifique se o modelo Gemma 3:1B está instalado.</strong>
              Execute <code>ollama list</code> no terminal para ver os modelos disponíveis.
            </li>
            <li v-if="statusConexao === 'erro'">
              <strong>Para instalar o modelo, execute:</strong>
              <pre>ollama pull gemma3:1b</pre>
            </li>
          </ul>
        </div>
      </div>
      
      <div class="acoes-diagnostico">
        <button class="btn-secondary" @click="executarDiagnostico">
          Executar Diagnóstico Novamente
        </button>
        <button class="btn-primary" @click="$emit('tentar-conexao')">
          Tentar Conectar
        </button>
      </div>
    </div>
    
    <div v-else class="sem-diagnostico">
      <p>Nenhum diagnóstico realizado ainda.</p>
      <button class="btn-secondary" @click="executarDiagnostico">
        Executar Diagnóstico de Conexão
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue';
import { ollamaService } from '@/services/ollamaService';

export default {
  name: 'OllamaStatusDiagnostic',
  
  emits: ['tentar-conexao', 'success', 'error'],
  
  setup(props, { emit }) {
    const testando = ref(false);
    const diagnosticoResultado = ref(null);
    
    const statusConexao = computed(() => {
      if (!diagnosticoResultado.value) return 'indefinido';
      
      if (diagnosticoResultado.value.sucessos.length > 0) {
        return 'sucesso';
      } else if (diagnosticoResultado.value.erros.length > 0) {
        return 'erro';
      }
      
      return 'indefinido';
    });
    
    const statusConexaoTexto = computed(() => {
      switch (statusConexao.value) {
        case 'sucesso': return 'Conectado';
        case 'erro': return 'Falha na conexão';
        default: return 'Indeterminado';
      }
    });
    
    const statusConexaoMensagem = computed(() => {
      if (statusConexao.value === 'sucesso') {
        return 'O servidor Ollama está respondendo. Verifique se o modelo selecionado está disponível.';
      } else if (statusConexao.value === 'erro') {
        return 'Não foi possível conectar ao servidor Ollama. Verifique se ele está executando.';
      }
      
      return 'Execute o diagnóstico para verificar a conexão.';
    });
    
    const urlFoiSucesso = (url) => {
      if (!diagnosticoResultado.value) return false;
      return diagnosticoResultado.value.sucessos.some(s => s.includes(url));
    };
    
    const executarDiagnostico = async () => {
      testando.value = true;
      
      try {
        diagnosticoResultado.value = await ollamaService.diagnosticarConexao();
        
        // Emitir evento de sucesso se a conexão for bem-sucedida
        if (diagnosticoResultado.value.sucessos.length > 0) {
          emit('success');
        } else {
          emit('error');
        }
      } catch (error) {
        console.error('Erro ao executar diagnóstico:', error);
        diagnosticoResultado.value = {
          timestamp: new Date().toISOString(),
          urlsTestadas: ['Diagnóstico falhou'],
          sucessos: [],
          erros: [`Falha no diagnóstico: ${error.message}`],
          detalhes: { error: error.message }
        };
        emit('error');
      } finally {
        testando.value = false;
      }
    };
    
    // Observar mudanças no status da conexão
    watch(statusConexao, (newStatus) => {
      if (newStatus === 'sucesso') {
        emit('success');
      } else if (newStatus === 'erro') {
        emit('error');
      }
    });
    
    // Executar diagnóstico automaticamente ao montar o componente
    onMounted(() => {
      executarDiagnostico();
    });
    
    return {
      testando,
      diagnosticoResultado,
      statusConexao,
      statusConexaoTexto,
      statusConexaoMensagem,
      urlFoiSucesso,
      executarDiagnostico
    };
  }
}
</script>

<style scoped>
.ollama-diagnostico {
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
  border: 1px solid #e0e6ed;
}

h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
  font-size: 1.1rem;
}

.diagnostico-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.diagnostico-resultado {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.status-geral {
  display: flex;
  padding: 15px;
  border-radius: 6px;
  align-items: center;
  gap: 15px;
}

.status-geral.sucesso {
  background-color: #e8f5e9;
  border-left: 4px solid #4caf50;
}

.status-geral.erro {
  background-color: #ffebee;
  border-left: 4px solid #f44336;
}

.status-geral.indefinido {
  background-color: #fff8e1;
  border-left: 4px solid #ffc107;
}

.status-icon {
  font-size: 24px;
}

.status-geral.sucesso .status-icon {
  color: #4caf50;
}

.status-geral.erro .status-icon {
  color: #f44336;
}

.status-geral.indefinido .status-icon {
  color: #ffc107;
}

.status-texto h4 {
  margin: 0 0 5px 0;
  font-size: 1rem;
}

.status-texto p {
  margin: 0;
  font-size: 0.9rem;
  color: #555;
}

.detalhes-conexao {
  background-color: #fff;
  border-radius: 6px;
  padding: 15px;
  border: 1px solid #e0e6ed;
}

.detalhes-conexao h5 {
  margin: 0 0 10px 0;
  font-size: 0.95rem;
  color: #333;
}

.urls-testadas {
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.url-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 4px;
  background-color: #f5f7fa;
}

.url-status {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.url-status.sucesso {
  background-color: #e8f5e9;
  color: #4caf50;
}

.url-status.erro {
  background-color: #ffebee;
  color: #f44336;
}

.url-texto {
  font-family: monospace;
  font-size: 0.9rem;
}

.resolucao-sugestoes ul {
  margin: 10px 0;
  padding-left: 20px;
}

.resolucao-sugestoes li {
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.resolucao-sugestoes code, .resolucao-sugestoes pre {
  background-color: #f1f1f1;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 0.9rem;
  font-family: monospace;
}

.resolucao-sugestoes pre {
  padding: 10px;
  margin: 8px 0;
}

.acoes-diagnostico {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.sem-diagnostico {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  padding: 20px;
}

.spinner {
  display: inline-block;
  width: 24px;
  height: 24px;
  border: 3px solid rgba(33, 150, 243, 0.3);
  border-radius: 50%;
  border-top-color: #2196f3;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.notification.warning-notification {
  background-color: #fff3e0;
  border-left: 4px solid #ff9800;
  color: #7f4d00;
  padding: 12px 15px;
  margin-bottom: 15px;
  border-radius: 4px;
}

.notification ol {
  margin-top: 10px;
  padding-left: 20px;
}

.notification li {
  margin-bottom: 10px;
}

.notification pre {
  background-color: rgba(255, 255, 255, 0.5);
  padding: 8px;
  border-radius: 4px;
  font-family: monospace;
  margin: 8px 0;
}

.icon {
  font-size: 24px;
  font-weight: bold;
}

.status-geral.sucesso .icon {
  color: #4caf50;
}

.status-geral.erro .icon {
  color: #f44336;
}

.status-geral.indefinido .icon {
  color: #ffc107;
}
</style>
