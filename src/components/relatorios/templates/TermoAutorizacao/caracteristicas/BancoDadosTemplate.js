/**
 * Gera o componente de banco de dados
 * @param {Object} processo - Dados do processo
 * @returns {String} HTML do componente
 */
export function gerarBancoDadosTemplate(processo) {
  return `
    <tr>
      <td style="width:40%; padding:8px; border-bottom:1px solid #ddd;"><strong>Banco de Dados:</strong></td>
      <td style="padding:8px; border-bottom:1px solid #ddd;">__________________</td>
    </tr>
  `;
}