import { ref } from 'vue'

export function usePublicationProcessing() {
  const showImportModal = ref(false)
  const publicacaoText = ref('')
  const camposNaoEncontrados = ref([])
  const loading = ref(false)
  
  const progressoExtracao = ref({
    status: 'idle', // idle, processing, success, error
    etapa: '',
    porcentagem: 0,
    detalhes: []
  })

  // Cache para processamentos
  const processamentosCache = {
    dados: new Map(),
    coordenadas: new Map(),
    orgaos: new Map(),
    
    limparCache() {
      this.dados.clear();
      this.coordenadas.clear();
      this.orgaos.clear();
      console.log('Cache limpo com sucesso');
    },
    
    gerarChave(texto) {
      // Gera uma chave simplificada baseada no texto
      return texto.substring(0, 50).replace(/\s+/g, '').toLowerCase();
    },
    
    obter(chave) {
      return this.dados.get(chave);
    },
    
    salvar(chave, dados) {
      this.dados.set(chave, dados);
    }
  }

  // Padrões para extração
  const patterns = {
    // Captura diferentes formatos de número/ano
    numeroProcesso: /(?:(?:PE|PP|processo)[\s.\/]*(\d+)[\s.\/]*(\d{4}))|(?:(\d+)[\s.\/]*(\d{4}))|(?:processo[\s.:]*(\d+)[\s.\/]*(\d{4}))/i,

    // Captura diversos formatos de data e hora
    dataHora: /(?:(?:data|prazo|abertura)[\s.:]*(\d{2}\/\d{2}\/\d{4})(?:[\s,]*(?:às|as|a|hora|hs|h)?[\s.:]*(\d{1,2}[:h]\d{2})?)|(?:(\d{2}\/\d{2}\/\d{4})\s*(?:às|as|a|hora|hs|h)?\s*(\d{1,2}[:h]\d{2})))/i,

    // Captura diferentes formatos de órgão
    orgao: /(?:(?:órgão|unid\.\s*licitante)[\s.:]+([^\n]+))|(?:FACULDADE\s+[A-ZÀ-Ú\s]+)|(?:FMJ)/i,

    // Captura modalidade
    modalidade: /(?:modalidade[\s.:]*)?(?:(?:pregão\s+eletrônico|PE|licitação\s+eletrônica))/i,

    // Captura objeto
    objeto: /(?:\*\s*([^*]+)\s*\*)|(?:objeto[\s.:]+([^\n]+))/i,

    // Valor estimado
    valor: /(?:valor[\s.:]*estimado|valor[\s.:]*global|valor[\s.:]*total|valor[\s.:]*máximo)[\s.:]*(?:de)?[\s.:]*R\$[\s.]*([\d.,]+)|\bR\$[\s.]*([\d.,]+)/i
  }

  // Função para processar publicação
  const processarPublicacao = async (formData) => {
    try {
      loading.value = true
      const texto = publicacaoText.value

      // Armazena o texto original no formData
      formData.publicacao_original = texto

      // Inicia o progresso
      progressoExtracao.value = {
        status: 'processing',
        etapa: 'Iniciando processamento',
        porcentagem: 0,
        detalhes: []
      }

      // Verifica cache
      const chaveCache = processamentosCache.gerarChave(texto)
      const dadosCache = processamentosCache.obter(chaveCache)

      if (dadosCache) {
        progressoExtracao.value.etapa = 'Dados encontrados no cache'
        progressoExtracao.value.porcentagem = 100
        
        // Retorna os dados do cache
        return { success: true, data: dadosCache, fromCache: true }
      }

      const dadosExtraidos = {
        numero: '',
        ano: '',
        orgao: '',
        data_pregao: '',
        hora_pregao: '',
        modalidade: '',
        objeto_resumido: '',
        objeto_completo: '',
        valor_estimado: ''
      }

      // Extração do número do processo (10%)
      progressoExtracao.value.etapa = 'Extraindo número do processo'
      progressoExtracao.value.porcentagem = 10
      const matchNumero = texto.match(patterns.numeroProcesso)
      if (matchNumero) {
        dadosExtraidos.numero = matchNumero[1] || matchNumero[3] || matchNumero[5]
        dadosExtraidos.ano = matchNumero[2] || matchNumero[4] || matchNumero[6]
        progressoExtracao.value.detalhes.push('✓ Número do processo extraído')
      } else {
        camposNaoEncontrados.value.push('Número do processo')
      }

      // Extração de data e hora (30%)
      progressoExtracao.value.etapa = 'Extraindo data e hora'
      progressoExtracao.value.porcentagem = 30
      const matchDataHora = texto.match(patterns.dataHora)
      if (matchDataHora) {
        const data = matchDataHora[1] || matchDataHora[3]
        const hora = matchDataHora[2] || matchDataHora[4]

        if (data) {
          const [dia, mes, ano] = data.split('/')
          dadosExtraidos.data_pregao = `${ano}-${mes}-${dia}`
          progressoExtracao.value.detalhes.push('✓ Data extraída')
        } else {
          camposNaoEncontrados.value.push('Data')
        }

        if (hora) {
          dadosExtraidos.hora_pregao = hora.replace(/[h]s?/i, ':').padEnd(5, '0')
          progressoExtracao.value.detalhes.push('✓ Hora extraída')
        } else {
          camposNaoEncontrados.value.push('Hora')
        }
      } else {
        camposNaoEncontrados.value.push('Data e hora')
      }

      // Extração do órgão (50%)
      progressoExtracao.value.etapa = 'Extraindo órgão'
      progressoExtracao.value.porcentagem = 50
      const matchOrgao = texto.match(patterns.orgao)
      if (matchOrgao && matchOrgao[1]) {
        dadosExtraidos.orgao = matchOrgao[1].trim()
        progressoExtracao.value.detalhes.push('✓ Órgão extraído')
      } else {
        camposNaoEncontrados.value.push('Órgão')
      }

      // Extração da modalidade (70%)
      progressoExtracao.value.etapa = 'Extraindo modalidade'
      progressoExtracao.value.porcentagem = 70
      const matchModalidade = texto.match(patterns.modalidade)
      if (matchModalidade) {
        dadosExtraidos.modalidade = mapearModalidade(matchModalidade[0])
        progressoExtracao.value.detalhes.push('✓ Modalidade extraída')
      } else {
        camposNaoEncontrados.value.push('Modalidade')
      }

      // Extração do objeto (90%)
      progressoExtracao.value.etapa = 'Extraindo objeto'
      progressoExtracao.value.porcentagem = 90
      const matchObjeto = texto.match(patterns.objeto)
      if (matchObjeto) {
        const objetoExtraido = (matchObjeto[1] || matchObjeto[2] || '').trim()
        
        if (objetoExtraido.length > 100) {
          dadosExtraidos.objeto_resumido = objetoExtraido.substring(0, 100) + '...'
          dadosExtraidos.objeto_completo = objetoExtraido
        } else {
          dadosExtraidos.objeto_resumido = objetoExtraido
          dadosExtraidos.objeto_completo = objetoExtraido
        }
        progressoExtracao.value.detalhes.push('✓ Objeto extraído')
      } else {
        camposNaoEncontrados.value.push('Objeto')
      }

      // Extração do valor estimado (80%)
      progressoExtracao.value.etapa = 'Extraindo valor estimado'
      progressoExtracao.value.porcentagem = 80
      const matchValor = texto.match(patterns.valor)
      if (matchValor) {
        let valorExtraido = (matchValor[1] || matchValor[2] || '').replace(/\./g, '').replace(',', '.')
        // Formata para o padrão brasileiro
        dadosExtraidos.valor_estimado = parseFloat(valorExtraido)
          .toLocaleString('pt-BR', { minimumFractionDigits: 2 })
        progressoExtracao.value.detalhes.push('✓ Valor estimado extraído')
      } else {
        camposNaoEncontrados.value.push('Valor estimado')
      }

      // Finalização (100%)
      progressoExtracao.value.etapa = 'Finalizando processamento'
      progressoExtracao.value.porcentagem = 100
      progressoExtracao.value.status = 'success'

      // Salva no cache
      processamentosCache.salvar(chaveCache, dadosExtraidos)
      
      return { success: true, data: dadosExtraidos, fromCache: false }

    } catch (error) {
      progressoExtracao.value.status = 'error'
      console.error('Erro ao processar publicação:', error)
      return { success: false, error }
    } finally {
      loading.value = false
    }
  }

  // Função auxiliar para mapear modalidades
  const mapearModalidade = (modalidadeTexto) => {
    const mapa = {
      'pregão eletrônico': 'pregao_eletronico',
      'pregão presencial': 'pregao_presencial',
      'tomada de preços': 'tomada_precos',
      'concorrência': 'concorrencia',
      'leilão': 'leilao',
      'PE': 'pregao_eletronico'
    }

    const modalidadeLower = modalidadeTexto.toLowerCase()
    for (const [key, value] of Object.entries(mapa)) {
      if (modalidadeLower.includes(key)) {
        return value
      }
    }
    
    return ''
  }

  // Função para fechar modal
  const closeImportModal = () => {
    showImportModal.value = false
    publicacaoText.value = ''
    camposNaoEncontrados.value = []
    progressoExtracao.value = {
      status: 'idle',
      etapa: '',
      porcentagem: 0,
      detalhes: []
    }
  }

  return {
    showImportModal,
    publicacaoText,
    camposNaoEncontrados,
    loading,
    progressoExtracao,
    processamentosCache,
    processarPublicacao,
    closeImportModal
  }
}
