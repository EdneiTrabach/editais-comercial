/**
 * Gera a seção de concorrência
 * @param {Object} processo - Dados do processo
 * @returns {String} HTML da seção de concorrência
 */
export function gerarConcorrencia(processo) {
  return `
    <h3 style="margin-bottom: 20px;">6. CONCORRÊNCIA</h3>
    <table style="width:100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr>
        <td style="width:40%; padding:8px; border-bottom:1px solid #ddd;"><strong>Valor atual do concorrente:</strong></td>
        <td style="padding:8px; border-bottom:1px solid #ddd;">R$ __________________</td>
      </tr>
      <tr>
        <td style="width:40%; padding:8px; border-bottom:1px solid #ddd;"><strong>Nome do concorrente/Assessoria:</strong></td>
        <td style="padding:8px; border-bottom:1px solid #ddd;">__________________</td>
      </tr>
      <tr>
        <td style="width:40%; padding:8px; border-bottom:1px solid #ddd;"><strong>Distância das filiais e habitantes:</strong></td>
        <td style="padding:8px; border-bottom:1px solid #ddd;">__________________</td>
      </tr>
    </table>
  `;
}