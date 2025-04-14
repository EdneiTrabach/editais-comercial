/**
 * Utilitário para validação de conformidade de sistemas
 * Responsável por verificar se os sistemas atendem aos requisitos mínimos
 */

/**
 * Verifica se um sistema específico atende ao percentual mínimo exigido
 * @param {Object} sistema - Objeto com dados do sistema
 * @param {number} percentualMinimoObrigatorio - Percentual mínimo para sistemas obrigatórios
 * @param {number} percentualMinimoGeral - Percentual mínimo geral
 * @returns {Object} - Objeto com status de conformidade
 */
export const validarConformidadeSistema = (sistema, percentualMinimoObrigatorio, percentualMinimoGeral) => {
  // Se o sistema não tem itens, não pode ser validado
  if (!sistema.totalItens) {
    return {
      atende: false,
      percentualAtingido: 0,
      percentualMinimo: sistema.obrigatorio ? percentualMinimoObrigatorio : percentualMinimoGeral,
      obrigatorio: sistema.obrigatorio
    };
  }
  
  // Calcular percentual de atendimento
  const percentualAtendimento = calcularPercentualAtendimento(sistema);
  
  // Determinar o percentual mínimo exigido com base na obrigatoriedade
  const percentualMinimo = sistema.obrigatorio ? percentualMinimoObrigatorio : percentualMinimoGeral;
  
  return {
    atende: percentualAtendimento >= percentualMinimo,
    percentualAtingido: percentualAtendimento,
    percentualMinimo,
    obrigatorio: sistema.obrigatorio
  };
};

/**
 * Calcula o percentual geral de atendimento para todos os sistemas
 * @param {Array} sistemas - Array com todos os sistemas analisados
 * @returns {number} - Percentual geral de atendimento
 */
export const calcularPercentualGeralAtendimento = (sistemas) => {
  if (!sistemas || !sistemas.length) return 0;
  
  const totais = sistemas.reduce((acc, sistema) => {
    acc.totalItens += sistema.totalItens || 0;
    acc.naoAtendidos += sistema.naoAtendidos || 0;
    return acc;
  }, { totalItens: 0, naoAtendidos: 0 });
  
  if (totais.totalItens === 0) return 0;
  
  return ((totais.totalItens - totais.naoAtendidos) / totais.totalItens) * 100;
};

/**
 * Calcula o percentual de atendimento para um sistema específico
 * @param {Object} sistema - Objeto com dados do sistema
 * @returns {number} - Percentual de atendimento
 */
export const calcularPercentualAtendimento = (sistema) => {
  if (!sistema.totalItens) return 0;
  
  const atendidos = sistema.totalItens - sistema.naoAtendidos;
  return (atendidos / sistema.totalItens) * 100;
};

/**
 * Verifica se todos os sistemas obrigatórios atendem aos requisitos
 * @param {Array} sistemas - Array com todos os sistemas analisados
 * @param {number} percentualMinimoObrigatorio - Percentual mínimo para sistemas obrigatórios
 * @returns {boolean} - Verdadeiro se todos os sistemas obrigatórios atendem
 */
export const todosObrigatoriosAtendem = (sistemas, percentualMinimoObrigatorio) => {
  const sistemasObrigatorios = sistemas.filter(s => s.obrigatorio);
  
  // Se não há sistemas obrigatórios, consideramos como atendido
  if (sistemasObrigatorios.length === 0) return true;
  
  return sistemasObrigatorios.every(sistema => {
    const percentualAtendimento = calcularPercentualAtendimento(sistema);
    return percentualAtendimento >= percentualMinimoObrigatorio;
  });
};

/**
 * Verifica a conformidade geral do processo
 * @param {Array} sistemas - Array com todos os sistemas analisados
 * @param {number} percentualMinimoGeral - Percentual mínimo geral
 * @param {number} percentualMinimoObrigatorio - Percentual mínimo para sistemas obrigatórios
 * @returns {Object} - Objeto com status de conformidade geral
 */
export const validarConformidadeGeral = (sistemas, percentualMinimoGeral, percentualMinimoObrigatorio) => {
  const percentualGeral = calcularPercentualGeralAtendimento(sistemas);
  const obrigatoriosConformes = todosObrigatoriosAtendem(sistemas, percentualMinimoObrigatorio);
  
  // Obter os sistemas que não atendem
  const sistemasNaoConformes = sistemas.filter(sistema => {
    const validacao = validarConformidadeSistema(sistema, percentualMinimoObrigatorio, percentualMinimoGeral);
    return !validacao.atende;
  });
  
  return {
    percentualGeralAtendimento: percentualGeral,
    atendePercentualMinimo: percentualGeral >= percentualMinimoGeral,
    todosObrigatoriosAtendem: obrigatoriosConformes,
    aprovado: (percentualGeral >= percentualMinimoGeral) && obrigatoriosConformes,
    sistemasNaoConformes
  };
};