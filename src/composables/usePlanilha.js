import { ref, computed } from 'vue'
import { utils, writeFileXLSX } from 'xlsx'
import html2pdf from 'html2pdf.js'

export function usePlanilha() {
  const itensPlanilha = ref([])

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const calcularTotal = (item) => {
    item.total = item.valorUnitario * item.quantidade
  }

  const totalGeral = computed(() => {
    return itensPlanilha.value.reduce((acc, item) => acc + (item.total || 0), 0)
  })

  const adicionarItem = () => {
    itensPlanilha.value.push({
      nome: 'Item Personalizado',
      categoria: 'Diversos',
      descricao: '',
      marca: '',
      valorUnitario: 0,
      quantidade: 1,
      total: 0
    })
  }

  const removerItem = (index) => {
    itensPlanilha.value.splice(index, 1)
  }

  const exportarPDF = () => {
    const element = document.querySelector('.planilha-container')
    
    const options = {
      margin: [10, 10, 10, 10],
      filename: 'proposta-comercial.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    }
    
    html2pdf().set(options).from(element).save()
  }

  const exportarExcel = () => {
    // Preparar dados para Excel (remover campos desnecessários para o cliente)
    const dadosExcel = itensPlanilha.value.map(item => ({
      'Item': item.nome,
      'Categoria': item.categoria,
      'Descrição': item.descricao,
      'Marca/Fabricante': item.marca,
      'Valor Unitário (R$)': item.valorUnitario,
      'Quantidade': item.quantidade,
      'Total (R$)': item.total
    }))
    
    // Adicionar linha com total geral
    dadosExcel.push({
      'Item': '',
      'Categoria': '',
      'Descrição': '',
      'Marca/Fabricante': '',
      'Valor Unitário (R$)': '',
      'Quantidade': 'TOTAL GERAL:',
      'Total (R$)': totalGeral.value
    })

    const ws = utils.json_to_sheet(dadosExcel)
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, 'Proposta Comercial')
    
    // Ajustar largura das colunas
    const wscols = [
      {wch: 20}, // Item
      {wch: 15}, // Categoria
      {wch: 40}, // Descrição
      {wch: 20}, // Marca
      {wch: 15}, // Valor Unitário
      {wch: 12}, // Quantidade
      {wch: 15}  // Total
    ]
    ws['!cols'] = wscols
    
    writeFileXLSX(wb, 'proposta-comercial.xlsx')
  }

  return {
    itensPlanilha,
    totalGeral,
    formatarMoeda,
    calcularTotal,
    adicionarItem,
    removerItem,
    exportarPDF,
    exportarExcel
  }
}
