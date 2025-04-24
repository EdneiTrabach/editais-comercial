export default {
  name: 'RelatoriosFiltros',
  props: {
    status: {
      type: String,
      default: 'vamos_participar'
    },
    responsavel: {
      type: String,
      default: ''
    }
  },
  emits: ['update:status', 'update:responsavel', 'limpar']
}