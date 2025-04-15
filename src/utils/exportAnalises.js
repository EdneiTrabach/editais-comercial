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

  // Configurar documento
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Estilo base
  const corPrimaria = [37, 99, 235]; // Azul corporativo
  const corSecundaria = [100, 100, 100]; // Cinza para textos
  const corDestaque = [220, 53, 69]; // Vermelho para alertas
  
  // Adicionar logo
  try {
    const logoUrl = '/icons/logo-licitacao.png'; // Caminho relativo à pasta public
    doc.addImage(logoUrl, 'PNG', 15, 15, 30, 20); // Ajustado altura para 20 para manter proporção
    
    // Ajustar posição do título para ficar ao lado da logo
    doc.setFontSize(22);
    doc.setTextColor(...corPrimaria);
    doc.text('Análise de Sistemas', pageWidth / 2 + 15, 25, { align: 'center' });
  } catch (error) {
    console.warn('Erro ao carregar logo:', error);
    // Se houver erro, centraliza o título
    doc.setFontSize(22);
    doc.setTextColor(...corPrimaria);
    doc.text('Análise de Sistemas', pageWidth / 2, 20, { align: 'center' });
  }
  
  // Informações do processo (ajustado yPos inicial para não sobrepor a logo)
  doc.setFontSize(11);
  doc.setTextColor(...corSecundaria);
  let yPos = 45; // Aumentado para dar mais espaço após a logo
  const lineHeight = 7;
  
  // Adicione este log para depuração
  console.log('Processo recebido para exportação:', processo);

  // CORREÇÃO: Usar os dados do processo diretamente, sem depender da função getProcessField
  // Garantir que temos dados válidos ou usar fallbacks
  const numeroProcesso = processo.numero_processo || processo.numero || 'Não informado';
  
  const orgao = (processo.orgao && typeof processo.orgao === 'object') 
    ? (processo.orgao.nome || 'Não informado')
    : (processo.orgao || processo.orgao_nome || 'Não informado');
  
  const data = processo.data_pregao || processo.data || processo.data_sessao;
  const dataFormatada = data 
    ? new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : 'Não informada';
  
  const responsavel = (processo.responsavel && processo.responsavel.nome) 
    || processo.responsavel_nome 
    || (typeof processo.responsavel === 'string' ? processo.responsavel : 'Não informado');
  
  const codigo = processo.codigo_analise || processo.codigo || 'Não informado';

  // Adicionar informações do processo no PDF
  const infoProcesso = [
    `Processo: ${numeroProcesso}`,
    `Órgão: ${orgao}`,
    `Data: ${dataFormatada}`,
    `Responsável: ${responsavel}`,
    `Código: ${codigo}`
  ];

  infoProcesso.forEach(info => {
    doc.text(info, 15, yPos);
    yPos += lineHeight;
  });

  // Tabela de sistemas
  const tableData = sistemas.map(sistema => {
    const total = sistema.totalItens || 0;
    const naoAtendidos = sistema.naoAtendidos || 0;
    const atendidos = total - naoAtendidos;
    const percentual = total > 0 ? ((atendidos / total) * 100).toFixed(2) : '0.00';
    
    return [
      sistema.nome || 'Sistema sem nome',
      total.toString(),
      atendidos.toString(),
      naoAtendidos.toString(),
      `${percentual}%`,
      sistema.obrigatorio ? 'Sim' : 'Não',
      sistema.percentual_minimo ? `${sistema.percentual_minimo}%` : 'N/A'
    ];
  });

  autoTable(doc, {
    startY: yPos + 10,
    head: [[
      'Sistema',
      'Total',
      'Atendidos',
      'Não Atendidos',
      '% Atendido',
      'Obrigatório',
      'Mínimo Exigido'
    ]],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [...corPrimaria],
      textColor: 255,
      fontSize: 10,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { halign: 'left' },     // Coluna Sistema alinhada à esquerda
      1: { halign: 'center' },   // Demais colunas centralizadas
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'center' },
      5: { halign: 'center' },
      6: { halign: 'center' }
    },
    margin: { left: 10, right: 10 },
    tableWidth: 'auto',
    didDrawCell: (data) => {
      // Destacar células de sistemas obrigatórios
      if (data.row.index >= 0 && data.column.index === 5) {
        if (data.cell.text[0] === 'Sim') {
          doc.setTextColor(...corDestaque);
        }
      }
    }
  });

  // Rodapé
  const addFooter = () => {
    const pageCount = doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(...corSecundaria);
      
      // Nome do sistema e data/hora
      const dataHora = new Date().toLocaleString('pt-BR');
      doc.text('Sistema de Análise de Editais', 15, 280);
      doc.text(`Emitido em: ${dataHora}`, pageWidth - 15, 280, { align: 'right' });
      
      // Numeração de páginas
      doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, 280, { align: 'center' });
    }
  };

  addFooter();
  
  // Corrigir nome do arquivo para garantir que nunca fique "sem-numero"
  const numeroProcessoLimpo = numeroProcesso
    .toString()
    .replace(/[\/\\:*?"<>|]/g, '-')
    .replace(/\s+/g, '_')
    .substring(0, 40) || 'relatorio';

  const fileName = `RelatorioAnalises-${numeroProcessoLimpo}.pdf`;
  doc.save(fileName);
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
  
  console.log('processo recebido para exportação:', processo);
  
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