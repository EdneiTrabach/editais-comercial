import { ref } from 'vue';
import { supabase } from '@/lib/supabase';

export function usePadroesCampos() {
  const padroes = ref({
    numero_processo: [],
    orgao: [],
    municipio: [],
    estado: [],
    empresa_vencedora: [],
    numero_contrato: []
  });
  
  const carregando = ref(false);
  const erro = ref(null);
  
  /**
   * Carrega padrões conhecidos do banco de dados
   * @param {number} limite - Quantidade máxima de padrões por campo
   */
  const carregarPadroes = async (limite = 50) => {
    try {
      carregando.value = true;
      
      // Verificar se a tabela padroes_campos existe
      const { error: checkError } = await supabase
        .from('padroes_campos')
        .select('id')
        .limit(1);
      
      // Se a tabela não existir, criar
      if (checkError && checkError.message.includes('does not exist')) {
        await criarTabelaPadroes();
      }
      
      // Carregar padrões do banco de dados
      const { data, error } = await supabase
        .from('padroes_campos')
        .select('*')
        .order('frequencia', { ascending: false })
        .limit(limite * Object.keys(padroes.value).length);
      
      if (error) throw error;
      
      // Agrupar padrões por tipo de campo
      const padroesAgrupados = {};
      Object.keys(padroes.value).forEach(campo => {
        padroesAgrupados[campo] = [];
      });
      
      data.forEach(padrao => {
        if (padroesAgrupados[padrao.tipo_campo]) {
          padroesAgrupados[padrao.tipo_campo].push(padrao);
        }
      });
      
      // Atualizar ref com os dados agrupados
      padroes.value = padroesAgrupados;
      
    } catch (error) {
      console.error('Erro ao carregar padrões:', error);
      erro.value = error;
    } finally {
      carregando.value = false;
    }
  };
  
  /**
   * Cria a tabela padroes_campos no banco de dados se não existir
   */
  const criarTabelaPadroes = async () => {
    try {
      const { error } = await supabase.rpc('criar_tabela_padroes_campos');
      if (error) throw error;
      
      console.log('Tabela padroes_campos criada com sucesso');
    } catch (error) {
      console.error('Erro ao criar tabela de padrões:', error);
      // Tentar criar usando SQL direto se a função RPC falhar
      try {
        await supabase.rpc('execute_sql', {
          sql_query: `
            CREATE TABLE IF NOT EXISTS padroes_campos (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              tipo_campo TEXT NOT NULL,
              valor TEXT NOT NULL,
              regex_pattern TEXT,
              frequencia INTEGER DEFAULT 1,
              criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              ultima_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              UNIQUE(tipo_campo, valor)
            );
          `
        });
      } catch (sqlError) {
        console.error('Erro ao criar tabela via SQL:', sqlError);
      }
    }
  };
  
  /**
   * Adiciona um novo padrão ou atualiza a frequência de um existente
   * @param {string} tipoCampo - Tipo do campo (numero_processo, orgao, etc)
   * @param {string} valor - Valor do padrão
   * @param {string} regexPattern - Padrão regex opcional
   */
  const adicionarPadrao = async (tipoCampo, valor, regexPattern = null) => {
    if (!tipoCampo || !valor) return null;
    
    try {
      // Verificar se o padrão já existe
      const { data, error } = await supabase
        .from('padroes_campos')
        .select('id, frequencia')
        .eq('tipo_campo', tipoCampo)
        .eq('valor', valor)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        // Atualizar frequência do padrão existente
        const { error: updateError } = await supabase
          .from('padroes_campos')
          .update({
            frequencia: data.frequencia + 1,
            ultima_atualizacao: new Date().toISOString()
          })
          .eq('id', data.id);
        
        if (updateError) throw updateError;
        
        // Atualizar localmente
        const padraoCampo = padroes.value[tipoCampo].find(p => p.id === data.id);
        if (padraoCampo) {
          padraoCampo.frequencia++;
        }
        
        return data.id;
      } else {
        // Inserir novo padrão
        const { data: insertData, error: insertError } = await supabase
          .from('padroes_campos')
          .insert({
            tipo_campo: tipoCampo,
            valor: valor,
            regex_pattern: regexPattern,
            frequencia: 1,
            criado_em: new Date().toISOString(),
            ultima_atualizacao: new Date().toISOString()
          })
          .select('id')
          .single();
        
        if (insertError) throw insertError;
        
        // Adicionar localmente
        if (insertData) {
          const novoPadrao = {
            id: insertData.id,
            tipo_campo: tipoCampo,
            valor: valor,
            regex_pattern: regexPattern,
            frequencia: 1
          };
          
          padroes.value[tipoCampo].push(novoPadrao);
        }
        
        return insertData?.id;
      }
    } catch (error) {
      console.error('Erro ao adicionar padrão:', error);
      return null;
    }
  };
  
  /**
   * Remove um padrão do banco de dados
   * @param {string} id - ID do padrão
   */
  const removerPadrao = async (id) => {
    if (!id) return false;
    
    try {
      const { error } = await supabase
        .from('padroes_campos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Remover localmente
      Object.keys(padroes.value).forEach(campo => {
        padroes.value[campo] = padroes.value[campo].filter(p => p.id !== id);
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao remover padrão:', error);
      return false;
    }
  };
  
  /**
   * Compara um texto com padrões conhecidos e retorna correspondências
   * @param {string} texto - Texto a ser comparado
   * @param {string} tipoCampo - Tipo de campo a ser comparado
   * @param {number} limiarConfianca - Limiar de confiança (0-1)
   * @returns {Array} Lista de correspondências ordenadas por confiança
   */
  const compararComPadroes = (texto, tipoCampo, limiarConfianca = 0.6) => {
    if (!texto || !tipoCampo || !padroes.value[tipoCampo]) {
      return [];
    }
    
    const textoNormalizado = texto.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    
    const correspondencias = [];
    
    // Verificar correspondências por regex
    padroes.value[tipoCampo].forEach(padrao => {
      // Se o padrão tem uma expressão regular, testar
      if (padrao.regex_pattern) {
        try {
          const regex = new RegExp(padrao.regex_pattern, 'i');
          const match = textoNormalizado.match(regex);
          
          if (match) {
            correspondencias.push({
              id: padrao.id,
              valor: padrao.valor,
              confianca: 0.9, // Alta confiança para correspondências de regex
              frequencia: padrao.frequencia
            });
          }
        } catch (e) {
          // Ignorar erros de regex inválida
        }
      }
      
      // Também verificar correspondências de texto
      const valorNormalizado = padrao.valor.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      
      if (textoNormalizado.includes(valorNormalizado)) {
        // Calcular confiança baseada no tamanho relativo
        const confianca = valorNormalizado.length / 100; // Ajustar com base no tamanho
        
        if (confianca >= limiarConfianca) {
          // Verificar se já adicionamos via regex
          const existente = correspondencias.findIndex(c => c.id === padrao.id);
          
          if (existente >= 0) {
            // Atualizar confiança se for maior
            if (confianca > correspondencias[existente].confianca) {
              correspondencias[existente].confianca = confianca;
            }
          } else {
            correspondencias.push({
              id: padrao.id,
              valor: padrao.valor,
              confianca,
              frequencia: padrao.frequencia
            });
          }
        }
      }
    });
    
    // Ordenar por confiança e frequência
    return correspondencias.sort((a, b) => {
      // Priorizar alta confiança
      if (Math.abs(b.confianca - a.confianca) > 0.2) {
        return b.confianca - a.confianca;
      }
      // Se confiança é similar, considerar frequência
      return b.frequencia - a.frequencia;
    });
  };
  
  /**
   * Atualiza estatísticas dos padrões com base no feedback do usuário
   * @param {Object} dadosOriginais - Dados extraídos originalmente
   * @param {Object} dadosCorrigidos - Dados corrigidos pelo usuário
   */
  const atualizarEstatisticasComFeedback = async (dadosOriginais, dadosCorrigidos) => {
    if (!dadosOriginais || !dadosCorrigidos) return;
    
    try {
      // Para cada campo, verificar se houve correção
      const campos = Object.keys(dadosCorrigidos).filter(campo => 
        dadosCorrigidos[campo] && 
        dadosCorrigidos[campo] !== dadosOriginais[campo]
      );
      
      // Adicionar os valores corrigidos como padrões com maior peso
      for (const campo of campos) {
        if (typeof dadosCorrigidos[campo] === 'string' && dadosCorrigidos[campo].trim()) {
          await adicionarPadrao(campo, dadosCorrigidos[campo].trim());
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar estatísticas:', error);
    }
  };
  
  return {
    padroes,
    carregando,
    erro,
    carregarPadroes,
    adicionarPadrao,
    removerPadrao,
    compararComPadroes,
    atualizarEstatisticasComFeedback
  };
}