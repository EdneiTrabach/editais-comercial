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
    
    // Substitua a função handleSubmit atual por esta implementação
    const handleSubmitWrapper = async () => {
      try {
        loading.value = true;

        // Validar campos obrigatórios
        if (!formData.value.numero || !formData.value.ano || !formData.value.data_pregao ||
            !formData.value.hora_pregao || !formData.value.orgao || !formData.value.modalidade) {
          showToast('Preencha todos os campos obrigatórios.', 'error');
          return;
        }

        // Número do processo no formato padrão
        const numero_processo = `${formData.value.numero}/${formData.value.ano}`;

        // Criar objeto de dados diretamente sem tentar detectar o esquema
        const processoData = {
          numero_processo,
          ano: formData.value.ano,
          orgao: formData.value.orgao,
          data_pregao: formData.value.data_pregao,
          hora_pregao: formData.value.hora_pregao,
          modalidade: formData.value.modalidade,
          site_pregao: formData.value.site_pregao,
          objeto_resumido: formData.value.objeto_resumido,
          sistemas_ativos: sistemasSelecionados.value,
          objeto_completo: formData.value.objeto_completo || formData.value.objeto_resumido,
          status: '',
          estado: formData.value.estado,
          representante_id: formData.value.representante,
          // Converter o valor_estimado para o formato correto
          valor_estimado: formData.value.valor_estimado ? 
            parseFloat(formData.value.valor_estimado.replace(/\./g, '').replace(',', '.')) : 
            null,
          codigo_analise: formData.value.codigo_analise || null,
          campo_adicional1: formData.value.campo_adicional1 || null,
          campo_adicional2: formData.value.campo_adicional2 || null,
          publicacao_original: formData.value.publicacao_original || null,
          responsavel_id: (await supabase.auth.getUser())?.data?.user?.id || null
        };
          
        // Adicionar distâncias se disponíveis
        if (distanciasSalvas.value?.length > 0) {
          const primeiraDistancia = distanciasSalvas.value[0];
          processoData.distancia_km = primeiraDistancia.distancia_km;
          processoData.ponto_referencia_cidade = primeiraDistancia.ponto_referencia_cidade;
          processoData.ponto_referencia_uf = primeiraDistancia.ponto_referencia_uf;
        }

        console.log('Salvando dados:', processoData);
          
        // Salvar dados diretamente
        const { data, error } = await supabase
          .from('processos')
          .insert(processoData)
          .select();
          
        if (error) throw error;
          
        showToast('Processo salvo com sucesso!', 'success');
        setTimeout(() => {
          router.push('/funcionalidades');
        }, 1500);
      } catch (error) {
        console.error('Erro ao salvar processo:', error);
        showToast(`Erro ao salvar: ${error.message || 'Verifique os dados e tente novamente'}`, 'error');
      } finally {
        loading.value = false;
      }
    };

    // Adicione a função handleCancel no seu arquivo de script
    const handleCancel = () => {
      // Limpar todos os campos do formulário
      formData.value = {
        numero: '',
        ano: new Date().getFullYear(),
        orgao: '',
        data_pregao: '',
        hora_pregao: '',
        estado: '',
        modalidade: '',
        site_pregao: '',
        objeto_resumido: '',
        objeto_completo: '',
        representante: '',
        valor_estimado: '',
        campo_adicional1: '',
        campo_adicional2: '',
        publicacao_original: '',
        status: '',
        distancia_km: null,
        ponto_referencia_cidade: '',
        ponto_referencia_uf: ''
      };
      
      // Limpar outros estados relacionados ao formulário
      distanciaCalculada.value = null;
      distanciasSalvas.value = [];
      pontoReferencia.value = null;
      cidadeOrgao.value = null;
      estadoDestino.value = '';
      filtroEstadoReferencia.value = '';
      sistemasSelecionados.value = [];
      
      // Limpar datas e validações
      dateError.value = null;
      timeError.value = null;
      
      // Redirecionar para a página de funcionalidades
      router.push('/funcionalidades');
    };

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
      handleAddPlataforma: async () => {
        try {
          // Validações básicas
          if (!novaPlatforma.value.nome || !novaPlatforma.value.url) {
            showToast('Nome e URL são obrigatórios', 'error')
            return
          }
      
          // Verificar explicitamente se a plataforma é adequada para o estado selecionado
          if (formData.value.estado) {
            const valid = validacoesCruzadas.validarEstadoPlataforma(
              formData.value.estado, 
              novaPlatforma.value.nome
            )
            
            if (!valid) {
              showToast(`Atenção: "${novaPlatforma.value.nome}" não é uma plataforma comum para o estado ${formData.value.estado}`, 'warning')
              // A mensagem é exibida, mas permitimos continuar com o salvamento
            }
          }
      
          // Continua com o salvamento da plataforma
          const { error } = await supabase
            .from('plataformas')
            .insert({
              nome: novaPlatforma.value.nome,
              url: novaPlatforma.value.url
            })
      
          if (error) throw error
      
          // Recarrega as plataformas e fecha o modal
          await loadPlataformas()
          novaPlatforma.value = { nome: '', url: '' }
          showPlataformaModal.value = false
          
          showToast('Plataforma adicionada com sucesso', 'success')
        } catch (error) {
          console.error('Erro ao adicionar plataforma:', error)
          showToast('Erro ao salvar plataforma', 'error')
        }
      },
      
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
      handleCancel,
    }
  }
}