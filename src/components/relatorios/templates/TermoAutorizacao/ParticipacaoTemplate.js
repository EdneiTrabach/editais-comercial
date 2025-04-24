/**
 * Gera a seção de participação
 * @param {Object} processo - Dados do processo
 * @returns {String} HTML da seção de participação
 */
export function gerarParticipacao(processo) {
  return `
    <h3 style="margin-bottom: 20px;">16. PARTICIPAÇÃO</h3>
    <p style="margin-bottom: 10px;">
      <strong>☐ Participar do certame</strong>
    </p>
    <p style="margin-bottom: 10px;">
      <strong>☐ Não participar - Motivo:</strong> _______________________________________________
    </p>
  `;
}