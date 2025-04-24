/**
 * Gera o componente de julgamento por lances
 * @param {Object} processo - Dados do processo
 * @param {Number} timestamp - Timestamp para IDs únicos
 * @returns {String} HTML do componente
 */
export function gerarJulgamentoLancesTemplate(processo, timestamp) {
  const julgamentoSimId = `julgamento-sim-${timestamp}`;
  const julgamentoNaoId = `julgamento-nao-${timestamp}`;
  
  return `
    <tr>
      <td style="width:40%; padding:8px; border-bottom:1px solid #ddd;"><strong>Julgamento por lances:</strong></td>
      <td style="padding:8px; border-bottom:1px solid #ddd;">
        <label style="display: inline-flex; align-items: center; margin-right: 15px; cursor: pointer; margin-bottom: 0px;">
          <input type="radio" name="julgamento" id="${julgamentoSimId}" style="margin-right: 6px;">
          <strong>Sim</strong>
        </label>
        
        <label style="display: inline-flex; align-items: center; cursor: pointer; margin-bottom: 0px;">
          <input type="radio" name="julgamento" id="${julgamentoNaoId}" style="margin-right: 6px;">
          <strong>Não</strong>
        </label>
      </td>
    </tr>
  `;
}