/**
 * Utilitário para gerar recomendações baseadas na análise de conformidade
 */

/**
 * Gera um texto de recomendação baseado na análise de conformidade
 * @param {Object} resultadoConformidade - Resultado da validação de conformidade
 * @param {number} percentualMinimoGeral - Percentual mínimo geral
 * @param {number} percentualMinimoObrigatorio - Percentual mínimo para sistemas obrigatórios
 * @returns {string} - Texto da recomendação
 */
export const gerarRecomendacao = (resultadoConformidade, percentualMinimoGeral, percentualMinimoObrigatorio) => {
  const { percentualGeralAtendimento, atendePercentualMinimo, todosObrigatoriosAtendem, sistemasNaoConformes } = resultadoConformidade;
  const percentualFormatado = percentualGeralAtendimento.toFixed(2);
  
  // Caso de aprovação completa
  if (atendePercentualMinimo && todosObrigatoriosAtendem) {
    return `Todos os requisitos técnicos foram atendidos. O percentual geral de ${percentualFormatado}% está acima do mínimo exigido (${percentualMinimoGeral}%) e todos os sistemas obrigatórios atendem ao percentual mínimo exigido (${percentualMinimoObrigatorio}%).\n\n✅ **Recomendamos a aprovação técnica do processo analisado.**`;
  }
  
  // Caso onde o percentual geral atende, mas sistemas obrigatórios não
  if (atendePercentualMinimo && !todosObrigatoriosAtendem) {
    const sistemasObrigatoriosNaoConformes = sistemasNaoConformes.filter(s => s.obrigatorio);
    const listagemSistemas = sistemasObrigatoriosNaoConformes
      .map(s => `- ${s.nome || 'Sistema sem nome'}: ${calcularPercentualAtendimento(s).toFixed(2)}%`)
      .join('\n');
    
    return `Embora o percentual geral esteja acima do mínimo exigido (${percentualFormatado}% ≥ ${percentualMinimoGeral}%), os seguintes sistemas obrigatórios **não atendem** ao percentual mínimo de ${percentualMinimoObrigatorio}%:\n\n${listagemSistemas}\n\n⚠️ **Recomendamos a reprovação técnica até que os sistemas obrigatórios atendam aos requisitos definidos no processo.**`;
  }
  
  // Caso onde o percentual geral não atende
  if (!atendePercentualMinimo) {
    return `O percentual geral de atendimento (${percentualFormatado}%) está abaixo do mínimo exigido (${percentualMinimoGeral}%).\n\n⚠️ **Recomendamos a reprovação técnica até que os requisitos mínimos sejam atendidos.**`;
  }
  
  // Caso genérico (não deveria chegar aqui, mas por segurança)
  return `A análise identificou não conformidades que impedem a aprovação do processo no momento. Revise os requisitos e realize os ajustes necessários.\n\n⚠️ **Recomendamos revisão do processo para adequação aos requisitos técnicos.**`;
};

/**
 * Calcula o percentual de atendimento para um sistema específico
 * @param {Object} sistema - Objeto com dados do sistema
 * @returns {number} - Percentual de atendimento
 */
const calcularPercentualAtendimento = (sistema) => {
  if (!sistema.totalItens) return 0;
  const atendidos = sistema.totalItens - sistema.naoAtendidos;
  return (atendidos / sistema.totalItens) * 100;
};