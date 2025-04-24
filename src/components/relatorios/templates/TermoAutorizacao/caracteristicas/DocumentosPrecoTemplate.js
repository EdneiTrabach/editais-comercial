/**
 * Gera o componente de documentos com preço
 * @param {Object} processo - Dados do processo
 * @param {Number} timestamp - Timestamp para IDs únicos
 * @returns {String} HTML do componente
 */
export function gerarDocumentosPrecoTemplate(processo, timestamp) {
  const docsSimId = `docs-sim-${timestamp}`;
  const docsNaoId = `docs-nao-${timestamp}`;
  
  return `
    <tr>
      <td style="width:40%; padding:8px; border-bottom:1px solid #ddd;"><strong>Incluir documentos com preço:</strong></td>
      <td style="padding:8px; border-bottom:1px solid #ddd;">
        <label style="display: inline-flex; align-items: center; margin-right: 15px; cursor: pointer; margin-bottom: 0px;">
          <input type="radio" name="documentos" id="${docsSimId}" style="margin-right: 6px;">
          <strong>Sim</strong>
        </label>
        
        <label style="display: inline-flex; align-items: center; cursor: pointer; margin-bottom: 0px;">
          <input type="radio" name="documentos" id="${docsNaoId}" style="margin-right: 6px;">
          <strong>Não</strong>
        </label>
      </td>
    </tr>
  `;
}