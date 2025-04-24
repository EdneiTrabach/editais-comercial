/**
 * Gera o componente de visita antes da licitação
 * @param {Object} processo - Dados do processo
 * @param {Number} timestamp - Timestamp para IDs únicos
 * @returns {String} HTML do componente
 */
export function gerarVisitaLicitacaoTemplate(processo, timestamp) {
  const visitaSimId = `visita-sim-${timestamp}`;
  const visitaNaoId = `visita-nao-${timestamp}`;
  const visitaOpcoesId = `visita-opcoes-${timestamp}`;
  const visita3DiasId = `visita-3dias-${timestamp}`;
  const visita5DiasId = `visita-5dias-${timestamp}`;
  const visita7DiasId = `visita-7dias-${timestamp}`;
  const visita10DiasId = `visita-10dias-${timestamp}`;
  
  return `
    <tr>
      <td style="width:40%; padding:8px; border-bottom:1px solid #ddd;"><strong>Visita antes da Licitação:</strong></td>
      <td style="padding:8px; border-bottom:1px solid #ddd;">
        <label style="display: inline-flex; align-items: center; margin-right: 15px; cursor: pointer; margin-bottom: 0px;">
          <input type="radio" name="visita" id="${visitaSimId}" style="margin-right: 6px;" onclick="document.getElementById('${visitaOpcoesId}').style.display='table-row';">
          <strong>Sim</strong>
        </label>
        
        <label style="display: inline-flex; align-items: center; cursor: pointer; margin-bottom: 0px;">
          <input type="radio" name="visita" id="${visitaNaoId}" style="margin-right: 6px;" onclick="document.getElementById('${visitaOpcoesId}').style.display='none';">
          <strong>Não</strong>
        </label>
      </td>
    </tr>
    <tr id="${visitaOpcoesId}" style="display: none; width: 100%;">
      <td style="width:40%; padding:8px 8px 8px 30px; border-bottom:1px solid #ddd;"><strong>Prazo de antecedência:</strong></td>
      <td style="padding:8px; border-bottom:1px solid #ddd;">
        <div style="display: flex; flex-wrap: wrap; gap: 15px;">
          <label style="display: inline-flex; align-items: center; cursor: pointer;">
            <input type="radio" name="visita-prazo" id="${visita3DiasId}" style="margin-right: 6px;">
            <strong>3 dias</strong>
          </label>
          
          <label style="display: inline-flex; align-items: center; cursor: pointer;">
            <input type="radio" name="visita-prazo" id="${visita5DiasId}" style="margin-right: 6px;">
            <strong>5 dias</strong>
          </label>
          
          <label style="display: inline-flex; align-items: center; cursor: pointer;">
            <input type="radio" name="visita-prazo" id="${visita7DiasId}" style="margin-right: 6px;">
            <strong>7 dias</strong>
          </label>
          
          <label style="display: inline-flex; align-items: center; cursor: pointer;">
            <input type="radio" name="visita-prazo" id="${visita10DiasId}" style="margin-right: 6px;">
            <strong>10 dias</strong>
          </label>
        </div>
      </td>
    </tr>
  `;
}