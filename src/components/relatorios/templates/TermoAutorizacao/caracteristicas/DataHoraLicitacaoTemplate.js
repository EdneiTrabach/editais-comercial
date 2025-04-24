import { formatarData } from '@/utils/formatadores';

/**
 * Gera o componente de data/hora da licitação
 * @param {Object} processo - Dados do processo
 * @returns {String} HTML do componente
 */
export function gerarDataHoraLicitacaoTemplate(processo) {
  const { data_pregao, hora_pregao } = processo;
  const dataFormatada = formatarData(data_pregao);
  
  return `
    <tr>
      <td style="width:40%; padding:8px; border-bottom:1px solid #ddd;"><strong>Data/Hora da Licitação:</strong></td>
      <td style="padding:8px; border-bottom:1px solid #ddd;">${dataFormatada} ${hora_pregao || ''}</td>
    </tr>
  `;
}