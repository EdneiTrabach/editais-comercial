import { ref, computed } from 'vue'

export function useFiltros(processos, anoSelecionado) {
  const filtros = ref({})
  const mostrarFiltro = ref({})
  const filtroSearch = ref({})
  const filtroModalidadeSearch = ref('')
  
  // Opções de modalidade
  const opcoesModalidade = [
    { valor: 'pregao_eletronico', texto: 'Pregão Eletrônico' },
    { valor: 'pregao_presencial', texto: 'Pregão Presencial' },
    { valor: 'credenciamento', texto: 'Credenciamento' },
    { valor: 'concorrencia', texto: 'Concorrência' },
    { valor: 'concurso', texto: 'Concurso' },
    { valor: 'leilao', texto: 'Leilão' },
    { valor: 'dialogo_competitivo', texto: 'Diálogo Competitivo' },
    { valor: 'tomada_precos', texto: 'Tomada de Preços' },
    { valor: 'chamamento_publico', texto: 'Chamamento Público' },
    { valor: 'rdc', texto: 'RDC' },
    { valor: 'rdc_eletronico', texto: 'RDC Eletrônico' },
    { valor: 'srp', texto: 'SRP' },
    { valor: 'srp_eletronico', texto: 'SRP Eletrônico' },
    { valor: 'srp_internacional', texto: 'SRP Internacional' }
  ]
  
  // Computed properties
  const opcoesFiltradasModalidade = computed(() => {
    if (!filtroModalidadeSearch.value) {
      return opcoesModalidade
    }

    const busca = filtroModalidadeSearch.value.toLowerCase()
    return opcoesModalidade.filter(opcao =>
      opcao.texto.toLowerCase().includes(busca)
    )
  })
  
  const processosFiltrados = computed(() => {
    if (!processos.value) return []

    return processos.value
      .filter(processo => {
        const anoProcesso = new Date(processo.data_pregao).getFullYear()
        return anoProcesso === anoSelecionado.value
      })
      .filter(processo => {
        // Aplicar todos os filtros ativos
        for (const campo in filtros.value) {
          if (!filtros.value[campo] || filtros.value[campo].length === 0) {
            continue // Pular se não há filtro para este campo
          }
          
          let valorProcesso = processo[campo]
          
          // Se o valor não existe, não incluir no resultado do filtro
          if (valorProcesso === null || valorProcesso === undefined) {
            return false
          }
          
          // Tratamento específico para diferentes tipos de campos
          switch (campo) {
            case 'data_pregao':
              // Formatar a data para comparação
              const dataFormatada = formatDate(valorProcesso)
              if (!filtros.value[campo].includes(dataFormatada)) {
                return false
              }
              break
              
            case 'hora_pregao':
              // Formatar a hora para comparação
              const horaFormatada = formatTime(valorProcesso)
              if (!filtros.value[campo].includes(horaFormatada)) {
                return false
              }
              break
              
            case 'modalidade':
            case 'status':
            case 'representante_id':
            case 'responsavel_id':
            case 'empresa_id':
              // Comparação direta para estes campos
              if (!filtros.value[campo].includes(valorProcesso)) {
                return false
              }
              break
              
            default:
              // Para campos de texto, fazer busca parcial
              if (typeof valorProcesso === 'string') {
                const match = filtros.value[campo].some(filtro =>
                  valorProcesso.toLowerCase().includes(filtro.toLowerCase())
                )
                if (!match) {
                  return false
                }
              } else {
                // Para outros tipos, comparação direta
                if (!filtros.value[campo].includes(valorProcesso)) {
                  return false
                }
              }
          }
        }
        
        // Se passou por todos os filtros, incluir no resultado
        return true
      })
  })
  
  const temFiltrosAtivos = computed(() => {
    return Object.values(filtros.value).some(f => f && f.length > 0)
  })
  
  // Funções auxiliares
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    try {
      const [date] = dateString.split('T')
      const [year, month, day] = date.split('-')
      return `${day}/${month}/${year}`
    } catch (error) {
      return '-'
    }
  }
  
  const formatTime = (time) => {
    if (!time) return '-'
    try {
      return time.split(':').slice(0, 2).join(':')
    } catch (error) {
      return '-'
    }
  }
  
  // Funções de manipulação de filtros
  const toggleFiltro = (coluna) => {
    // Fechar todos os outros filtros primeiro
    Object.keys(mostrarFiltro.value).forEach(key => {
      if (key !== coluna) {
        mostrarFiltro.value[key] = false
      }
    })
    
    // Inverter o estado do filtro atual
    mostrarFiltro.value[coluna] = !mostrarFiltro.value[coluna]
  }
  
  const limparFiltros = () => {
    Object.keys(filtros.value).forEach(key => {
      filtros.value[key] = []
    })
  }
  
  const opcoesUnicas = (coluna) => {
    if (!processos.value || processos.value.length === 0) return []
    
    const opcoes = new Set()
    
    // Para colunas especiais que precisam de tratamento diferenciado
    if (coluna === 'modalidade') {
      // Retorna diretamente as opções pré-definidas
      return opcoesModalidade
    }
    
    processos.value.forEach(processo => {
      let valor = processo[coluna]
      
      // Pular valores nulos ou indefinidos
      if (valor === null || valor === undefined) return
      
      // Tratamento específico para diferentes tipos de coluna
      switch (coluna) {
        case 'data_pregao':
          valor = formatDate(valor)
          break
        case 'hora_pregao':
          valor = formatTime(valor)
          break
        case 'status':
          valor = { value: valor, text: formatStatus(valor) }
          break
        // Outros casos especiais podem ser adicionados aqui
      }
      
      if (valor) opcoes.add(JSON.stringify(valor))
    })
    
    // Convertemos de volta os objetos JSON para JavaScript
    return Array.from(opcoes).map(item => {
      try {
        return JSON.parse(item)
      } catch {
        return item
      }
    }).sort((a, b) => {
      // Ordenar string ou objeto com campo text
      const textA = typeof a === 'object' ? a.text : a
      const textB = typeof b === 'object' ? b.text : b
      return textA.localeCompare(textB)
    })
  }
  
  const formatStatus = (status) => {
    const statusMap = {
      'vamos_participar': 'Vamos Participar',
      'em_analise': 'Em Análise',
      'em_andamento': 'Em Andamento',
      'ganhamos': 'Ganhamos',
      'perdemos': 'Perdemos',
      'suspenso': 'Suspenso',
      'revogado': 'Revogado',
      'adiado': 'Adiado',
      'demonstracao': 'Demonstração',
      'cancelado': 'Cancelado',
      'nao_participar': 'Decidido Não Participar'
    }
    return statusMap[status] || status
  }
  
  const toggleFiltroItem = (coluna, valor) => {
    if (!filtros.value[coluna]) {
      filtros.value[coluna] = []
    }
    
    const index = filtros.value[coluna].indexOf(valor)
    if (index === -1) {
      // Adiciona o item ao filtro
      filtros.value[coluna].push(valor)
    } else {
      // Remove o item do filtro
      filtros.value[coluna].splice(index, 1)
    }
  }
  
  const filtrarOpcoes = (coluna) => {
    // Esta função pode ser expandida para outros tipos de colunas
    console.log('Filtrando opções para coluna:', coluna)
  }
  
  const filtrarOpcoesPorColuna = (coluna, opcoes) => {
    if (!filtroSearch.value[coluna]) {
      return opcoes
    }
    
    const busca = filtroSearch.value[coluna].toLowerCase()
    
    return opcoes.filter(opcao => {
      if (typeof opcao === 'object' && opcao.text) {
        return opcao.text.toLowerCase().includes(busca)
      } else if (typeof opcao === 'string') {
        return opcao.toLowerCase().includes(busca)
      }
      return false
    })
  }
  
  const limparFiltroColuna = (coluna) => {
    if (filtros.value[coluna]) {
      filtros.value[coluna] = []
    }
  }
  
  // Inicializar filtros
  const initializeFiltros = () => {
    // Esta função deve ser chamada no setup do componente principal
    // para inicializar os filtros com base nas colunas disponíveis
  }
  
  return {
    filtros,
    mostrarFiltro,
    filtroSearch,
    filtroModalidadeSearch,
    opcoesModalidade,
    opcoesFiltradasModalidade,
    processosFiltrados,
    temFiltrosAtivos,
    toggleFiltro,
    limparFiltros,
    opcoesUnicas,
    toggleFiltroItem,
    filtrarOpcoes,
    filtrarOpcoesPorColuna,
    limparFiltroColuna,
    initializeFiltros
  }
}