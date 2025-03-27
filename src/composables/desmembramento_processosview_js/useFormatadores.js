export function useFormatadores() {
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      // Garantir que estamos lidando apenas com a parte da data
      const [date] = dateString.split('T');
      const [year, month, day] = date.split('-');

      // Retornar a data formatada sem manipulação de timezone
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return '-';
    }
  }

  const formatTime = (time) => {
    if (!time) return '-';
    try {
      const cleanTime = time.split(':').slice(0, 2).join(':');
      return cleanTime;
    } catch (error) {
      console.error('Erro ao formatar hora:', error);
      return '-';
    }
  }

  const formatModalidade = (modalidade, tipo_pregao) => {
    const modalidades = {
      'pregao': {
        'presencial': 'PP',
        'eletronico': 'PE'
      },
      'concorrencia': 'CONC',
      'concurso': 'CNC',
      'leilao': 'LEI',
      'dialogo_competitivo': 'DC',
      'credenciamento': 'CR',
      'pre_qualificacao': 'PQ',
      'manifestacao_interesse': 'PMI',
      'licitacao_internacional': 'LI'
    }

    if (modalidade === 'pregao' && tipo_pregao) {
      return modalidades[modalidade][tipo_pregao]
    }

    return modalidades[modalidade] || modalidade
  }

  const formatModalidadeCompleta = (modalidade) => {
    const modalidades = {
      'pregao_eletronico': 'Pregão Eletrônico',
      'pregao_presencial': 'Pregão Presencial',
      'credenciamento': 'Credenciamento',
      'concorrencia': 'Concorrência',
      'concurso': 'Concurso',
      'leilao': 'Leilão',
      'dialogo_competitivo': 'Diálogo Competitivo',
      'tomada_precos': 'Tomada de Preços',
      'chamamento_publico': 'Chamamento Público',
      'rdc': 'Regime Diferenciado de Contratações',
      'rdc_eletronico': 'RDC Eletrônico',
      'srp': 'Sistema de Registro de Preços',
      'srp_eletronico': 'SRP Eletrônico',
      'srp_internacional': 'SRP Internacional'
    }

    return modalidades[modalidade] || modalidade
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

  const getModalidadeSigla = (modalidade) => {
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

  const getPortalName = (url) => {
    if (!url) return '-'
    try {
      const hostname = new URL(url).hostname
      return hostname
        .replace('www.', '')
        .split('.')
        .slice(0, -1)
        .join('.')
        .toUpperCase()
    } catch (e) {
      return url
    }
  }

  const formatarDistancia = (processo) => {
    if (!processo) return '-';

    // Verificar se o processo tem dados básicos de distância
    if (processo.distancia_km && processo.ponto_referencia_cidade && processo.ponto_referencia_uf) {
      return `${processo.distancia_km} km (${processo.ponto_referencia_cidade}/${processo.ponto_referencia_uf})`;
    }

    return '-';
  }

  const formatCNPJ = (cnpj) => {
    if (!cnpj) return '';
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  }

  const formatarMoeda = (valor) => {
    // Se valor for falsy (null, undefined, 0, ''), retorne apenas um traço
    if (!valor) return '-';
    
    // Verificar se é um número ou string
    let valorNumerico;
    
    if (typeof valor === 'string') {
      // Remove qualquer texto ou R$ que possa estar presente
      // Remove todos os pontos de milhar e substitui vírgula por ponto
      const valorLimpo = valor.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
      valorNumerico = parseFloat(valorLimpo);
    } else {
      valorNumerico = parseFloat(valor);
    }
    
    // Verificar se é um número válido e diferente de zero
    if (isNaN(valorNumerico) || valorNumerico === 0) return '-';
    
    // Formatar como moeda brasileira
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valorNumerico);
  }

  return {
    formatDate,
    formatTime,
    formatModalidade,
    formatModalidadeCompleta,
    formatStatus,
    getModalidadeSigla,
    getPortalName,
    formatarDistancia,
    formatCNPJ,
    formatarMoeda
  }
}