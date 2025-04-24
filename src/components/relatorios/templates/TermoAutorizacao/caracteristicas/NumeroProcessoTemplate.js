/**
 * Gera o componente de número do processo
 * @param {Object} processo - Dados do processo
 * @returns {String} HTML do componente
 */
export function gerarNumeroProcessoTemplate(processo) {
  const { numero_processo } = processo;
  
  return `
    <tr>
      <td style="width:40%; padding:8px; border-bottom:1px solid #ddd;"><strong>Número do Processo:</strong></td>
      <td style="padding:8px; border-bottom:1px solid #ddd;">${numero_processo || ''}</td>
    </tr>
  `;
}