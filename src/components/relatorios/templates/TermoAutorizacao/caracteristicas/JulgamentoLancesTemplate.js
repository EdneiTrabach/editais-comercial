/**
 * Gera o componente de julgamento por lances
 * @param {Object} processo - Dados do processo
 * @param {Number} timestamp - Timestamp para IDs únicos
 * @returns {String} HTML do componente
 */
export function gerarJulgamentoLancesTemplate(processo, timestamp) {
  const julgamentoSimId = `julgamento-sim-${timestamp}`;
  const julgamentoNaoId = `julgamento-nao-${timestamp}`;
  const julgamentoOpcoesId = `julgamento-opcoes-${timestamp}`;
  const julgamentoAbertoId = `julgamento-aberto-${timestamp}`;
  const julgamentoFechadoId = `julgamento-fechado-${timestamp}`;
  const julgamentoMenorPrecoId = `julgamento-menor-preco-${timestamp}`;
  const julgamentoMenorPercentualId = `julgamento-menor-percentual-${timestamp}`;
  const julgamentoMaiorDescontoId = `julgamento-maior-desconto-${timestamp}`;
  const julgamentoMelhorTecnicaId = `julgamento-melhor-tecnica-${timestamp}`;
  
  return `
    <tr>
      <td style="width:40%; padding:8px; border-bottom:1px solid #ddd;"><strong>Julgamento por lances:</strong></td>
      <td style="padding:8px; border-bottom:1px solid #ddd;">
        <label style="display: inline-flex; align-items: center; margin-right: 15px; cursor: pointer; margin-bottom: 0px;">
          <input type="radio" name="julgamento" id="${julgamentoSimId}" style="margin-right: 6px;" onclick="document.getElementById('${julgamentoOpcoesId}').style.display='table-row';">
          <strong>Sim</strong>
        </label>
        
        <label style="display: inline-flex; align-items: center; cursor: pointer; margin-bottom: 0px;">
          <input type="radio" name="julgamento" id="${julgamentoNaoId}" style="margin-right: 6px;" onclick="document.getElementById('${julgamentoOpcoesId}').style.display='none';">
          <strong>Não</strong>
        </label>
      </td>
    </tr>
    <tr id="${julgamentoOpcoesId}" style="display: none; width: 100%;">
      <td style="width:40%; padding:8px 8px 8px 30px; border-bottom:1px solid #ddd;"><strong>Modo de julgamento:</strong></td>
      <td style="padding:8px; border-bottom:1px solid #ddd;">
        <div style="display: flex; flex-wrap: wrap; gap: 15px;">
          <label style="display: inline-flex; align-items: center; cursor: pointer;">
            <input type="radio" name="julgamento-modo" id="${julgamentoAbertoId}" style="margin-right: 6px;">
            <strong>Aberto</strong>
          </label>
          
          <label style="display: inline-flex; align-items: center; cursor: pointer;">
            <input type="radio" name="julgamento-modo" id="${julgamentoFechadoId}" style="margin-right: 6px;">
            <strong>Fechado</strong>
          </label>
          
          <label style="display: inline-flex; align-items: center; cursor: pointer;">
            <input type="radio" name="julgamento-modo" id="${julgamentoMenorPrecoId}" style="margin-right: 6px;">
            <strong>Menor Preço</strong>
          </label>
          
          <label style="display: inline-flex; align-items: center; cursor: pointer;">
            <input type="radio" name="julgamento-modo" id="${julgamentoMenorPercentualId}" style="margin-right: 6px;">
            <strong>Menor Percentual</strong>
          </label>
          
          <label style="display: inline-flex; align-items: center; cursor: pointer;">
            <input type="radio" name="julgamento-modo" id="${julgamentoMaiorDescontoId}" style="margin-right: 6px;">
            <strong>Maior Desconto</strong>
          </label>
          
          <label style="display: inline-flex; align-items: center; cursor: pointer;">
            <input type="radio" name="julgamento-modo" id="${julgamentoMelhorTecnicaId}" style="margin-right: 6px;">
            <strong>Melhor Técnica</strong>
          </label>
        </div>
      </td>
    </tr>
  `;
}