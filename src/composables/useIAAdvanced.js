import { ref } from 'vue';
import { supabase } from '@/lib/supabase';
import axios from 'axios';

export function useIAAdvanced() {
  const processando = ref(false);
  const erro = ref(null);
  const modeloDisponivel = ref(false);
  
  /**
   * Verifica se a integração com modelo avançado está disponível
   */
  const verificarDisponibilidade = async () => {
    try {
      // Verificar configurações do modelo
      const { data: configData } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('chave', 'ia_avancada_ativa')
        .single();
      
      if (configData?.valor === 'true') {
        // Verificar se temos chave API configurada
        const { data: apiKeyData } = await supabase
          .from('configuracoes')
          .select('valor')
          .eq('chave', 'openai_api_key')
          .single();
        
        modeloDisponivel.value = !!apiKeyData?.valor;
        return modeloDisponivel.value;
      }
      
      modeloDisponivel.value = false;
      return false;
    } catch (error) {
      console.warn('Erro ao verificar disponibilidade de IA avançada:', error);
      modeloDisponivel.value = false;
      return false;
    }
  };

  /**
   * Extrai informações usando o modelo avançado de IA
   */
  const analisarComModeloAvancado = async (texto, dadosHistoricos = null) => {
    if (!await verificarDisponibilidade()) {
      throw new Error('Modelo avançado não está disponível');
    }
    
    try {
      processando.value = true;
      
      // Obter a chave API
      const { data: apiKeyData } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('chave', 'openai_api_key')
        .single();
      
      if (!apiKeyData?.valor) {
        throw new Error('Chave API não encontrada');
      }
      
      // Preparar o contexto com dados históricos
      let contextoDados = '';
      if (dadosHistoricos && dadosHistoricos.length > 0) {
        contextoDados = 'Exemplos de publicações anteriores e informações extraídas:\n';
        dadosHistoricos.forEach((item, index) => {
          contextoDados += `Exemplo ${index + 1}:\n`;
          contextoDados += `Texto: ${item.texto.substring(0, 300)}...\n`;
          contextoDados += `Número do Processo: ${item.numero_processo || 'Não identificado'}\n`;
          contextoDados += `Órgão: ${item.orgao || 'Não identificado'}\n`;
          contextoDados += `Município: ${item.municipio || 'Não identificado'}\n`;
          contextoDados += `Estado: ${item.estado || 'Não identificado'}\n`;
          contextoDados += `Data da Licitação: ${item.data_licitacao || 'Não identificada'}\n`;
          contextoDados += `Empresa Vencedora: ${item.empresa_vencedora || 'Não identificada'}\n`;
          contextoDados += `Número do Contrato: ${item.numero_contrato || 'Não identificado'}\n\n`;
        });
      }
      
      // Construir o prompt para o modelo
      const prompt = `
        Você é um assistente especializado em análise de publicações contratuais e licitações. 
        Extraia as seguintes informações do texto abaixo:
        
        1. Número do Processo
        2. Órgão Licitante
        3. Município
        4. Estado/UF (apenas a sigla)
        5. Data da Licitação (em formato ISO YYYY-MM-DD)
        6. Empresa Vencedora (nome completo)
        7. Número do Contrato
        
        ${contextoDados}
        
        TEXTO DA PUBLICAÇÃO:
        ${texto}
        
        Responda APENAS com um objeto JSON válido no seguinte formato, sem explicações adicionais:
        {
          "numero_processo": "string ou null se não encontrado",
          "orgao": "string ou null se não encontrado",
          "municipio": "string ou null se não encontrado",
          "estado": "string ou null se não encontrado",
          "data_licitacao": "YYYY-MM-DD ou null se não encontrada",
          "empresa_vencedora": "string ou null se não encontrada",
          "numero_contrato": "string ou null se não encontrado",
          "confianca": "número de 0 a 100 representando a confiança na extração"
        }
      `;
      
      // Fazer a chamada à API
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4-turbo-preview', // ou outro modelo adequado
          messages: [
            { role: 'system', content: 'Você é um assistente especializado em extrair informações de publicações contratuais.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1, // baixa temperatura para respostas mais determinísticas
          max_tokens: 1000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKeyData.valor}`
          }
        }
      );
      
      // Extrair a resposta
      const resposta = response.data.choices[0].message.content;
      
      // Tentar fazer parse do JSON
      try {
        const resultado = JSON.parse(resposta);
        
        // Registrar análise para aprendizado futuro
        await registrarAnaliseRealizada(texto, resultado);
        
        return resultado;
      } catch (parseError) {
        console.error('Erro ao fazer parse da resposta da IA:', parseError);
        throw new Error('Erro ao processar resposta do modelo');
      }
    } catch (error) {
      console.error('Erro na análise com modelo avançado:', error);
      erro.value = error;
      throw error;
    } finally {
      processando.value = false;
    }
  };
  
  /**
   * Registra análise realizada para uso futuro no aprendizado
   */
  const registrarAnaliseRealizada = async (texto, resultado) => {
    try {
      await supabase.from('analises_ia').insert({
        texto_publicacao: texto,
        dados_extraidos: resultado,
        modelo: 'gpt-4-turbo-preview',
        timestamp: new Date().toISOString(),
        validado: false // será atualizado com feedback do usuário
      });
    } catch (error) {
      console.warn('Erro ao registrar análise (não crítico):', error);
    }
  };
  
  /**
   * Obtém dados históricos para melhorar o contexto das análises
   */
  const obterDadosHistoricos = async (limite = 5) => {
    try {
      // Obter análises validadas pelo usuário
      const { data: analises } = await supabase
        .from('analises_ia')
        .select('*')
        .eq('validado', true)
        .order('confianca', { ascending: false })
        .limit(limite);
      
      if (!analises || analises.length === 0) {
        return [];
      }
      
      return analises.map(analise => ({
        texto: analise.texto_publicacao,
        ...analise.dados_extraidos
      }));
    } catch (error) {
      console.warn('Erro ao obter dados históricos (não crítico):', error);
      return [];
    }
  };
  
  return {
    processando,
    erro,
    modeloDisponivel,
    verificarDisponibilidade,
    analisarComModeloAvancado,
    obterDadosHistoricos
  };
}