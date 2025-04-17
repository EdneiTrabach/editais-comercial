import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export function useProcessos() {
  const processos = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const sistemas = ref([]);
  const selectedProcesso = ref(null);

  const carregarProcessos = async () => {
    try {
      loading.value = true;
      error.value = null;
      
      // Remover a relação com 'usuarios' que está causando o erro
      const { data, error: supabaseError } = await supabase
        .from('processos')
        .select(`
          *,
          sistemas(id, nome)
        `)
        .order('data_pregao', { ascending: false });
        
      if (supabaseError) throw supabaseError;
      
      processos.value = data;
      
    } catch (err) {
      console.error('Erro ao carregar processos:', err);
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  // Função para formatar status do processo
  const formatStatus = (status) => {
    if (!status) return 'Desconhecido';
    
    const statusMap = {
      'em_analise': 'Em Análise',
      'ganhamos': 'Ganhamos',
      'perdemos': 'Perdemos',
      'desistimos': 'Desistimos',
      'cancelado': 'Cancelado',
      'adiado': 'Adiado',
      'aguardando': 'Aguardando'
    };
    
    return statusMap[status.toLowerCase()] || status;
  };

  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('pt-BR')
  }

  // Carregar processos do Supabase
  const loadProcessos = async () => {
    try {
      const { data, error } = await supabase
        .from('processos')
        .select('*, sistemas_ativos') // Garantir que sistemas_ativos seja incluído explicitamente
        .eq('status', 'vamos_participar')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Processar cada processo para garantir que sistemas_ativos seja um array
      if (data) {
        data.forEach(processo => {
          if (typeof processo.sistemas_ativos === 'string') {
            try {
              processo.sistemas_ativos = JSON.parse(processo.sistemas_ativos);
            } catch (e) {
              console.warn(`Erro ao fazer parse dos sistemas para o processo ${processo.id}:`, e);
              processo.sistemas_ativos = [];
            }
          }
          
          // Garantir que é um array
          if (!Array.isArray(processo.sistemas_ativos)) {
            processo.sistemas_ativos = processo.sistemas_ativos ? [processo.sistemas_ativos] : [];
          }
        });
      }
      
      processos.value = data;
      console.log('Processos carregados com sistemas:', processos.value);
    } catch (error) {
      console.error('Erro ao carregar processos:', error);
      processos.value = [];
    }
  }

  // Carregar sistemas do processo selecionado
  const loadSistemas = async (processoId) => {
    try {
      const { data, error } = await supabase
        .from('sistemas')
        .select('*')
        .eq('processo_id', processoId)

      if (error) throw error
      sistemas.value = data
    } catch (error) {
      console.error('Erro ao carregar sistemas:', error)
    }
  }

  return {
    processos,
    loading,
    error,
    carregarProcessos,
    formatStatus,
    formatDate,
    loadProcessos,
    loadSistemas,
    selectedProcesso
  }
}
