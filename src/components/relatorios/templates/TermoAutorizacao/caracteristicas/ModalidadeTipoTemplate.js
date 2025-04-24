/**
 * Gera o componente de modalidade/tipo do processo
 * @param {Object} processo - Dados do processo
 * @returns {String} HTML do componente
 */
export function gerarModalidadeTipoTemplate(processo) {
  const { modalidade } = processo;
  
  return `
    <tr>
      <td style="width:40%; padding:8px; border-bottom:1px solid #ddd;"><strong>Modalidade/Tipo:</strong></td>
      <td style="padding:8px; border-bottom:1px solid #ddd;">${modalidade?.replace(/_/g, ' ') || ''}</td>
    </tr>
  `;
}