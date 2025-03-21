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
        .select('*')
        .eq('status', 'vamos_participar')
        .order('created_at', { ascending: false })

      if (error) throw error
      processos.value = data
    } catch (error) {
      console.error('Erro ao carregar processos:', error)
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
