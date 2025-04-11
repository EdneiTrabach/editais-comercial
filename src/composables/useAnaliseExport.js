import { utils, writeFileXLSX } from 'xlsx'
import { ref } from 'vue'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import Chart from 'chart.js/auto'
import 'chart.js/auto'

// Registrar plugin aprimorado para exibir rótulos nas barras
Chart.register({
  id: 'datalabels',
  beforeDraw: (chart) => {
    const ctx = chart.ctx;
    
    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      if (!meta.hidden) {
        meta.data.forEach((element, index) => {
          // Não mostrar rótulos para valores muito pequenos
          const value = dataset.data[index];
          if (value < 1) return;
          
          // Definir estilo de texto com melhor visibilidade
          const fontSize = chart.config.type === 'pie' || chart.config.type === 'doughnut' ? 14 : 12;
          ctx.font = `bold ${fontSize}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Determinar a cor do texto para melhor contraste
          let textColor = 'white';
          
          // Para gráficos de pizza, usar branco para fatias mais escuras
          if (chart.config.type === 'pie' || chart.config.type === 'doughnut') {
            textColor = 'white';
          } else {
            // Para barras e linhas, usar cor com contraste baseado na cor de fundo
            if (dataset.backgroundColor && typeof dataset.backgroundColor === 'string' && 
                dataset.backgroundColor.includes('rgba')) {
              // Extrair o valor alfa (transparência) da cor
              const alpha = parseFloat(dataset.backgroundColor.split(',')[3]);
              textColor = alpha < 0.5 ? '#333' : 'white';
            }
          }
          
          ctx.fillStyle = textColor;
          
          // Posicionamento específico baseado no tipo de gráfico
          let position = element.getCenterPoint();
          
          // Sempre mostrar apenas o valor numérico, sem símbolo de %
          let displayValue = value;
          
          // Posicionamento diferente baseado no tipo de gráfico
          if (chart.config.type === 'bar') {
            // Para gráficos de barra
            if (chart.options.indexAxis === 'y') {
              // Barras horizontais
              position.x = (element.x + element.base) / 2;
              ctx.fillText(displayValue, position.x, position.y);
            } else {
              // Barras verticais - sempre posicionar texto acima da barra
              ctx.fillStyle = '#333';
              ctx.fillText(displayValue, position.x, element.y - 10);
            }
          } else if (chart.config.type === 'line') {
            // Para linhas, mostrar acima do ponto com fundo para melhor visibilidade
            const padding = 2;
            const textWidth = ctx.measureText(displayValue).width;
            
            // Desenhar fundo para aumentar a visibilidade do texto
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(
              position.x - textWidth/2 - padding,
              position.y - 20 - padding,
              textWidth + padding * 2,
              14 + padding * 2
            );
            
            // Desenhar o texto
            ctx.fillStyle = '#333';
            ctx.fillText(displayValue, position.x, position.y - 15);
          } else if (chart.config.type === 'pie' || chart.config.type === 'doughnut') {
            // Para pizza, mostrar valor no centro de cada fatia
            ctx.fillText(displayValue, position.x, position.y);
          }
        });
      }
    });
  }
});

export function useAnaliseExport() {
  const showExportDropdown = ref(false)
  const chartRef = ref(null)
  const chartDialog = ref(false)
  const currentChartType = ref('bar')
  
  // Função para exportar para Excel
  const exportToExcel = (data) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      alert('Sem dados para exportar')
      return
    }
    
    // Formatar os dados para o Excel
    const formattedData = data.map(item => {
      return {
        'Sistema': item.sistema_nome_personalizado || (item.sistemas?.nome || 'Sistema sem nome'),
        'Total de Itens': item.total_itens || 0,
        'Itens Atendidos': (item.total_itens || 0) - (item.nao_atendidos || 0),
        'Itens Não Atendidos': item.nao_atendidos || 0,
        'Percentual Atendido': `${Math.round(((item.total_itens - item.nao_atendidos) / item.total_itens || 0) * 100)}%`
      }
    })
    
    const workbook = utils.book_new()
    const worksheet = utils.json_to_sheet(formattedData)
    
    // Ajustar a largura das colunas
    const columnWidths = [
      { wch: 30 }, // Sistema
      { wch: 15 }, // Total de Itens
      { wch: 15 }, // Itens Atendidos
      { wch: 20 }, // Itens Não Atendidos
      { wch: 18 }  // Percentual Atendido
    ]
    worksheet['!cols'] = columnWidths
    
    utils.book_append_sheet(workbook, worksheet, 'Análise de Sistemas')
    writeFileXLSX(workbook, 'analise_sistemas.xlsx')
  }
  
  // Função para exportar para PDF
  const exportToPDF = (data) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      alert('Sem dados para exportar')
      return
    }
    
    const doc = new jsPDF()
    
    // Título
    doc.setFontSize(16)
    doc.text('Análise de Sistemas', 14, 20)
    
    // Data atual
    doc.setFontSize(10)
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 26)
    
    // Preparar os dados para a tabela
    const tableData = data.map(item => [
      item.sistema_nome_personalizado || (item.sistemas?.nome || 'Sistema sem nome'),
      item.total_itens || 0,
      (item.total_itens || 0) - (item.nao_atendidos || 0),
      item.nao_atendidos || 0,
      `${Math.round(((item.total_itens - item.nao_atendidos) / item.total_itens || 0) * 100)}%`
    ])
    
    // Adicionar a tabela
    autoTable(doc, {
      head: [['Sistema', 'Total de Itens', 'Itens Atendidos', 'Itens Não Atendidos', 'Percentual Atendido']],
      body: tableData,
      startY: 30,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 240, 240] }
    })
    
    // Salvar
    doc.save('analise_sistemas.pdf')
  }
  
  // Função para exportar para TXT
  const exportToTXT = (data) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      alert('Sem dados para exportar')
      return
    }
    
    // Criar conteúdo do arquivo de texto
    let content = "ANÁLISE DE SISTEMAS\n"
    content += "=".repeat(50) + "\n"
    content += `Data: ${new Date().toLocaleDateString('pt-BR')}\n\n`
    
    // Adicionar dados
    data.forEach(item => {
      const systemName = item.sistema_nome_personalizado || (item.sistemas?.nome || 'Sistema sem nome')
      const total = item.total_itens || 0
      const atendidos = total - (item.nao_atendidos || 0)
      const naoAtendidos = item.nao_atendidos || 0
      const percentual = Math.round(((total - naoAtendidos) / total || 0) * 100)
      
      content += `Sistema: ${systemName}\n`
      content += `Total de Itens: ${total}\n`
      content += `Itens Atendidos: ${atendidos}\n`
      content += `Itens Não Atendidos: ${naoAtendidos}\n`
      content += `Percentual Atendido: ${percentual}%\n`
      content += "-".repeat(50) + "\n"
    })
    
    // Criar blob e link para download
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'analise_sistemas.txt'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  // Show chart visualization
  const showChart = (data, type) => {
    currentChartType.value = type || 'bar'
    chartDialog.value = true
    
    // Verificação melhorada dos dados
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.warn('Dados vazios ou inválidos fornecidos para o gráfico')
      data = [] // Garantir que data seja ao menos um array vazio
    }
    
    // Let Vue render the dialog first, then create chart
    setTimeout(() => {
      renderChart(data, type)
    }, 100)
  }
  
  // Render chart based on type
  const renderChart = (data, type) => {
    const isPie = type === 'pie';
    const isHorizontal = type === 'horizontalBar';
    
    // Se for gráfico de pizza, usamos uma lógica diferente para criar múltiplos gráficos
    if (isPie) {
      renderMultiplePieCharts(data);
      return;
    }
    
    // Para outros tipos de gráfico, mantemos a lógica atual
    const canvas = chartRef.value;
    if (!canvas) return;
    
    // Garantir que o canvas esteja visível para outros tipos de gráficos
    canvas.style.display = 'block';
    
    // Prepare data for chart
    const chartData = prepareChartData(data);
    
    // Destroy previous chart if exists
    if (canvas.chart) {
      canvas.chart.destroy();
    }
    
    // Limpar qualquer conteúdo de gráficos de pizza anteriores
    const chartContainer = canvas.closest('.chart-body');
    if (chartContainer) {
      const pieChartsContainer = chartContainer.querySelector('.multiple-pie-charts');
      if (pieChartsContainer) {
        pieChartsContainer.remove();
      }
    }
    
    // Configurar opções específicas de acordo com o tipo de gráfico
    let options = {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: isHorizontal ? 'y' : 'x',
      plugins: {
        title: {
          display: true,
          text: 'Análise de Sistemas',
          font: {
            size: 16
          }
        },
        legend: {
          position: 'bottom'
        },
        tooltip: {
          enabled: true,
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const value = context.raw || 0;
              
              if (isPie) {
                return `${context.label}: ${value}`;
              }
              
              // No tooltip ainda mantemos o % para melhor compreensão
              if (context.dataset.label && context.dataset.label.includes('Percentual')) {
                return `${label}: ${value}%`;
              }
              return `${label}: ${value}`;
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            autoSkip: false,
            maxRotation: 45,
            minRotation: 45,
            font: {
              size: 10
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
            callback: (value) => Math.floor(value)
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        },
        percentage: {
          type: 'linear',
          position: 'right',
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: (value) => `${value}%`
          },
          title: {
            display: true,
            text: 'Percentual'
          },
          grid: {
            drawOnChartArea: false
          }
        }
      }
    };
    
    if (type === 'line') {
      options.elements = {
        line: {
          tension: 0.3
        },
        point: {
          radius: 5,
          hoverRadius: 7,
          hitRadius: 10
        }
      };
    } else if (isPie) {
      delete options.scales;
      
      options.cutout = '40%'; // Tornamos o gráfico um donut para visualização em camadas
      
      options.plugins.tooltip = {
        callbacks: {
          label: function(context) {
            let label = '';
            if (context.dataset.category) {
              label = context.dataset.category + ': ';
            }
            return label + context.raw;
          },
          title: function(context) {
            return context[0].label;
          }
        }
      };
    }

    // Preparar datasets para diferentes tipos de gráfico
    const datasets = [];
    
    if (isPie) {
      // Nova implementação de gráfico em camadas para pizza
      // Usamos círculos concêntricos para representar total, atendidos e não atendidos
      
      // A lógica aqui é criar três datasets:
      // - Dataset 1: Total (círculo exterior) 
      // - Dataset 2: Atendidos (círculo intermediário)
      // - Dataset 3: Não atendidos (círculo interno)
      
      // Calculando somas totais para melhor visualização
      const totalSum = chartData.totals.reduce((sum, value) => sum + value, 0);
      const attendedSum = totalSum - chartData.nonAttended.reduce((sum, value) => sum + value, 0);
      const nonAttendedSum = chartData.nonAttended.reduce((sum, value) => sum + value, 0);
      
      // Dataset para o total (camada exterior)
      datasets.push({
        label: 'Total',
        data: [totalSum],
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1,
        category: 'Total',
        weight: 0.5
      });
      
      // Dataset para atendidos (camada intermediária)
      datasets.push({
        label: 'Atendidos',
        data: [attendedSum],
        backgroundColor: 'rgba(75, 192, 192, 0.8)',
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 1,
        category: 'Atendidos',
        weight: 0.7
      });
      
      // Dataset para não atendidos (camada interna)
      datasets.push({
        label: 'Não Atendidos',
        data: [nonAttendedSum],
        backgroundColor: 'rgba(255, 99, 132, 0.8)',
        borderColor: 'rgb(255, 99, 132)',
        borderWidth: 1,
        category: 'Não Atendidos',
        weight: 0.9
      });
      
    } else {
      // Para outros tipos de gráfico, mostrar todas as métricas
      datasets.push(
        {
          label: 'Total de Itens',
          data: chartData.totals,
          backgroundColor: 'rgba(54, 162, 235, 0.8)',
          borderColor: 'rgb(54, 162, 235)',
          borderWidth: 1
        },
        {
          label: 'Itens Não Atendidos',
          data: chartData.nonAttended,
          backgroundColor: 'rgba(255, 99, 132, 0.8)',
          borderColor: 'rgb(255, 99, 132)',
          borderWidth: 1
        },
        {
          label: 'Percentual Atendido',
          data: chartData.percentages,
          backgroundColor: 'rgba(75, 192, 192, 0.8)',
          borderColor: 'rgb(75, 192, 192)',
          borderWidth: 1,
          yAxisID: 'percentage'
        }
      );
      
      if (type === 'line') {
        datasets.forEach(dataset => {
          dataset.fill = false;
          dataset.pointBackgroundColor = dataset.borderColor;
        });
      }
    }
    
    // Tipo de gráfico específico para pie
    const chartType = isPie ? 'doughnut' : (isHorizontal ? 'bar' : type || 'bar');
    
    // Create new chart with improved visibility
    canvas.chart = new Chart(canvas, {
      type: chartType,
      data: {
        labels: isPie ? ['Análise de Sistemas'] : chartData.labels,
        datasets: datasets
      },
      options: options
    });
    
    // Se for gráfico de pizza, adicionar legendas personalizadas abaixo
    if (isPie && canvas.chart) {
      const chartContainer = canvas.closest('.chart-body');
      if (chartContainer) {
        // Remover legenda anterior se existir
        const oldLegend = chartContainer.querySelector('.custom-pie-legend');
        if (oldLegend) {
          oldLegend.remove();
        }
        
        // Criar nova legenda
        const legend = document.createElement('div');
        legend.className = 'custom-pie-legend';
        legend.style.marginTop = '20px';
        legend.style.textAlign = 'center';
        
        // Dados para a legenda
        const legendItems = [
          { label: 'Total de Itens', color: 'rgb(54, 162, 235)', value: totalSum },
          { label: 'Itens Atendidos', color: 'rgb(75, 192, 192)', value: attendedSum },
          { label: 'Itens Não Atendidos', color: 'rgb(255, 99, 132)', value: nonAttendedSum }
        ];
        
        // Construir HTML da legenda
        legendItems.forEach(item => {
          const itemDiv = document.createElement('div');
          itemDiv.style.display = 'inline-block';
          itemDiv.style.margin = '0 15px';
          
          itemDiv.innerHTML = `
            <div style="display: flex; align-items: center;">
              <div style="width: 15px; height: 15px; background-color: ${item.color}; margin-right: 5px;"></div>
              <span>${item.label}: ${item.value}</span>
            </div>
          `;
          
          legend.appendChild(itemDiv);
        });
        
        chartContainer.appendChild(legend);
      }
    }
  }
  
  // Nova função para renderizar múltiplos gráficos de pizza
  const renderMultiplePieCharts = (data) => {
    const canvas = chartRef.value;
    if (!canvas) return;
    
    // Preparar dados para o gráfico
    const chartData = prepareChartData(data);
    
    // Encontrar o container
    const chartContainer = canvas.closest('.chart-body');
    if (!chartContainer) return;
    
    // Limpar gráficos existentes
    if (canvas.chart) {
      canvas.chart.destroy();
      canvas.chart = null;
    }
    
    // Remover container de múltiplas pizzas se já existir
    let multipleChartsContainer = chartContainer.querySelector('.multiple-pie-charts');
    if (multipleChartsContainer) {
      multipleChartsContainer.remove();
    }
    
    // Esconder o canvas original
    canvas.style.display = 'none';
    
    // Criar container para múltiplos gráficos
    multipleChartsContainer = document.createElement('div');
    multipleChartsContainer.className = 'multiple-pie-charts';
    multipleChartsContainer.style.display = 'flex';
    multipleChartsContainer.style.flexWrap = 'wrap';
    multipleChartsContainer.style.justifyContent = 'center';
    multipleChartsContainer.style.gap = '20px';
    multipleChartsContainer.style.marginTop = '20px';
    
    chartContainer.appendChild(multipleChartsContainer);
    
    // Calcular tamanho ideal para os gráficos com base na quantidade
    const itemsCount = chartData.labels.length;
    const maxWidth = Math.min(250, Math.max(150, 800 / Math.ceil(Math.sqrt(itemsCount))));
    
    // Criar um gráfico para cada sistema
    chartData.labels.forEach((systemName, index) => {
      // Criar container para cada gráfico
      const pieContainer = document.createElement('div');
      pieContainer.style.width = `${maxWidth}px`;
      pieContainer.style.height = `${maxWidth + 40}px`;  // Altura adicional para título
      pieContainer.style.position = 'relative';
      pieContainer.style.display = 'flex';
      pieContainer.style.flexDirection = 'column';
      pieContainer.style.alignItems = 'center';
      
      // Criar título para o sistema
      const titleElement = document.createElement('h4');
      titleElement.textContent = systemName;
      titleElement.style.margin = '0 0 10px 0';
      titleElement.style.fontSize = '14px';
      titleElement.style.textAlign = 'center';
      titleElement.style.height = '40px';
      titleElement.style.overflow = 'hidden';
      titleElement.style.textOverflow = 'ellipsis';
      titleElement.style.display = '-webkit-box';
      titleElement.style.webkitLineClamp = '2';
      titleElement.style.webkitBoxOrient = 'vertical';
      titleElement.title = systemName; // Para mostrar tooltip com nome completo
      
      // Criar canvas para o gráfico
      const pieCanvas = document.createElement('canvas');
      pieCanvas.width = maxWidth;
      pieCanvas.height = maxWidth;
      pieCanvas.style.width = '100%';
      
      // Adicionar elementos ao container
      pieContainer.appendChild(titleElement);
      pieContainer.appendChild(pieCanvas);
      multipleChartsContainer.appendChild(pieContainer);
      
      // Obter valores para este sistema
      const total = chartData.totals[index];
      const nonAttended = chartData.nonAttended[index];
      const attended = total - nonAttended;
      
      // Configurar dados do gráfico
      const pieData = {
        labels: ['Atendidos', 'Não Atendidos'],
        datasets: [{
          data: [attended, nonAttended],
          backgroundColor: [
            'rgba(75, 192, 192, 0.8)',  // Verde para atendidos
            'rgba(255, 99, 132, 0.8)'   // Vermelho para não atendidos
          ],
          borderColor: [
            'rgb(75, 192, 192)',
            'rgb(255, 99, 132)'
          ],
          borderWidth: 1
        }]
      };
      
      // Opções do gráfico
      const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw || 0;
                const label = context.label || '';
                return `${label}: ${value}`;
              }
            }
          },
          legend: {
            position: 'bottom',
            labels: {
              font: {
                size: 10
              }
            }
          }
        }
      };
      
      // Criar o gráfico
      new Chart(pieCanvas, {
        type: 'doughnut',
        data: pieData,
        options: pieOptions
      });
      
      // Adicionar informações de total abaixo do gráfico
      const infoElement = document.createElement('div');
      infoElement.style.marginTop = '5px';
      infoElement.style.fontSize = '12px';
      infoElement.style.textAlign = 'center';
      infoElement.innerHTML = `Total: <strong>${total}</strong>`;
      
      pieContainer.appendChild(infoElement);
    });
  };
  
  // Prepare data for chart
  const prepareChartData = (data) => {
    // Verificação robusta da existência de dados
    if (!data || !Array.isArray(data) || data.length === 0) {
      // Retornar estrutura básica vazia para evitar erros
      return {
        labels: [],
        totals: [],
        nonAttended: [],
        percentages: []
      }
    }
    
    const labels = []
    const totals = []
    const nonAttended = []
    const percentages = []
    
    data.forEach(item => {
      // Skip invalid items
      if (!item) return
      
      // Obter nome do sistema com failsafe
      const systemName = item.sistema_nome_personalizado || 
                       (item.sistemas?.nome || 'Sistema sem nome')
      
      // Garantir que valores numéricos sejam tratados corretamente
      const total = Number(item.total_itens || 0)
      const notAttended = Number(item.nao_atendidos || 0)
      
      // Adicionar dados ao array
      labels.push(systemName)
      totals.push(total)
      nonAttended.push(notAttended)
      
      // Calcular percentual
      let percentual = 0
      if (total > 0) {
        percentual = Math.round(((total - notAttended) / total) * 100)
      }
      percentages.push(percentual)
    })
    
    return {
      labels,
      totals,
      nonAttended,
      percentages
    }
  }
  
  // Exportar gráfico atual como imagem para PDF
  const exportChartToPDF = () => {
    const canvas = chartRef.value
    if (!canvas) {
      alert('Gráfico não disponível para exportação')
      return
    }
    
    // Cria o PDF
    const pdf = new jsPDF('landscape', 'mm', 'a4')
    
    // Adiciona título
    pdf.setFontSize(16)
    pdf.text('Análise de Sistemas', 14, 15)
    
    // Verificar se estamos com múltiplos gráficos de pizza
    const chartContainer = canvas.closest('.chart-body');
    const multipleChartsContainer = chartContainer?.querySelector('.multiple-pie-charts');
    
    if (currentChartType.value === 'pie' && multipleChartsContainer) {
      // Para múltiplos gráficos de pizza, capturar uma imagem completa do container
      
      // Primeiro obtemos as dimensões do PDF
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Tentamos converter o container em uma imagem usando html2canvas
      // Note: isto é uma simplificação, uma implementação real pode precisar da biblioteca html2canvas
      alert('Exportação de múltiplos gráficos de pizza para PDF ainda não implementada completamente.');
      
      // Alternativa: capturar cada gráfico individual
      const pieCanvases = multipleChartsContainer.querySelectorAll('canvas');
      let currentY = 25; // Começar após o título
      
      pieCanvases.forEach((pieCanvas, index) => {
        if (index > 0 && index % 2 === 0) {
          // Adicionar nova página a cada dois gráficos
          pdf.addPage();
          currentY = 15;
        }
        
        const imgData = pieCanvas.toDataURL('image/png');
        const title = pieCanvas.previousElementSibling.textContent;
        
        // Adicionar título do sistema
        pdf.setFontSize(12);
        pdf.text(title, 14, currentY);
        
        // Calcular dimensões para a imagem
        const imgWidth = 80;
        const imgHeight = imgWidth;
        
        // Adicionar a imagem
        pdf.addImage(imgData, 'PNG', 14, currentY + 5, imgWidth, imgHeight);
        
        // Atualizar posição Y para o próximo gráfico
        if (index % 2 === 0) {
          // Se for o primeiro de cada página, o próximo vai para a direita
          currentY += imgHeight + 15;
        } else {
          // Se for o segundo, o próximo vai para a linha seguinte
          currentY += imgHeight + 15;
        }
      });
      
    } else {
      // Para gráficos normais, usamos a lógica atual
      const imgData = canvas.toDataURL('image/png');
      
      // Adiciona a imagem
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 30;
      const imgHeight = imgWidth * canvas.height / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 15, 25, imgWidth, imgHeight);
    }
    
    // Salvar o PDF
    pdf.save(`grafico_analise_${currentChartType.value}.pdf`);
  }
  
  // Exportar dados do gráfico para Excel
  const exportChartToExcel = () => {
    const canvas = chartRef.value
    if (!canvas || !canvas.chart) {
      alert('Gráfico não disponível para exportação')
      return
    }
    
    // Obter dados do gráfico
    const chart = canvas.chart
    const labels = chart.data.labels || []
    const datasets = chart.data.datasets || []
    
    // Preparar dados para Excel
    const dataForExcel = labels.map((label, i) => {
      const rowData = {
        'Sistema': label
      }
      
      // Adicionar valores de todos os datasets para cada sistema
      datasets.forEach(dataset => {
        rowData[dataset.label] = dataset.data[i]
      })
      
      return rowData
    })
    
    // Criar e exportar Excel
    const workbook = utils.book_new()
    const worksheet = utils.json_to_sheet(dataForExcel)
    
    // Ajustar largura das colunas
    const columnWidths = [
      { wch: 30 }, // Sistema
      { wch: 15 }, // Total de Itens
      { wch: 15 }, // Itens Não Atendidos
      { wch: 18 }, // Percentual Atendido
    ]
    worksheet['!cols'] = columnWidths
    
    utils.book_append_sheet(workbook, worksheet, `Gráfico ${currentChartType.value}`)
    writeFileXLSX(workbook, `grafico_analise_${currentChartType.value}.xlsx`)
  }
  
  // Exportar dados do gráfico como TXT
  const exportChartToTXT = () => {
    const canvas = chartRef.value
    if (!canvas || !canvas.chart) {
      alert('Gráfico não disponível para exportação')
      return
    }
    
    // Obter dados do gráfico
    const chart = canvas.chart
    const labels = chart.data.labels || []
    const datasets = chart.data.datasets || []
    
    // Preparar conteúdo do TXT
    let content = `DADOS DO GRÁFICO: ${currentChartType.value.toUpperCase()}\n`
    content += "=".repeat(50) + "\n"
    content += `Data: ${new Date().toLocaleDateString('pt-BR')}\n\n`
    
    // Cabeçalho
    let header = "Sistema"
    datasets.forEach(ds => {
      header += `\t${ds.label}`
    })
    content += header + '\n'
    content += "-".repeat(50) + "\n"
    
    // Adicionar dados
    labels.forEach((label, i) => {
      let row = label
      datasets.forEach(dataset => {
        const value = dataset.data[i]
        // Para percentuais, adicionar o símbolo %
        const formattedValue = dataset.label.includes('Percentual') ? `${value}%` : value
        row += `\t${formattedValue}`
      })
      content += row + '\n'
    })
    
    // Criar blob e link para download
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `grafico_analise_${currentChartType.value}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  return {
    showExportDropdown,
    exportToExcel,
    exportToPDF,
    exportToTXT,
    exportChartToPDF,
    exportChartToExcel,
    exportChartToTXT,
    showChart,
    chartRef,
    chartDialog,
    currentChartType
  }
}
