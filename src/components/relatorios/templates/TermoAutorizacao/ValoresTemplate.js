import { formatarMoeda } from '@/utils/formatadores';

/**
 * Gera a seção de valores do edital
 * @param {Object} processo - Dados do processo
 * @returns {String} HTML da seção de valores
 */
export function gerarValores(processo) {
  const { valor_estimado } = processo;
  
  const valorFormatado = formatarMoeda(valor_estimado);
  
  return `
    <h3 style="margin-bottom: 20px;">3. DADOS DE VALORES DO EDITAL</h3>
    <table style="width:100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr>
        <td style="width:40%; padding:8px; border-bottom:1px solid #ddd;"><strong>Valor Estimado no Edital:</strong></td>
        <td style="padding:8px; border-bottom:1px solid #ddd;">${valorFormatado}</td>
      </tr>
      <tr>
        <td style="width:40%; padding:8px; border-bottom:1px solid #ddd;"><strong>Valor da nossa proposta:</strong></td>
        <td style="padding:8px; border-bottom:1px solid #ddd;">R$ __________________</td>
      </tr>
      <tr>
        <td style="width:40%; padding:8px; border-bottom:1px solid #ddd;"><strong>% que atendemos:</strong></td>
        <td style="padding:8px; border-bottom:1px solid #ddd;">_________ %</td>
      </tr>
    </table>
  `;
}