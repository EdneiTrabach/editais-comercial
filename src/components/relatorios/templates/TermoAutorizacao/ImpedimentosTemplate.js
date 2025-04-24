/**
 * Gera a seção de impedimentos para participação
 * @param {Object} processo - Dados do processo
 * @returns {String} HTML da seção de impedimentos
 */
export function gerarImpedimentos(processo) {
  return `
    <h3 style="margin-bottom: 20px;">4. IMPEDIMENTOS PARA PARTICIPAÇÃO</h3>
    <h4 style="margin-bottom: 10px;">4.1 Documental</h4>
    <p style="margin-bottom: 20px;">_______________________________________________________________</p>
    <h4 style="margin-bottom: 10px;">4.2 Técnica</h4>
    <p style="margin-bottom: 20px;">_______________________________________________________________</p>
  `;
}