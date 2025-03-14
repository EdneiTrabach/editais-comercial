import { ref } from 'vue'

export function useCurrencyFormatter() {
  /**
   * Valida a entrada de teclado permitindo apenas números e vírgula
   * @param {Event} event - O evento de teclado
   * @param {string} valorAtual - O valor atual do campo
   * @returns {boolean} Retorna true se a entrada for válida
   */
  const validarInput = (event, valorAtual = '') => {
    // Permite apenas números e vírgula
    const charCode = event.which ? event.which : event.keyCode
    
    // Códigos: 44 = vírgula, 48-57 = números 0-9
    if (charCode !== 44 && (charCode < 48 || charCode > 57)) {
      event.preventDefault()
      return false
    }
    
    // Verifica se já existe uma vírgula
    if (charCode === 44 && valorAtual.includes(',')) {
      event.preventDefault()
      return false
    }
    
    return true
  }

  /**
   * Formata um valor para o formato monetário com até 2 casas decimais
   * @param {string} valorAtual - O valor atual do campo
   * @returns {string} O valor formatado
   */
  const formatarValorEstimadoLocal = (valorAtual) => {
    // Remove o prefixo "R$ " se presente
    let valor = valorAtual || ''
    valor = valor.replace(/^R\$\s?/, '')
    
    // Remove todos os caracteres não numéricos, exceto vírgula
    valor = valor.replace(/[^\d,]/g, '')
    
    // Garante apenas uma vírgula
    const partes = valor.split(',')
    if (partes.length > 2) {
      valor = partes[0] + ',' + partes[1]
    }
    
    // Limita a 4 casas decimais após a vírgula
    if (partes.length > 1 && partes[1].length > 2) {
      valor = partes[0] + ',' + partes[1].substring(0, 2)
    }
    
    // Formata com pontos para separar milhares
    if (partes[0].length > 3) {
      let inteiros = partes[0].replace(/\D/g, '')
      inteiros = inteiros.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
      
      valor = inteiros + (partes.length > 1 ? ',' + partes[1] : '')
    }
    
    return valor
  }

  /**
   * Formata um valor para moeda brasileira com 2 casas decimais
   * @param {string} valorAtual - O valor atual do campo
   * @returns {string} O valor formatado como moeda
   */
  const formatarValorMoeda = (valorAtual) => {
    // Pega o valor atual e remove tudo exceto números
    let valor = valorAtual || ''
    const numeros = valor.replace(/\D/g, '')
    
    // Se não houver números, retorna string vazia
    if (!numeros) {
      return ''
    }
    
    // Converte para número e divide por 100 para obter o valor real
    const valorNumerico = parseInt(numeros, 10) / 100
    
    // Formata para o padrão brasileiro (separador de milhar e vírgula decimal)
    return valorNumerico.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  /**
   * Formata um valor estimado com base em diferentes regras de formatação
   * @param {string} valorAtual - O valor atual a ser formatado
   * @returns {string} O valor formatado
   */
  const formatarValorEstimado = (valorAtual) => {
    // Implementação existente ou nova implementação conforme necessário
    return formatarValorEstimadoLocal(valorAtual)
  }

  return {
    validarInput,
    formatarValorEstimadoLocal,
    formatarValorMoeda,
    formatarValorEstimado
  }
}