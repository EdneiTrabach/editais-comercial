export default {
  name: 'RelatoriosTabela',
  
  props: {
    processos: {
      type: Array,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    },
    responsaveis: {
      type: Array,
      default: () => []
    },
    sistemas: {
      type: Array,
      default: () => []
    }
  },
  
  emits: ['ver-detalhes', 'ir-para-processo'],
  
  setup(props) {
    // Formatação de data
    const formatarData = (date) => {
      if (!date) return '-';
      return new Date(date).toLocaleDateString('pt-BR');
    };
    
    // Formatação de valor monetário
    const formatarMoeda = (valor) => {
      if (valor === null || valor === undefined) return '-';
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(valor);
    };
    
    // Formatação de status
    const formatarStatus = (status) => {
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
    
    // Obter nome do responsável
    const getResponsavelNome = (responsavelId) => {
      if (!responsavelId) return '-';
      
      const responsavel = props.responsaveis.find(r => r.id === responsavelId);
      return responsavel ? responsavel.nome : '-';
    };
    
    // Obter nomes dos sistemas
    const getSistemasNomes = (sistemasIds) => {
      if (!sistemasIds || !Array.isArray(sistemasIds) || sistemasIds.length === 0) return '-';
      
      const nomes = sistemasIds.map(id => {
        const sistema = props.sistemas.find(s => s.id === id);
        return sistema ? sistema.nome : 'Sistema Desconhecido';
      });
      
      return nomes.join(', ');
    };
    
    return {
      formatarData,
      formatarMoeda,
      formatarStatus,
      getResponsavelNome,
      getSistemasNomes
    };
  }
}