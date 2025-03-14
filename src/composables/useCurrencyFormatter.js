// Instalar: npm install v-money

import { ref } from 'vue'
import money from 'v-money'

export default {
  directives: {
    money
  },
  data() {
    return {
      money: {
        decimal: ',',
        thousands: '.',
        prefix: 'R$ ',
        precision: 2
      }
    }
  }
}

export function useCurrencyFormatter() {
  /**
   * Valida a entrada de teclado permitindo apenas números e vírgula
   * @param {Event} event - O evento de teclado
   * @param {string} valorAtual - O valor atual do campo
   * @returns {boolean} Retorna true se a entrada for válida
   */
  const validarInput = (event, valorAtual = '') => {
    const charCode = event.which ? event.which : event.keyCode
    
    // Permite apenas: vírgula (44), números (48-57), backspace (8), tab (9)
    if (charCode !== 44 && (charCode < 48 || charCode > 57) && charCode !== 8 && charCode !== 9) {
      event.preventDefault()
      return false
    }
    
    // Impede mais de uma vírgula
    if (charCode === 44 && valorAtual.includes(',')) {
      event.preventDefault()
      return false
    }
    
    // Limita a 2 casas decimais
    if (charCode >= 48 && charCode <= 57) {
      const partes = valorAtual.split(',')
      if (partes.length > 1 && partes[1].length >= 2) {
        event.preventDefault()
        return false
      }
    }
    
    return true
  }

  /**
   * Sanitiza qualquer entrada no campo, removendo caracteres inválidos
   * Deve ser usado no evento @input
   * @param {Event} event - O evento de input 
   */
  const sanitizarInput = (event) => {
    // Pega o elemento de input que disparou o evento
    const input = event.target
    
    // Posição atual do cursor
    const cursorPos = input.selectionStart
    
    // Remove todos os caracteres não numéricos exceto vírgula
    const valorLimpo = input.value.replace(/[^\d,]/g, '')
    
    // Garante apenas uma vírgula
    const partes = valorLimpo.split(',')
    let novoValor
    
    if (partes.length > 2) {
      novoValor = partes[0] + ',' + partes[1]
    } else {
      novoValor = valorLimpo
    }
    
    // Limita a 2 casas decimais após a vírgula
    if (partes.length > 1 && partes[1].length > 2) {
      novoValor = partes[0] + ',' + partes[1].substring(0, 2)
    }
    
    // Verifica se houve mudança no valor
    if (input.value !== novoValor) {
      // Calcula a diferença para ajustar o cursor
      const diff = input.value.length - novoValor.length
      
      // Atualiza o valor
      input.value = novoValor
      
      // Ajusta a posição do cursor
      input.setSelectionRange(cursorPos - diff, cursorPos - diff)
    }
  }

  /**
   * Formata um valor para o formato monetário com até 2 casas decimais
   * @param {string|number} valorAtual - O valor atual do campo
   * @returns {string} O valor formatado
   */
  const formatarValorEstimadoLocal = (valorAtual) => {
    // Normaliza o valor para string
    let valor = valorAtual != null ? String(valorAtual) : '';
    
    // Remove prefixo monetário se existir
    valor = valor.replace(/^R\$\s?/, '');
    
    // Remove caracteres inválidos (mantém apenas dígitos e vírgula)
    valor = valor.replace(/[^\d,]/g, '');
    
    // Trata as partes do número (inteira e decimal)
    const partes = valor.split(',');
    
    // Garante apenas uma vírgula
    if (partes.length > 2) {
      valor = partes[0] + ',' + partes[1];
    }
    
    // Limita a 2 casas decimais
    if (partes.length > 1 && partes[1].length > 2) {
      valor = partes[0] + ',' + partes[1].substring(0, 2);
    }
    
    // Formata com separadores de milhar
    if (partes[0] && partes[0].length > 0) {
      let inteiros = partes[0].replace(/\D/g, '');
      inteiros = inteiros.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      valor = inteiros + (partes.length > 1 ? ',' + partes[1].substring(0, 2) : '');
    }
    
    return valor;
  }

  /**
   * Força a formatação do valor removendo excesso de casas decimais e aplicando máscara
   * @param {string} valor - O valor a ser limpo e formatado
   * @returns {string} O valor formatado corretamente
   */
  const limparEFormatarValor = (valor) => {
    if (!valor) return '';
    
    // Remove qualquer caractere que não seja dígito ou vírgula
    valor = valor.replace(/[^\d,]/g, '');
    
    // Se não tem vírgula, consideramos os dois últimos dígitos como centavos
    if (!valor.includes(',')) {
      // Garantimos que tenha pelo menos 3 dígitos (100 = R$ 1,00)
      if (valor.length > 2) {
        const parteInteira = valor.substring(0, valor.length - 2);
        const parteDecimal = valor.substring(valor.length - 2);
        valor = parteInteira + ',' + parteDecimal;
      } else {
        // Para valores menores que 1 real (ex: 45 centavos)
        valor = '0,' + valor.padStart(2, '0');
      }
    }
    
    const partes = valor.split(',');
    
    // Trata parte inteira
    const parteInteira = partes[0] ? partes[0].replace(/\D/g, '') : '0';
    
    // Trata parte decimal (limite de 2 casas)
    const parteDecimal = partes.length > 1 ? partes[1].substring(0, 2).padEnd(2, '0') : '00';
    
    // Formata com separadores de milhar
    const inteiroFormatado = parteInteira.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    return `${inteiroFormatado},${parteDecimal}`;
  }

  /**
   * Formata um valor para moeda brasileira com 2 casas decimais
   * @param {string|number} valorAtual - O valor atual do campo
   * @returns {string} O valor formatado como moeda
   */
  const formatarValorMoeda = (valorAtual) => {
    const valor = valorAtual != null ? String(valorAtual) : '';
    const numeros = valor.replace(/\D/g, '');
    
    if (!numeros) return '';
    
    // Converte para número com 2 casas decimais
    const valorNumerico = parseInt(numeros, 10) / 100;
    
    // Formata no padrão brasileiro
    return valorNumerico.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  /**
   * Formata um valor estimado garantindo as regras de formatação padrão
   * @param {string} valorAtual - O valor atual a ser formatado
   * @returns {string} O valor formatado
   */
  const formatarValorEstimado = (valorAtual) => {
    // Sempre garante a formatação correta
    return limparEFormatarValor(valorAtual);
  }

  return {
    validarInput,
    sanitizarInput,
    formatarValorEstimadoLocal,
    formatarValorMoeda,
    formatarValorEstimado,
    limparEFormatarValor
  }
}