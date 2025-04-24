/**
 * Gera o componente de pedidos de esclarecimentos
 * @param {Object} processo - Dados do processo
 * @param {Number} timestamp - Timestamp para IDs únicos
 * @returns {String} HTML do componente
 */
export function gerarPedidosEsclarecimentosTemplate(processo, timestamp) {
  const esclarecimentosSimId = `esclarecimentos-sim-${timestamp}`;
  const esclarecimentosNaoId = `esclarecimentos-nao-${timestamp}`;
  const esclarecimentosTextId = `esclarecimentos-text-${timestamp}`;
  const esclarecimentosContainerId = `esclarecimentos-container-${timestamp}`;

  return `
    <tr>
      <td style="width:40%; padding:8px; border-bottom:1px solid #ddd;"><strong>Pedidos de Esclarecimentos:</strong></td>
      <td style="padding:8px; border-bottom:1px solid #ddd;">
        <div style="display: flex; flex-direction: column; width: 100%;">
          <div style="display: flex; align-items: center; margin-bottom: 10px;">
            <label style="display: inline-flex; align-items: center; margin-right: 15px; cursor: pointer; margin-bottom: 0px;">
              <input type="radio" name="esclarecimentos" id="${esclarecimentosSimId}" style="margin-right: 6px;" onclick="document.getElementById('${esclarecimentosContainerId}').style.display='table-row';">
              <strong>Sim</strong>
            </label>
            
            <label style="display: inline-flex; align-items: center; cursor: pointer; margin-bottom: 0px;">
              <input type="radio" name="esclarecimentos" id="${esclarecimentosNaoId}" style="margin-right: 6px;" onclick="document.getElementById('${esclarecimentosContainerId}').style.display='none';">
              <strong>Não</strong>
            </label>
          </div>
        </div>
      </td>
    </tr>
    <tr id="${esclarecimentosContainerId}" style="display: none; width: 100%;">
      <td colspan="2" style="padding:8px; border-bottom:1px solid #ddd; width: 100%;">
        <textarea id="${esclarecimentosTextId}" style="width: 100%; min-height: 80px; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-family: inherit; font-size: inherit; box-sizing: border-box;" placeholder="Digite as informações sobre os pedidos de esclarecimentos aqui..." maxlength="5000"></textarea>
      </td>
    </tr>
  `;
}
