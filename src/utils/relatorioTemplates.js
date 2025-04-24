import { formatarData, formatarMoeda, formatarStatus } from './formatadores';

/**
 * Gera o modelo HTML para o relatório baseado nos dados do processo
 * @param {Object} processo - Dados do processo
 * @returns {String} HTML formatado para o relatório
 */
export async function gerarModeloRelatorio(processo) {
  if (!processo) return '';
  
  // Extrair dados do processo
  const {
    numero_processo,
    orgao,
    data_pregao,
    hora_pregao,
    objeto_resumido,
    objeto_completo,
    valor_estimado,
    status,
    modalidade,
    sistemas_ativos
  } = processo;

  // Formatar os dados necessários
  const dataFormatada = formatarData(data_pregao);
  const valorFormatado = formatarMoeda(valor_estimado);
  const statusFormatado = formatarStatus(status);
  const dataHoje = new Date().toLocaleDateString('pt-BR');

  // Obter nome do responsável
  let responsavel = 'Não definido';
  if (processo.responsaveis) {
    responsavel = Array.isArray(processo.responsaveis)
      ? (processo.responsaveis[0]?.nome || 'Não definido')
      : (processo.responsaveis?.nome || 'Não definido');
  }
  
  // Gerar HTML para o Termo de Autorização
  return `
    <h1 style="text-align:center; margin-bottom: 20px;">TERMO DE AUTORIZAÇÃO</h1>
    <h2 style="text-align:center; margin-bottom: 30px;">RELATÓRIO DE AVALIAÇÃO DE PARTICIPAÇÃO EM PROCESSO LICITATÓRIO</h2>
    
    <p style="text-align:right; margin-bottom: 30px;">Domingos Martins-ES, ____ de ______________ de ${new Date().getFullYear()}</p>
    
    <h3 style="margin-bottom: 20px;">1. DADOS DO CLIENTE/PROSPECT</h3>
    <p style="margin-bottom: 15px;"><strong>Cliente/Prospect:</strong> ${orgao || ''}</p>
    
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
    
    <h3 style="margin-bottom: 20px;">4. IMPEDIMENTOS PARA PARTICIPAÇÃO</h3>
    <h4 style="margin-bottom: 10px;">4.1 Documental</h4>
    <p style="margin-bottom: 20px;">_______________________________________________________________</p>
    <h4 style="margin-bottom: 10px;">4.2 Técnica</h4>
    <p style="margin-bottom: 20px;">_______________________________________________________________</p>
    
    <h3 style="margin-bottom: 20px;">5. ITENS IMPUGNATÍVEIS</h3>
    <p style="margin-bottom: 20px;">_______________________________________________________________</p>
    
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
    
    <h3 style="margin-bottom: 20px;">7. INFORMAÇÕES ADICIONAIS</h3>
    <p style="margin-bottom: 20px;">_______________________________________________________________</p>
    
    <h3 style="margin-bottom: 20px;">8. PERIODICIDADE DAS VISITAS</h3>
    <p style="margin-bottom: 20px;">_______________________________________________________________</p>
    
    <h3 style="margin-bottom: 20px;">9. DEMONSTRAÇÃO</h3>
    <p style="margin-bottom: 10px;"><strong>Pede demonstração:</strong> ☐ Sim ☐ Não</p>
    
    <h3 style="margin-bottom: 20px;">10. MULTAS</h3>
    <p style="margin-bottom: 20px;">_______________________________________________________________</p>
    
    <h3 style="margin-bottom: 20px;">11. PRAZO DE IMPLANTAÇÃO</h3>
    <p style="margin-bottom: 20px;">_______________________________________________________________</p>
    
    <h3 style="margin-bottom: 20px;">12. SISTEMAS A IMPLANTAR</h3>
    <p style="margin-bottom: 20px;">_______________________________________________________________</p>
    
    <h3 style="margin-bottom: 20px;">13. IMPLANTAÇÃO/TREINAMENTO/MIGRAÇÃO</h3>
    <p style="margin-bottom: 20px;">_______________________________________________________________</p>
    
    <h3 style="margin-bottom: 20px;">14. PRAZO DE RECURSO LEGAL</h3>
    <p style="margin-bottom: 20px;">_______________________________________________________________</p>
    
    <h3 style="margin-bottom: 20px;">15. CONDIÇÃO DE REAJUSTE</h3>
    <p style="margin-bottom: 20px;">_______________________________________________________________</p>
    
    <h3 style="margin-bottom: 20px;">16. PARTICIPAÇÃO</h3>
    <p style="margin-bottom: 10px;">
      <strong>☐ Participar do certame</strong>
    </p>
    <p style="margin-bottom: 10px;">
      <strong>☐ Não participar - Motivo:</strong> _______________________________________________
    </p>
    
    <div style="margin-top:50px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div style="width: 45%;">
          <p style="border-top: 1px solid #000; padding-top: 10px; text-align: center;">Suzany Medeiros Leite</p>
          <p style="text-align: center;">Gerente Comercial</p>
        </div>
        <div style="width: 45%;">
          <p style="border-top: 1px solid #000; padding-top: 10px; text-align: center;">Estevão Henrique Holz</p>
          <p style="text-align: center;">CPF: 979.001.257-87</p>
        </div>
      </div>
    </div>
  `;
}