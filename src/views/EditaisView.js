import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { SupabaseManager } from '@/lib/supabaseManager'

// Componentes
import TheSidebar from '@/components/TheSidebar.vue'
import RequiredLabel from '@/components/RequiredLabel.vue'

// Gerenciamento de conexão e visibilidade
import { useVisibilityHandler } from '@/composables/useVisibilityHandler'
import { useConnectionManager } from '@/composables/useConnectionManager'

// Composables básicos de dados
import { usePlatforms } from '@/composables/usePlatforms'
import { useRepresentatives } from '@/composables/useRepresentatives'
import { useDateValidation } from '@/composables/useDateValidation'
import { useSystemsManagement } from '@/composables/useSystemsManagement'

// Composables de processamento e cálculos
import { useDistanceCalculator } from '@/composables/useDistanceCalculator'
import { usePublicationProcessing } from '@/composables/usePublicationProcessing'

// Composables de interface e validação
import { useValidation } from '@/composables/useValidation'
import { useToast } from '@/composables/useToast'

// Composables específicos da view
import { useEditaisForm } from '@/composables/useEditaisForm'
import { useRealtimeManager } from '@/composables/useRealtimeManager'
import { useEstados } from '@/composables/useEstados'
import { useDistanceHandling } from '@/composables/useDistanceHandling'
import { usePublicationHandler } from '@/composables/usePublicationHandler'

// Utilidades
import { formatarModalidade } from '@/utils/modalityUtils'

// No topo do arquivo, adicione estas importações:
import { useTimeout } from '@/composables/useTimeout'
import { useConnection } from '@/composables/useConnection'
import { useSubscriptionManager } from '@/composables/useSubscriptionManager'
import { useCurrencyFormatter } from '@/composables/useCurrencyFormatter'

export default {
  name: 'EditaisView',
  components: {
    TheSidebar,
    RequiredLabel
  },
  emits: ['sidebarToggle'],
  setup() {
    // Variáveis básicas do componente
    const router = useRouter()
    const isSidebarExpanded = ref(true)
    const currentYear = ref(new Date().getFullYear())
    const showTimeoutMessage = ref(false)
    const loadingTimeout = ref(null)
    
    // === INICIALIZAÇÃO DE COMPOSABLES ===
    
    // PRIMEIRO: Inicialize useEditaisForm para ter acesso a formData
    const {
      formData,
      loading,
      showPlataformaField,
      validateForm,
      handleSubmit,
      setupWatchers
    } = useEditaisForm()
    
    // DEPOIS: Inicialize os outros composables que usam formData
    const {
      errors,
      validationState,
      clearErrors,
      addError,
      removeError,
      validacoesCruzadas,
      executarValidacoesCruzadas
    } = useValidation(formData) // Agora formData já está definido
    
    // Adicione o novo composable
    const {
      validarInput,
      formatarValorEstimadoLocal,
      formatarValorMoeda,
      formatarValorEstimado
    } = useCurrencyFormatter()
    
    // Composables de dados
    const { 
      plataformas, 
      showPlataformaModal, 
      novaPlatforma, 
      loadPlataformas, 
      handleAddPlataforma 
    } = usePlatforms()
    
    const {
      representantes,
      showRepresentanteModal,
      novoRepresentante,
      loadRepresentantes,
      handleAddRepresentante,
      handleOpenRepresentanteModal
    } = useRepresentatives()
    
    const {
      dateError,
      timeError,
      validateDate: validateDateFn,
      validateTime: validateTimeFn
    } = useDateValidation()
    
    const {
      sistemasAtivos,
      sistemasSelecionados,
      loadSistemas,
      toggleSistema,
      isSistemaSelected,
      clearSelections,
      selectAllSistemas
    } = useSystemsManagement()

    const { estados } = useEstados()
    
    // Composables de processamento
    const {
      pontoReferencia,
      cidadeOrgao,
      distanciaCalculada,
      distanciaManual,
      distanciaManualValue,
      estadoDestino,
      municipios,
      municipiosCarregados,
      filtroEstadoReferencia,
      pontosReferencia,
      pontosFiltrados,
      calculandoDistancia, // Adicione esta linha
      carregarMunicipios,
      calcularDistancia,
      toggleModoManual
    } = useDistanceCalculator()
    
    const {
      showImportModal,
      publicacaoText,
      camposNaoEncontrados,
      progressoExtracao,
      processamentosCache,
      processarPublicacao,
      closeImportModal
    } = usePublicationProcessing()
    
    // Composables de interface e validação
    const { toast, showToast } = useToast()
    
    const { isVisible, isReconnecting } = useVisibilityHandler(async (visible) => {
      if (visible) {
        await loadPageData(loadPlataformas, loadRepresentantes, loadSistemas)
      }
    })
    
    const {
      isLoading,
      processos,
      setupRealtimeSubscription,
      startAutoRefresh,
      loadPageData,
      cleanupSubscriptions
    } = useRealtimeManager()
    
    // Composables adicionais para melhor organização
    const {
      distanciasSalvas,
      salvarDistancia,
      validarCidade,
      salvarDistanciaManual,
      adicionarDistanciaLista,
      removerDaLista
    } = useDistanceHandling(
      formData, 
      pontoReferencia, 
      distanciaCalculada, 
      cidadeOrgao, 
      distanciaManualValue,
      estadoDestino
    )
    
    const {
      handleProcessPublication
    } = usePublicationHandler(
      publicacaoText, 
      processarPublicacao, 
      closeImportModal, 
      formData
    )

    // No início do setup()
    const { setTimeout: safeSetTimeout, clearTimeout: safeClearTimeout } = useTimeout()
    const { isOnline, hasConnectionIssue, checkConnection, attemptReconnect } = useConnection()
    const { addSubscription, removeSubscription, removeAllSubscriptions } = useSubscriptionManager()
    
    // No arquivo EditaisView.js, dentro do setup(), antes de onUnmounted:
    const refreshInterval = ref(null)

    // === FUNÇÕES BÁSICAS DE INTERAÇÃO ===
    
    // Função para toggle do sidebar
    const handleSidebarToggle = (expanded) => {
      isSidebarExpanded.value = expanded
    }
    
    // Função para mostrar mensagem de timeout
    const showTimeout = (show = true) => {
      if (loadingTimeout.value) {
        clearTimeout(loadingTimeout.value)
        loadingTimeout.value = null
      }
      
      showTimeoutMessage.value = show
      
      if (show) {
        loadingTimeout.value = setTimeout(() => {
          showTimeoutMessage.value = false
        }, 5000)
      }
    }
    
    // Adicione versões wrapper que usam o formData
    const validarInputWrapper = (event) => {
      return validarInput(event, formData.value.valor_estimado)
    }
    
    const formatarValorEstimadoLocalWrapper = () => {
      formData.value.valor_estimado = formatarValorEstimadoLocal(formData.value.valor_estimado)
    }
    
    const formatarValorMoedaWrapper = () => {
      formData.value.valor_estimado = formatarValorMoeda(formData.value.valor_estimado)
    }

    // === CONFIGURAÇÃO DE WATCHERS ===
    
    // Configuração de watchers do formulário
    setupWatchers(estadoDestino, carregarMunicipios)
    
    // Watcher para sincronizar estado e carregar municípios
    watch(() => formData.value.estado, (novoEstado) => {
      filtroEstadoReferencia.value = novoEstado

      if (novoEstado) {
        carregarMunicipios()
      } else {
        municipios.value = []
        municipiosCarregados.value = false
      }
    })

    // Watcher para mudanças de visibilidade
    watch(isVisible, async (newValue) => {
      if (newValue) {
        await loadPageData(loadPlataformas, loadRepresentantes, loadSistemas)
      }
    })

    // Substitua a lógica de verificação de visibilidade existente
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        if (isOnline.value) {
          await checkConnection()
          if (!hasConnectionIssue.value) {
            await loadPageData(loadPlataformas, loadRepresentantes, loadSistemas)
          } else {
            await attemptReconnect()
          }
        }
      }
    }

    // Função wrapper para validação de data que passa o valor do formData
    const validateDate = () => {
      validateDateFn(formData.value.data_pregao)
    }
    
    // Função wrapper para validação de horário que passa o valor do formData
    const validateTime = () => {
      validateTimeFn(formData.value.hora_pregao)
    }
    
    // Valida a data e hora quando elas forem alteradas
    watch(() => formData.value.data_pregao, (newDate) => {
      if (newDate) validateDateFn(newDate)
    })
    
    watch(() => formData.value.hora_pregao, (newTime) => {
      if (newTime) validateTimeFn(newTime)
    })

    // === CICLO DE VIDA DO COMPONENTE ===
    
    onMounted(() => {
      // Adicionar listener de visibilidade
      document.addEventListener('visibilitychange', handleVisibilityChange)
      
      // Gerenciamento de conexão
      useConnectionManager(() => loadPageData(loadPlataformas, loadRepresentantes, loadSistemas))
      
      // Configurações de realtime
      setupRealtimeSubscription()
      startAutoRefresh()
      
      // Carregamento de dados iniciais
      Promise.all([
        loadPlataformas(),
        loadRepresentantes(),
        loadSistemas()
      ]).catch(error => {
        console.error('Erro ao carregar dados iniciais:', error)
      })
      
      // Limpeza de cache
      processamentosCache.limparCache()
      
      // Configuração de canal para atualizações
      const channel = supabase.channel('editais-updates')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'processos' }, 
          () => loadPageData(loadPlataformas, loadRepresentantes, loadSistemas)
        )
        .subscribe()
      
      addSubscription('editais-updates', channel)
    })

    // Limpeza ao desmontar o componente
    onUnmounted(() => {
      // Limpar todas as assinaturas
      removeAllSubscriptions()
      
      // Limpar temporizadores
      if (loadingTimeout.value) {
        safeClearTimeout(loadingTimeout.value)
      }
      
      // Remover listeners de visibilidade
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      
      // Limpar outras limpezas existentes
      cleanupSubscriptions()
      
      // Parar auto refresh
      if (refreshInterval && refreshInterval.value) {
        clearInterval(refreshInterval.value)
        refreshInterval.value = null
      }
      
      // Cancelar solicitações pendentes
      const controller = new AbortController()
      controller.abort()
      
      // Remover listeners de visibilidade
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    })

    // === WRAPPERS DE FUNÇÕES ===
    
    // Wrapper para validação do formulário
    const validateFormWrapper = () => {
      return validateForm(
        validateDate, 
        validateTime, 
        dateError, 
        timeError
      )
    }
    
    // Wrapper para submissão do formulário
    const handleSubmitWrapper = async () => {
      await handleSubmit(sistemasSelecionados, validateFormWrapper)
    }

    // === RETORNO DE VALORES E FUNÇÕES PARA O TEMPLATE ===
    
    return {
      // Variáveis de UI
      isSidebarExpanded,
      loading,
      isLoading,
      currentYear,
      toast,
      showTimeoutMessage,
      
      // Dados do formulário
      formData,
      showPlataformaField,
      estados,
      
      // Dados de plataformas
      plataformas,
      showPlataformaModal,
      novaPlatforma,
      
      // Dados de representantes
      representantes,
      showRepresentanteModal,
      novoRepresentante,
      
      // Dados de importação
      showImportModal,
      publicacaoText,
      progressoExtracao,
      camposNaoEncontrados,
      
      // Dados de validação
      dateError,
      timeError,
      
      // Dados de distância
      pontoReferencia,
      cidadeOrgao,
      distanciaCalculada,
      distanciaManual,
      distanciaManualValue,
      estadoDestino,
      municipios,
      municipiosCarregados,
      filtroEstadoReferencia, 
      pontosReferencia,
      pontosFiltrados,
      distanciasSalvas,
      calculandoDistancia,
      
      // Dados de sistemas
      sistemasAtivos,
      sistemasSelecionados,
      
      // Dados de processos
      processos,
      
      // Funções de interação básica
      handleSidebarToggle,
      
      // Funções de plataformas
      loadPlataformas,
      handleAddPlataforma,
      
      // Funções de representantes
      loadRepresentantes,
      handleAddRepresentante,
      handleOpenRepresentanteModal,
      
      // Funções de sistemas
      toggleSistema,
      isSistemaSelected,
      
      // Funções de distância
      carregarMunicipios,
      calcularDistancia,
      salvarDistancia,
      validarCidade,
      toggleModoManual,
      salvarDistanciaManual,
      adicionarDistanciaLista,
      removerDaLista,
      
      // Funções de importação
      closeImportModal,
      handleProcessPublication,
      
      // Funções de formulário
      validateForm: validateFormWrapper,
      handleSubmit: handleSubmitWrapper,
      
      // Funções de formatação
      formatarModalidade,
      isReconnecting,
      validarInput: validarInputWrapper,
      formatarValorEstimado,
      formatarValorMoeda: formatarValorMoedaWrapper,
      formatarValorEstimadoLocal: formatarValorEstimadoLocalWrapper,
    }
  }
}