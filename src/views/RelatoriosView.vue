<template>
  <div class="layout">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />

    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <div class="reports-header">
        <h1>Relatórios do Sistema</h1>
        <p>Selecione o tipo de relatório que deseja gerar</p>
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
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.main-content {
  padding: 2rem;
  transition: margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
}

.reports-header {
  margin-bottom: 2rem;
}

.reports-header h1 {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.reports-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.report-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.report-icon img {
  width: 48px;
  height: 48px;
}

.report-content h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.report-actions {
  display: flex;
  gap: 1rem;
  margin-top: auto;
}

.btn-export {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-export img {
  width: 20px;
  height: 20px;
}

.btn-export.pdf {
  background: #dc2626;
  color: white;
}

.btn-export.excel {
  background: #16a34a;
  color: white;
}

.btn-export:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .reports-grid {
    grid-template-columns: 1fr;
  }
  
  .report-actions {
    flex-direction: column;
  }
}

/* Dark mode */
:deep(.dark-mode) .report-card {
  background: #1f2937;
  color: white;
}

:deep(.dark-mode) .report-content h3 {
  color: white;
}

:deep(.dark-mode) .report-content p {
  color: #cbd5e1;
}
</style>