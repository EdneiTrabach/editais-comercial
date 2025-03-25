import { ref } from 'vue';
import { supabase } from '@/lib/supabase';
import { useIAAdvanced } from './useIAAdvanced';
import { usePadroesCampos } from './usePadroesCampos';

export function useIAAnalyzer() {
  const processando = ref(false);
  const erro = ref(null);
  const processoIdentificado = ref(null);
  const ultimaAnaliseId = ref(null);
  
  const iaAvancada = useIAAdvanced();
  const padroesCampos = usePadroesCampos();
  
  /**
   * Analisa um texto de publicação contratual e identifica o processo relacionado
   * Verifica primeiro se o modelo avançado está disponível, senão usa o modelo básico
   */
  const analisarTexto = async (texto, sistemas, empresas, processos = null) => {
    if (!texto || texto.trim().length < 50) {
      return null;
    }
    
    try {
      processando.value = true;
      erro.value = null;
      processoIdentificado.value = null;
      ultimaAnaliseId.value = null;
      
      // Carregar padrões de campos
      await padroesCampos.carregarPadroes();
      
      // Verificar se modelo avançado está disponível
      const modeloAvancadoDisponivel = await iaAvancada.verificarDisponibilidade();
      
      let resultado;
      
      if (modeloAvancadoDisponivel) {
        try {
          // Obter dados históricos para melhorar contexto
          const dadosHistoricos = await iaAvancada.obterDadosHistoricos();
          
          // Usar modelo avançado
          const resultadoAvancado = await iaAvancada.analisarComModeloAvancado(texto, dadosHistoricos);
          
          // Obter sistemas mencionados (não está incluído no modelo avançado)
          const sistemasIds = extrairSistemasMencionados(
            texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""), 
            sistemas
          );
          
          // Obter ID da empresa vencedora se o nome for retornado
          let empresaVencedoraId = null;
          if (resultadoAvancado.empresa_vencedora) {
            empresaVencedoraId = await encontrarEmpresaPorNome(resultadoAvancado.empresa_vencedora, empresas);
          }
          
          resultado = {
            ...resultadoAvancado,
            sistemas_ids: sistemasIds,
            empresa_vencedora: empresaVencedoraId // Substituir nome por ID
          };
          
          // Salvar ID da análise para feedback posterior
          ultimaAnaliseId.value = resultadoAvancado.id;
        } catch (advancedError) {
          console.warn('Erro no modelo avançado, recorrendo ao modelo básico:', advancedError);
          resultado = await analisarTextoModeloBasico(texto, sistemas, empresas, processos);
        }
      } else {
        // Usar modelo básico
        resultado = await analisarTextoModeloBasico(texto, sistemas, empresas, processos);
      }
      
      // Tentar identificar o processo
      if (resultado) {
        // Melhorar resultados usando padrões conhecidos
        resultado = melhorarResultadosComPadroes(resultado, texto);
        
        const processoEncontrado = await identificarProcesso(
          resultado.numero_processo, 
          resultado.orgao, 
          resultado.municipio, 
          resultado.estado, 
          resultado.data_licitacao, 
          processos
        );
        
        if (processoEncontrado) {
          processoIdentificado.value = processoEncontrado;
          resultado.processo_identificado = processoEncontrado;
        }
      }
      
      return resultado;
    } catch (error) {
      console.error('Erro na análise de texto:', error);
      erro.value = error;
      return null;
    } finally {
      processando.value = false;
    }
  };
  
  /**
   * Analisa texto usando o modelo básico (original)
   */
  const analisarTextoModeloBasico = async (texto, sistemas, empresas, processos = null) => {
    // Normalizar o texto para facilitar a busca
    const textoNormalizado = texto.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    
    // Extrair informações para identificação do processo
    const numeroProcesso = extrairNumeroProcesso(textoNormalizado);
    const orgao = extrairOrgao(textoNormalizado);
    const municipio = extrairMunicipio(textoNormalizado);
    const estado = extrairEstado(textoNormalizado);
    const dataLicitacao = extrairDataLicitacao(textoNormalizado);
    
    // Continuar com a análise original
    const empresaVencedora = extrairEmpresaVencedora(textoNormalizado, empresas);
    const numeroContrato = extrairNumeroContrato(textoNormalizado);
    const sistemasIds = extrairSistemasMencionados(textoNormalizado, sistemas);
    
    // Registrar análise básica
    const analiseBasica = {
      numero_processo: numeroProcesso,
      orgao: orgao,
      municipio: municipio,
      estado: estado,
      data_licitacao: dataLicitacao,
      empresa_vencedora: empresaVencedora,
      numero_contrato: numeroContrato,
      sistemas_ids: sistemasIds
    };
    
    try {
      // Registrar análise básica no banco para aprendizado
      const { data, error } = await supabase.from('analises_ia').insert({
        texto_publicacao: texto,
        dados_extraidos: analiseBasica,
        modelo: 'basico',
        timestamp: new Date().toISOString(),
        validado: false
      }).select('id');
      
      if (!error && data && data[0]) {
        ultimaAnaliseId.value = data[0].id;
      }
    } catch (error) {
      console.warn('Erro ao registrar análise básica (não crítico):', error);
    }
    
    return analiseBasica;
  };
  
  /**
   * Melhora os resultados usando padrões conhecidos
   */
  const melhorarResultadosComPadroes = (resultado, texto) => {
    const resultadoMelhorado = { ...resultado };
    const campos = ['numero_processo', 'orgao', 'municipio', 'estado', 'numero_contrato'];
    
    // Para cada campo, verificar se podemos melhorar com padrões conhecidos
    campos.forEach(campo => {
      // Se o campo não foi extraído, tentar com padrões
      if (!resultadoMelhorado[campo]) {
        const correspondencias = padroesCampos.compararComPadroes(texto, campo, 0.7);
        
        if (correspondencias.length > 0) {
          // Usar o padrão com maior confiança
          resultadoMelhorado[campo] = correspondencias[0].valor;
        }
      }
    });
    
    return resultadoMelhorado;
  };
  
  /**
   * Identifica o processo baseado nas informações extraídas
   */
  const identificarProcesso = async (numeroProcesso, orgao, municipio, estado, dataLicitacao, processosCache = null) => {
    // Se não temos número de processo ou órgão, é difícil identificar com confiança
    if (!numeroProcesso && !orgao) {
      return null;
    }
    
    try {
      let processosCorrespondentes = [];
      
      // Se temos uma lista de processos em cache, usamos ela para busca local (mais rápido)
      if (processosCache && processosCache.length > 0) {
        processosCorrespondentes = buscarProcessosLocalmente(
          processosCache, numeroProcesso, orgao, municipio, estado, dataLicitacao
        );
      } else {
        // Caso contrário, buscamos no banco de dados
        processosCorrespondentes = await buscarProcessosNoBanco(
          numeroProcesso, orgao, municipio, estado, dataLicitacao
        );
      }
      
      // Se encontrarmos exatamente um processo, retornamos ele
      if (processosCorrespondentes.length === 1) {
        return processosCorrespondentes[0];
      } 
      // Se encontrarmos múltiplos, retornamos o com maior pontuação de correspondência
      else if (processosCorrespondentes.length > 1) {
        return processosCorrespondentes[0]; // O primeiro é o com maior pontuação
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao identificar processo:', error);
      return null;
    }
  };
  
  /**
   * Busca processos localmente usando a lista em cache
   */
  const buscarProcessosLocalmente = (processos, numeroProcesso, orgao, municipio, estado, dataLicitacao) => {
    // Atribuir pontuação para cada processo baseado nas correspondências
    const processosComPontuacao = processos.map(processo => {
      let pontuacao = 0;
      
      // Correspondência por número do processo (muito relevante)
      if (numeroProcesso && processo.numero_processo) {
        // Normalizar para comparação
        const numProc = processo.numero_processo.toLowerCase().replace(/[\s./-]/g, '');
        const numExtraido = numeroProcesso.toLowerCase().replace(/[\s./-]/g, '');
        
        if (numProc === numExtraido) {
          pontuacao += 100; // Correspondência exata
        } else if (numProc.includes(numExtraido) || numExtraido.includes(numProc)) {
          pontuacao += 50; // Correspondência parcial
        }
      }
      
      // Correspondência por órgão (relevante)
      if (orgao && processo.orgao) {
        const orgaoProc = processo.orgao.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const orgaoExtraido = orgao.toLowerCase();
        
        if (orgaoProc === orgaoExtraido) {
          pontuacao += 40; // Correspondência exata
        } else if (orgaoProc.includes(orgaoExtraido) || orgaoExtraido.includes(orgaoProc)) {
          pontuacao += 20; // Correspondência parcial
        }
      }
      
      // Correspondência por município (relevante)
      if (municipio && processo.municipio) {
        const municipioProc = processo.municipio.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const municipioExtraido = municipio.toLowerCase();
        
        if (municipioProc === municipioExtraido) {
          pontuacao += 30;
        } else if (municipioProc.includes(municipioExtraido) || municipioExtraido.includes(municipioProc)) {
          pontuacao += 15;
        }
      }
      
      // Correspondência por estado (menos relevante, muitos processos do mesmo estado)
      if (estado && processo.uf) {
        if (processo.uf.toLowerCase() === estado.toLowerCase()) {
          pontuacao += 10;
        }
      }
      
      // Correspondência por data (relevante)
      if (dataLicitacao && processo.data_pregao) {
        const dataProc = new Date(processo.data_pregao).toISOString().split('T')[0];
        const dataExtraida = dataLicitacao;
        
        if (dataProc === dataExtraida) {
          pontuacao += 30;
        }
      }
      
      return {
        processo,
        pontuacao
      };
    });
    
    // Filtrar processos com pontuação relevante (maior que 30 pontos)
    const correspondentes = processosComPontuacao
      .filter(item => item.pontuacao > 30)
      .sort((a, b) => b.pontuacao - a.pontuacao); // Ordenar por pontuação descendente
    
    return correspondentes.map(item => item.processo);
  };
  
  /**
   * Busca processos no banco de dados usando as informações extraídas
   */
  const buscarProcessosNoBanco = async (numeroProcesso, orgao, municipio, estado, dataLicitacao) => {
    try {
      let query = supabase.from('processos').select('*');
      
      // Filtros para afunilar a busca
      if (numeroProcesso) {
        query = query.ilike('numero_processo', `%${numeroProcesso}%`);
      }
      
      if (orgao) {
        query = query.ilike('orgao', `%${orgao}%`);
      }
      
      if (municipio) {
        query = query.ilike('municipio', `%${municipio}%`);
      }
      
      if (estado) {
        query = query.ilike('uf', estado);
      }
      
      if (dataLicitacao) {
        query = query.eq('data_pregao', dataLicitacao);
      }
      
      // Limitar resultados e ordenar por data mais recente
      query = query.order('data_pregao', { ascending: false }).limit(10);
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return [];
      }
      
      // Se tivermos resultados, pontuamos e ordenamos usando a mesma lógica
      return buscarProcessosLocalmente(data, numeroProcesso, orgao, municipio, estado, dataLicitacao);
    } catch (error) {
      console.error('Erro ao buscar processos no banco:', error);
      return [];
    }
  };
  
  /**
   * Extrai o número do processo do texto
   */
  const extrairNumeroProcesso = (texto) => {
    // Padões comuns para números de processo em publicações
    const padroes = [
      /processo\s+(?:n[°º.:]*\s*)?(\d+[\s./\-]*\d*[\s./\-]*\d*)/i,
      /processo\s+(?:administrativo|licitatório|eletrônico)\s+(?:n[°º.:]*\s*)?(\d+[\s./\-]*\d*[\s./\-]*\d*)/i,
      /pregão\s+(?:eletrônico|presencial)\s+(?:n[°º.:]*\s*)?(\d+[\s./\-]*\d*[\s./\-]*\d*)/i,
      /edital\s+(?:n[°º.:]*\s*)?(\d+[\s./\-]*\d*[\s./\-]*\d*)/i,
      /licitação\s+(?:n[°º.:]*\s*)?(\d+[\s./\-]*\d*[\s./\-]*\d*)/i,
      // Novos padrões
      /n[°º.:]{1,2}\s+do\s+processo[:\s]+(\d+[\s./\-]*\d*[\s./\-]*\d*)/i,
      /protocolo[:\s]+(?:n[°º.:]*\s*)?(\d+[\s./\-]*\d*[\s./\-]*\d*)/i,
      /pae[:\s]+(?:n[°º.:]*\s*)?(\d+[\s./\-]*\d*[\s./\-]*\d*)/i, // Processo Administrativo Eletrônico
      /sei[:\s]+(?:n[°º.:]*\s*)?(\d+[\s./\-]*\d*[\s./\-]*\d*)/i, // Sistema Eletrônico de Informações
      /modalidade[^.]*?(?:n[°º.:]*\s*)?(\d+[\s./\-]*\d*[\s./\-]*\d*)/i
    ];
    
    for (const padrao of padroes) {
      const match = texto.match(padrao);
      if (match && match[1]) {
        // Limpar e normalizar o número do processo
        return match[1].trim().replace(/\s+/g, '');
      }
    }
    
    // Tentar um padrão mais genérico para números que parecem processos
    const padraoGenerico = /\b(\d{1,2}[\s./\-]\d{3,6}[\s./\-]\d{4})\b/g;
    const matches = [...texto.matchAll(padraoGenerico)];
    
    if (matches.length > 0) {
      // Se encontrarmos múltiplos, pegamos o primeiro
      return matches[0][1].trim().replace(/\s+/g, '');
    }
    
    return null;
  };
  
  /**
   * Extrai o órgão do texto
   */
  const extrairOrgao = (texto) => {
    const padroes = [
      /(?:órgão|entidade|unidade gestora|unidade compradora)[\s:]+([^.,\n]+)/i,
      /prefeitura(?:\s+municipal)?\s+de\s+([^.,\n]+)/i,
      /(?:governo|estado)\s+(?:do|de)\s+([^.,\n]+)/i,
      /(?:secretaria|ministério)\s+(?:d[aoe]s?)?\s+([^.,\n]+)/i,
      /universidade\s+(?:federal|estadual)?\s+(?:do|de)?\s+([^.,\n]+)/i,
      /instituto\s+(?:federal|estadual)?\s+(?:do|de)?\s+([^.,\n]+)/i,
      /câmara\s+(?:municipal|legislativa)\s+de\s+([^.,\n]+)/i
    ];
    
    for (const padrao of padroes) {
      const match = texto.match(padrao);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return null;
  };
  
  /**
   * Extrai o município do texto
   */
  const extrairMunicipio = (texto) => {
    const padroes = [
      /município\s+de\s+([^.,\n]+)/i,
      /prefeitura\s+(?:municipal\s+)?de\s+([^.,\n]+)/i,
      /(?:cidade|localidade)\s+de\s+([^.,\n]+)/i,
      // Novos padrões
      /em\s+([^.,\n]{3,30}?),\s*(?:estado|e)\s*d[eo]\s*([^.,\n]+)/i, // "Em São Paulo, Estado de SP"
      /na\s+cidade\s+de\s+([^.,\n]+)/i
    ];
    
    for (const padrao of padroes) {
      const match = texto.match(padrao);
      if (match && match[1]) {
        // Limpar municípios comuns que podem ser confundidos
        const municipio = match[1].trim();
        
        // Se for muito curto, provavelmente não é um município válido
        if (municipio.length < 3) {
          continue;
        }
        
        // Palavras que normalmente não são municípios
        const termoInvalido = /\b(processo|edital|pregão|licitação|documento)\b/i.test(municipio);
        if (termoInvalido) {
          continue;
        }
        
        return municipio;
      }
    }
    
    return null;
  };
  
  /**
   * Extrai o estado (UF) do texto
   */
  const extrairEstado = (texto) => {
    // Mapeamento de nomes de estados para siglas
    const estadosMap = {
      'acre': 'AC', 'alagoas': 'AL', 'amapa': 'AP', 'amazonas': 'AM',
      'bahia': 'BA', 'ceara': 'CE', 'distrito federal': 'DF', 'espirito santo': 'ES',
      'goias': 'GO', 'maranhao': 'MA', 'mato grosso': 'MT', 'mato grosso do sul': 'MS',
      'minas gerais': 'MG', 'para': 'PA', 'paraiba': 'PB', 'parana': 'PR',
      'pernambuco': 'PE', 'piaui': 'PI', 'rio de janeiro': 'RJ', 'rio grande do norte': 'RN',
      'rio grande do sul': 'RS', 'rondonia': 'RO', 'roraima': 'RR', 'santa catarina': 'SC',
      'sao paulo': 'SP', 'sergipe': 'SE', 'tocantins': 'TO'
    };
    
    // Buscar siglas diretas (AC, MG, SP, etc)
    const padraoSigla = /\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b/i;
    const matchSigla = texto.match(padraoSigla);
    
    if (matchSigla && matchSigla[1]) {
      return matchSigla[1].toUpperCase();
    }
    
    // Buscar nomes de estados por extenso
    for (const [nome, sigla] of Object.entries(estadosMap)) {
      if (texto.includes(nome)) {
        return sigla;
      }
    }
    
    return null;
  };
  
  /**
   * Extrai a data da licitação do texto
   */
  const extrairDataLicitacao = (texto) => {
    // Padrões comuns para datas em publicações
    const padroes = [
      /data\s+(?:d[aoe]\s+)?(?:abertura|realização|sessão|certame|licitação|pregão)[\s:]+(\d{1,2}[\s./\-]\d{1,2}[\s./\-]\d{2,4})/i,
      /(?:abertura|realização|sessão|certame|licitação|pregão)[^.]*?(?:dia|data)[\s:]*(\d{1,2}[\s./\-]\d{1,2}[\s./\-]\d{2,4})/i,
      /(\d{1,2}[\s./\-]\d{1,2}[\s./\-]\d{2,4})[^.,]*?(?:abertura|realização|sessão|certame|licitação|pregão)/i,
      // Novos padrões
      /data\s+(?:d[aoe]\s+)?(?:publicação|homologação|adjudicação)[\s:]+(\d{1,2}[\s./\-]\d{1,2}[\s./\-]\d{2,4})/i,
      /reunião\s+(?:d[aoe]\s+)?(?:julgamento|habilitação)[^.]*?(?:dia|data)[\s:]*(\d{1,2}[\s./\-]\d{1,2}[\s./\-]\d{2,4})/i
    ];
    
    for (const padrao of padroes) {
      const match = texto.match(padrao);
      if (match && match[1]) {
        const dataStr = match[1].trim();
        
        // Tentar interpretar a data no formato dd/mm/yyyy
        const partes = dataStr.split(/[\s./\-]+/);
        if (partes.length === 3) {
          let dia = parseInt(partes[0], 10);
          let mes = parseInt(partes[1], 10);
          let ano = parseInt(partes[2], 10);
          
          // Ajustar ano de dois dígitos
          if (ano < 100) {
            ano += 2000;
          }
          
          // Validar data
          if (dia >= 1 && dia <= 31 && mes >= 1 && mes <= 12 && ano >= 2000) {
            return `${ano}-${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
          }
        }
      }
    }
    
    // Buscar datas no formato brasileiro padrão (independente do contexto)
    const padraoBr = /\b(\d{1,2})[\s./\-](\d{1,2})[\s./\-](20\d{2})\b/g;
    const matchesBr = [...texto.matchAll(padraoBr)];
    
    if (matchesBr.length > 0) {
      const match = matchesBr[0];
      const dia = parseInt(match[1], 10);
      const mes = parseInt(match[2], 10);
      const ano = parseInt(match[3], 10);
      
      if (dia >= 1 && dia <= 31 && mes >= 1 && mes <= 12) {
        return `${ano}-${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
      }
    }
    
    return null;
  };
  
  // Manter as funções originais
  const extrairEmpresaVencedora = (texto, empresas) => {
    // Padrões de texto que podem indicar a empresa vencedora
    const padroes = [
      /empresa (vencedora|adjudicada|contratada)[:\s]+(.*?)(?=[\.,;]|\s{2}|$)/i,
      /adjudicado[:\s]+(a|para|à)?\s+(.*?)(?=[\.,;]|\s{2}|$)/i,
      /contratada[:\s]+(.*?)(?=[\.,;]|\s{2}|$)/i,
      /vencedor[:\s]+(.*?)(?=[\.,;]|\s{2}|$)/i,
      /homologado[:\s]+(a|para|à)?\s+(.*?)(?=[\.,;]|\s{2}|$)/i
    ];
    
    // Tentar extrair o nome da empresa usando os padrões
    let possiveisEmpresas = [];
    
    for (const padrao of padroes) {
      const match = texto.match(padrao);
      if (match && match[2]) {
        possiveisEmpresas.push(match[2].trim());
      }
    }
    
    // Procurar por CNPJ no texto
    const padraoCNPJ = /cnpj[:\s]*(\d{2}[\.\s]?\d{3}[\.\s]?\d{3}[\.\s]?\d{4}[\-\.\s]?\d{2})/i;
    const matchCNPJ = texto.match(padraoCNPJ);
    let cnpjEncontrado = null;
    
    if (matchCNPJ && matchCNPJ[1]) {
      // Limpar formatação do CNPJ
      cnpjEncontrado = matchCNPJ[1].replace(/[^\d]/g, '');
    }
    
    // Buscar correspondência entre empresas cadastradas e texto extraído
    if (cnpjEncontrado) {
      const empresa = empresas.find(e => {
        const cnpjLimpo = e.cnpj ? e.cnpj.replace(/[^\d]/g, '') : '';
        return cnpjLimpo === cnpjEncontrado;
      });
      
      if (empresa) return empresa.id;
    }
    
    // Se não encontrou por CNPJ, tenta por nome
    for (const nomeEmpresa of possiveisEmpresas) {
      const empresa = empresas.find(e => {
        const nome = e.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return nome.includes(nomeEmpresa) || nomeEmpresa.includes(nome);
      });
      
      if (empresa) return empresa.id;
    }
    
    return null;
  };
  
  // (manter funções originais)
  const extrairNumeroContrato = (texto) => {
    // Código existente
    const padroes = [
      /contrato n[º°\.ºo]([\s\.:]*)(\d+[\/-]?\d*[\/-]?\d*)/i,
      /numero do contrato[:\s]+(\d+[\/-]?\d*[\/-]?\d*)/i,
      /contrato[:\s]+(\d+[\/-]?\d*[\/-]?\d*)/i,
      /contrato de (prestacao|fornecimento)[\s\w]+ n[º°\.ºo]([\s\.:]*)(\d+[\/-]?\d*[\/-]?\d*)/i
    ];
    
    for (const padrao of padroes) {
      const match = texto.match(padrao);
      if (match && match[2]) {
        return match[2].trim();
      } else if (match && match[3]) {
        return match[3].trim();
      } else if (match && match[1] && /\d/.test(match[1])) {
        return match[1].trim();
      }
    }
    
    return null;
  };
  
  const extrairSistemasMencionados = (texto, sistemas) => {
    // Código existente
    const sistemasEncontrados = [];
    
    sistemas.forEach(sistema => {
      // Normalizar nome do sistema
      const nomeNormalizado = sistema.nome
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      
      // Criar variações de busca para o nome do sistema
      const variacoes = [
        nomeNormalizado,
        // Remover "sistema" ou "software" do início do nome
        nomeNormalizado.replace(/^(sistema|software)[\s\-_]+/i, ''),
        // Buscar por sigla (se tiver espaços)
        nomeNormalizado.split(/\s+/).map(palavra => palavra[0]).join('')
      ];
      
      // Verificar se alguma variação está presente no texto
      const encontrado = variacoes.some(variacao => 
        texto.includes(variacao) && variacao.length > 2 // Evitar falsos positivos com siglas curtas
      );
      
      if (encontrado && !sistemasEncontrados.includes(sistema.id)) {
        sistemasEncontrados.push(sistema.id);
      }
    });
    
    return sistemasEncontrados;
  };
  
  // Expor funções e estados
  return {
    processando,
    erro,
    processoIdentificado,
    ultimaAnaliseId, // Importante: exportar para usar no feedback
    analisarTexto,
    extrairNumeroProcesso,
    extrairOrgao,
    extrairMunicipio,
    extrairEstado,
    extrairDataLicitacao,
    extrairEmpresaVencedora,
    extrairNumeroContrato,
    extrairSistemasMencionados
  };
}