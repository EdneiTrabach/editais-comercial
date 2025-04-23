/**
 * Formatar data para exibição
 * @param {string} dataStr - String de data
 * @returns {string} Data formatada
 */
export function formatarData(dataStr) {
  if (!dataStr) return 'Data não informada';
  
  try {
    const data = new Date(dataStr);
    return data.toLocaleDateString('pt-BR');
  } catch (error) {
    return dataStr;
  }
}

/**
 * Formatar nome de modalidade para exibição
 * @param {string} modalidade - Código da modalidade
 * @returns {string} Nome formatado da modalidade
 */
export function formatarModalidade(modalidade) {
  const modalidadesMap = {
    'pregao_eletronico': 'Pregão Eletrônico',
    'pregao_presencial': 'Pregão Presencial',
    'tomada_precos': 'Tomada de Preços',
    'concorrencia': 'Concorrência',
    'convite': 'Convite',
    'dispensa': 'Dispensa',
    'inexigibilidade': 'Inexigibilidade',
    'leilao': 'Leilão',
    'rdc': 'RDC',
    'rdc_eletronico': 'RDC Eletrônico'
  };
  
  return modalidadesMap[modalidade] || modalidade;
}

/**
 * Formatar nível de compatibilidade para exibição
 * @param {number} pontuacao - Pontuação de compatibilidade
 * @returns {string} Texto do nível formatado
 */
export function formatarNivel(pontuacao) {
  if (pontuacao >= 100) return 'Alta compatibilidade';
  if (pontuacao >= 70) return 'Boa compatibilidade';
  return 'Possível compatibilidade';
}

/**
 * Obter classe CSS para o nível de compatibilidade
 * @param {number} pontuacao - Pontuação de compatibilidade
 * @returns {string} Nome da classe CSS
 */
export function getNivelClasse(pontuacao) {
  if (pontuacao >= 100) return 'alto';
  if (pontuacao >= 70) return 'medio';
  return 'baixo';
}

/**
 * Extrai o número do processo a partir do texto
 * @param {string} texto - Texto da publicação
 * @returns {string|null} Número do processo extraído ou null
 */
export function extrairNumeroProcesso(texto) {
  if (!texto) return null;
  
  // Formatos comuns: 1234/2023, 1234-2023, 1234.2023
  const regexNumeroProcesso = /\b(\d{1,6})[\/\.\-]?(\d{2,4})\b/g;
  const matches = [...texto.matchAll(regexNumeroProcesso)];
  
  if (matches.length > 0) {
    return `${matches[0][1]}/${matches[0][2]}`;
  }
  
  return null;
}

/**
 * Extrai o nome do órgão a partir do texto
 * @param {string} texto - Texto da publicação
 * @returns {string|null} Nome do órgão extraído ou null
 */
export function extrairOrgao(texto) {
  if (!texto) return null;
  
  // Tentar extrair após palavras-chave comuns
  const regexOrgao = /(?:prefeitura|câmara|secretaria|município|órgão)\s+(?:municipal|de|do|da)\s+(?:de\s+)?([a-zA-ZáàâãéèêíìîóòôõúùûçÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ\s]{3,}?)(?:\s|$|,|\.)/i;
  
  const match = texto.match(regexOrgao);
  
  if (match && match[1]) {
    // Limpar o nome do órgão
    return match[1].trim();
  }
  
  // Tentar encontrar "Prefeitura de X" ou padrões similares
  const regexSimples = /(?:prefeitura|câmara)\s+(?:de|do|da)\s+([a-zA-ZáàâãéèêíìîóòôõúùûçÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ\s]{3,}?)(?:\s|$|,|\.)/i;
  
  const matchSimples = texto.match(regexSimples);
  
  if (matchSimples && matchSimples[1]) {
    return matchSimples[1].trim();
  }
  
  return null;
}

/**
 * Extrai uma possível data de licitação do texto
 * @param {string} texto - Texto da publicação
 * @returns {string|null} Data formatada ou null
 */
export function extrairDataLicitacao(texto) {
  if (!texto) return null;
  
  // Busca por padrões de data: dd/mm/yyyy, dd-mm-yyyy, dd.mm.yyyy
  const regexData = /(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{4})/g;
  const matches = [...texto.matchAll(regexData)];
  
  if (matches.length > 0) {
    const [_, dia, mes, ano] = matches[0];
    // Validar data
    if (parseInt(mes) <= 12 && parseInt(dia) <= 31) {
      try {
        const data = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
        return data.toISOString().split('T')[0]; // Formato yyyy-mm-dd
      } catch (e) {
        return null;
      }
    }
  }
  
  return null;
}

/**
 * Extrai um possível município mencionado no texto
 * @param {string} texto - Texto da publicação
 * @returns {string|null} Nome do município extraído ou null
 */
export function extrairMunicipio(texto) {
  if (!texto) return null;
  
  // Tentar encontrar após "município de" ou padrões similares
  const regexMunicipio = /município\s+(?:de|do|da)\s+([a-zA-ZáàâãéèêíìîóòôõúùûçÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ\s]{3,}?)(?:\s|$|,|\.)/i;
  
  const match = texto.match(regexMunicipio);
  
  if (match && match[1]) {
    return match[1].trim();
  }
  
  // Tentar encontrar "cidade de X" ou padrões similares
  const regexCidade = /cidade\s+(?:de|do|da)\s+([a-zA-ZáàâãéèêíìîóòôõúùûçÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ\s]{3,}?)(?:\s|$|,|\.)/i;
  
  const matchCidade = texto.match(regexCidade);
  
  if (matchCidade && matchCidade[1]) {
    return matchCidade[1].trim();
  }
  
  return null;
}

/**
 * Extrai uma sigla de estado (UF) do texto
 * @param {string} texto - Texto da publicação
 * @returns {string|null} Sigla do estado ou null
 */
export function extrairEstadoUF(texto) {
  if (!texto) return null;
  
  // Lista de UFs brasileiras
  const ufs = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
               'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 
               'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'];
  
  // Buscar UF após preposições comuns
  const regexUF = new RegExp(`\\b(${ufs.join('|')})\\b`, 'gi');
  const matches = texto.match(regexUF);
  
  if (matches && matches.length > 0) {
    return matches[0].toUpperCase();
  }
  
  // Buscar em formatos "Estado de X" ou "estado do X"
  const regexEstado = /estado\s+(?:de|do|da)\s+([a-zA-ZáàâãéèêíìîóòôõúùûçÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ\s]{3,}?)(?:\s|$|,|\.)/i;
  const matchEstado = texto.match(regexEstado);
  
  if (matchEstado && matchEstado[1]) {
    // Mapear nome do estado para UF
    const estadosMap = {
      'acre': 'AC',
      'alagoas': 'AL',
      'amapa': 'AP',
      'amazonas': 'AM',
      'bahia': 'BA',
      'ceara': 'CE',
      'distrito federal': 'DF',
      'espirito santo': 'ES',
      'goias': 'GO',
      'maranhao': 'MA',
      'mato grosso': 'MT',
      'mato grosso do sul': 'MS',
      'minas gerais': 'MG',
      'para': 'PA',
      'paraiba': 'PB',
      'parana': 'PR',
      'pernambuco': 'PE',
      'piaui': 'PI',
      'rio de janeiro': 'RJ',
      'rio grande do norte': 'RN',
      'rio grande do sul': 'RS',
      'rondonia': 'RO',
      'roraima': 'RR',
      'santa catarina': 'SC',
      'sao paulo': 'SP',
      'sergipe': 'SE',
      'tocantins': 'TO'
    };
    
    const nomeEstado = matchEstado[1].toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
      
    return estadosMap[nomeEstado] || null;
  }
  
  return null;
}

/**
 * Formata o valor monetário para exibição
 * @param {number|string} valor - Valor monetário
 * @returns {string} Valor formatado em Real brasileiro
 */
export function formatarValorMonetario(valor) {
  if (valor === null || valor === undefined || valor === '') return 'Valor não informado';
  
  try {
    const valorNumerico = typeof valor === 'string' ? parseFloat(valor.replace(/[^\d,.-]/g, '').replace(',', '.')) : valor;
    
    return valorNumerico.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  } catch (error) {
    return `${valor}`;
  }
}