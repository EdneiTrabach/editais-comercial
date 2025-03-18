import { ref, computed, watch } from 'vue'
import { useValidation } from './useValidation'
import { useToast } from './useToast'
import { supabase } from '@/lib/supabase'
import { requiresPlataforma } from '@/utils/modalityUtils'
import { useRouter } from 'vue-router'

export function useEditaisForm() {
  const router = useRouter()
  const { clearErrors, addError, executarValidacoesCruzadas, validacoesCruzadas } = useValidation()
  const { showToast } = useToast()
  const loading = ref(false)

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
    valor_estimado: '',
    responsavel_id: '' // Adicione esta linha
  })

  // Computed property para controlar a visibilidade do campo de plataforma
  const showPlataformaField = computed(() => {
    // O método requiresPlataforma deve verificar todas as modalidades eletrônicas
    return requiresPlataforma(formData.value.modalidade)
  })

  // Função para lidar com a mudança de modalidade
  const handleModalidadeChange = () => {
    if (!requiresPlataforma(formData.value.modalidade)) {
      formData.value.site_pregao = ''
    }
  }
  
  // Função para validar formulário
  const validateForm = (validateDate, validateTime, dateError, timeError) => {
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
    }
    
    return isValid
  }
  
  // Função para submeter o formulário
  const handleSubmit = async (sistemasSelecionados, validateFunc) => {
    if (!validateFunc()) {
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
      
      // Redirecionamento
      router.push({ name: 'processos' })
      
    } catch (error) {
      console.error('Erro ao cadastrar processo:', error)
      showToast('Erro ao cadastrar processo', 'error')
    } finally {
      loading.value = false
    }
  }

  // Configura watchers para validação cruzada
  const setupWatchers = (
    estadoDestino,
    carregarMunicipios
  ) => {
    // Modalidade
    watch(() => formData.value.modalidade, (newModalidade) => {
      handleModalidadeChange()
      
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

    // Plataforma
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

    // Estado destino sincronização
    watch(() => formData.value.estado, (novoEstado) => {
      if (novoEstado && !estadoDestino.value) {
        estadoDestino.value = novoEstado
        carregarMunicipios()
      }
    }, { immediate: true })
  }

  return {
    formData,
    loading,
    showPlataformaField,
    handleModalidadeChange,
    validateForm,
    handleSubmit,
    setupWatchers
  }
}