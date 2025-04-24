import { formatarData, formatarStatus } from '@/utils/formatadores';
import { supabase } from '@/lib/supabase';

export default {
  name: 'RelatorioHeader',
  
  props: {
    processo: {
      type: Object,
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  
  emits: ['voltar', 'exportar'],
  
  setup(props) {
    const getResponsavelNome = (id) => {
      if (!id || !props.processo || !props.processo.responsaveis) return 'Não definido';
      
      const responsavel = Array.isArray(props.processo.responsaveis)
        ? props.processo.responsaveis.find(r => r.id === id)
        : props.processo.responsaveis;
        
      return responsavel ? responsavel.nome : 'Não definido';
    };
    
    const salvarRascunho = async () => {
      try {
        // Lógica para salvar rascunho
        console.log('Salvando rascunho...');
        // Implementar lógica para salvar no banco de dados
      } catch (error) {
        console.error('Erro ao salvar rascunho:', error);
        alert('Erro ao salvar rascunho');
      }
    };
    
    return {
      formatarData,
      formatarStatus,
      getResponsavelNome,
      salvarRascunho
    };
  }
};