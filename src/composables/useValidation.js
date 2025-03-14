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
      // Mapeamento de plataformas específicas por estado
      const plataformasRegionais = {
        'MG': ['compras.mg.gov.br', 'licitacoes-e.com.br', 'ammlicita', 'amm.org.br'],
        'SP': ['bec.sp.gov.br', 'licitacoes-e.com.br', 'bbmnet'],
        'RJ': ['compras.rj.gov.br', 'licitacoes-e.com.br'],
        'RS': ['compras.rs.gov.br', 'licitacoes-e.com.br'],
        'PR': ['compras.pr.gov.br', 'licitacoes-e.com.br'],
        'BA': ['comprasnet.ba.gov.br', 'licitacoes-e.com.br'],
        'CE': ['portalcompras.ce.gov.br', 'licitacoes-e.com.br', 'comprasnet.gov.br'],
        'GO': ['comprasnet.go.gov.br', 'licitacoes-e.com.br'],
        'PE': ['compras.pe.gov.br', 'licitacoes-e.com.br'],
        'SC': ['portaldecompras.sc.gov.br', 'licitacoes-e.com.br'],
        'ES': ['compras.es.gov.br', 'licitacoes-e.com.br'],
        'AM': ['compras.am.gov.br', 'e-compras.am.gov.br'],
        'PA': ['compraspara.pa.gov.br', 'licitacoes-e.com.br'],
        'DF': ['compras.df.gov.br', 'licitacoes-e.com.br'],
        'MT': ['aquisicoes.seplag.mt.gov.br', 'licitacoes-e.com.br'],
        'MS': ['compraspublicas.ms.gov.br', 'licitacoes-e.com.br'],
        'PB': ['centraldecompras.pb.gov.br', 'licitacoes-e.com.br'],
        'RN': ['compras.rn.gov.br', 'licitacoes-e.com.br'],
        'AL': ['comprasnet.al.gov.br', 'licitacoes-e.com.br'],
        'PI': ['licitacao.pi.gov.br', 'licitacoes-e.com.br'],
        'SE': ['comprasnet.se.gov.br', 'licitacoes-e.com.br'],
        'TO': ['compras.to.gov.br', 'licitacoes-e.com.br'],
        'RO': ['compras.ro.gov.br', 'licitacoes-e.com.br'],
        'AC': ['compras.ac.gov.br', 'licitacoes-e.com.br'],
        'RR': ['compras.rr.gov.br', 'licitacoes-e.com.br'],
        'AP': ['compras.ap.gov.br', 'licitacoes-e.com.br'],
        'MA': ['compras.ma.gov.br', 'licitacoes-e.com.br']
      }

      if (!estado || !plataforma) return true
      
      // Lista de plataformas nacionais compatíveis com todos os estados
      const plataformasNacionais = ['comprasnet.gov.br', 'gov.br/compras', 'licitacoes-e.com.br'];
      
      // Verifica se a plataforma é nacional (compatível com qualquer estado)
      const plataformaLower = plataforma.toLowerCase();
      const isPlataformaNacional = plataformasNacionais.some(p => 
        plataformaLower.includes(p.toLowerCase())
      );
      
      if (isPlataformaNacional) return true;
      
      // Verifica se a plataforma está mapeada para o estado selecionado
      if (plataformasRegionais[estado] && 
          plataformasRegionais[estado].some(p => plataformaLower.includes(p.toLowerCase()))) {
        return true;
      }
      
      // Verifica se a plataforma é específica para algum outro estado
      let plataformaEspecifica = false;
      let estadosPermitidos = [];
      
      Object.entries(plataformasRegionais).forEach(([estadoKey, plataformasList]) => {
        if (plataformasList.some(p => plataformaLower.includes(p.toLowerCase()))) {
          plataformaEspecifica = true;
          estadosPermitidos.push(estadoKey);
        }
      });
      
      // Se a plataforma é específica de outros estados, não é compatível
      if (plataformaEspecifica) {
        return false;
      }
      
      // Verifica se é uma plataforma não reconhecida
      // Para plataformas não reconhecidas, podemos optar por ser mais restritivos
      // Aqui estamos considerando incompatível se contém algumas palavras-chave de plataformas
      const keywordsPlatform = ['compras', 'licitacao', 'pregao', 'bbmnet', 'bll', 'bolsa'];
      const containsPlatformKeyword = keywordsPlatform.some(keyword => 
        plataformaLower.includes(keyword.toLowerCase())
      );
      
      if (containsPlatformKeyword) {
        // Se parece ser uma plataforma específica não reconhecida, retorna incompatível
        return false;
      }
      
      // Se não foi identificada como plataforma específica, permite o uso
      return true;
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
