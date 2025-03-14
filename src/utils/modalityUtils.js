/**
 * Utilitários para manipulação de modalidades de licitação
 */

// Lista de modalidades de licitação
export const MODALIDADES = {
  'pregao': 'Pregão',
  'concorrencia': 'Concorrência',
  'concurso': 'Concurso',
  'leilao': 'Leilão',
  'dialogo_competitivo': 'Diálogo Competitivo',
  'credenciamento': 'Credenciamento',
  'pre_qualificacao': 'Pré-Qualificação',
  'manifestacao_interesse': 'Procedimento de Manifestação de Interesse',
  'licitacao_internacional': 'Licitação Internacional',
  'outros': 'Outros',
  'pregao_eletronico': 'Pregão Eletrônico',
  'pregao_presencial': 'Pregão Presencial',
  'tomada_precos': 'Tomada de Preços',
  'chamamento_publico': 'Chamamento Público',
  'rdc': 'Regime Diferenciado de Contratações',
  'rdc_eletronico': 'Regime Diferenciado de Contratações Eletrônico',
  'srp': 'Sistema de Registro de Preços',
  'srp_eletronico': 'Sistema de Registro de Preços Eletrônico',
  'srp_internacional': 'Sistema de Registro de Preços Internacional',
}

// Lista completa de modalidades que podem requerer plataforma digital
export const MODALIDADES_ELETRONICAS = [
  'pregao_eletronico',
  'rdc_eletronico',
  'srp_eletronico',
  'srp_internacional',
  'credenciamento',
  'licitacao_internacional',
  'dialogo_competitivo',
  'chamamento_publico',
  'pre_qualificacao',
  'manifestacao_interesse',
  'concurso',
  'srp_internacional',
  'srp_eletronico',
  'rdc',
  'toma_precos',
]

// Prazos mínimos em dias úteis para cada modalidade
export const PRAZOS_MINIMOS = {
  'pregao_eletronico': 8,
  'pregao_presencial': 8,
  'tomada_precos': 15,
  'concorrencia': 30,
  'leilao': 15,
  'rdc_eletronico': 10,
  'srp_eletronico': 8
}

/**
 * Formata o código da modalidade para texto amigável
 * @param {string} modalidade - Código da modalidade
 * @returns {string} Nome formatado da modalidade
 */
export function formatarModalidade(modalidade) {
  return MODALIDADES[modalidade] || modalidade
}

/**
 * Verifica se uma modalidade requer plataforma eletrônica
 * @param {string} modalidade - Código da modalidade
 * @returns {boolean}
 */
export function requiresPlataforma(modalidade) {
  return MODALIDADES_ELETRONICAS.includes(modalidade)
}

/**
 * Mapeia um texto de modalidade para o código correspondente
 * @param {string} modalidadeTexto - Texto contendo a modalidade
 * @returns {string} Código da modalidade
 */
export function mapearModalidade(modalidadeTexto) {
  const mapa = {
    'pregão eletrônico': 'pregao_eletronico',
    'pregão presencial': 'pregao_presencial',
    'tomada de preços': 'tomada_precos',
    'concorrência': 'concorrencia',
    'leilão': 'leilao',
    'pe': 'pregao_eletronico',
    'pp': 'pregao_presencial',
    'tp': 'tomada_precos',
    'convite': 'convite',
    'chamada pública': 'chamada_publica',
    'dispensa de licitação': 'dispensa'
  }

  const modalidadeLower = (modalidadeTexto || '').toLowerCase().trim()
  
  // Verifica correspondência exata
  if (mapa[modalidadeLower]) {
    return mapa[modalidadeLower]
  }
  
  // Verifica correspondência parcial
  for (const [key, value] of Object.entries(mapa)) {
    if (modalidadeLower.includes(key)) {
      return value
    }
  }
  
  return ''
}
