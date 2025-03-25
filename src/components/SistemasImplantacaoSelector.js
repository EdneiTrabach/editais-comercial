import { ref, computed, watch } from 'vue'
import { supabase } from '../supabase'

export default {
  name: 'SistemasImplantacaoSelector',
  props: {
    processoId: {
      type: String,
      required: true
    },
    sistemasAtivos: {
      type: Array,
      default: () => []
    },
    value: {
      type: Object,
      default: () => ({ sistemas_ids: [], informacoes_adicionais: '' })
    }
  },
  
  emits: ['update:value', 'save'],
  
  setup(props, { emit }) {
    const sistemasSelecionados = ref(props.value?.sistemas_ids || []);
    const informacoesAdicionais = ref(props.value?.informacoes_adicionais || '');
    const sistemasDisponiveis = ref([]);
    const loading = ref(false);
    
    // Observa mudanças no valor externo
    watch(() => props.value, (newVal) => {
      if (newVal) {
        sistemasSelecionados.value = newVal.sistemas_ids || [];
        informacoesAdicionais.value = newVal.informacoes_adicionais || '';
      }
    });
    
    // Observa mudanças nos sistemas ativos para atualizar disponíveis
    watch(() => props.sistemasAtivos, async (newSistemásAtivos) => {
      if (newSistemásAtivos && newSistemásAtivos.length) {
        await carregarSistemasDisponiveis();
      }
    }, { immediate: true });
    
    // Carrega detalhes dos sistemas disponíveis
    const carregarSistemasDisponiveis = async () => {
      if (!props.sistemasAtivos || !props.sistemasAtivos.length) return;
      
      loading.value = true;
      try {
        const { data, error } = await supabase
          .from('sistemas')
          .select('id, nome')
          .in('id', props.sistemasAtivos);
          
        if (error) throw error;
        sistemasDisponiveis.value = data || [];
      } catch (error) {
        console.error('Erro ao carregar sistemas disponíveis:', error);
      } finally {
        loading.value = false;
      }
    };
    
    // Alterna a seleção de um sistema
    const toggleSistema = (sistemaId) => {
      const index = sistemasSelecionados.value.indexOf(sistemaId);
      if (index === -1) {
        sistemasSelecionados.value.push(sistemaId);
      } else {
        sistemasSelecionados.value.splice(index, 1);
      }
      atualizarValor();
    };
    
    // Atualiza o valor para os componentes pais
    const atualizarValor = () => {
      const valorAtualizado = {
        sistemas_ids: sistemasSelecionados.value,
        informacoes_adicionais: informacoesAdicionais.value
      };
      emit('update:value', valorAtualizado);
    };
    
    // Observa mudanças nas informações adicionais
    watch(informacoesAdicionais, () => {
      atualizarValor();
    });
    
    // Salvar no banco de dados
    const salvar = async () => {
      try {
        const { error } = await supabase
          .from('processos')
          .update({
            sistemas_implantacao: {
              sistemas_ids: sistemasSelecionados.value,
              informacoes_adicionais: informacoesAdicionais.value
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', props.processoId);
          
        if (error) throw error;
        emit('save');
      } catch (error) {
        console.error('Erro ao salvar sistemas a implantar:', error);
      }
    };
    
    // Verifica se um sistema está selecionado
    const isSistemaSelecionado = (sistemaId) => {
      return sistemasSelecionados.value.includes(sistemaId);
    };
    
    return {
      sistemasDisponiveis,
      sistemasSelecionados,
      informacoesAdicionais,
      loading,
      toggleSistema,
      isSistemaSelecionado,
      salvar
    };
  }
}