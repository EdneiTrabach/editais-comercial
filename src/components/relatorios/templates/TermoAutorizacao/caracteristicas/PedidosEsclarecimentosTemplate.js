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
              <input type="radio" name="esclarecimentos" id="${esclarecimentosSimId}" style="margin-right: 6px;">
              <strong>Sim</strong>
            </label>
            
            <label style="display: inline-flex; align-items: center; cursor: pointer; margin-bottom: 0px;">
              <input type="radio" name="esclarecimentos" id="${esclarecimentosNaoId}" style="margin-right: 6px;">
              <strong>Não</strong>
            </label>
          </div>
          
          <div id="${esclarecimentosContainerId}" style="width: 100%; display: none;">
            <textarea id="${esclarecimentosTextId}" style="width: 100%; min-height: 60px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;" maxlength="5000" placeholder="Digite os esclarecimentos aqui..."></textarea>
          </div>
        </div>
      </td>
    </tr>
  `;
}