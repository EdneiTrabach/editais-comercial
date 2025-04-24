// Formatação de data
export const formatarData = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR');
};

// Formatação de valor monetário
export const formatarMoeda = (valor) => {
  if (valor === null || valor === undefined) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
};

// Formatação de status
export const formatarStatus = (status) => {
  if (!status) return '-';
  
  const statusMap = {
    'vamos_participar': 'Vamos Participar',
    'ganhamos': 'Ganhamos',
    'perdemos': 'Perdemos',
    'em_analise': 'Em Análise',
    'adiado': 'Adiado',
    'cancelado': 'Cancelado',
    'demonstracao': 'Demonstração'
  };
  
  return statusMap[status] || status.replace(/_/g, ' ');
};

export const formatadores = {
  formatarData,
  formatarMoeda,
  formatarStatus
};