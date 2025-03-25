import { ref } from 'vue';
import axios from 'axios';

export function useIALocal() {
  const processando = ref(false);
  const erro = ref(null);
  const modeloDisponivel = ref(false);
  
  /**
   * Verifica se o servidor Ollama está disponível
   */
  const verificarDisponibilidade = async () => {
    try {
      // Verificar se o servidor Ollama está rodando
      const response = await axios.get('http://localhost:11434/api/tags');
      modeloDisponivel.value = response.status === 200;
      return modeloDisponivel.value;
    } catch (error) {
      console.warn('Ollama não está disponível:', error);
      modeloDisponivel.value = false;
      return false;
    }
  };

  /**
   * Analisa texto usando modelo local Ollama
   */
  const analisarComModeloLocal = async (texto, dadosHistoricos = null) => {
    try {
      processando.value = true;
      
      // Construir o prompt com contexto
      let contextoDados = '';
      if (dadosHistoricos && dadosHistoricos.length > 0) {
        contextoDados = 'Exemplos de publicações anteriores:\n';
        dadosHistoricos.forEach((item, index) => {
          contextoDados += `Exemplo ${index + 1}: ${item.texto.substring(0, 100)}...\n`;
        });
      }
      
      const prompt = `
        ${contextoDados}
        
        Você é um assistente especializado em análise de publicações contratuais e licitações. 
        Extraia as seguintes informações do texto abaixo e responda apenas com um objeto JSON:
        
        TEXTO DA PUBLICAÇÃO:
        ${texto}
        
        Responda APENAS com um objeto JSON válido no seguinte formato, sem explicações:
        {
          "numero_processo": "string ou null se não encontrado",
          "orgao": "string ou null se não encontrado",
          "municipio": "string ou null se não encontrado",
          "estado": "string ou null se não encontrado",
          "data_licitacao": "YYYY-MM-DD ou null se não encontrada",
          "empresa_vencedora": "string ou null se não encontrada",
          "numero_contrato": "string ou null se não encontrado"
        }
      `;
      
      // Chamar API Ollama (geralmente em localhost:11434)
      const response = await axios.post('http://localhost:11434/api/generate', {
        model: 'mistral', // ou 'llama2', 'nous-hermes' dependendo do que você baixou
        prompt: prompt,
        stream: false
      });
      
      try {
        // A resposta do Ollama está no campo 'response'
        const jsonStr = response.data.response;
        // Extrair objeto JSON da resposta
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const resultado = JSON.parse(jsonMatch[0]);
          return resultado;
        }
        throw new Error('Não foi possível extrair JSON da resposta');
      } catch (parseError) {
        console.error('Erro ao processar resposta:', parseError);
        throw new Error('Formato de resposta inválido');
      }
    } catch (error) {
      console.error('Erro na análise com modelo local:', error);
      erro.value = error;
      throw error;
    } finally {
      processando.value = false;
    }
  };
  
  return {
    processando,
    erro,
    modeloDisponivel,
    verificarDisponibilidade,
    analisarComModeloLocal
  };
}