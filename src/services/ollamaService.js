import axios from 'axios';

/**
 * Serviço para interagir com a API do Ollama
 */
export class OllamaService {
  /**
   * Construtor do serviço
   * @param {string} baseUrl - URL base do servidor Ollama (padrão: http://localhost:11434)
   * @param {boolean} useProxy - Se deve usar o proxy configurado no Vite
   */
  constructor(baseUrl = 'http://localhost:11434', useProxy = true) {
    this.originalUrl = baseUrl;
    this.baseUrl = useProxy ? '/ollama-api' : baseUrl;
    this.useProxy = useProxy;
    this.api = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json'
      },
      // Configurações para lidar com problemas de CORS
      withCredentials: false
    });
    
    console.log(`OllamaService inicializado com ${this.useProxy ? 'proxy' : 'acesso direto'} para ${this.baseUrl}`);
  }

  /**
   * Verifica se o servidor Ollama está online e retorna os modelos disponíveis
   * @returns {Promise<Array>} Lista de modelos disponíveis
   */
  async getModelos() {
    try {
      console.log('Obtendo modelos Ollama via:', this.baseUrl);
      const response = await this.api.get('/api/tags');
      console.log('Resposta da API Ollama:', response.data);
      return response.data.models || [];
    } catch (error) {
      console.error('Erro ao obter modelos do Ollama:', error);
      throw new Error('Não foi possível conectar ao servidor Ollama ou listar os modelos.');
    }
  }

  /**
   * Verifica se um modelo específico está disponível
   * @param {string} modeloNome - Nome do modelo para verificar
   * @returns {Promise<boolean>} true se o modelo está disponível, false caso contrário
   */
  async verificarModeloDisponivel(modeloNome) {
    try {
      const modelos = await this.getModelos();
      return modelos.some(modelo => modelo.name === modeloNome);
    } catch (error) {
      console.error('Erro ao verificar disponibilidade do modelo:', error);
      return false;
    }
  }

  /**
   * Gera uma resposta usando o modelo selecionado
   * @param {string} modeloNome - Nome do modelo (ex: gemma3:1b)
   * @param {string} prompt - Texto do prompt
   * @param {Object} options - Opções adicionais para a geração
   * @returns {Promise<string>} Texto gerado como resposta
   */
  async gerarResposta(modeloNome, prompt, options = {}) {
    try {
      const defaultOptions = {
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 0.9,
        stream: false
      };
      
      const config = { ...defaultOptions, ...options };
      
      const response = await this.api.post('/api/generate', {
        model: modeloNome,
        prompt: prompt,
        ...config
      });
      
      return response.data.response;
    } catch (error) {
      console.error('Erro ao gerar resposta com Ollama:', error);
      throw new Error('Falha ao gerar resposta com o modelo Ollama.');
    }
  }

  /**
   * Comandos para baixar e gerenciar modelos Ollama no terminal
   * @returns {Object} Objeto com comandos úteis para o Ollama
   */
  static getComandosUteis() {
    return {
      baixarGemma: 'ollama pull gemma3:1b',
      listarModelos: 'ollama list',
      iniciarServidor: 'ollama serve',
      deletarModelo: 'ollama rm gemma3:1b'
    };
  }
  
  /**
   * Método de diagnóstico para testar a conexão
   * @returns {Promise<Object>} Informações de diagnóstico
   */
  async diagnosticarConexao() {
    const diagnostico = {
      timestamp: new Date().toISOString(),
      urlTentada: this.originalUrl,
      urlsTestadas: [],
      sucessos: [],
      erros: [],
      detalhes: {}
    };
    
    // Testar URL via proxy configurado no Vite
    try {
      const response = await this.api.get('/api/tags');
      diagnostico.urlsTestadas.push(`${this.baseUrl}/api/tags (via proxy)`);
      diagnostico.sucessos.push(`${this.baseUrl}/api/tags (via proxy)`);
      diagnostico.detalhes['proxy'] = {
        status: 'sucesso',
        data: response.data,
        timestamp: new Date().toISOString()
      };
      
      // Se tivermos sucesso aqui, podemos retornar imediatamente
      return diagnostico;
    } catch (error) {
      console.error('Erro ao acessar via proxy:', error);
      diagnostico.urlsTestadas.push(`${this.baseUrl}/api/tags (via proxy)`);
      diagnostico.erros.push(`${this.baseUrl}/api/tags (via proxy): ${error.message}`);
      diagnostico.detalhes['proxy'] = {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
    
    // Se ainda estamos tentando, vamos tentar diretamente via fetch com mode: no-cors
    // Isso pelo menos nos dirá se o servidor está respondendo, mesmo que não possamos acessar os dados
    try {
      await fetch(`${this.originalUrl}/api/tags`, { 
        method: 'GET',
        mode: 'no-cors'  // Isso permitirá que saibamos se o servidor está ao menos respondendo
      });
      
      // Se chegamos aqui sem erro, o servidor está respondendo, mas não podemos acessar os dados devido ao CORS
      diagnostico.urlsTestadas.push(`${this.originalUrl}/api/tags (no-cors)`);
      diagnostico.sucessos.push(`${this.originalUrl}/api/tags (servidor respondendo, mas CORS bloqueado)`);
      diagnostico.detalhes['no-cors'] = {
        status: 'servidor respondendo, mas CORS bloqueado',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      diagnostico.urlsTestadas.push(`${this.originalUrl}/api/tags (no-cors)`);
      diagnostico.erros.push(`${this.originalUrl}/api/tags: ${error.message}`);
      diagnostico.detalhes['no-cors'] = {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
    
    return diagnostico;
  }
}

// Instância padrão que pode ser usada diretamente - SEMPRE usar o proxy
export const ollamaService = new OllamaService(undefined, true);
