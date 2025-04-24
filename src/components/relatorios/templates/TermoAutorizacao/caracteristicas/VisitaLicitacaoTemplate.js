/**
 * Gera o componente de visita antes da licitação
 * @param {Object} processo - Dados do processo
 * @param {Number} timestamp - Timestamp para IDs únicos
 * @returns {String} HTML do componente
 */
export function gerarVisitaLicitacaoTemplate(processo, timestamp) {
  const visitaSimId = `visita-sim-${timestamp}`;
  const visitaNaoId = `visita-nao-${timestamp}`;
  
  return `
    <tr>
      <td style="width:40%; padding:8px; border-bottom:1px solid #ddd;"><strong>Visita antes da Licitação:</strong></td>
      <td style="padding:8px; border-bottom:1px solid #ddd;">
        <label style="display: inline-flex; align-items: center; margin-right: 15px; cursor: pointer; margin-bottom: 0px;">
          <input type="radio" name="visita" id="${visitaSimId}" style="margin-right: 6px;">
          <strong>Sim</strong>
        </label>
        
        <label style="display: inline-flex; align-items: center; cursor: pointer; margin-bottom: 0px;">
          <input type="radio" name="visita" id="${visitaNaoId}" style="margin-right: 6px;">
          <strong>Não</strong>
        </label>
      </td>
    </tr>
  `;
}