/**
 * Gera o componente de banco de dados
 * @param {Object} processo - Dados do processo
 * @param {Number} timestamp - Timestamp para IDs únicos
 * @returns {String} HTML do componente
 */
export function gerarBancoDadosTemplate(processo, timestamp) {
  const bancoDadosSimId = `banco-dados-sim-${timestamp}`;
  const bancoDadosNaoId = `banco-dados-nao-${timestamp}`;
  const bancoDadosTextId = `banco-dados-text-${timestamp}`;
  const bancoDadosContainerId = `banco-dados-container-${timestamp}`;
  
  return `
    <tr>
      <td style="width:40%; padding:8px; border-bottom:1px solid #ddd;"><strong>Banco de Dados:</strong></td>
      <td style="padding:8px; border-bottom:1px solid #ddd;">
        <div style="display: flex; flex-direction: column; width: 100%;">
          <div style="display: flex; align-items: center; margin-bottom: 10px;">
            <label style="display: inline-flex; align-items: center; margin-right: 15px; cursor: pointer; margin-bottom: 0px;">
              <input type="radio" name="bancodados" id="${bancoDadosSimId}" style="margin-right: 6px;" onclick="document.getElementById('${bancoDadosContainerId}').style.display='table-row';">
              <strong>Sim</strong>
            </label>
            
            <label style="display: inline-flex; align-items: center; cursor: pointer; margin-bottom: 0px;">
              <input type="radio" name="bancodados" id="${bancoDadosNaoId}" style="margin-right: 6px;" onclick="document.getElementById('${bancoDadosContainerId}').style.display='none';">
              <strong>Não</strong>
            </label>
          </div>
        </div>
      </td>
    </tr>
    <tr id="${bancoDadosContainerId}" style="display: none; width: 100%;">
      <td colspan="2" style="padding:8px; border-bottom:1px solid #ddd; width: 100%;">
        <textarea id="${bancoDadosTextId}" style="width: 100%; min-height: 80px; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-family: inherit; font-size: inherit; box-sizing: border-box;" placeholder="Digite as informações sobre o banco de dados aqui..." maxlength="5000"></textarea>
      </td>
    </tr>
  `;
}