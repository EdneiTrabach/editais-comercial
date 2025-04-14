/**
 * Módulo para exportação de relatórios de análise de conformidade em diversos formatos
 */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { 
  formatDate, 
  formatPercent, 
  formatSystemStatus,
  gerarCabecalho,
  gerarRodape,
  truncateText
} from './formatUtils';
import { 
  calcularPercentualGeralAtendimento,
  validarConformidadeSistema,
  validarConformidadeGeral
} from './validateCompliance';
import { gerarRecomendacao } from './generateRecommendation';

/**
 * Exporta análise para TXT no formato especificado
 * @param {Array} sistemas - Lista de sistemas analisados
 * @param {Object} processo - Dados do processo
 * @param {Object} parametros - Parâmetros de análise (percentuais mínimos)
 */
export const exportToTXT = (sistemas, processo, parametros) => {
  if (!sistemas || sistemas.length === 0) {
    alert('Sem dados para exportar');
    return;
  }

  const { percentualMinimoGeral, percentualMinimoObrigatorio } = parametros;

  // Validar conformidade geral
  const resultadoConformidade = validarConformidadeGeral(
    sistemas, 
    percentualMinimoGeral, 
    percentualMinimoObrigatorio
  );

  // Calcular totais
  const totalItens = sistemas.reduce((acc, sistema) => acc + (sistema.totalItens || 0), 0);
  const totalNaoAtendidos = sistemas.reduce((acc, sistema) => acc + (sistema.naoAtendidos || 0), 0);
  const totalAtendidos = totalItens - totalNaoAtendidos;
  const percentualGeralAtendimento = calcularPercentualGeralAtendimento(sistemas);

  // Gerar cabeçalho
  let content = gerarCabecalho(processo, parametros);

  // Gerar resumo da análise
  content += "RESUMO DA ANÁLISE\n";
  content += "----------------\n";
  content += `Total de Itens Avaliados: ${totalItens}\n`;
  content += `Itens Atendidos: ${totalAtendidos}\n`;
  content += `Itens Não Atendidos: ${totalNaoAtendidos}\n`;
  content += `Percentual Geral de Atendimento: ${formatPercent(percentualGeralAtendimento)}\n`;
  content += `Status Geral: ${resultadoConformidade.atendePercentualMinimo ? 
    '✅ Atende ao percentual mínimo geral' : 
    '❌ Não atende ao percentual mínimo geral'} (≥ ${percentualMinimoGeral}%)\n\n`;

  // Gerar detalhes dos sistemas
  content += "DETALHES DOS SISTEMAS\n";
  content += "--------------------\n";
  
  sistemas.forEach(sistema => {
    const validacao = validarConformidadeSistema(
      sistema, 
      percentualMinimoObrigatorio, 
      percentualMinimoGeral
    );
    
    const percentualAtendimento = validacao.percentualAtingido;
    const nome = sistema.nome || (sistema.sistemas?.nome || "Sistema sem nome");
    const total = sistema.totalItens || 0;
    const naoAtendidos = sistema.naoAtendidos || 0;
    const atendidos = total - naoAtendidos;
    
    content += `Sistema: ${nome}\n`;
    content += `  Total de Itens: ${total}\n`;
    content += `  Atendidos: ${atendidos}\n`;
    content += `  Não Atendidos: ${naoAtendidos}\n`;
    content += `  Percentual: ${formatPercent(percentualAtendimento)}\n`;
    content += `  Status: ${validacao.atende ? 
      '✅ Atende' : 
      `❌ Não Atende (Min: ${validacao.percentualMinimo}%)`}\n\n`;
  });

  // Resumo dos sistemas
  content += "RESUMO DOS SISTEMAS\n";
  content += "-------------------\n";
  
  sistemas.forEach(sistema => {
    const validacao = validarConformidadeSistema(
      sistema, 
      percentualMinimoObrigatorio, 
      percentualMinimoGeral
    );
    
    const nome = sistema.nome || (sistema.sistemas?.nome || "Sistema sem nome");
    const percentualAtendimento = validacao.percentualAtingido;
    
    content += `- ${nome}: ${formatPercent(percentualAtendimento)} ${!validacao.atende ? '❌' : ''}\n`;
  });

  // Gerar recomendação
  content += "\nRECOMENDAÇÃO\n";
  content += "--------------------------\n";
  content += gerarRecomendacao(resultadoConformidade, percentualMinimoGeral, percentualMinimoObrigatorio);

  // Adicionar rodapé
  content += gerarRodape();

  // Criar blob e link para download
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `analise_sistemas_${processo.numero_processo || 'relatorio'}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Exporta análise para PDF no formato especificado
 * @param {Array} sistemas - Lista de sistemas analisados
 * @param {Object} processo - Dados do processo
 * @param {Object} parametros - Parâmetros de análise (percentuais mínimos)
 */
export const exportToPDF = (sistemas, processo, parametros) => {
  if (!sistemas || sistemas.length === 0) {
    alert('Sem dados para exportar');
    return;
  }

  const { percentualMinimoGeral, percentualMinimoObrigatorio } = parametros;

  // Validar conformidade geral
  const resultadoConformidade = validarConformidadeGeral(
    sistemas, 
    percentualMinimoGeral, 
    percentualMinimoObrigatorio
  );

  // Criar o documento PDF
  const doc = new jsPDF();
  
  // Adicionar título
  doc.setFontSize(18);
  doc.text('RELATÓRIO DE ANÁLISE DE SISTEMAS', 14, 20);
  
  // Adicionar informações do processo
  doc.setFontSize(10);
  doc.setTextColor(0);
  
  let yPos = 30;
  const lineHeight = 6;
  
  doc.text(`PROCESSO: ${processo.numero_processo || 'N/A'}`, 14, yPos); yPos += lineHeight;
  doc.text(`ÓRGÃO: ${truncateText(processo.orgao || 'N/A', 70)}`, 14, yPos); yPos += lineHeight;
  doc.text(`DATA: ${formatDate(processo.data_pregao || new Date())}`, 14, yPos); yPos += lineHeight;
  doc.text(`CÓDIGO: ${processo.codigo_analise || 'N/A'}`, 14, yPos); yPos += lineHeight;
  doc.text(`% Mínimo Geral: ${percentualMinimoGeral}%`, 14, yPos); yPos += lineHeight;
  doc.text(`% Mínimo Obrigatórios: ${percentualMinimoObrigatorio}%`, 14, yPos); yPos += lineHeight * 1.5;
  
  // Calcular totais
  const totalItens = sistemas.reduce((acc, sistema) => acc + (sistema.totalItens || 0), 0);
  const totalNaoAtendidos = sistemas.reduce((acc, sistema) => acc + (sistema.naoAtendidos || 0), 0);
  const totalAtendidos = totalItens - totalNaoAtendidos;
  const percentualGeralAtendimento = calcularPercentualGeralAtendimento(sistemas);
  
  // Resumo da análise
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 140);  // Azul escuro
  doc.text('RESUMO DA ANÁLISE', 14, yPos); yPos += lineHeight;
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text(`Total de Itens Avaliados: ${totalItens}`, 14, yPos); yPos += lineHeight;
  doc.text(`Itens Atendidos: ${totalAtendidos}`, 14, yPos); yPos += lineHeight;
  doc.text(`Itens Não Atendidos: ${totalNaoAtendidos}`, 14, yPos); yPos += lineHeight;
  doc.text(`Percentual Geral de Atendimento: ${formatPercent(percentualGeralAtendimento)}`, 14, yPos); yPos += lineHeight;
  
  // Status geral com cores
  doc.text('Status Geral: ', 14, yPos);
  doc.setTextColor(resultadoConformidade.atendePercentualMinimo ? 0x00 : 0xff, 
                   resultadoConformidade.atendePercentualMinimo ? 0x80 : 0x00, 0x00);
  doc.text(`${resultadoConformidade.atendePercentualMinimo ? 'Atende' : 'Não atende'} ao percentual mínimo geral (≥ ${percentualMinimoGeral}%)`,
           50, yPos);
  yPos += lineHeight * 1.5;
  doc.setTextColor(0);

  // Detalhes dos sistemas (tabela)
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 140);
  doc.text('DETALHES DOS SISTEMAS', 14, yPos); yPos += lineHeight;
  doc.setFontSize(10);
  doc.setTextColor(0);
  
  // Preparar dados para a tabela de sistemas
  const tableData = sistemas.map(sistema => {
    const validacao = validarConformidadeSistema(
      sistema, 
      percentualMinimoObrigatorio, 
      percentualMinimoGeral
    );
    
    const nome = sistema.nome || (sistema.sistemas?.nome || "Sistema sem nome");
    const total = sistema.totalItens || 0;
    const naoAtendidos = sistema.naoAtendidos || 0;
    const atendidos = total - naoAtendidos;
    const percentualAtendimento = validacao.percentualAtingido;
    const status = validacao.atende ? 'Atende ✓' : `Não Atende ✗ (Min: ${validacao.percentualMinimo}%)`;
    
    return [
      nome,
      total,
      atendidos,
      naoAtendidos,
      formatPercent(percentualAtendimento),
      status
    ];
  });

  // Adicionar a tabela de sistemas
  autoTable(doc, {
    startY: yPos,
    head: [['Sistema', 'Total Itens', 'Atendidos', 'Não Atendidos', 'Percentual', 'Status']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [0, 51, 102],
      textColor: 255,
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 23, halign: 'center' },
      5: { cellWidth: 42 }
    },
    styles: {
      fontSize: 8,
      cellPadding: 3
    },
    // Colorir linhas com base no status de conformidade
    didDrawCell: function(data) {
      if (data.section === 'body' && data.column.index === 5) {
        // Verificar se o texto contém "Não Atende"
        if (data.cell.text && data.cell.text.toString().includes('Não Atende')) {
          doc.setFillColor(255, 240, 240); // Vermelho claro
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
          doc.setTextColor(200, 0, 0); // Vermelho para o texto
          doc.text(data.cell.text.toString(), data.cell.x + data.cell.padding, data.cell.y + data.cell.height/2);
          doc.setTextColor(0); // Voltar para preto
          return false; // Para prevenir o desenho default do texto
        }
      }
    }
  });
  
  // Atualizar a posição Y após a tabela
  yPos = doc.lastAutoTable.finalY + 10;
  
  // Recomendação
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 140);
  doc.text('RECOMENDAÇÃO', 14, yPos); yPos += lineHeight;
  doc.setFontSize(10);
  doc.setTextColor(0);
  
  // Dividir o texto da recomendação em linhas para caber no PDF
  const recomendacao = gerarRecomendacao(resultadoConformidade, percentualMinimoGeral, percentualMinimoObrigatorio);
  const splitRecomendacao = doc.splitTextToSize(recomendacao, 180);
  
  // Se a recomendação for muito extensa e não couber na página atual, adicione uma nova página
  if (yPos + splitRecomendacao.length * 5 > 280) {
    doc.addPage();
    yPos = 20;
  }
  
  // Colorir a recomendação baseado no resultado
  doc.setTextColor(...(resultadoConformidade.aprovado ? [0, 100, 0] : [200, 0, 0]));
  doc.text(splitRecomendacao, 14, yPos);
  doc.setTextColor(0);
  
  // Rodapé
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
           14, 285);
  
  // Adicionar número de página no rodapé
  const pageCount = doc.internal.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
  }
  
  // Salvar o PDF
  doc.save(`analise_sistemas_${processo.numero_processo || 'relatorio'}.pdf`);
};

/**
 * Exporta análise para Excel no formato especificado
 * @param {Array} sistemas - Lista de sistemas analisados
 * @param {Object} processo - Dados do processo
 * @param {Object} parametros - Parâmetros de análise (percentuais mínimos)
 */
export const exportToExcel = (sistemas, processo, parametros) => {
  if (!sistemas || sistemas.length === 0) {
    alert('Sem dados para exportar');
    return;
  }
  
  const { percentualMinimoGeral, percentualMinimoObrigatorio } = parametros;
  
  // Validar conformidade geral
  const resultadoConformidade = validarConformidadeGeral(
    sistemas,
    percentualMinimoGeral,
    percentualMinimoObrigatorio
  );
  
  // Criar workbook
  const workbook = XLSX.utils.book_new();
  
  // Aba 1: Detalhes dos Sistemas
  const detalhesData = sistemas.map(sistema => {
    const validacao = validarConformidadeSistema(
      sistema,
      percentualMinimoObrigatorio,
      percentualMinimoGeral
    );
    
    const nome = sistema.nome || (sistema.sistemas?.nome || "Sistema sem nome");
    const total = sistema.totalItens || 0;
    const naoAtendidos = sistema.naoAtendidos || 0;
    const atendidos = total - naoAtendidos;
    const percentualAtendimento = validacao.percentualAtingido;
    
    return {
      'Sistema': nome,
      'Total de Itens': total,
      'Atendidos': atendidos,
      'Não Atendidos': naoAtendidos,
      'Percentual de Atendimento': percentualAtendimento / 100, // Para formatação como percentual no Excel
      'Mínimo Exigido': validacao.percentualMinimo / 100, // Para formatação como percentual no Excel
      'Status': validacao.atende ? 'Atende' : 'Não Atende',
      'Obrigatório': sistema.obrigatorio ? 'Sim' : 'Não'
    };
  });
  
  // Criar a primeira planilha (Detalhes)
  const detalhesWorksheet = XLSX.utils.json_to_sheet(detalhesData);
  
  // Definir largura das colunas
  detalhesWorksheet['!cols'] = [
    { wch: 40 }, // Sistema
    { wch: 15 }, // Total de Itens
    { wch: 15 }, // Atendidos
    { wch: 15 }, // Não Atendidos
    { wch: 15 }, // Percentual
    { wch: 15 }, // Mínimo Exigido
    { wch: 15 }, // Status
    { wch: 15 }  // Obrigatório
  ];
  
  // Formatar as células de percentual
  const percentCols = ['E', 'F']; // colunas com percentuais
  const range = XLSX.utils.decode_range(detalhesWorksheet['!ref']);
  
  percentCols.forEach(col => {
    for(let row = range.s.r + 1; row <= range.e.r; row++) {
      const cell = detalhesWorksheet[`${col}${row+1}`];
      if (cell) cell.z = '0.00%';
    }
  });
  
  // Adicionar a primeira planilha
  XLSX.utils.book_append_sheet(workbook, detalhesWorksheet, 'Detalhes dos Sistemas');
  
  // Aba 2: Resumo do Processo
  const resumoData = [
    { 'Campo': 'Processo', 'Valor': processo.numero_processo || 'N/A' },
    { 'Campo': 'Órgão', 'Valor': processo.orgao || 'N/A' },
    { 'Campo': 'Data', 'Valor': formatDate(processo.data_pregao || new Date()) },
    { 'Campo': 'Código', 'Valor': processo.codigo_analise || 'N/A' },
    { 'Campo': 'Percentual Mínimo Geral', 'Valor': percentualMinimoGeral / 100 },
    { 'Campo': 'Percentual Mínimo Obrigatórios', 'Valor': percentualMinimoObrigatorio / 100 },
    { 'Campo': 'Total de Itens', 'Valor': sistemas.reduce((acc, sistema) => acc + (sistema.totalItens || 0), 0) },
    { 'Campo': 'Itens Atendidos', 'Valor': sistemas.reduce((acc, sistema) => acc + ((sistema.totalItens || 0) - (sistema.naoAtendidos || 0)), 0) },
    { 'Campo': 'Itens Não Atendidos', 'Valor': sistemas.reduce((acc, sistema) => acc + (sistema.naoAtendidos || 0), 0) },
    { 'Campo': 'Percentual Geral de Atendimento', 'Valor': resultadoConformidade.percentualGeralAtendimento / 100 },
    { 'Campo': 'Status Geral', 'Valor': resultadoConformidade.aprovado ? 'Aprovado' : 'Reprovado' },
    { 'Campo': '', 'Valor': '' },
    { 'Campo': 'RECOMENDAÇÃO', 'Valor': '' },
    { 'Campo': '', 'Valor': gerarRecomendacao(resultadoConformidade, percentualMinimoGeral, percentualMinimoObrigatorio) }
  ];
  
  // Criar a segunda planilha (Resumo)
  const resumoWorksheet = XLSX.utils.json_to_sheet(resumoData);
  
  // Definir largura das colunas na planilha de resumo
  resumoWorksheet['!cols'] = [
    { wch: 30 }, // Campo
    { wch: 80 }  // Valor
  ];
  
  // Formatar células de percentual na planilha de resumo
  ['B5', 'B6', 'B10'].forEach(cell => {
    if (resumoWorksheet[cell]) resumoWorksheet[cell].z = '0.00%';
  });
  
  // Adicionar a segunda planilha
  XLSX.utils.book_append_sheet(workbook, resumoWorksheet, 'Resumo do Processo');
  
  // Exportar o arquivo
  XLSX.writeFile(workbook, `analise_sistemas_${processo.numero_processo || 'relatorio'}.xlsx`);
};