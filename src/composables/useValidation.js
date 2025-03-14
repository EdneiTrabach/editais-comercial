import { ref } from 'vue'
import { PRAZOS_MINIMOS } from '@/utils/modalityUtils'

export function useValidation() {
  const errors = ref({})
  const validationState = ref({
    isValid: true,
    invalidFields: []
  })

  const clearErrors = () => {
    errors.value = {}
    validationState.value = {
      isValid: true,
      invalidFields: []
    }
  }

  const addError = (field, message) => {
    errors.value[field] = message
    validationState.value.isValid = false
    if (!validationState.value.invalidFields.includes(field)) {
      validationState.value.invalidFields.push(field)
    }
  }

  const removeError = (field) => {
    if (errors.value[field]) {
      delete errors.value[field]
      validationState.value.invalidFields = validationState.value.invalidFields.filter(
        f => f !== field
      )
      validationState.value.isValid = validationState.value.invalidFields.length === 0
    }
  }

  // Validações cruzadas
  const validacoesCruzadas = {
    // Validação cruzada entre data e modalidade
    validarDataModalidade: (data, modalidade) => {
      if (!data || !modalidade) return true

      const dataLimite = new Date()
      dataLimite.setDate(dataLimite.getDate() + (PRAZOS_MINIMOS[modalidade] || 8))
      const dataPregao = new Date(data)

      return dataPregao >= dataLimite
    },

    // Validação cruzada entre modalidade e valor estimado
    validarModalidadeValor: (modalidade, valor) => {
      const limitesModalidade = {
        'tomada_precos': { min: 0, max: 3300000 }, // Valores exemplo
        'concorrencia': { min: 3300000, max: Infinity }
      }

      if (!modalidade || !valor) return true
      
      const valorNumerico = typeof valor === 'string' 
        ? parseFloat(valor.replace(/\./g, '').replace(',', '.')) 
        : valor
      
      const limite = limitesModalidade[modalidade]
      return limite ? (valorNumerico >= limite.min && valorNumerico <= limite.max) : true
    },

    // Validação cruzada entre estado e plataforma
    validarEstadoPlataforma: (estado, plataforma) => {
      const plataformasRegionais = {
        'MG': ['compras.mg.gov.br', 'licitacoes-e.com.br'],
        'SP': ['bec.sp.gov.br', 'licitacoes-e.com.br'],
        'RJ': ['compras.rj.gov.br', 'licitacoes-e.com.br']
        // Adicione mais estados e suas plataformas conforme necessário
      }

      if (!estado || !plataforma) return true
      
      // Se não houver restrição específica para o estado, permite qualquer plataforma
      if (!plataformasRegionais[estado]) return true
      
      const plataformasPermitidas = plataformasRegionais[estado]
      return plataformasPermitidas.some(p => plataforma.toLowerCase().includes(p.toLowerCase()))
    }
  }

  // Função para executar todas as validações cruzadas
  const executarValidacoesCruzadas = (formData) => {
    const erros = []

    // Valida data x modalidade
    if (!validacoesCruzadas.validarDataModalidade(formData.data_pregao, formData.modalidade)) {
      erros.push(`O prazo mínimo para a modalidade selecionada não foi respeitado`)
    }

    // Valida modalidade x valor (se houver)
    if (formData.valor_estimado &&
      !validacoesCruzadas.validarModalidadeValor(formData.modalidade, formData.valor_estimado)) {
      erros.push('O valor não é compatível com a modalidade selecionada')
    }

    // Valida estado x plataforma
    if (formData.site_pregao &&
      !validacoesCruzadas.validarEstadoPlataforma(formData.estado, formData.site_pregao)) {
      erros.push('A plataforma selecionada não é comum para este estado')
    }

    return erros
  }

  // Função para formatar valor estimado
  const formatarValorEstimado = () => {
    // Remova o R$ se estiver presente no valor
    let valor = formData.value.valor_estimado || ''
    // Remove qualquer caracter que não seja número
    let valorNumerico = valor.toString().replace(/\D/g, '')
    
    // Converte para valor decimal (divide por 100)
    valorNumerico = (parseInt(valorNumerico) / 100).toFixed(2)
    
    // Formata para o padrão brasileiro
    valor = valorNumerico.replace('.', ',')
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    
    formData.value.valor_estimado = valor
  }

  return {
    errors,
    validationState,
    clearErrors,
    addError,
    removeError,
    validacoesCruzadas,
    executarValidacoesCruzadas,
    formatarValorEstimado
  }
}
