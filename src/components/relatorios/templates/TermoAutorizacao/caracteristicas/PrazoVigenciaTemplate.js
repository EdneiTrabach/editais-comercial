/**
 * Gera o componente de prazo de vigência
 * @param {Object} processo - Dados do processo
 * @returns {String} HTML do componente
 */
export function gerarPrazoVigenciaTemplate(processo) {
  return `
    <tr>
      <td style="width:40%; padding:8px; border-bottom:1px solid #ddd;"><strong>Prazo de Vigência:</strong></td>
      <td style="padding:8px; border-bottom:1px solid #ddd;">____ meses</td>
    </tr>
  `;
}