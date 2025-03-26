import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'

export function useAnalises() {
  const step = ref(0)
  const isSidebarExpanded = ref(true)
  const processos = ref([])
  const sistemas = ref([])
  const selectedProcesso = ref(null)
  const anoSelecionado = ref(new Date().getFullYear())
  const sistemasAnalise = ref([])

  // Computed para processo atual
  const processoAtual = computed(() => {
    return processos.value.find(p => p.id === selectedProcesso.value)
  })

  // Computed para filtrar processos por ano (modificado)
  const processosFiltrados = computed(() => {
    if (!anoSelecionado.value) return []
    return processos.value.filter(processo => {
      const ano = processo.data_pregao ? new Date(processo.data_pregao).getFullYear() : null
      return ano === anoSelecionado.value
    })
  })

  // Computed para anos disponíveis
  const anosDisponiveis = computed(() => {
    const anos = new Set(processos.value.map(p => {
      return p.data_pregao ? new Date(p.data_pregao).getFullYear() : null
    }).filter(Boolean))
    return Array.from(anos).sort((a, b) => b - a)
  })

  // Computed para verificar se pode avançar
  const podeAvancar = computed(() => {
    if (step.value === 0) return !!anoSelecionado.value
    if (step.value === 1) return !!selectedProcesso.value
    return false
  })

  // Computed para porcentagem geral
  const porcentagemGeralAtendimento = computed(() => {
    if (!sistemasAnalise.value.length) return 0
    
    const totais = sistemasAnalise.value.reduce((acc, sistema) => {
      acc.atendidos += sistema.atendidos
      acc.total += sistema.totalItens
      return acc
    }, { atendidos: 0, total: 0 })
    
    return calcularPorcentagem(totais.atendidos, totais.total)
  })

  // Função para selecionar ano
  const selecionarAno = (ano) => {
    anoSelecionado.value = ano
    step.value = 1
  }

  // Função para selecionar processo
  const selectProcesso = async (processo) => {
    selectedProcesso.value = processo.id
    await carregarAnalisesSistemas()
    step.value = 2
  }

  // Função para carregar análises dos sistemas
  const carregarAnalisesSistemas = async () => {
    try {
      // Primeiro, pegamos os sistemas ativos do processo
      const { data: sistemasProcesso } = await supabase
        .from('processos')
        .select('sistemas_ativos')
        .eq('id', selectedProcesso.value)
        .single()

      if (sistemasProcesso?.sistemas_ativos) {
        // Buscamos os detalhes dos sistemas
        const { data: sistemasDetalhes } = await supabase
          .from('sistemas')
          .select('id, nome')
          .in('id', sistemasProcesso.sistemas_ativos)

        // Para cada sistema, calculamos as análises
        sistemasAnalise.value = await Promise.all(sistemasDetalhes.map(async (sistema) => {
          const { data: analises } = await supabase
            .from('analises_itens')
            .select('*')
            .eq('processo_id', selectedProcesso.value)
            .eq('sistema_id', sistema.id)

          const totalItens = analises?.length || 0
          const atendidos = analises?.filter(a => a.atende)?.length || 0

          return {
            ...sistema,
            totalItens,
            atendidos,
            naoAtendidos: totalItens - atendidos
          }
        }))
      }
    } catch (error) {
      console.error('Erro ao carregar análises:', error)
    }
  }

  // Função para carregar processos
  const loadProcessos = async () => {
    try {
      const { data, error } = await supabase
        .from('processos')
        .select('*')
        .eq('status', 'em_analise') // Filtrar apenas processos em análise
        .order('data_pregao', { ascending: true })

      if (error) throw error
      processos.value = data || []
    } catch (error) {
      console.error('Erro ao carregar processos:', error)
      processos.value = []
    }
  }

  // Navegação entre etapas
  const voltarEtapa = () => {
    if (step.value > 0) {
      step.value--
      if (step.value === 0) {
        selectedProcesso.value = null
      }
    }
  }

  const avancarEtapa = () => {
    if (step.value < 2 && podeAvancar.value) {
      step.value++
    }
  }

  // Função auxiliar para cálculo de porcentagem
  const calcularPorcentagem = (valor, total) => {
    if (!total) return 0
    return Number(((valor / total) * 100).toFixed(2))
  }

  // Adicionar onMounted para carregar processos automaticamente
  onMounted(async () => {
    await loadProcessos()
  })

  return {
    step,
    isSidebarExpanded,
    processos,
    sistemas,
    selectedProcesso,
    processoAtual,
    sistemasAnalise,
    anosDisponiveis,
    anoSelecionado,
    processosFiltrados,
    podeAvancar,
    porcentagemGeralAtendimento,
    handleSidebarToggle: (expanded) => isSidebarExpanded.value = expanded,
    selecionarAno,
    selectProcesso,
    voltarEtapa,
    avancarEtapa,
    calcularPorcentagem,
    loadProcessos // Adicionar ao return
  }
}