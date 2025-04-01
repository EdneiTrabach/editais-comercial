export function useFormatters() {
  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('pt-BR')
  }
  
  const formatTime = (time) => {
    if (!time) return '-'
    return time.substring(0, 5) // HH:mm
  }
  
  const formatStatus = (status) => {
    const statusMap = {
      'vamos_participar': 'Vamos Participar',
      'em_analise': 'Em Análise',
      'em_andamento': 'Em Andamento',
      'ganhamos': 'Ganhamos',
      'perdemos': 'Perdemos',
      'suspenso': 'Suspenso',
      'revogado': 'Revogado',
      'adiado': 'Adiado',
      'demonstracao': 'Demonstração',
      'cancelado': 'Cancelado',
      'nao_participar': 'Decidido Não Participar'
    }
    return statusMap[status] || status
  }
  
  const formatModalidade = (modalidade) => {
    const modalidades = {
      'pregao_eletronico': 'PE',
      'pregao_presencial': 'PP',
      'credenciamento': 'CR',
      'concorrencia': 'CC',
      'concurso': 'CS',
      'leilao': 'LL',
      'dialogo_competitivo': 'DC',
      'tomada_precos': 'TP',
      'chamamento_publico': 'CP',
      'rdc': 'RDC',
      'rdc_eletronico': 'RDC-E',
      'srp': 'SRP',
      'srp_eletronico': 'SRP-E',
      'srp_internacional': 'SRP-I'
    }
    return modalidades[modalidade] || modalidade
  }
  
  // Novo método para formatar valores monetários
  const formatCurrency = (value) => {
    if (!value || value === '') return 'R$ 0,00'
    
    // Remove caracteres não numéricos, exceto vírgula
    let numericValue = value.toString().replace(/[^\d,]/g, '')
    
    // Substituir vírgula por ponto para cálculos
    let calculableValue = numericValue.replace(',', '.')
    
    // Converter para número se possível
    let number = parseFloat(calculableValue)
    if (isNaN(number)) return 'R$ 0,00'
    
    // Formatar usando Intl.NumberFormat
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(number)
  }

  return {
    formatDate,
    formatTime,
    formatStatus,
    formatModalidade,
    formatCurrency
  }
}