import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export function usePublicationAnalysis() {
  const analisando = ref(false)
  const resultadoAnalise = ref(null)
  const erro = ref(null)

  // Extrair sistemas mencionados no texto
  const extrairSistemasDoTexto = async (texto) => {
    if (!texto) return []
    
    try {
      analisando.value = true
      
      // Carregamento dos sistemas cadastrados
      const { data: sistemas } = await supabase
        .from('sistemas')
        .select('id, nome')
        .eq('status', 'ACTIVE')
      
      if (!sistemas || !sistemas.length) return []
      
      // Algoritmo para identificar menções a sistemas no texto
      const sistemasMencionados = []
      
      sistemas.forEach(sistema => {
        // Verificar se o nome do sistema (ou variações) é mencionado no texto
        const regex = new RegExp(`\\b${sistema.nome}\\b|\\b${sistema.nome.replace(/\s+/g, '[ -]+')}\\b`, 'i')
        
        if (regex.test(texto)) {
          sistemasMencionados.push(sistema.id)
        }
      })
      
      return sistemasMencionados
    } catch (error) {
      console.error('Erro ao analisar texto:', error)
      erro.value = error
      return []
    } finally {
      analisando.value = false
    }
  }

  // Extrair informações de empresa vencedora
  const extrairEmpresaVencedora = async (texto) => {
    try {
      analisando.value = true
      
      // Carregar empresas para comparação
      const { data: empresas } = await supabase
        .from('empresas')
        .select('id, nome, cnpj, razao_social')
      
      if (!empresas || !empresas.length) return null
      
      // Procurar por padrões de texto que indiquem empresa vencedora
      const padraoEmpresa = /empresa[\s.:]*(?:vencedora|contratada|adjudicada)[\s.:]*([^,.\n]+)/i
      const padraoCnpj = /cnpj[\s.:]*(\d{2}[\.\-\/]?\d{3}[\.\-\/]?\d{3}[\.\-\/]?\d{4}[\.\-\/]?\d{2})/i
      
      const matchEmpresa = texto.match(padraoEmpresa)
      const matchCnpj = texto.match(padraoCnpj)
      
      if (matchEmpresa || matchCnpj) {
        // Buscar correspondência por nome ou CNPJ
        const empresaEncontrada = empresas.find(empresa => {
          if (matchEmpresa && empresa.nome && matchEmpresa[1].includes(empresa.nome)) {
            return true
          }
          
          if (matchCnpj) {
            const cnpjTexto = matchCnpj[1].replace(/[\.\-\/]/g, '')
            const cnpjEmpresa = empresa.cnpj.replace(/[\.\-\/]/g, '')
            return cnpjTexto === cnpjEmpresa
          }
          
          return false
        })
        
        return empresaEncontrada?.id || null
      }
      
      return null
    } catch (error) {
      console.error('Erro ao extrair empresa vencedora:', error)
      erro.value = error
      return null
    } finally {
      analisando.value = false
    }
  }

  // Extrair número de contrato
  const extrairNumeroContrato = (texto) => {
    try {
      // Padrões comuns para números de contrato
      const padroes = [
        /contrato[\s.:]*(?:n[º°\.ºo]|número|nro|numero)[\s.:]*(\d+[\/-]?\d*)/i,
        /(?:n[º°\.ºo]|número|nro|numero)[\s.:]*(?:do contrato|contrato)[\s.:]*(\d+[\/-]?\d*)/i,
        /(?:contrato)[\s.:]*(\d+[\/-]?\d*)/i
      ]
      
      for (const padrao of padroes) {
        const match = texto.match(padrao)
        if (match && match[1]) {
          return match[1].trim()
        }
      }
      
      return null
    } catch (error) {
      console.error('Erro ao extrair número do contrato:', error)
      erro.value = error
      return null
    }
  }

  // Função principal para análise completa
  const analisarPublicacao = async (texto) => {
    if (!texto) return null
    
    try {
      analisando.value = true
      erro.value = null
      
      // Executar todas as análises em paralelo
      const [sistemasMencionados, empresaId, numeroContrato] = await Promise.all([
        extrairSistemasDoTexto(texto),
        extrairEmpresaVencedora(texto),
        extrairNumeroContrato(texto)
      ])
      
      resultadoAnalise.value = {
        sistemas_ids: sistemasMencionados,
        empresa_vencedora: empresaId,
        numero_contrato: numeroContrato
      }
      
      return resultadoAnalise.value
    } catch (error) {
      console.error('Erro na análise da publicação:', error)
      erro.value = error
      return null
    } finally {
      analisando.value = false
    }
  }
  
  // Aplicar resultados da análise ao processo
  const aplicarResultadosAnalise = async (processoId, resultados) => {
    if (!processoId || !resultados) return false
    
    try {
      const atualizacoes = {}
      
      if (resultados.empresa_vencedora) {
        atualizacoes.empresa_vencedora = resultados.empresa_vencedora
      }
      
      if (resultados.numero_contrato) {
        atualizacoes.numero_contrato = resultados.numero_contrato
      }
      
      if (resultados.sistemas_ids && resultados.sistemas_ids.length > 0) {
        atualizacoes.sistemas_implantacao = {
          sistemas_ids: resultados.sistemas_ids,
          informacoes_adicionais: 'Extraído automaticamente'
        }
      }
      
      if (Object.keys(atualizacoes).length === 0) return false
      
      const { error } = await supabase
        .from('processos')
        .update(atualizacoes)
        .eq('id', processoId)
      
      if (error) throw error
      
      return true
    } catch (error) {
      console.error('Erro ao aplicar resultados:', error)
      erro.value = error
      return false
    }
  }

  return {
    analisando,
    resultadoAnalise,
    erro,
    extrairSistemasDoTexto,
    extrairEmpresaVencedora,
    extrairNumeroContrato,
    analisarPublicacao,
    aplicarResultadosAnalise
  }
}