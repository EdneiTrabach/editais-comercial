import { ref, onMounted, computed, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import TheSidebar from '@/components/TheSidebar.vue'
import RequiredLabel from '@/components/RequiredLabel.vue'
import debounce from 'lodash/debounce'
import { calcularDistanciaHaversine } from '@/utils/distance.js'
import { ibgeService } from '@/services/ibgeService'
import { coordenadasMunicipais } from '@/data/coordenadasMunicipios'
import { useVisibilityHandler } from '@/composables/useVisibilityHandler'
import { SupabaseManager } from '@/lib/supabaseManager'
import { calcularDistanciaRota } from '@/utils/googleMapsService'
import { useConnectionManager } from '@/composables/useConnectionManager'

// Importação dos composables criados
import { usePlatforms } from '@/composables/usePlatforms'
import { useRepresentatives } from '@/composables/useRepresentatives'
import { useDateValidation } from '@/composables/useDateValidation'
import { useDistanceCalculator } from '@/composables/useDistanceCalculator'
import { usePublicationProcessing } from '@/composables/usePublicationProcessing'
import { useSystemsManagement } from '@/composables/useSystemsManagement'
import { useValidation } from '@/composables/useValidation'
import { useToast } from '@/composables/useToast'

// Importação das utilidades
import { formatarModalidade, requiresPlataforma } from '@/utils/modalityUtils'

export default {
  name: 'EditaisView',
  components: {
    TheSidebar,
    RequiredLabel
  },
  setup() {
    const router = useRouter()
    const isSidebarExpanded = ref(true)
    const loading = ref(false)
    const currentYear = ref(new Date().getFullYear())
    const processos = ref([])
    
    // Inicializa os composables
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
      validateDate,
      validateTime,
      isBusinessDay,
      getNextBusinessDay
    } = useDateValidation()
    
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
      distanciasSalvas,
      calculandoDistancia,
      pontosReferencia,
      pontosFiltrados,
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
    
    const {
      sistemasAtivos,
      sistemasSelecionados,
      loadSistemas,
      toggleSistema,
      isSistemaSelected,
      clearSelections,
      selectAllSistemas
    } = useSystemsManagement()

    const {
      errors,
      validationState,
      clearErrors,
      addError,
      removeError,
      validacoesCruzadas,
      executarValidacoesCruzadas,
      formatarValorEstimado
    } = useValidation()
    
    const { toast, showToast } = useToast()
    
    const { isVisible } = useVisibilityHandler()

    // Dados do formulário
    const formData = ref({
      numero: '',
      ano: new Date().getFullYear(),
      orgao: '',
      data_pregao: '',
      hora_pregao: '',
      estado: '',
      modalidade: '',
      site_pregao: '',
      objeto_resumido: '',
      sistemasAtivos: [],
      objeto_completo: '',
      representante: '',
      status: '',
      distancia_km: null,
      ponto_referencia_cidade: '',
      ponto_referencia_uf: '',
      valor_estimado: ''
    })

    // Lista de estados
    const estados = [
      { uf: 'AC', nome: 'Acre' },
      { uf: 'AL', nome: 'Alagoas' },
      { uf: 'AP', nome: 'Amapá' },
      { uf: 'AM', nome: 'Amazonas' },
      { uf: 'BA', nome: 'Bahia' },
      { uf: 'CE', nome: 'Ceará' },
      { uf: 'DF', nome: 'Distrito Federal' },
      { uf: 'ES', nome: 'Espírito Santo' },
      { uf: 'GO', nome: 'Goiás' },
      { uf: 'MA', nome: 'Maranhão' },
      { uf: 'MT', nome: 'Mato Grosso' },
      { uf: 'MS', nome: 'Mato Grosso do Sul' },
      { uf: 'MG', nome: 'Minas Gerais' },
      { uf: 'PA', nome: 'Pará' },
      { uf: 'PB', nome: 'Paraíba' },
      { uf: 'PR', nome: 'Paraná' },
      { uf: 'PE', nome: 'Pernambuco' },
      { uf: 'PI', nome: 'Piauí' },
      { uf: 'RJ', nome: 'Rio de Janeiro' },
      { uf: 'RN', nome: 'Rio Grande do Norte' },
      { uf: 'RS', nome: 'Rio Grande do Sul' },
      { uf: 'RO', nome: 'Rondônia' },
      { uf: 'RR', nome: 'Roraima' },
      { uf: 'SC', nome: 'Santa Catarina' },
      { uf: 'SP', nome: 'São Paulo' },
      { uf: 'SE', nome: 'Sergipe' },
      { uf: 'TO', nome: 'Tocantins' }
    ]

    // Computed property para controlar a visibilidade do campo de plataforma
    const showPlataformaField = computed(() => {
      return requiresPlataforma(formData.value.modalidade)
    })
    
    // Função para toggle do sidebar
    const handleSidebarToggle = (expanded) => {
      isSidebarExpanded.value = expanded
    }

    // Função para lidar com a mudança de modalidade
    const handleModalidadeChange = () => {
      // Limpa o campo de plataforma se mudar para modalidade que não requer
      if (!requiresPlataforma(formData.value.modalidade)) {
        formData.value.site_pregao = ''
      }
    }
    
    // Função para salvar a distância no formData
    const salvarDistancia = () => {
      if (!pontoReferencia.value || !distanciaCalculada.value) {
        showToast('Selecione um ponto de referência e calcule a distância primeiro', 'error')
        return
      }

      formData.value.distancia_km = parseFloat(distanciaCalculada.value.replace(' km', '').replace('(aproximado)', '').trim())
      formData.value.ponto_referencia_cidade = pontoReferencia.value.cidade
      formData.value.ponto_referencia_uf = pontoReferencia.value.uf

      showToast('Distância salva com sucesso!', 'success')
    }

    const validarCidade = () => {
      return cidadeOrgao.value && cidadeOrgao.value.length >= 3;
    }

    // Função para salvar distância manual
    const salvarDistanciaManual = () => {
      if (!distanciaManualValue.value || !pontoReferencia.value) {
        showToast('Digite um valor de distância e selecione um ponto de referência', 'error')
        return
      }

      formData.value.distancia_km = parseFloat(distanciaManualValue.value)
      formData.value.ponto_referencia_cidade = pontoReferencia.value.cidade
      formData.value.ponto_referencia_uf = pontoReferencia.value.uf

      showToast('Distância manual salva com sucesso!', 'success')
    }
    
    // Função para validar formulário
    const validateForm = () => {
      clearErrors()
      
      // Validação de campos obrigatórios
      const requiredFields = [
        { field: 'numero', label: 'Número' },
        { field: 'ano', label: 'Ano' },
        { field: 'orgao', label: 'Órgão' },
        { field: 'data_pregao', label: 'Data do pregão' },
        { field: 'hora_pregao', label: 'Hora do pregão' },
        { field: 'modalidade', label: 'Modalidade' },
        { field: 'estado', label: 'Estado' }
      ]
      
      let isValid = true
      
      // Valida campos obrigatórios
      for (const item of requiredFields) {
        if (!formData.value[item.field]) {
          addError(item.field, `O campo ${item.label} é obrigatório`)
          isValid = false
        }
      }
      
      // Valida data
      if (formData.value.data_pregao && !validateDate(formData.value.data_pregao)) {
        addError('data_pregao', dateError.value || 'Data inválida')
        isValid = false
      }
      
      // Valida hora
      if (formData.value.hora_pregao && !validateTime(formData.value.hora_pregao)) {
        addError('hora_pregao', timeError.value || 'Hora inválida')
        isValid = false
      }
      
      // Valida plataforma para modalidades eletrônicas
      if (requiresPlataforma(formData.value.modalidade) && !formData.value.site_pregao) {
        addError('site_pregao', 'A plataforma é obrigatória para esta modalidade')
        isValid = false
      }
      
      // Executar validações cruzadas
      const errosValidacaoCruzada = executarValidacoesCruzadas(formData.value)
      if (errosValidacaoCruzada.length > 0) {
        for (const erro of errosValidacaoCruzada) {
          showToast(erro, 'warning')
        }
        // Não impede envio, apenas alerta
      }
      
      return isValid
    }
    
    // Função para submeter o formulário
    const handleSubmit = async () => {
      if (!validateForm()) {
        showToast('Por favor, corrija os erros no formulário', 'error')
        return
      }
      
      try {
        loading.value = true
        
        // Prepara dados para envio
        const formDataToSend = { ...formData.value }
        
        // Adiciona sistemas selecionados
        formDataToSend.sistemas = sistemasSelecionados.value
        
        // Converte valor estimado para número se existir
        if (formDataToSend.valor_estimado) {
          formDataToSend.valor_estimado = parseFloat(
            formDataToSend.valor_estimado.replace(/\./g, '').replace(',', '.')
          )
        }
        
        const { data, error } = await supabase
          .from('processos')
          .insert(formDataToSend)
          .select()
        
        if (error) throw error
        
        showToast('Processo cadastrado com sucesso!', 'success')
        
        // Resetar formulário ou redirecionar
        router.push({ name: 'processos' })
        
      } catch (error) {
        console.error('Erro ao cadastrar processo:', error)
        showToast('Erro ao cadastrar processo', 'error')
      } finally {
        loading.value = false
      }
    }

    // Função para processar uma publicação
    const handleProcessPublication = async () => {
      if (!publicacaoText.value) {
        showToast('Insira o texto da publicação', 'warning')
        return
      }
      
      try {
        const result = await processarPublicacao(formData.value)
        
        if (result.success) {
          // Atualiza o formulário com os dados extraídos
          Object.assign(formData.value, result.data)
          
          showToast(result.fromCache 
            ? 'Dados recuperados do cache com sucesso!'
            : 'Processamento concluído com sucesso!', 'success')
          
          setTimeout(() => closeImportModal(), 1500)
        } else {
          showToast('Erro ao processar publicação', 'error')
        }
      } catch (error) {
        console.error('Erro ao processar publicação:', error)
        showToast('Erro ao processar publicação', 'error')
      }
    }

    // Gerenciamento de realtime e refresh
    const isLoading = ref(false)
    const refreshInterval = ref(null)
    const processosCache = new Map()

    const startAutoRefresh = () => {
      stopAutoRefresh() // Limpa timer anterior
      refreshInterval.value = setInterval(() => {
        loadProcessos().catch(console.error)
      }, 30000)
    }

    const stopAutoRefresh = () => {
      if (refreshInterval.value) {
        clearInterval(refreshInterval.value)
        refreshInterval.value = null
      }
    }

    // Função de carregamento com cache
    const loadProcessos = async () => {
      if (isLoading.value) return

      try {
        isLoading.value = true
        const { data, error } = await supabase
          .from('processos')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        processos.value = data

        // Atualiza cache
        data.forEach(processo => {
          processosCache.set(processo.id, processo)
        })
      } catch (error) {
        console.error('Erro ao carregar processos:', error)
      } finally {
        isLoading.value = false
      }
    }

    const setupRealtimeSubscription = () => {
      try {
        const channel = supabase
          .channel('processos-changes')
          .on('postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'processos'
            },
            (payload) => {
              console.log('Mudança detectada:', payload)
              loadProcessos()
            }
          )
          .subscribe()

        // Registra a subscrição
        SupabaseManager.addSubscription('processos-changes', channel)
      } catch (error) {
        console.error('Erro ao configurar realtime:', error)
      }
    }

    // Função para carregar dados da página
    const loadPageData = async () => {
      if (isLoading.value) return
      
      try {
        isLoading.value = true
        await Promise.all([
          loadProcessos(),
          loadPlataformas(),
          loadRepresentantes(),
          loadSistemas()
        ])
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      } finally {
        isLoading.value = false
      }
    }

    // Funções relacionadas a distância e municípios
    const adicionarDistanciaLista = () => {
      if (!distanciaCalculada.value || !pontoReferencia.value || !cidadeOrgao.value) {
        showToast('Selecione os pontos e calcule a distância primeiro', 'warning')
        return
      }

      const novaDistancia = {
        distancia_km: parseFloat(distanciaCalculada.value.replace(' km', '').replace('(aproximado)', '').trim()),
        ponto_referencia_cidade: pontoReferencia.value.cidade,
        ponto_referencia_uf: pontoReferencia.value.uf,
        cidade_destino: cidadeOrgao.value.nome,
        uf_destino: estadoDestino.value
      }

      distanciasSalvas.value.push(novaDistancia)
      distanciaCalculada.value = null
      showToast('Distância adicionada à lista', 'success')
    }

    const removerDaLista = (index) => {
      distanciasSalvas.value.splice(index, 1)
      showToast('Distância removida da lista', 'success')
    }

    // Watchers
    watch(() => formData.value.estado, (novoEstado) => {
      filtroEstadoReferencia.value = novoEstado

      // Carrega os municípios automaticamente quando o estado for selecionado
      if (novoEstado) {
        carregarMunicipios()
      } else {
        municipios.value = []
        municipiosCarregados.value = false
      }
    })

    watch(() => formData.value.modalidade, (newModalidade) => {
      handleModalidadeChange()
      
      // Validação cruzada
      if (formData.value.data_pregao) {
        const valid = validacoesCruzadas.validarDataModalidade(
          formData.value.data_pregao,
          newModalidade
        )
        if (!valid) {
          showToast('Atenção: Prazo mínimo para esta modalidade não atendido', 'warning')
        }
      }
    })

    watch(() => formData.value.site_pregao, (newPlataforma) => {
      if (formData.value.estado && newPlataforma) {
        const valid = validacoesCruzadas.validarEstadoPlataforma(
          formData.value.estado,
          newPlataforma
        )
        if (!valid) {
          showToast('Atenção: Plataforma não comum para este estado', 'warning')
        }
      }
    })

    // Adicione um watch para sincronizar inicialmente o estadoDestino com o estado principal
    watch(() => formData.value.estado, (novoEstado) => {
      if (novoEstado && !estadoDestino.value) {
        estadoDestino.value = novoEstado
        carregarMunicipios()
      }
    }, { immediate: true })

    // Watch for visibility changes
    watch(isVisible, async (newValue) => {
      if (newValue) {
        await loadPageData()
      }
    })

    // Ciclo de vida do componente
    onMounted(() => {
      // Use o composable para gerenciar reconexões
      useConnectionManager(loadPageData)
      
      // Configurar o realtime
      setupRealtimeSubscription()
      
      // Carregar dados iniciais
      Promise.all([
        loadPlataformas(),
        loadRepresentantes(),
        loadSistemas()
      ]).catch(error => {
        console.error('Erro ao carregar dados iniciais:', error)
      })
      
      // Limpar cache
      processamentosCache.limparCache()
      
      // Iniciar auto refresh
      startAutoRefresh()
      
      // Configura subscrição para atualizações
      const channel = supabase.channel('editais-updates')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'processos' }, 
          () => loadPageData()
        )
        .subscribe()
      
      SupabaseManager.addSubscription('editais-updates', channel)
      
      // Log coordenadas disponíveis (debug)
      console.log('Componente EditaisView montado')
    })

    onUnmounted(() => {
      // Limpar timers e listeners
      stopAutoRefresh()
      
      // Remover canais Supabase
      const channelProcessosChanges = SupabaseManager.subscriptions.get('processos-changes')
      if (channelProcessosChanges) {
        supabase.removeChannel(channelProcessosChanges)
        SupabaseManager.removeSubscription('processos-changes')
      }
      
      const channelEditaisUpdates = SupabaseManager.subscriptions.get('editais-updates')
      if (channelEditaisUpdates) {
        supabase.removeChannel(channelEditaisUpdates)
        SupabaseManager.removeSubscription('editais-updates')
      }
    })

    // Retorne todas as variáveis e funções necessárias no template
    return {
      isSidebarExpanded,
      loading,
      isLoading,
      formData,
      currentYear,
      plataformas,
      showPlataformaModal,
      novaPlatforma,
      representantes,
      showRepresentanteModal,
      novoRepresentante,
      showImportModal,
      publicacaoText,
      dateError,
      timeError,
      estados,
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
      sistemasAtivos,
      sistemasSelecionados,
      showPlataformaField,
      toast,
      progressoExtracao,
      camposNaoEncontrados,
      processos,
      
      // Funções
      handleSidebarToggle,
      loadPlataformas,
      handleAddPlataforma,
      loadRepresentantes,
      handleAddRepresentante,
      handleOpenRepresentanteModal,
      toggleSistema,
      isSistemaSelected,
      carregarMunicipios,
      calcularDistancia,
      closeImportModal,
      handleProcessPublication,
      validateForm,
      handleSubmit,
      salvarDistancia,
      validarCidade,
      toggleModoManual,
      salvarDistanciaManual,
      adicionarDistanciaLista,
      removerDaLista,
      formatarModalidade,
      formatarValorEstimado
    }
  }
}