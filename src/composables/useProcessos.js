import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export function useProcessos() {
  const processos = ref([])
  const sistemas = ref([])
  const selectedProcesso = ref(null)

  // Função para formatar status do processo
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
    sistemas,
    selectedProcesso,
    formatStatus,
    formatDate,
    loadProcessos,
    loadSistemas
  }
}
