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
  methods: {
    formatarData(dataString) {
      if (!dataString) return '-';
      const data = new Date(dataString);
      return data.toLocaleDateString('pt-BR');
    },
    formatarStatus(status) {
      if (!status) return '-';

      const statusMap = {
        'vamos_participar': 'Vamos Participar',
        'ganhamos': 'Ganhamos',
        'perdemos': 'Perdemos',
        'em_analise': 'Em Análise',
        'suspenso': 'Suspenso',
        'adiado': 'Adiado'
      };

      return statusMap[status] || status.replace(/_/g, ' ');
    },
    formatarMoeda(valor) {
      if (!valor) return 'R$ 0,00';

      const valorNumerico = typeof valor === 'string'
        ? parseFloat(valor.replace(/[^0-9,.-]/g, '').replace(',', '.'))
        : parseFloat(valor);

      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(valorNumerico);
    },
    getSistemasNomes(sistemasIds) {
      if (!sistemasIds || !sistemasIds.length) return '-';
      
      // Se não há sistemas importados no componente, retorna apenas os IDs
      if (!this.sistemas || this.sistemas.length === 0) {
        return sistemasIds.join(', ');
      }
      
      const nomes = sistemasIds.map(id => {
        const sistema = this.sistemas.find(s => s.id === id);
        return sistema ? sistema.nome : 'Sistema Desconhecido';
      });
      
      return nomes.join(', ');
    }
  }
}