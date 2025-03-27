import axios from 'axios';
import { ollamaService } from './ollamaService';

/**
 * Serviço unificado para interagir com vários provedores de IA
 */
export class IAService {
  constructor() {
    this.provedores = {
      'openai': this.criarOpenAIClient,
      'claude': this.criarClaudeClient,
      'mistral': this.criarMistralClient,
      'gemini': this.criarGeminiClient,
      'deepseek': this.criarDeepseekClient,
      'copilot': this.criarCopilotClient,
      'local': () => ollamaService
    };
  }

  /**
   * Obtém o cliente apropriado para o provedor especificado
   * @param {string} provedor - Nome do provedor (openai, claude, etc)
   * @param {Object} config - Configurações do provedor
   * @returns {Object} Cliente do provedor
   */
  getProvedor(provedor, config) {
    if (!this.provedores[provedor]) {
      throw new Error(`Provedor não suportado: ${provedor}`);
    }
    
    return this.provedores[provedor](config);
  }

  /**
   * Cria um cliente para a API OpenAI
   * @param {Object} config - Configurações do OpenAI
   * @returns {Object} Cliente OpenAI
   */
  criarOpenAIClient(config) {
    const client = axios.create({
      baseURL: 'https://api.openai.com/v1',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.openai_api_key}`
      }
    });

    return {
      async gerarResposta(prompt, options = {}) {
        const defaultOptions = {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'Você é um assistente útil.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1024
        };
        
        const requestOptions = { ...defaultOptions, ...options };
        
        const response = await client.post('/chat/completions', requestOptions);
        return response.data.choices[0].message.content;
      },
      
      async testarConexao() {
        const response = await client.post('/chat/completions', {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'Você é um assistente útil.' },
            { role: 'user', content: 'Teste de conexão' }
          ],
          max_tokens: 5
        });
        
        return response.status === 200;
      }
    };
  }

  /**
   * Cria um cliente para a API Claude (Anthropic)
   * @param {Object} config - Configurações do Claude
   * @returns {Object} Cliente Claude
   */
  criarClaudeClient(config) {
    const client = axios.create({
      baseURL: 'https://api.anthropic.com/v1',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.claude_api_key,
        'anthropic-version': '2023-06-01'
      }
    });

    return {
      async gerarResposta(prompt, options = {}) {
        const defaultOptions = {
          model: config.claude_modelo || 'claude-3-sonnet-20240229',
          max_tokens: 1024,
          temperature: 0.7
        };
        
        const requestOptions = { 
          ...defaultOptions, 
          ...options,
          messages: [
            { role: 'user', content: prompt }
          ]
        };
        
        const response = await client.post('/messages', requestOptions);
        return response.data.content[0].text;
      },
      
      async testarConexao() {
        const response = await client.post('/messages', {
          model: config.claude_modelo || 'claude-3-sonnet-20240229',
          max_tokens: 5,
          messages: [{ role: 'user', content: 'Teste de conexão' }]
        });
        
        return response.status === 200;
      }
    };
  }

  /**
   * Cria um cliente para a API Mistral
   * @param {Object} config - Configurações do Mistral
   * @returns {Object} Cliente Mistral
   */
  criarMistralClient(config) {
    const client = axios.create({
      baseURL: 'https://api.mistral.ai/v1',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.mistral_api_key}`
      }
    });

    return {
      async gerarResposta(prompt, options = {}) {
        const defaultOptions = {
          model: config.mistral_modelo || 'mistral-medium',
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1024
        };
        
        const requestOptions = { ...defaultOptions, ...options };
        
        const response = await client.post('/chat/completions', requestOptions);
        return response.data.choices[0].message.content;
      },
      
      async testarConexao() {
        const response = await client.post('/chat/completions', {
          model: config.mistral_modelo || 'mistral-medium',
          messages: [{ role: 'user', content: 'Teste de conexão' }],
          max_tokens: 5
        });
        
        return response.status === 200;
      }
    };
  }

  /**
   * Cria um cliente para a API Google Gemini
   * @param {Object} config - Configurações do Gemini
   * @returns {Object} Cliente Gemini
   */
  criarGeminiClient(config) {
    return {
      async gerarResposta(prompt, options = {}) {
        const url = `https://generativelanguage.googleapis.com/v1/models/${config.gemini_modelo || 'gemini-1.5-pro'}:generateContent?key=${config.gemini_api_key}`;
        
        const defaultOptions = {
          temperature: 0.7,
          maxOutputTokens: 1024,
          topP: 0.9
        };
        
        const requestOptions = { 
          ...defaultOptions, 
          ...options,
          contents: [{
            parts: [{ text: prompt }]
          }]
        };
        
        const response = await axios.post(url, requestOptions);
        return response.data.candidates[0].content.parts[0].text;
      },
      
      async testarConexao() {
        const url = `https://generativelanguage.googleapis.com/v1/models/${config.gemini_modelo || 'gemini-1.5-pro'}:generateContent?key=${config.gemini_api_key}`;
        
        const response = await axios.post(url, {
          contents: [{
            parts: [{ text: 'Teste de conexão' }]
          }],
          maxOutputTokens: 5
        });
        
        return response.status === 200;
      }
    };
  }

  /**
   * Cria um cliente para a API DeepSeek
   * @param {Object} config - Configurações do DeepSeek
   * @returns {Object} Cliente DeepSeek
   */
  criarDeepseekClient(config) {
    const client = axios.create({
      baseURL: 'https://api.deepseek.com/v1',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.deepseek_api_key}`
      }
    });

    return {
      async gerarResposta(prompt, options = {}) {
        const defaultOptions = {
          model: config.deepseek_modelo === 'deepseek-coder' ? 'deepseek-coder-v1.5' : 'deepseek-v1',
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1024
        };
        
        const requestOptions = { ...defaultOptions, ...options };
        
        const response = await client.post('/chat/completions', requestOptions);
        return response.data.choices[0].message.content;
      },
      
      async testarConexao() {
        const model = config.deepseek_modelo === 'deepseek-coder' ? 'deepseek-coder-v1.5' : 'deepseek-v1';
        
        const response = await client.post('/chat/completions', {
          model: model,
          messages: [{ role: 'user', content: 'Teste de conexão' }],
          max_tokens: 5
        });
        
        return response.status === 200;
      }
    };
  }

  /**
   * Cria um cliente para a API Microsoft Copilot
   * @param {Object} config - Configurações do Copilot
   * @returns {Object} Cliente Copilot
   */
  criarCopilotClient(config) {
    // Implementação básica - seria necessário usar OAuth e outras configurações adicionais
    // para uma implementação real com Microsoft Copilot
    return {
      async gerarResposta(prompt, options = {}) {
        throw new Error('Integração com Microsoft Copilot não implementada');
      },
      
      async testarConexao() {
        throw new Error('Integração com Microsoft Copilot não implementada');
      }
    };
  }
}

export const iaService = new IAService();
