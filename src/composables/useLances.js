import { ref, computed, watch } from 'vue'
import { useProcessos } from './useProcessos'
import { usePlanilha } from './usePlanilha'
import { supabase } from '@/lib/supabase'
import { useSistemasItens } from './useSistemasItens'

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

  // Adicione o novo composable
  const { processarItensPlanilha } = useSistemasItens()

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

  // Função para obter o nome do sistema a partir do ID
  const sistemasNomesCache = ref({});
  
  // Carrega nomes dos sistemas se necessário
  const carregarNomesSistemas = async () => {
    try {
      console.log("Carregando nomes de todos os sistemas...")
      const { data, error } = await supabase
        .from('sistemas')
        .select('id, nome')
      
      if (error) throw error
      
      if (data && data.length > 0) {
        data.forEach(sistema => {
          sistemasNomesCache.value[sistema.id] = sistema.nome
        })
        console.log("Cache de nomes de sistemas atualizado:", sistemasNomesCache.value)
      } else {
        console.warn("Nenhum sistema encontrado no banco")
      }
    } catch (error) {
      console.error("Erro ao carregar nomes dos sistemas:", error)
    }
  }
  
  const getSistemaNome = (id) => {
    return sistemasNomesCache.value[id] || `Sistema ${id}`;
  };

  const handleSidebarToggle = () => {
    isSidebarExpanded.value = !isSidebarExpanded.value
  }

  const selectProcesso = async (processo) => {
    try {
      selectedProcesso.value = processo.id
      // Limpa a seleção de itens quando muda de processo
      itensSelecionados.value = []
      
      console.log("Processo selecionado completo:", processo)
      
      // Verificar se sistemas_ativos existe e transformá-lo em array se necessário
      if (processo.sistemas_ativos) {
        let sistemasIds = processo.sistemas_ativos;
        
        // Verificar se sistemas_ativos é uma string JSON e tentar fazer parse
        if (typeof sistemasIds === 'string') {
          try {
            sistemasIds = JSON.parse(sistemasIds);
          } catch (e) {
            console.warn("Erro ao fazer parse dos sistemas:", e);
            sistemasIds = [];
          }
        }
        
        // Garantir que é um array
        if (!Array.isArray(sistemasIds)) {
          sistemasIds = sistemasIds ? [sistemasIds] : [];
        }
        
        console.log("Sistemas IDs processados:", sistemasIds);
        
        if (sistemasIds.length > 0) {
          // Carregar os sistemas usando os IDs
          try {
            const { data, error } = await supabase
              .from('sistemas')
              .select('id, nome')
              .in('id', sistemasIds);
            
            if (error) throw error;
            
            if (data && data.length > 0) {
              sistemas.value = data;
              console.log("Sistemas carregados do banco:", sistemas.value);
            } else {
              // Fallback: usar IDs com nomes do cache
              sistemas.value = sistemasIds.map(id => ({
                id: id,
                nome: getSistemaNome(id) || `Sistema ${id}`
              }));
              console.log("Usando nomes do cache para sistemas:", sistemas.value);
            }
          } catch (error) {
            console.error("Erro ao carregar detalhes dos sistemas:", error);
            
            // Mesmo com erro, tenta usar os nomes do cache
            sistemas.value = sistemasIds.map(id => ({
              id: id,
              nome: getSistemaNome(id) || `Sistema ${id}`
            }));
          }
        } else {
          console.log("O processo não tem sistemas_ativos (array vazio)");
          sistemas.value = [];
        }
      } else {
        console.log("O processo não tem a propriedade sistemas_ativos");
        sistemas.value = [];
      }
      
      // Avança para a etapa de seleção de itens
      step.value = 2;
    } catch (error) {
      console.error("Erro ao selecionar processo:", error);
      sistemas.value = []; // Garantir que sistemas está vazio se falhar
      step.value = 2; // Avança mesmo com erro para não travar o fluxo
    }
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
        // Usar a nova função para processar os itens com os sistemas
        itensPlanilha.value = processarItensPlanilha(
          itensSelecionados.value,
          sistemas.value,
          itensDisponiveis
        )
        
        // Calcular totais iniciais
        itensPlanilha.value.forEach(item => {
          calcularTotal(item)
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
    loadProcessos,
    getSistemaNome,
    carregarNomesSistemas
  }
}
