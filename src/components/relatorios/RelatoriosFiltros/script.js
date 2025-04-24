import { ref, watch } from 'vue';

export default {
  name: 'RelatoriosFiltros',
  
  props: {
    status: {
      type: String,
      default: 'todos'
    },
    responsavel: {
      type: String,
      default: ''
    }
  },
  
  emits: ['limpar', 'update:status', 'update:responsavel'],
  
  setup(props, { emit }) {
    const statusLocal = ref(props.status);
    const responsavelLocal = ref(props.responsavel);
    
    // Observar mudanças nas props
    watch(() => props.status, (newVal) => {
      statusLocal.value = newVal;
    });
    
    watch(() => props.responsavel, (newVal) => {
      responsavelLocal.value = newVal;
    });
    
    // Emitir eventos quando os valores locais mudarem
    const emitirStatusChange = () => {
      emit('update:status', statusLocal.value);
    };
    
    const emitirResponsavelChange = () => {
      emit('update:responsavel', responsavelLocal.value);
    };
    
    return {
      statusLocal,
      responsavelLocal,
      emitirStatusChange,
      emitirResponsavelChange
    };
  }
}