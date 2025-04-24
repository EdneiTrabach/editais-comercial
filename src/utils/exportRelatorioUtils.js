/**
 * Utilitários para exportação de relatórios
 */

/**
 * Exporta o conteúdo HTML do editor para um arquivo PDF
 * @param {Object} options - Opções para a exportação
 * @param {String} options.conteudo - Conteúdo HTML a ser exportado
 * @param {Object} options.processo - Dados do processo para metadados do PDF
 * @param {String} options.nomeArquivo - Nome do arquivo PDF a ser gerado
 */
export async function exportToPDF({ conteudo, processo, nomeArquivo }) {
  try {
    // Importar jsPDF e html2canvas de forma dinâmica
    const [jsPDFModule, html2canvasModule] = await Promise.all([
      import('jspdf'),
      import('html2canvas')
    ]);
    
    const { jsPDF } = jsPDFModule;
    const html2canvas = html2canvasModule.default;
    
    // Criar um elemento temporário para renderizar o HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = conteudo;
    tempDiv.style.width = '210mm';
    tempDiv.style.padding = '20mm';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.style.fontSize = '12pt';
    document.body.appendChild(tempDiv);

    // Configurar o documento PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Adicionar metadados ao PDF
    doc.setProperties({
      title: `Relatório - ${processo.numero_processo || 'Processo Licitatório'}`,
      subject: processo.objeto_resumido || 'Relatório de Processo',
      author: 'Sistema de Gestão de Processos Licitatórios',
      keywords: 'processo, licitação, relatório',
      creator: 'Sistema de Gestão de Processos Licitatórios'
    });

    // Renderizar o HTML para canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      logging: false
    });

    // Adicionar cabeçalho
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 10, 10);
    doc.text(`Processo: ${processo.numero_processo || ''}`, doc.internal.pageSize.getWidth() - 10, 10, { align: 'right' });

    // Calcular dimensões
    const imgWidth = doc.internal.pageSize.getWidth() - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 20; // Posição inicial após o cabeçalho

    // Adicionar a primeira página
    doc.addImage(
      canvas.toDataURL('image/jpeg', 1.0),
      'JPEG',
      10,
      position,
      imgWidth,
      imgHeight,
      '',
      'FAST'
    );
    heightLeft -= (doc.internal.pageSize.getHeight() - 20);

    // Adicionar páginas adicionais se necessário
    while (heightLeft >= 0) {
      position = 10; // Reset posição para o topo da nova página
      doc.addPage();
      
      // Adicionar cabeçalho nas páginas subsequentes
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 10, 10);
      doc.text(`Processo: ${processo.numero_processo || ''}`, doc.internal.pageSize.getWidth() - 10, 10, { align: 'right' });
      
      doc.addImage(
        canvas.toDataURL('image/jpeg', 1.0),
        'JPEG',
        10,
        position,
        imgWidth,
        imgHeight,
        '',
        'FAST',
        heightLeft > 0 ? 'SLOW' : 'FAST'
      );
      heightLeft -= (doc.internal.pageSize.getHeight() - 20);
    }

    // Remover o elemento temporário
    document.body.removeChild(tempDiv);

    // Salvar o PDF
    doc.save(nomeArquivo || 'relatorio.pdf');

    return true;
  } catch (error) {
    console.error('Erro ao exportar para PDF:', error);
    throw new Error(`Erro ao exportar para PDF: ${error.message}`);
  }
}