/**
 * Gera a seção de demonstração
 * @param {Object} processo - Dados do processo
 * @returns {String} HTML da seção de demonstração
 */
export function gerarDemonstracao(processo) {
  return `
    <h3 style="margin-bottom: 20px;">9. DEMONSTRAÇÃO</h3>
    <p style="margin-bottom: 10px;"><strong>Pede demonstração:</strong> ☐ Sim ☐ Não</p>
  `;
}