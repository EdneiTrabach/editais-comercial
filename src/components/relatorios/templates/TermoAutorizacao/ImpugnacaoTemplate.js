/**
 * Gera a seção de itens impugnatíveis
 * @param {Object} processo - Dados do processo
 * @param {Number} timestamp - Timestamp para IDs únicos
 * @returns {String} HTML da seção de itens impugnatíveis
 */
export function gerarItensImpugnativeis(processo, timestamp) {
  // Criar IDs únicos para os elementos
  const impugnacaoSimId = `impugnacao-sim-${timestamp}`;
  const impugnacaoNaoId = `impugnacao-nao-${timestamp}`;
  const impugnacaoContainerId = `impugnacao-container-${timestamp}`;
  const impugnacaoTextId = `impugnacao-text-${timestamp}`;
  
  return `
    <h3 style="margin-bottom: 20px;">4. ITENS IMPUGNATÍVEIS</h3>
    <table style="width:100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr>
        <td style="width:40%; padding:8px; border-bottom:1px solid #ddd;"><strong>Existem itens a impugnar?</strong></td>
        <td style="padding:8px; border-bottom:1px solid #ddd;">
          <div style="display: flex; flex-direction: column; width: 100%;">
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
              <label style="display: inline-flex; align-items: center; margin-right: 15px; cursor: pointer; margin-bottom: 0px;">
                <input type="radio" name="impugnacao" id="${impugnacaoSimId}" style="margin-right: 6px;" onclick="document.getElementById('${impugnacaoContainerId}').style.display='table-row';">
                <strong>Sim</strong>
              </label>
              
              <label style="display: inline-flex; align-items: center; cursor: pointer; margin-bottom: 0px;">
                <input type="radio" name="impugnacao" id="${impugnacaoNaoId}" style="margin-right: 6px;" onclick="document.getElementById('${impugnacaoContainerId}').style.display='none';">
                <strong>Não</strong>
              </label>
            </div>
          </div>
        </td>
      </tr>
      <tr id="${impugnacaoContainerId}" style="display: none; width: 100%;">
        <td colspan="2" style="padding:8px; border-bottom:1px solid #ddd; width: 100%;">
          <textarea 
            id="${impugnacaoTextId}" 
            style="width: 100%; min-height: 80px; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-family: inherit; font-size: inherit; box-sizing: border-box;" 
            placeholder="Descreva os itens que podem ser impugnados neste edital..." 
            maxlength="5000"
          ></textarea>
        </td>
      </tr>
    </table>
  `;
}