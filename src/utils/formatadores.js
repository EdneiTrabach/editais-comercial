/**
 * Funções de formatação para uso em toda a aplicação
 */

/**
 * Formata uma data no padrão brasileiro
 * @param {string|Date} date - Data para formatar
 * @param {boolean} includeTime - Se deve incluir a hora
 * @returns {string} Data formatada
 */
export function formatarData(date, includeTime = false) {
  if (!date) return '-';
  
  try {
    const dataObj = new Date(date);
    
    // Formatar data
    const options = { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric'
    };
    
    // Adicionar hora se solicitado
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.hour12 = false;
    }
    
    return dataObj.toLocaleDateString('pt-BR', options);
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return String(date);
  }
}

/**
 * Formata um valor monetário no padrão brasileiro (R$)
 * @param {number|string} valor - Valor para formatar
 * @returns {string} Valor formatado como moeda
 */
export function formatarMoeda(valor) {
  if (valor === null || valor === undefined || valor === '') return '-';
  
  try {
    // Converter para número se for string
    const valorNumerico = typeof valor === 'string' ? 
      parseFloat(valor.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')) : 
      valor;
    
    // Verificar se é um número válido
    if (isNaN(valorNumerico)) return '-';
    
    // Formatar como moeda brasileira
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valorNumerico);
  } catch (error) {
    console.error('Erro ao formatar moeda:', error);
    return String(valor);
  }
}

/**
 * Formata o status de um processo para exibição
 * @param {string} status - Status para formatar
 * @returns {string} Status formatado
 */
export function formatarStatus(status) {
  if (!status) return '-';
  
  const statusMap = {
    'vamos_participar': 'Vamos Participar',
    'ganhamos': 'Ganhamos',
    'perdemos': 'Perdemos',
    'em_analise': 'Em Análise',
    'adiado': 'Adiado',
    'cancelado': 'Cancelado',
    'demonstracao': 'Demonstração',
    'suspenso': 'Suspenso',
    'revogado': 'Revogado',
    'em_andamento': 'Em Andamento',
    'desistimos': 'Desistimos'
  };
  
  return statusMap[status] || status.replace(/_/g, ' ');
}

/**
 * Formata um número como percentual
 * @param {number} valor - Valor para formatar (ex: 0.75)
 * @param {number} casasDecimais - Número de casas decimais
 * @returns {string} Valor formatado como percentual (ex: 75%)
 */
export function formatarPercentual(valor, casasDecimais = 0) {
  if (valor === null || valor === undefined || isNaN(valor)) return '-';
  
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: casasDecimais,
      maximumFractionDigits: casasDecimais
    }).format(valor / 100);
  } catch (error) {
    console.error('Erro ao formatar percentual:', error);
    return String(valor) + '%';
  }
}