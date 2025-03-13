<template>
  <div class="layout">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />

    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <div class="header">
        <h1>Relatórios do Sistema</h1>
        <!-- <p>Selecione o tipo de relatório que deseja gerar</p> -->
      </div>

      <div class="reports-grid">
        <div v-for="report in reports" :key="report.id" class="report-card">
          <div class="report-icon">
            <img :src="report.icon" :alt="report.title">
          </div>
          <div class="report-content">
            <h3>{{ report.title }}</h3>
            <p>{{ report.description }}</p>
          </div>
          <div class="report-actions">
            <button @click="generateReport(report, 'pdf')" class="btn-export pdf">
              <img src="/icons/pdf.svg" alt="PDF">
              Exportar PDF
            </button>
            <button @click="generateReport(report, 'excel')" class="btn-export excel">
              <img src="/icons/excel.svg" alt="Excel">
              Exportar Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import TheSidebar from '@/components/TheSidebar.vue'
import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { useConnectionManager } from '@/composables/useConnectionManager'

const isSidebarExpanded = ref(true)

const reports = [
  {
    id: 1,
    icon: '/icons/grafico.svg',
    title: 'Relatório de Processos',
    description: 'Listagem completa de processos licitatórios',
    endpoint: '/api/reports/processes'
  },
  {
    id: 2,
    icon: '/icons/cartao-usuario.svg',
    title: 'Relatório de Representantes',
    description: 'Dados dos representantes cadastrados',
    endpoint: '/api/reports/representatives'
  },
  {
    id: 3,
    icon: '/icons/empresa.svg',
    title: 'Relatório de Empresas',
    description: 'Informações das empresas participantes',
    endpoint: '/api/reports/companies'
  },
  {
    id: 4,
    icon: '/icons/check.svg',
    title: 'Relatório de Status',
    description: 'Status dos processos licitatórios',
    endpoint: '/api/reports/status'
  }
]

const handleSidebarToggle = (expanded) => {
  isSidebarExpanded.value = expanded
}

const generateReport = async (report, format) => {
  try {
    // Aqui você faria a chamada API para buscar os dados
    const data = await fetchReportData(report.endpoint)
    
    if (format === 'pdf') {
      generatePDF(data, report.title)
    } else {
      generateExcel(data, report.title)
    }
  } catch (error) {
    console.error('Erro ao gerar relatório:', error)
    alert('Erro ao gerar relatório. Tente novamente.')
  }
}

const generatePDF = (data, title) => {
  const pdf = new jsPDF()
  
  // Adiciona título
  pdf.setFontSize(16)
  pdf.text(title, 20, 20)
  
  // Configuração da tabela
  const columns = Object.keys(data[0])
  const rows = data.map(item => Object.values(item))
  
  pdf.autoTable({
    head: [columns],
    body: rows,
    startY: 30,
    theme: 'grid'
  })
  
  pdf.save(`${title.toLowerCase().replace(/\s+/g, '-')}.pdf`)
}

const generateExcel = (data, title) => {
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório')
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  
  saveAs(blob, `${title.toLowerCase().replace(/\s+/g, '-')}.xlsx`)
}

// Função simulada de busca de dados
const fetchReportData = async (endpoint) => {
  try {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error('Erro ao buscar dados');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    // Retorna dados mockados para teste
    return [
      { id: 1, nome: 'Teste 1', status: 'Ativo' },
      { id: 2, nome: 'Teste 2', status: 'Inativo' }
    ];
  }
}

const loadData = async () => {
  await loadProcessos() // ou qualquer outra função que carregue seus dados
}

// Use o composable
useConnectionManager(loadData)
</script>

<style src="../assets/styles/RelatoriosView.css"></style>