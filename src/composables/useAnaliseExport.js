import { utils, writeFileXLSX } from 'xlsx'
import { ref } from 'vue'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import Chart from 'chart.js/auto'
import 'chart.js/auto'

// Importar as novas funções de exportação avançadas
import { 
  exportToTXT as exportToTXTAdvanced, 
  exportToPDF as exportToPDFAdvanced, 
  exportToExcel as exportToExcelAdvanced 
} from '@/utils/exportAnalises'

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
          if (value < 0.001) return;
          
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
          
          // Formatar o valor com precisão de até 5 casas decimais quando necessário
          let displayValue = value;
          if (dataset.label && dataset.label.includes('Percentual')) {
            // Para percentuais, manter exatamente 5 casas decimais
            if (value % 1 !== 0) {
              displayValue = parseFloat(value.toFixed(5));
            }
          }
          
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
  const exportToExcel = (data, processo = {}, parametros = { percentualMinimoGeral: 92, percentualMinimoObrigatorio: 100 }) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      alert('Sem dados para exportar')
      return
    }
    
    // Converter dados para o formato esperado pela função avançada
    const sistemasNormalizados = data.map(item => {
      return {
        nome: item.sistema_nome_personalizado || (item.sistemas?.nome || 'Sistema sem nome'),
        totalItens: item.total_itens || 0,
        naoAtendidos: item.nao_atendidos || 0,
        obrigatorio: item.obrigatorio || false,
        percentual_minimo: item.percentual_minimo || parametros.percentualMinimoObrigatorio
      }
    })
    
    try {
      // Usar a exportação avançada
      exportToExcelAdvanced(sistemasNormalizados, processo, {
        percentualMinimoGeral: parametros.percentualMinimoGeral,
        percentualMinimoObrigatorio: parametros.percentualMinimoObrigatorio
      })
    } catch (error) {
      console.error("Erro ao exportar Excel avançado:", error)
      
      // Fallback para formato básico em caso de erro
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
  }
  
  // Função para exportar para PDF
  const exportToPDF = (data, processo = {}, parametros = { percentualMinimoGeral: 92, percentualMinimoObrigatorio: 100 }) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      alert('Sem dados para exportar')
      return
    }
    
    // Converter dados para o formato esperado pela função avançada
    const sistemasNormalizados = data.map(item => {
      return {
        nome: item.sistema_nome_personalizado || (item.sistemas?.nome || 'Sistema sem nome'),
        totalItens: item.total_itens || 0,
        naoAtendidos: item.nao_atendidos || 0,
        obrigatorio: item.obrigatorio || false,
        percentual_minimo: item.percentual_minimo || parametros.percentualMinimoObrigatorio
      }
    })
    
// Substitua o código nas linhas ~185-195 por:

const exportToPDF = (data, processo = {}, parametros = { percentualMinimoGeral: 92, percentualMinimoObrigatorio: 100 }) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    alert('Sem dados para exportar')
    return
  }
  
  // Converter dados para o formato esperado pela função avançada
  const sistemasNormalizados = data.map(item => {
    return {
      nome: item.sistema_nome_personalizado || (item.sistemas?.nome || 'Sistema sem nome'),
      totalItens: item.total_itens || 0,
      naoAtendidos: item.nao_atendidos || 0,
      obrigatorio: item.obrigatorio || false,
      percentual_minimo: item.percentual_minimo || parametros.percentualMinimoObrigatorio
    }
  })
  
  try {
    // Usar a exportação avançada
    exportToPDFAdvanced(sistemasNormalizados, processo, {
      percentualMinimoGeral: parametros.percentualMinimoGeral,
      percentualMinimoObrigatorio: parametros.percentualMinimoObrigatorio
    })
  } catch (error) {
    console.error("Erro ao exportar PDF avançado:", error)
    
    // Fallback para formato básico em caso de erro
    // ... resto do código de fallback ...
  }
}

    try {
      // Usar a exportação avançada
      exportToPDFAdvanced(sistemasNormalizados, processo, {
        percentualMinimoGeral: parametros.percentualMinimoGeral,
        percentualMinimoObrigatorio: parametros.percentualMinimoObrigatorio
      })
    } catch (error) {
      console.error("Erro ao exportar PDF avançado:", error)
      
      // Fallback para formato básico em caso de erro
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
  }
  
  // Função para exportar para TXT
  const exportToTXT = (data, processo = {}, parametros = { percentualMinimoGeral: 92, percentualMinimoObrigatorio: 100 }) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      alert('Sem dados para exportar')
      return
    }
    
    // Converter dados para o formato esperado pela função avançada
    const sistemasNormalizados = data.map(item => {
      return {
        nome: item.sistema_nome_personalizado || (item.sistemas?.nome || 'Sistema sem nome'),
        totalItens: item.total_itens || 0,
        naoAtendidos: item.nao_atendidos || 0,
        obrigatorio: item.obrigatorio || false,
        percentual_minimo: item.percentual_minimo || parametros.percentualMinimoObrigatorio
      }
    })
    
    try {
      // Usar a exportação avançada
      exportToTXTAdvanced(sistemasNormalizados, processo, {
        percentualMinimoGeral: parametros.percentualMinimoGeral,
        percentualMinimoObrigatorio: parametros.percentualMinimoObrigatorio
      })
    } catch (error) {
      console.error("Erro ao exportar TXT avançado:", error)
      
      // Fallback para formato básico em caso de erro
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
    
    // Limpar qualquer conteúdo anterior
    const chartContainer = canvas.closest('.chart-body');
    if (chartContainer) {
      const pieChartsContainer = chartContainer.querySelector('.multiple-pie-charts');
      if (pieChartsContainer) {
        pieChartsContainer.remove();
      }
      
      // Remover tabela de resumo se existir
      const summaryTable = chartContainer.querySelector('.non-conform-summary');
      if (summaryTable) {
        summaryTable.remove();
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
              const dataIndex = context.dataIndex;
              
              if (isPie) {
                return `${context.label}: ${value}`;
              }

              // Adicionar informações do percentual e requisito mínimo apenas no tooltip
              if (context.dataset.label === 'Itens Atendidos') {
                const percentual = chartData.percentages[dataIndex].toFixed(5);
                const minRequirement = chartData.minRequirements[dataIndex];
                const isConform = chartData.conformStatus[dataIndex];
                const status = isConform ? 'Atende ✓' : 'Não Atende ✗';
                
                return [
                  `${label}: ${value}`,
                  `Percentual: ${percentual}%`,
                  `Mínimo Exigido: ${minRequirement}%`,
                  `Status: ${status}`
                ];
              }
              
              return `${label}: ${value}`;
            }
          }
        },
        annotation: {
          annotations: {}
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
            // Preservar casas decimais quando necessário
            callback: (value) => {
              if (value % 1 === 0) return Math.floor(value);
              return parseFloat(value.toFixed(5));
            }
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
            // Preservar casas decimais quando necessário
            callback: (value) => {
              if (value % 1 === 0) return `${value}%`;
              return `${parseFloat(value.toFixed(5))}%`;
            }
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
    } 

    // Preparar datasets para diferentes tipos de gráfico
    const datasets = [];

    // Calcular itens atendidos para exibição
    const attendedItems = chartData.totals.map((total, idx) => total - chartData.nonAttended[idx]);
        
    // Para gráficos de barra e linha, mostrar todas as métricas
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
      }
    );

    // Dataset para itens atendidos com cores condicionais (verde mais forte ou verde claro)
    const attendedColors = chartData.conformStatus.map(isConform => 
      isConform ? 'rgba(40, 167, 69, 0.8)' : 'rgba(144, 238, 144, 0.6)' // Verde forte se conforme, verde claro se não
    );

    const attendedBorders = chartData.conformStatus.map(isConform => 
      isConform ? 'rgb(40, 167, 69)' : 'rgb(144, 238, 144)' // Borda correspondente
    );

    // Adicionar dataset para itens atendidos
    datasets.push({
      label: 'Itens Atendidos',
      data: attendedItems,
      backgroundColor: attendedColors,
      borderColor: attendedBorders,
      borderWidth: 1.5
    });

    if (type === 'line') {
      datasets.forEach(dataset => {
        dataset.fill = false;
        dataset.pointBackgroundColor = dataset.borderColor;
        
        // Para o dataset de percentual, usar símbolos diferentes para conformes/não conformes
        if (dataset.label === 'Percentual Atendido') {
          dataset.pointStyle = chartData.conformStatus.map(isConform => 
            isConform ? 'circle' : 'triangle'
          );
          dataset.pointRadius = chartData.conformStatus.map(isConform => 
            isConform ? 5 : 7
          );
        }
      });
    }
    
    // Tipo de gráfico específico para pie
    const chartType = isHorizontal ? 'bar' : type || 'bar';
    
    // Create new chart with improved visibility
    canvas.chart = new Chart(canvas, {
      type: chartType,
      data: {
        labels: chartData.labels,
        datasets: datasets
      },
      options: options,
      plugins: [{
        id: 'clearMinRequirementLines', // Novo plugin vazio para substituir o anterior
        afterDraw: function(chart) {
          // Não desenhar mais as linhas vermelhas
        }
      }]
    });
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
    
    // Remover tabela de resumo anterior se existir
    const summaryTable = chartContainer.querySelector('.non-conform-summary');
    if (summaryTable) {
      summaryTable.remove();
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
      pieContainer.style.height = `${maxWidth + 60}px`;  // Altura adicional para título e status
      pieContainer.style.position = 'relative';
      pieContainer.style.display = 'flex';
      pieContainer.style.flexDirection = 'column';
      pieContainer.style.alignItems = 'center';
      
      // Verificar se está em conformidade
      const isConform = chartData.conformStatus[index];
      
      // Adicionar borda vermelha para itens não conformes
      if (!isConform) {
        pieContainer.style.border = '2px solid #d9534f';
        pieContainer.style.borderRadius = '5px';
        pieContainer.style.padding = '5px';
        pieContainer.style.backgroundColor = 'rgba(255, 99, 132, 0.05)';
      }
      
      // Criar título para o sistema
      const titleElement = document.createElement('h4');
      titleElement.textContent = systemName;
      titleElement.style.margin = '0 0 5px 0';
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
      const percentAtendido = chartData.percentages[index];
      const minRequirement = chartData.minRequirements[index];
      
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
              },
              afterBody: function(context) {
                return [
                  `Percentual Atendido: ${percentAtendido.toFixed(5)}%`,
                  `Mínimo Exigido: ${minRequirement}%`,
                  `Status: ${isConform ? 'Atende ✓' : 'Não Atende ✗'}`
                ];
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
      
      // Adicionar informações de total e status abaixo do gráfico
      const infoElement = document.createElement('div');
      infoElement.style.marginTop = '5px';
      infoElement.style.fontSize = '12px';
      infoElement.style.textAlign = 'center';
      
      // Status de conformidade
      const statusBadge = document.createElement('span');
      statusBadge.style.padding = '2px 5px';
      statusBadge.style.borderRadius = '3px';
      statusBadge.style.fontWeight = 'bold';
      statusBadge.style.marginLeft = '5px';
      
      if (isConform) {
        statusBadge.textContent = '✓ Atende';
        statusBadge.style.backgroundColor = 'rgba(75, 192, 192, 0.2)';
        statusBadge.style.color = 'rgb(75, 192, 192)';
      } else {
        statusBadge.textContent = `✗ Não Atende (Min: ${minRequirement}%)`;
        statusBadge.style.backgroundColor = 'rgba(255, 99, 132, 0.2)';
        statusBadge.style.color = 'rgb(255, 99, 132)';
      }
      
      infoElement.innerHTML = `Total: <strong>${total}</strong> `;
      infoElement.appendChild(statusBadge);
      
      pieContainer.appendChild(infoElement);
    });
  }
  
  // Prepare data for chart
  const prepareChartData = (data) => {
    // Verificação robusta da existência de dados
    if (!data || !Array.isArray(data) || data.length === 0) {
      // Retornar estrutura básica vazia para evitar erros
      return {
        labels: [],
        totals: [],
        nonAttended: [],
        percentages: [],
        minRequirements: [],
        conformStatus: []
      }
    }
    
    const labels = []
    const totals = []
    const nonAttended = []
    const percentages = []
    const minRequirements = []
    const conformStatus = []
    
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
      
      // Calcular percentual como valor numérico puro, sem converter para string primeiro
      let percentual = 0
      if (total > 0) {
        percentual = ((total - notAttended) / total) * 100;
      }
      percentages.push(percentual)
      
      // Adicionar requisito mínimo como número puro
      const minRequirement = Number(item.percentual_minimo || 80)
      minRequirements.push(minRequirement)
      
      // Determinar conformidade com uma comparação direta de números
      const isConform = percentual >= minRequirement;
      conformStatus.push(isConform)
      
      // Debug para TESOURARIA
      if (systemName.includes('TESOURARIA')) {
        console.log(`DEPURAÇÃO - ${systemName}: 
          Percentual: ${percentual} 
          MinReq: ${minRequirement} 
          isConform: ${isConform}`)
      }
    })
    
    return {
      labels,
      totals,
      nonAttended,
      percentages,
      minRequirements,
      conformStatus
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
  
  const handleExportToPDF = () => {
    try {
      exportToPDF(props.data, props.processo, {
        percentualMinimoGeral: props.percentualMinimoGeral,
        percentualMinimoObrigatorio: props.percentualMinimoObrigatorio
      });
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      // Opcionalmente, mostrar algum feedback para o usuário
      alert('Erro ao exportar PDF: ' + error.message);
    }
  };

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
