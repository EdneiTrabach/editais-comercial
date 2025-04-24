import { formatarData } from '@/utils/formatadores';

/**
 * Gera a seção de características do processo
 * @param {Object} processo - Dados do processo
 * @returns {String} HTML da seção de características
 */
export function gerarCaracteristicas(processo) {
  const {
    numero_processo,
    objeto_resumido,
    modalidade,
    data_pregao,
    hora_pregao
  } = processo;
  
  const dataFormatada = formatarData(data_pregao);
  
  return `
    <h3 style="margin-bottom: 20px;">2. CARACTERÍSTICAS DO PROCESSO</h3>
    <table style="width:100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr>
        <td style="width:40%; padding:8px; border-bottom:1px solid #ddd;"><strong>Objeto:</strong></td>
        <td style="padding:8px; border-bottom:1px solid #ddd;">${objeto_resumido || ''}</td>
      </tr>
      <tr>
        <td style="width:40%; padding:8px; border-bottom:1px solid #ddd;"><strong>Modalidade/Tipo:</strong></td>
        <td style="padding:8px; border-bottom:1px solid #ddd;">${modalidade?.replace('_', ' ') || ''}</td>
      </tr>
      <tr>
        <td style="width:40%; padding:8px; border-bottom:1px solid #ddd;"><strong>Data/Hora da Licitação:</strong></td>
        <td style="padding:8px; border-bottom:1px solid #ddd;">${dataFormatada} ${hora_pregao || ''}</td>
      </tr>
      <tr>
        <td style="width:40%; padding:8px; border-bottom:1px solid #ddd;"><strong>Número do Processo:</strong></td>
        <td style="padding:8px; border-bottom:1px solid #ddd;">${numero_processo || ''}</td>
      </tr>
      <tr>
        <td style="width:40%; padding:8px; border-bottom:1px solid #ddd;"><strong>Prazo de Vigência:</strong></td>
        <td style="padding:8px; border-bottom:1px solid #ddd;">____ meses</td>
      </tr>
      <tr>
        <td style="width:40%; padding:8px; border-bottom:1px solid #ddd;"><strong>Pedidos de Esclarecimentos:</strong></td>
        <td style="padding:8px; border-bottom:1px solid #ddd;">☐ Sim ☐ Não</td>
      </tr>
      <tr>
        <td style="width:40%; padding:8px; border-bottom:1px solid #ddd;"><strong>Visita antes da Licitação:</strong></td>
        <td style="padding:8px; border-bottom:1px solid #ddd;">☐ Sim ☐ Não</td>
      </tr>
      <tr>
        <td style="width:40%; padding:8px; border-bottom:1px solid #ddd;"><strong>Incluir documentos com preço:</strong></td>
        <td style="padding:8px; border-bottom:1px solid #ddd;">☐ Sim ☐ Não</td>
      </tr>
      <tr>
        <td style="width:40%; padding:8px; border-bottom:1px solid #ddd;"><strong>Julgamento por lances:</strong></td>
        <td style="padding:8px; border-bottom:1px solid #ddd;">☐ Sim ☐ Não</td>
      </tr>
      <tr>
        <td style="width:40%; padding:8px; border-bottom:1px solid #ddd;"><strong>Banco de Dados:</strong></td>
        <td style="padding:8px; border-bottom:1px solid #ddd;">__________________</td>
      </tr>
    </table>
  `;
}