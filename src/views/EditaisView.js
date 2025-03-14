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
    
    // Adicione esta função antes do handleSubmitWrapper
    const verificarEstruturaBanco = async () => {
      try {
        // Verifica a estrutura da tabela processos
        const { data, error } = await supabase.rpc('postgres_schema', {
          table_name: 'processos'
        });
        
        if (error) {
          console.error('Erro ao verificar schema:', error);
          return false;
        }
        
        console.log('Estrutura da tabela processos:', data);
        return true;
      } catch (err) {
        console.error('Erro na verificação de schema:', err);
        return false;
      }
    };

    // Substitua a função handleSubmit atual por esta implementação
    const handleSubmitWrapper = async () => {
      try {
        loading.value = true;
        
        // Validar campos obrigatórios antes de enviar
        if (!formData.value.numero || !formData.value.ano || !formData.value.data_pregao ||
            !formData.value.hora_pregao || !formData.value.estado || !formData.value.orgao ||
            !formData.value.modalidade || !formData.value.objeto_completo || !formData.value.representante) {
          showToast('Preencha todos os campos obrigatórios.', 'error');
          loading.value = false;
          return;
        }
        
        // Criando o número do processo no formato esperado
        const numero_processo = `${formData.value.numero}/${formData.value.ano}`;
        
        // 1. Primeiro tentar descobrir o esquema da tabela processos
        try {
          const { data: schemaColumns, error } = await supabase
            .rpc('get_table_columns', { table_name: 'processos' })
            .select('column_name');
            
          if (error) console.error("Erro ao obter colunas:", error);
          
          const colunas = schemaColumns ? schemaColumns.map(c => c.column_name) : [];
          console.log("Colunas disponíveis:", colunas);
          
          // 2. Construir objeto de dados adaptado com base nas colunas existentes
          const processoData = {};
          
          // Dados básicos que devem existir em qualquer esquema
          processoData.numero_processo = numero_processo;
          processoData.ano = formData.value.ano;
          processoData.orgao = formData.value.orgao;
          processoData.data_pregao = formData.value.data_pregao;
          processoData.hora_pregao = formData.value.hora_pregao;
          processoData.modalidade = formData.value.modalidade;
          processoData.status = formData.value.status || 'NOVO';
          
          // Dados condicionais baseados no esquema detectado
          if (colunas.includes('estado')) processoData.estado = formData.value.estado;
          if (colunas.includes('site_pregao')) processoData.site_pregao = formData.value.site_pregao;
          if (colunas.includes('objeto_resumido')) processoData.objeto_resumido = formData.value.objeto_resumido;
          if (colunas.includes('objeto_completo')) processoData.objeto_completo = formData.value.objeto_completo;
          if (colunas.includes('representante_id')) processoData.representante_id = formData.value.representante;
          if (colunas.includes('valor_estimado')) processoData.valor_estimado = formData.value.valor_estimado;
          if (colunas.includes('sistemas_ativos')) processoData.sistemas_ativos = sistemasSelecionados.value;
          
          // Campos opcionais
          if (colunas.includes('campo_adicional1') && formData.value.campo_adicional1) 
            processoData.campo_adicional1 = formData.value.campo_adicional1;
          
          if (colunas.includes('campo_adicional2') && formData.value.campo_adicional2)
            processoData.campo_adicional2 = formData.value.campo_adicional2;
          
          if (colunas.includes('publicacao_original') && formData.value.publicacao_original)
            processoData.publicacao_original = formData.value.publicacao_original;
          
          // Distâncias se disponíveis
          if (distanciasSalvas.value?.length > 0) {
            const primeiraDistancia = distanciasSalvas.value[0];
            if (colunas.includes('distancia_km')) 
              processoData.distancia_km = primeiraDistancia.distancia_km;
            if (colunas.includes('ponto_referencia_cidade')) 
              processoData.ponto_referencia_cidade = primeiraDistancia.ponto_referencia_cidade;
            if (colunas.includes('ponto_referencia_uf')) 
              processoData.ponto_referencia_uf = primeiraDistancia.ponto_referencia_uf;
          }
          
          console.log('Enviando dados adaptados:', processoData);
          
          // 3. Tentar inserção com os dados adaptados
          const { data, error: insertError } = await supabase
            .from('processos')
            .insert(processoData)
            .select();
          
          if (insertError) throw insertError;
          
          console.log('Processo salvo com sucesso!', data);
          showToast('Processo salvo com sucesso!', 'success');
          
          setTimeout(() => {
            router.push('/funcionalidades');
          }, 1500);
          
        } catch (schemaError) {
          console.error("Erro ao determinar esquema:", schemaError);
          
          // Tentar salvar com conjunto mínimo garantido de colunas
          const dadosMinimos = {
            numero_processo,
            ano: formData.value.ano,
            orgao: formData.value.orgao,
            data_pregao: formData.value.data_pregao,
            hora_pregao: formData.value.hora_pregao,
            modalidade: formData.value.modalidade, // Coluna obrigatória!
            objeto_resumido: formData.value.objeto_resumido || formData.value.objeto_completo.substring(0, 100),
            status: 'NOVO'
          };
          
          console.log('Tentando com dados mínimos:', dadosMinimos);
          
          const { error } = await supabase
            .from('processos')
            .insert(dadosMinimos);
          
          if (error) throw error;
          
          showToast('Processo salvo com dados básicos. Complete-o mais tarde.', 'warning');
          setTimeout(() => {
            router.push('/funcionalidades');
          }, 1500);
        }
        
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