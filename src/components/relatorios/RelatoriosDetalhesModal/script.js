export default {
  name: 'RelatoriosDetalhesModal',
  
  props: {
    processo: {
      type: Object,
      required: true
    },
    sistemas: {
      type: Array,
      default: () => []
    }
  },
  
  emits: ['fechar'],
  
  setup(props, { emit }) {
    // Formatação de data
    const formatarData = (date) => {
      if (!date) return 'Não informado';
      return new Date(date).toLocaleDateString('pt-BR');
    };
    
    // Formatação de valor monetário
    const formatarMoeda = (valor) => {
      if (valor === null || valor === undefined) return 'Não informado';
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(valor);
    };
    
    // Formatação de status
    const formatarStatus = (status) => {
      if (!status) return 'Não definido';
      
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
    
    // Obter nomes dos sistemas
    const getSistemasNomes = (sistemasIds) => {
      if (!sistemasIds || !Array.isArray(sistemasIds) || sistemasIds.length === 0) 
        return 'Nenhum sistema';
      
      const nomes = sistemasIds.map(id => {
        const sistema = props.sistemas.find(s => s.id === id);
        return sistema ? sistema.nome : 'Sistema Desconhecido';
      });
      
      return nomes.join(', ');
    };
    
    // Navegar para o relatório
    const irParaRelatorio = () => {
      window.location.href = `/processos/${props.processo.id}/relatorio`;
    };
    
    return {
      formatarData,
      formatarMoeda,
      formatarStatus,
      getSistemasNomes,
      irParaRelatorio
    };
  }
}