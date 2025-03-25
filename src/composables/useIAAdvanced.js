import { ref } from 'vue';
import { supabase } from '@/lib/supabase';
import axios from 'axios';
import { useIALocal } from './useIALocal';

export function useIAAdvanced() {
  const processando = ref(false);
  const erro = ref(null);
  const modeloDisponivel = ref(false);
  const iaLocal = useIALocal();
  
  /**
   * Verifica se algum modelo avançado está disponível
   */
  const verificarDisponibilidade = async () => {
    try {
      // Primeiro verificar configurações
      const { data: configData } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('chave', 'ia_avancada_ativa')
        .single();
      
      if (configData?.valor !== 'true') {
        modeloDisponivel.value = false;
        return false;
      }
      
      // Verificar se temos chave API configurada para OpenAI
      const { data: apiKeyData } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('chave', 'openai_api_key')
        .single();
        
      // Verificar modelo selecionado
      const { data: modeloData } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('chave', 'modelo_ia')
        .single();
        
      const modeloSelecionado = modeloData?.valor || 'openai';
      
      // Se for OpenAI, verificar chave
      if (modeloSelecionado === 'openai') {
        modeloDisponivel.value = !!apiKeyData?.valor;
        return modeloDisponivel.value;
      }
      
      // Se for modelo local, verificar disponibilidade
      if (modeloSelecionado === 'local') {
        return await iaLocal.verificarDisponibilidade();
      }
      
      // Outros provedores podem ser adicionados aqui
      
      modeloDisponivel.value = false;
      return false;
    } catch (error) {
      console.warn('Erro ao verificar disponibilidade de IA avançada:', error);
      modeloDisponivel.value = false;
      return false;
    }
  };

  /**
   * Analisa texto usando o modelo adequado
   */
  const analisarComModeloAvancado = async (texto, dadosHistoricos = null) => {
    if (!await verificarDisponibilidade()) {
      throw new Error('Nenhum modelo de IA avançado está disponível');
    }
    
    try {
      processando.value = true;
      
      // Verificar qual modelo usar
      const { data: modeloData } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('chave', 'modelo_ia')
        .single();
        
      const modeloSelecionado = modeloData?.valor || 'openai';
      
      let resultado;
      
      // Usar modelo apropriado
      if (modeloSelecionado === 'local') {
        resultado = await iaLocal.analisarComModeloLocal(texto, dadosHistoricos);
      } else {
        // Por padrão usa OpenAI
        resultado = await analisarComOpenAI(texto, dadosHistoricos);
      }
      
      // Registrar análise para aprendizado futuro
      await registrarAnaliseRealizada(texto, resultado, modeloSelecionado);
      
      return resultado;
    } catch (error) {
      console.error('Erro na análise:', error);
      erro.value = error;
      
      // Tentar fallback para outro modelo se o principal falhar
      try {
        if (await iaLocal.verificarDisponibilidade()) {
          console.log('Tentando fallback para modelo local...');
          return await iaLocal.analisarComModeloLocal(texto, dadosHistoricos);
        }
      } catch (fallbackError) {
        console.error('Erro no fallback:', fallbackError);
      }
      
      throw error;
    } finally {
      processando.value = false;
    }
  };
  
  /**
   * Analisa com OpenAI (código original, mantido como função separada)
   */
  const analisarComOpenAI = async (texto, dadosHistoricos = null) => {
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