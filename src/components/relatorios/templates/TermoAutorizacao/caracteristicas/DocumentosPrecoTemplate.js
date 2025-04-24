/**
 * Gera o componente de documentos com preço
 * @param {Object} processo - Dados do processo
 * @param {Number} timestamp - Timestamp para IDs únicos
 * @returns {String} HTML do componente
 */
export function gerarDocumentosPrecoTemplate(processo, timestamp) {
  const docsSimId = `docs-sim-${timestamp}`;
  const docsNaoId = `docs-nao-${timestamp}`;
  const docsOpcoesId = `docs-opcoes-${timestamp}`;
  const docsConcomitanteId = `docs-concomitante-${timestamp}`;
  const docsEmailId = `docs-email-${timestamp}`;
  const docsSicafId = `docs-sicaf-${timestamp}`;
  const docsAutomaticoId = `docs-automatico-${timestamp}`;
  
  return `
    <tr>
      <td style="width:40%; padding:8px; border-bottom:1px solid #ddd;"><strong>Incluir documentos de habilitação com preço:</strong></td>
      <td style="padding:8px; border-bottom:1px solid #ddd;">
        <label style="display: inline-flex; align-items: center; margin-right: 15px; cursor: pointer; margin-bottom: 0px;">
          <input type="radio" name="documentos" id="${docsSimId}" style="margin-right: 6px;" onclick="document.getElementById('${docsOpcoesId}').style.display='table-row';">
          <strong>Sim</strong>
        </label>
        
        <label style="display: inline-flex; align-items: center; cursor: pointer; margin-bottom: 0px;">
          <input type="radio" name="documentos" id="${docsNaoId}" style="margin-right: 6px;" onclick="document.getElementById('${docsOpcoesId}').style.display='none';">
          <strong>Não</strong>
        </label>
      </td>
    </tr>
    <tr id="${docsOpcoesId}" style="display: none; width: 100%;">
      <td style="width:40%; padding:8px 8px 8px 30px; border-bottom:1px solid #ddd;"><strong>Método de envio:</strong></td>
      <td style="padding:8px; border-bottom:1px solid #ddd;">
        <div style="display: flex; flex-wrap: wrap; gap: 15px;">
          <label style="display: inline-flex; align-items: center; cursor: pointer;">
            <input type="radio" name="docs-metodo" id="${docsConcomitanteId}" style="margin-right: 6px;">
            <strong>Concomitantemente</strong>
          </label>
          
          <label style="display: inline-flex; align-items: center; cursor: pointer;">
            <input type="radio" name="docs-metodo" id="${docsEmailId}" style="margin-right: 6px;">
            <strong>E-mail</strong>
          </label>
          
          <label style="display: inline-flex; align-items: center; cursor: pointer;">
            <input type="radio" name="docs-metodo" id="${docsSicafId}" style="margin-right: 6px;">
            <strong>SICAF</strong>
          </label>
          
          <label style="display: inline-flex; align-items: center; cursor: pointer;">
            <input type="radio" name="docs-metodo" id="${docsAutomaticoId}" style="margin-right: 6px;">
            <strong>Automático</strong>
          </label>
        </div>
      </td>
    </tr>
  `;
}