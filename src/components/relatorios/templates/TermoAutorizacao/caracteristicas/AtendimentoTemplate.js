/**
 * Gera o componente de percentual de atendimento com textarea simples
 * @param {Object} processo - Dados do processo
 * @param {Array} analisesItens - Dados de análise já carregados do banco
 * @param {Number} timestamp - Timestamp para IDs únicos
 * @returns {Object} HTML e scripts do componente
 */
export function gerarAtendimentoTemplate(processo, analisesItens = [], timestamp) {
  const atendimentoTextId = `atendimento-texto-${timestamp}`;
  
  // Calcular percentual geral se houver dados disponíveis
  let percentualGeral = 0;
  let sistemasPrincipais = [];
  
  if (Array.isArray(analisesItens) && analisesItens.length > 0) {
    let totalGeral = 0;
    let atendimentoGeral = 0;
    
    // Processar os dados de análise para calcular o percentual geral
    analisesItens.forEach(item => {
      const totalItens = item.total_itens || 0;
      const naoAtendidos = item.nao_atendidos || 0;
      const atendidos = totalItens - naoAtendidos;
      const percentual = totalItens > 0 ? Math.round((atendidos / totalItens) * 100) : 0;
      const nomeSistema = item.sistema_nome_personalizado || 
                         (item.sistemas ? item.sistemas.nome : 'Sistema');
      
      totalGeral += totalItens;
      atendimentoGeral += atendidos;
      
      // Guardar sistemas principais para sugestão
      sistemasPrincipais.push(`${nomeSistema}: ${percentual}%`);
    });
    
    // Calcular percentual geral
    percentualGeral = totalGeral > 0 ? Math.round((atendimentoGeral / totalGeral) * 100) : 0;
  }
  
  // Texto de sugestão baseado nos dados disponíveis
  const textoSugestao = Array.isArray(analisesItens) && analisesItens.length > 0 ? 
    `Atendemos ${percentualGeral}% dos requisitos deste edital.\nPrincipais sistemas: ${sistemasPrincipais.join(', ')}` : 
    "";
  
  // Retorna o componente apenas com o textarea
  return {
    html: `
      <tr>
        <td style="width:40%; padding:8px; border-bottom:1px solid #ddd;"><strong>% que atendemos:</strong></td>
        <td style="padding:8px; border-bottom:1px solid #ddd; width:100%;">
          <textarea 
            id="${atendimentoTextId}" 
            style="width: 100%; min-height: 80px; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-family: inherit; font-size: inherit; box-sizing: border-box;"
            placeholder="Digite as informações sobre o percentual de atendimento aqui..."
            maxlength="5000"
          >${textoSugestao}</textarea>
        </td>
      </tr>
    `,
    scriptInicializador: '',
    scriptCarregamento: ''
  };
}