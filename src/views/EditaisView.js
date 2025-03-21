import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { SupabaseManager } from '@/lib/supabaseManager'

// Componentes
import TheSidebar from '@/components/TheSidebar.vue'
import RequiredLabel from '@/components/RequiredLabel.vue'
import Shepherd from '../components/Shepherd.vue';

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
    RequiredLabel,
    Shepherd
  },
  emits: ['sidebarToggle'],
  setup() {
    // Variáveis básicas do componente
    const router = useRouter()
    const isSidebarExpanded = ref(true)
    const currentYear = ref(new Date().getFullYear())
    const showTimeoutMessage = ref(false)
    const loadingTimeout = ref(null)
    const responsaveis_usuario = ref([]);
    
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
    
    onMounted(async () => {
      try {
        // Carregar dados iniciais em paralelo
        await Promise.all([
          loadPlataformas(),
          loadRepresentantes(),
          loadResponsaveis_usuario(), // Certifique-se de que esta linha existe
          loadSistemas()
        ]);
        
        // Restante do código ...
      } catch (error) {
        console.error('Erro ao inicializar formulário:', error);
      }
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
          publicacao_original: formData.value.publicacao_original || null
        };
        
        // REMOVA o campo responsavel_id do processoData e adicione-o apenas se o valor for válido
        // após verificar se o ID existe na tabela profiles
        if (formData.value.responsavel_id) {
          try {
            // Verificamos primeiro se o ID existe na tabela profiles
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', formData.value.responsavel_id)
              .single();
              
            if (profileError || !profileData) {
              // Se o ID não existe em profiles, não incluímos ele no processoData
              console.warn('ID de responsável não encontrado em profiles, salvando processo sem responsável.');
            } else {
              // Só incluímos o responsavel_id se ele existir em profiles
              processoData.responsavel_id = formData.value.responsavel_id;
            }
          } catch (err) {
            console.error('Erro ao verificar responsável:', err);
            // Em caso de erro, não incluímos o responsável
          }
        }
          
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

    // Função para carregar os responsáveis
    const loadResponsaveis_usuario = async () => {
      try {
        // Alterado para buscar da tabela de responsaveis_processos em vez de profiles
        const { data, error } = await supabase
          .from('responsaveis_processos')
          .select('id, nome, email, departamento')
          .eq('status', 'ACTIVE') // Filtra apenas responsáveis ativos
          .order('nome');
          
        if (error) throw error;
        responsaveis_usuario.value = data || [];
        console.log('Responsáveis ativos carregados:', responsaveis_usuario.value.length);
      } catch (error) {
        console.error('Erro ao carregar responsáveis:', error);
        responsaveis_usuario.value = [];
      }
    };

    // Referência ao componente Shepherd
    const tourGuide = ref(null);
    
    // Funções para controlar o tour
    const startTour = () => {
      if (isLoading.value) {
        showToast('Aguarde o carregamento completo antes de iniciar o tour.', 'warning');
        return;
      }
      
      // Certifique-se de que qualquer tour anterior seja finalizado
      cleanupTourElements();
      
      // Usar a ref corretamente para acessar o componente
      if (tourGuide.value) {
        tourGuide.value.startTour();
      } else {
        console.error('Tour guide component not found');
      }
    };

    const cleanupTourElements = () => {
      const overlays = document.querySelectorAll('.shepherd-modal-overlay-container');
      overlays.forEach(overlay => overlay.remove());
      
      const elements = document.querySelectorAll('.shepherd-element');
      elements.forEach(element => element.remove());
    };

    const onTourComplete = () => {
      // Garante que o overlay modal seja removido
      cleanupTourElements();
      
      // Exibir a mensagem de conclusão
      showToast('Tour concluído! Agora você conhece os principais recursos da página.', 'success');
    };

    const onTourCancel = () => {
      cleanupTourElements();
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
      responsaveis_usuario,
      tourSteps: [
        {
          id: 'intro',
          title: 'Bem-vindo ao Cadastro de Editais',
          text: 'Este tour irá guiá-lo pelos principais recursos desta página.',
          attachTo: {
            element: '.header h1',
            on: 'bottom'
          },
          buttons: [
            {
              text: 'Fechar',
              action: function() { return this.cancel(); },
              classes: 'shepherd-button-secondary'
            },
            {
              text: 'Próximo',
              action: function() { return this.next(); },
              classes: 'shepherd-button-primary'
            }
          ]
        },
        {
          id: 'importacao',
          title: 'Importação de Publicações',
          text: 'Clique aqui para importar publicações e preencher automaticamente o formulário.',
          attachTo: {
            element: '.btn-import',
            on: 'bottom'
          }
        },
        {
          id: 'processo',
          title: 'Número do Processo',
          text: 'Informe o número do processo licitatório e o ano correspondente.',
          attachTo: {
            element: '.processo-input',
            on: 'bottom'
          }
        },
        {
          id: 'data-pregao',
          title: 'Data e Hora',
          text: 'Selecione a data e o horário em que o pregão será realizado.',
          attachTo: {
            element: 'input[type="date"]',
            on: 'right'
          }
        },
        {
          id: 'estado-orgao',
          title: 'Estado e Órgão',
          text: 'Selecione o estado e informe o órgão responsável pela licitação.',
          attachTo: {
            element: '.form-group select[v-model="formData.estado"]',
            on: 'left'
          }
        },
        {
          id: 'modalidade',
          title: 'Modalidade',
          text: 'Escolha a modalidade da licitação. Isso afetará outros campos do formulário.',
          attachTo: {
            element: 'select[v-model="formData.modalidade"]',
            on: 'right'
          }
        },
        {
          id: 'objeto',
          title: 'Objeto da Licitação',
          text: 'Informe tanto o objeto resumido quanto o objeto completo da licitação.',
          attachTo: {
            element: '.objeto-container',
            on: 'top'
          }
        },
        {
          id: 'distancia',
          title: 'Cálculo de Distância',
          text: 'Calcule a distância entre o órgão e os pontos de referência para avaliar a viabilidade.',
          attachTo: {
            element: '.distancia-container',
            on: 'top'
          }
        },
        {
          id: 'representante',
          title: 'Representante',
          text: 'Selecione o representante que atuará no processo licitatório.',
          attachTo: {
            element: '.representante-container',
            on: 'bottom'
          }
        },
        {
          id: 'finalizar',
          title: 'Salvar ou Cancelar',
          text: 'Após preencher todos os campos necessários, você pode salvar ou cancelar o cadastro.',
          attachTo: {
            element: '.form-actions',
            on: 'top'
          },
          buttons: [
            {
              text: 'Voltar',
              action: function() { return this.back(); },
              classes: 'shepherd-button-secondary'
            },
            {
              text: 'Concluir Tour',
              action: function() { 
                // Certifique-se de completar o tour apropriadamente
                const result = this.complete();
                
                // Remova a linha abaixo para evitar duplicação de limpeza
                // const shepherd = document.querySelector('.shepherd-modal-overlay-container');
                // if (shepherd) {
                //   shepherd.remove();
                // }
                
                return result;
              },
              classes: 'shepherd-button-primary'
            }
          ]
        }
      ],
      startTour,
      onTourComplete,
      onTourCancel,
      tourGuide
    }
  }
}