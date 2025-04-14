/**
 * Funções de formatação específicas para exportações
 */

/**
 * Formata a data para o formato brasileiro (DD/MM/YYYY)
 * @param {string} dateString - String com a data
 * @returns {string} - Data formatada
 */
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  } catch (error) {
    return '-';
  }
};

/**
 * Formata data e hora para o formato brasileiro (DD/MM/YYYY HH:MM:SS)
 * @param {string} dateString - String com a data
 * @returns {string} - Data e hora formatadas
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  } catch (error) {
    return '-';
  }
};

/**
 * Formata um valor para o formato de moeda brasileira
 * @param {number} value - Valor a ser formatado
 * @returns {string} - Valor formatado
 */
export const formatCurrency = (value) => {
  if (value === undefined || value === null) return '-';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

/**
 * Formata um percentual com casas decimais específicas
 * @param {number} value - Valor a ser formatado
 * @param {number} decimals - Quantidade de casas decimais (padrão: 2)
 * @returns {string} - Percentual formatado
 */
export const formatPercent = (value, decimals = 2) => {
  if (value === undefined || value === null) return '-';
  
  return `${value.toFixed(decimals)}%`;
};

/**
 * Trunca texto muito longo e adiciona reticências
 * @param {string} text - Texto a ser truncado
 * @param {number} maxLength - Tamanho máximo permitido (padrão: 50)
 * @returns {string} - Texto truncado se necessário
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Formata o status de um sistema
 * @param {boolean} aprovado - Status de aprovação do sistema
 * @param {number} percentualMinimo - Percentual mínimo exigido
 * @returns {string} - Status formatado
 */
export const formatSystemStatus = (aprovado, percentualMinimo) => {
  if (aprovado) {
    return `✅ Atende`;
  }
  return `❌ Não Atende (Min: ${percentualMinimo}%)`;
};

/**
 * Gera cabeçalho padrão para documentos de análise
 * @param {Object} processo - Dados do processo
 * @param {Object} parametros - Parâmetros de análise
 * @returns {string} - Texto do cabeçalho formatado
 */
export const gerarCabecalho = (processo, parametros) => {
  const { numero_processo, orgao, codigo_analise } = processo;
  const { percentualMinimoGeral, percentualMinimoObrigatorio } = parametros;
  
  const dataPregao = processo.data_pregao ? formatDate(processo.data_pregao) : formatDate(new Date());
  
  let cabecalho = '========================================================\n';
  cabecalho += '             RELATÓRIO DE ANÁLISE DE SISTEMAS              \n';
  cabecalho += '========================================================\n\n';
  cabecalho += `PROCESSO: ${numero_processo || 'N/A'}\n`;
  cabecalho += `ÓRGÃO: ${orgao || 'N/A'}\n`;
  cabecalho += `DATA: ${dataPregao}\n`;
  cabecalho += `CÓDIGO: ${codigo_analise || 'N/A'}\n`;
  cabecalho += `% Mínimo Geral: ${percentualMinimoGeral}%\n`;
  cabecalho += `% Mínimo Obrigatórios: ${percentualMinimoObrigatorio}%\n\n`;
  
  return cabecalho;
};

/**
 * Gera rodapé padrão para documentos de análise
 * @returns {string} - Texto do rodapé formatado
 */
export const gerarRodape = () => {
  const dataHora = formatDateTime(new Date());
  
  let rodape = '\n\n';
  rodape += `Gerado em: ${dataHora}\n`;
  rodape += '========================================================';
  
  return rodape;
};