/**
 * Gera o componente de objeto do processo
 * @param {Object} processo - Dados do processo
 * @returns {String} HTML do componente
 */
export function gerarObjetoTemplate(processo) {
  const { objeto_resumido, objeto_completo } = processo;
  const objetoExibir = objeto_completo || objeto_resumido || '';
  
  return `
    <tr>
      <td style="width:40%; padding:8px; border-bottom:1px solid #ddd;"><strong>Objeto:</strong></td>
      <td style="padding:8px; border-bottom:1px solid #ddd; text-wrap: auto;">${objetoExibir}</td>
    </tr>
  `;
}