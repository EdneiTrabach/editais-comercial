import { jsPDF } from 'jspdf';
import 'jspdf/dist/polyfills.es.js';
import * as XLSX from 'xlsx';
import autoTable from 'jspdf-autotable';

/**
 * Formata a data para o formato brasileiro (DD/MM/YYYY)
 */
const formatDate = (dateString) => {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR').format(date);
};

/**
 * Formata um valor para o formato de moeda brasileira
 */
const formatCurrency = (value) => {
  if (value === undefined || value === null) return '-';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

/**
 * Formata o status para exibição
 */
const formatStatus = (status) => {
  const statusMap = {
    'aberto': 'Aberto',
    'em_analise': 'Em Análise',
    'participando': 'Participando',
    'vencido': 'Vencido',
    'perdido': 'Perdido',
    'cancelado': 'Cancelado',
    'revogado': 'Revogado',
    'suspenso': 'Suspenso',
    'nao_participar': 'Não Participar'
  };
  
  return statusMap[status] || status;
};

/**
 * Formata a modalidade para exibição
 */
const formatModalidade = (modalidade) => {
  const modalidadeMap = {
    'pregao_eletronico': 'Pregão Eletrônico',
    'pregao_presencial': 'Pregão Presencial',
    'concorrencia': 'Concorrência',
    'tomada_preco': 'Tomada de Preço',
    'convite': 'Convite',
    'chamamento_publico': 'Chamamento Público',
    'inexigibilidade': 'Inexigibilidade',
    'dispensa': 'Dispensa'
  };
  
  return modalidadeMap[modalidade] || modalidade;
};

/**
 * Exporta dados para PDF
 * @param {Array} data - Dados a serem exportados
 * @param {String} filename - Nome do arquivo
 */
export const exportToPDF = (data, filename) => {
  // Cria o documento PDF
  const doc = new jsPDF({
    orientation: 'landscape'
  });
  
  // Adiciona título e informações
  doc.setFontSize(18);
  doc.text('Relatório de Processos', 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Gerado em: ${formatDate(new Date().toISOString())}`, 14, 30);
  
  // Prepara os dados para a tabela
  const tableColumn = ["Número", "Órgão", "Modalidade", "Data", "Status", "Valor Estimado", "Representante", "Responsável"];
  const tableRows = [];
  
  data.forEach(item => {
    const rowData = [
      item.numero_processo || '-',
      (item.orgao || '').substring(0, 30) + ((item.orgao || '').length > 30 ? '...' : ''),
      formatModalidade(item.modalidade) || '-',
      formatDate(item.data_pregao) || '-',
      formatStatus(item.status) || '-',
      formatCurrency(item.valor_estimado) || '-',
      (item.representante?.nome || '-').substring(0, 20),
      (item.responsavel?.nome || '-').substring(0, 20)
    ];
    tableRows.push(rowData);
  });

  // Adiciona a tabela ao PDF
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 40,
    styles: {
      fontSize: 9,
      cellPadding: 3,
      overflow: 'linebreak'
    },
    columnStyles: {
      0: { cellWidth: 25 },  // Número
      1: { cellWidth: 40 },  // Órgão
      2: { cellWidth: 30 },  // Modalidade
      3: { cellWidth: 20 },  // Data
      4: { cellWidth: 25 },  // Status
      5: { cellWidth: 25 },  // Valor
      6: { cellWidth: 30 },  // Representante
      7: { cellWidth: 30 },  // Responsável
    },
    headStyles: {
      fillColor: [24, 144, 255],
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240]
    }
  });

  // Adiciona número de página no rodapé
  const pageCount = doc.internal.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
  }

  // Salva o PDF
  doc.save(`${filename}_${new Date().toISOString().slice(0,10)}.pdf`);
};

/**
 * Exporta dados para Excel
 * @param {Array} data - Dados a serem exportados
 * @param {String} filename - Nome do arquivo
 */
export const exportToExcel = (data, filename) => {
  // Prepara os dados processados para o Excel
  const processedData = data.map(item => {
    return {
      'Número': item.numero_processo || '-',
      'Órgão': item.orgao || '-',
      'Modalidade': formatModalidade(item.modalidade) || '-',
      'Data de Abertura': formatDate(item.data_pregao) || '-',
      'Status': formatStatus(item.status) || '-',
      'UF': item.estado || '-',
      'Valor Estimado': formatCurrency(item.valor_estimado) || '-',
      'Representante': item.representante?.nome || '-',
      'Responsável': item.responsavel?.nome || '-',
      'Ano': item.ano || '-',
      'Código Análise': item.codigo_analise || '-',
      'Distância': item.distancia_km ? `${item.distancia_km} km` : '-',
      'Sistemas Ativos': Array.isArray(item.sistemas_ativos) ? item.sistemas_ativos.length : '-'
    };
  });
  
  // Cria uma planilha
  const worksheet = XLSX.utils.json_to_sheet(processedData);
  const workbook = XLSX.utils.book_new();
  
  // Ajusta largura das colunas
  const columnsWidth = [
    { wpx: 100 },  // Número
    { wpx: 150 },  // Órgão
    { wpx: 120 },  // Modalidade
    { wpx: 100 },  // Data
    { wpx: 100 },  // Status
    { wpx: 50 },   // UF
    { wpx: 120 },  // Valor
    { wpx: 120 },  // Representante
    { wpx: 120 },  // Responsável
    { wpx: 50 },   // Ano
    { wpx: 100 },  // Código
    { wpx: 80 },   // Distância
    { wpx: 100 },  // Sistemas
  ];
  
  worksheet['!cols'] = columnsWidth;
  
  // Adiciona a planilha ao workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, "Processos");
  
  // Exporta o arquivo
  XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().slice(0,10)}.xlsx`);
};
