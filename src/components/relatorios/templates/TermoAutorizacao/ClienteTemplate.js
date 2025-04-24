/**
 * Gera a seção de dados do cliente
 * @param {Object} processo - Dados do processo
 * @param {Function} onTipoChange - Função callback para quando o tipo muda
 */
export function gerarDadosCliente(processo) {
  const { orgao } = processo;
  
  return `
    <h3 style="margin-bottom: 20px;">1. DADOS DO CLIENTE/PROSPECT</h3>
    <p style="margin-bottom: 15px;"><strong>Cliente/Prospect:</strong> ${orgao || ''}</p>
  `;
}