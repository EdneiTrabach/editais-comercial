import { ref, computed, watch } from 'vue'
import { useProcessos } from './useProcessos'
import { usePlanilha } from './usePlanilha'

export function useLances() {
  const step = ref(1)
  const isSidebarExpanded = ref(true)
  const itensSelecionados = ref([])
  
  // Importar funcionalidades de outros composables
  const {
    processos,
    sistemas,
    selectedProcesso,
    loadProcessos,
    loadSistemas
  } = useProcessos()

  const {
    itensPlanilha,
    totalGeral,
    calcularTotal,
    adicionarItem,
    removerItem,
    exportarPDF,
    exportarExcel,
    formatarMoeda
  } = usePlanilha()

  // Lista ampliada de itens disponíveis para seleção
  const itensDisponiveis = [
    { id: 1, nome: 'Licença de Uso', categoria: 'Licenciamento' },
    { id: 2, nome: 'Manutenção Mensal', categoria: 'Serviços Contínuos' },
    { id: 3, nome: 'Implantação', categoria: 'Serviços Iniciais' },
    { id: 4, nome: 'Treinamento', categoria: 'Serviços Iniciais' },
    { id: 5, nome: 'Customização', categoria: 'Desenvolvimento' },
    { id: 6, nome: 'Consultoria', categoria: 'Serviços Técnicos' },
    { id: 7, nome: 'Migração de Dados', categoria: 'Serviços Iniciais' },
    { id: 8, nome: 'Suporte Técnico', categoria: 'Serviços Contínuos' },
    { id: 9, nome: 'Infraestrutura (Servidor)', categoria: 'Hardware/Infraestrutura' },
    { id: 10, nome: 'Hospedagem em Nuvem', categoria: 'Serviços Contínuos' },
    { id: 11, nome: 'Desenvolvimento Sob Demanda', categoria: 'Desenvolvimento' },
    { id: 12, nome: 'Atualização de Versão', categoria: 'Serviços Técnicos' },
    { id: 13, nome: 'Instalação', categoria: 'Serviços Iniciais' },
    { id: 14, nome: 'Outros', categoria: 'Diversos' }
  ]

  const handleSidebarToggle = () => {
    isSidebarExpanded.value = !isSidebarExpanded.value
  }

  const selectProcesso = async (processo) => {
    selectedProcesso.value = processo.id
    // Limpa a seleção de itens quando muda de processo
    itensSelecionados.value = []
    
    // Carrega os sistemas do processo selecionado
    try {
      await loadSistemas(processo.id)
    } catch (error) {
      console.error("Erro ao carregar sistemas:", error)
      // Mesmo com erro, continua para a próxima etapa
    }
    
    // Avança para a etapa de seleção de itens
    step.value = 2
    
    console.log("Processo selecionado:", processo.id)
    console.log("Sistemas carregados:", sistemas.value)
  }

  // Resetar seleção quando voltar para a etapa 1
  watch(step, (newValue) => {
    if (newValue === 1) {
      selectedProcesso.value = null
      itensSelecionados.value = []
    }
  })

  const podeAvancar = computed(() => {
    switch (step.value) {
      case 1:
        return selectedProcesso.value !== null
      case 2:
        return itensSelecionados.value.length > 0
      default:
        return false
    }
  })

  const voltarEtapa = () => {
    if (step.value > 1) {
      step.value--
    }
  }

  const avancarEtapa = () => {
    if (step.value < 3 && podeAvancar.value) {
      step.value++
      if (step.value === 3) {
        // Prepara os itens selecionados para a planilha com mais campos
        itensPlanilha.value = itensSelecionados.value.map(itemId => {
          const item = itensDisponiveis.find(i => i.id === itemId)
          return {
            nome: item.nome,
            categoria: item.categoria,
            descricao: '',
            marca: '',
            valorUnitario: 0,
            quantidade: 1,
            total: 0
          }
        })
      }
    }
  }

  return {
    step,
    isSidebarExpanded,
    processos,
    sistemas,
    selectedProcesso,
    itensSelecionados,
    itensPlanilha,
    itensDisponiveis,
    totalGeral,
    podeAvancar,
    handleSidebarToggle,
    selectProcesso,
    calcularTotal,
    adicionarItem,
    removerItem,
    exportarPDF,
    exportarExcel,
    formatarMoeda,
    voltarEtapa,
    avancarEtapa,
    loadProcessos
  }
}
