import { utils, writeFileXLSX } from 'xlsx'
import { ref } from 'vue'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import Chart from 'chart.js/auto'

export function useAnaliseExport() {
  const showExportDropdown = ref(false)
  const chartRef = ref(null)
  const chartDialog = ref(false)
  const currentChartType = ref('bar')
  
  // Formatting functions
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    try {
      const [date] = dateString.split('T')
      const [year, month, day] = date.split('-')
      return `${day}/${month}/${year}`
    } catch (error) {
      return '-'
    }
  }
  
  const formatStatus = (status) => {
    const statusMap = {
      'vamos_participar': 'Vamos Participar',
      'em_analise': 'Em Análise',
      'em_andamento': 'Em Andamento',
      'ganhamos': 'Ganhamos',
      'perdemos': 'Perdemos',
      'suspenso': 'Suspenso',
      'revogado': 'Revogado',
      'adiado': 'Adiado',
      'demonstracao': 'Demonstração',
      'cancelado': 'Cancelado',
      'nao_atendido': 'Não Atendido',
      'atendido': 'Atendido'
    }
    return statusMap[status] || status
  }
  
  // Export to Excel
  const exportToExcel = (data, filename = 'analise_sistemas') => {
    const dataToExport = prepareExportData(data)
    
    const ws = utils.json_to_sheet(dataToExport)
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, 'Análise')
    writeFileXLSX(wb, `${filename}.xlsx`)
  }
  
  // Export to PDF
  const exportToPDF = (data, filename = 'analise_sistemas') => {
    const doc = new jsPDF()
    const dataToExport = prepareExportData(data)
    
    doc.setFontSize(16)
    doc.text('Análise de Sistemas', 14, 22)
    doc.setFontSize(10)
    doc.text(`Data de exportação: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30)
    
    autoTable(doc, {
      head: [Object.keys(dataToExport[0] || {})],
      body: dataToExport.map(row => Object.values(row)),
      startY: 35,
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255
      }
    })
    
    doc.save(`${filename}.pdf`)
  }
  
  // Export to TXT
  const exportToTXT = (data, filename = 'analise_sistemas') => {
    const dataToExport = prepareExportData(data)
    let content = ''
    
    // Add headers
    if (dataToExport.length > 0) {
      content += Object.keys(dataToExport[0]).join('\t') + '\n'
      
      // Add rows
      dataToExport.forEach(row => {
        content += Object.values(row).join('\t') + '\n'
      })
    }
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  
  // Prepare data for export
  const prepareExportData = (data) => {
    return data.map(item => ({
      'Sistema': item.sistema_nome_personalizado || (item.sistemas?.nome || 'Sistema sem nome'),
      'Total de Itens': item.total_itens || 0,
      'Não Atendidos': item.nao_atendidos || 0,
      'Percentual': `${calculatePercentage(item.total_itens, item.nao_atendidos)}%`,
      'Obrigatório': item.obrigatorio ? 'Sim' : 'Não',
      'Percentual Mínimo': `${item.percentual_minimo || 0}%`,
      'Status': getStatusText(item)
    }))
  }
  
  // Calculate percentage of items attended
  const calculatePercentage = (total, nonAttended) => {
    if (!total || total === 0) return 0
    const attended = total - (nonAttended || 0)
    return Math.round((attended / total) * 100)
  }
  
  // Get status text based on item data
  const getStatusText = (item) => {
    const total = item.total_itens || 0
    const nonAttended = item.nao_atendidos || 0
    const percentualAtendido = calculatePercentage(total, nonAttended)
    const percentualMinimo = item.percentual_minimo || 0
    
    if (item.obrigatorio && percentualAtendido < percentualMinimo) {
      return 'Não Atendido'
    } else {
      return 'Atendido'
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
    const canvas = chartRef.value
    if (!canvas) return
    
    // Prepare data for chart
    const chartData = prepareChartData(data)
    
    // Destroy previous chart if exists
    if (canvas.chart) {
      canvas.chart.destroy()
    }
    
    // Create new chart
    canvas.chart = new Chart(canvas, {
      type: type || 'bar',
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: 'Total de Itens',
            data: chartData.totals,
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgb(54, 162, 235)',
            borderWidth: 1
          },
          {
            label: 'Itens Não Atendidos',
            data: chartData.nonAttended,
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 1
          },
          {
            label: 'Percentual Atendido',
            data: chartData.percentages,
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            borderColor: 'rgb(75, 192, 192)',
            borderWidth: 1,
            // Only show in line chart
            hidden: type !== 'line'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
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
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    })
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
  
  return {
    showExportDropdown,
    exportToExcel,
    exportToPDF,
    exportToTXT,
    showChart,
    chartRef,
    chartDialog,
    currentChartType
  }
}
