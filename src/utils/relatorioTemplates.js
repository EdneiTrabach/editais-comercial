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

  // Obter nome do responsável
  let responsavel = 'Não definido';
  if (processo.responsaveis) {
    responsavel = Array.isArray(processo.responsaveis)
      ? (processo.responsaveis[0]?.nome || 'Não definido')
      : (processo.responsaveis?.nome || 'Não definido');
  }
  
  // Gerar HTML para o relatório
  return `
    <h1 style="text-align:center; margin-bottom: 30px;">Relatório de Processo Licitatório</h1>
    
    <h2>1. Informações Gerais</h2>
    <table style="width:100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr>
        <td style="width:30%; padding:8px; border-bottom:1px solid #ddd;"><strong>Número do Processo:</strong></td>
        <td style="padding:8px; border-bottom:1px solid #ddd;">${numero_processo || ''}</td>
      </tr>
      <tr>
        <td style="width:30%; padding:8px; border-bottom:1px solid #ddd;"><strong>Órgão:</strong></td>
        <td style="padding:8px; border-bottom:1px solid #ddd;">${orgao || ''}</td>
      </tr>
      <tr>
        <td style="width:30%; padding:8px; border-bottom:1px solid #ddd;"><strong>Data do Pregão:</strong></td>
        <td style="padding:8px; border-bottom:1px solid #ddd;">${dataFormatada} às ${hora_pregao || ''}</td>
      </tr>
      <tr>
        <td style="width:30%; padding:8px; border-bottom:1px solid #ddd;"><strong>Modalidade:</strong></td>
        <td style="padding:8px; border-bottom:1px solid #ddd;">${modalidade?.replace('_', ' ') || ''}</td>
      </tr>
      <tr>
        <td style="width:30%; padding:8px; border-bottom:1px solid #ddd;"><strong>Status atual:</strong></td>
        <td style="padding:8px; border-bottom:1px solid #ddd;">${statusFormatado}</td>
      </tr>
      <tr>
        <td style="width:30%; padding:8px; border-bottom:1px solid #ddd;"><strong>Responsável:</strong></td>
        <td style="padding:8px; border-bottom:1px solid #ddd;">${responsavel}</td>
      </tr>
      <tr>
        <td style="width:30%; padding:8px; border-bottom:1px solid #ddd;"><strong>Valor Estimado:</strong></td>
        <td style="padding:8px; border-bottom:1px solid #ddd;">${valorFormatado}</td>
      </tr>
    </table>
    
    <h2>2. Objeto da Licitação</h2>
    <p><strong>Resumo:</strong> ${objeto_resumido || ''}</p>
    <p><strong>Descrição Completa:</strong></p>
    <p>${objeto_completo || 'Não informado.'}</p>
    
    <h2>3. Análise Técnica</h2>
    <p>[Insira aqui a análise técnica do processo licitatório]</p>
    
    <h2>4. Impugnações</h2>
    <p>[Descreva aqui se houve impugnações e seus resultados]</p>
    
    <h2>5. Observações Importantes</h2>
    <p>[Adicione aqui observações relevantes sobre o processo]</p>
    
    <h2>6. Conclusão</h2>
    <p>[Escreva aqui a conclusão sobre a participação no processo]</p>
    
    <div style="margin-top:50px;">
      <p style="text-align:center;">Data: ${new Date().toLocaleDateString('pt-BR')}</p>
      <p style="text-align:center; margin-top:50px;">____________________________________</p>
      <p style="text-align:center;">${responsavel}</p>
      <p style="text-align:center;">Responsável pelo Processo</p>
    </div>
  `;
}