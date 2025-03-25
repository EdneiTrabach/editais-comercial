import { ref, computed } from 'vue'

export function useSistemasItens() {
  // Configurações para itens específicos
  const itensConfiguracao = {
    // ID do item: { configurações específicas }
    1: { // Licença de Uso
      quantidadePadrao: 1,
      descricaoPadrao: 'Licença de uso perpétua'
    },
    2: { // Manutenção Mensal
      quantidadePadrao: 12,
      descricaoPadrao: 'Serviço de manutenção mensal por 12 meses'
    },
    // Adicione outras configurações conforme necessário para os demais itens
    3: { quantidadePadrao: 1, descricaoPadrao: 'Serviço de implantação completa' },
    4: { quantidadePadrao: 1, descricaoPadrao: 'Treinamento para usuários do sistema' },
    5: { quantidadePadrao: 1, descricaoPadrao: 'Serviço de customização específica' },
    6: { quantidadePadrao: 1, descricaoPadrao: 'Consultoria técnica especializada' },
    7: { quantidadePadrao: 1, descricaoPadrao: 'Migração completa de dados' },
    8: { quantidadePadrao: 12, descricaoPadrao: 'Suporte técnico por 12 meses' },
    9: { quantidadePadrao: 1, descricaoPadrao: 'Infraestrutura de servidor dedicado' },
    10: { quantidadePadrao: 12, descricaoPadrao: 'Hospedagem em nuvem por 12 meses' },
    11: { quantidadePadrao: 1, descricaoPadrao: 'Desenvolvimento conforme demanda' },
    12: { quantidadePadrao: 1, descricaoPadrao: 'Atualização para nova versão' },
    13: { quantidadePadrao: 1, descricaoPadrao: 'Instalação de sistema' },
    14: { quantidadePadrao: 1, descricaoPadrao: 'Serviços diversos' }
  }

  // Itens que devem ser vinculados a cada sistema
  const itensPorSistema = [1, 2, 3, 4, 7, 8, 10, 12, 13] // IDs dos itens que devem gerar uma entrada por sistema
  
  /**
   * Processa os itens selecionados e gera entradas para a planilha de valores
   * @param {Array} itensSelecionados - IDs dos itens selecionados pelo usuário
   * @param {Array} sistemasDisponiveis - Lista de sistemas disponíveis no processo
   * @param {Array} itensDisponiveis - Lista completa de itens disponíveis para seleção
   * @returns {Array} Itens processados para a planilha de valores
   */
  const processarItensPlanilha = (itensSelecionados, sistemasDisponiveis, itensDisponiveis) => {
    console.log("Processando itens para planilha:", itensSelecionados);
    console.log("Sistemas disponíveis:", sistemasDisponiveis);
    
    // Array para os itens processados
    const itensPlanilha = [];
    
    // Processar cada item selecionado
    itensSelecionados.forEach(itemId => {
      const itemOriginal = itensDisponiveis.find(i => i.id === itemId);
      
      if (!itemOriginal) {
        console.error(`Item com ID ${itemId} não encontrado`);
        return;
      }
      
      // Verificar se este é um item que deve ser vinculado a cada sistema
      if (itensPorSistema.includes(itemId) && sistemasDisponiveis.length > 0) {
        // Gerar uma entrada para cada sistema
        sistemasDisponiveis.forEach(sistema => {
          const config = itensConfiguracao[itemId] || { quantidadePadrao: 1, descricaoPadrao: '' };
          
          itensPlanilha.push({
            id: `${itemId}-${sistema.id}`,
            itemId: itemId,
            sistemaId: sistema.id,
            nome: `${itemOriginal.nome} - ${sistema.nome}`,
            categoria: itemOriginal.categoria,
            descricao: config.descricaoPadrao,
            marca: '', // Garantir que começa vazio
            valorUnitario: 0,
            quantidade: config.quantidadePadrao,
            total: 0
          });
        });
      } else {
        // Para itens que não precisam ser vinculados a sistemas
        const config = itensConfiguracao[itemId] || { quantidadePadrao: 1, descricaoPadrao: '' };
        
        itensPlanilha.push({
          id: `${itemId}-geral`,
          itemId: itemId,
          sistemaId: null,
          nome: itemOriginal.nome,
          categoria: itemOriginal.categoria,
          descricao: config.descricaoPadrao,
          marca: '',
          valorUnitario: 0,
          quantidade: config.quantidadePadrao,
          total: 0
        });
      }
    });
    
    console.log("Itens processados para planilha:", itensPlanilha);
    return itensPlanilha;
  };

  return {
    processarItensPlanilha,
    itensConfiguracao
  };
}