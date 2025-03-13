<script setup>
import { ref, onMounted } from 'vue'
import { Chart } from 'chart.js/auto'
import TheSidebar from '@/components/TheSidebar.vue'
import { useConnectionManager } from '@/composables/useConnectionManager'

const isSidebarExpanded = ref(true)
const currentDate = new Date().toLocaleDateString('pt-BR', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})

const handleSidebarToggle = (expanded) => {
  isSidebarExpanded.value = expanded
}

// Dados fictícios
const ultimosEditais = ref([
  { id: 1, codigo: 'ED001', descricao: 'Fornecimento de Equipamentos', valor: 'R$ 120.000', status: 'em-andamento' },
  { id: 2, codigo: 'ED002', descricao: 'Serviços de Manutenção', valor: 'R$ 85.000', status: 'concluido' },
  { id: 3, codigo: 'ED003', descricao: 'Consultoria Técnica', valor: 'R$ 95.000', status: 'pendente' },
])

const lineChartRef = ref(null)
const pieChartRef = ref(null)
const barChartRef = ref(null)

const loadData = async () => {
  await loadProcessos() // ou qualquer outra função que carregue seus dados
}

// Use o composable
useConnectionManager(loadData)

onMounted(() => {
  // Gráfico de Linha
  const lineChart = new Chart(lineChartRef.value, {
    type: 'line',
    data: {
      labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
      datasets: [{
        label: 'Editais Publicados',
        data: [12, 19, 15, 25, 22, 30],
        borderColor: '#4CAF50',
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  })

  // Gráfico de Pizza
  const pieChart = new Chart(pieChartRef.value, {
    type: 'pie',
    data: {
      labels: ['Obras', 'Serviços', 'Materiais', 'Outros'],
      datasets: [{
        data: [30, 25, 35, 10],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  })

  // Gráfico de Barras
  const barChart = new Chart(barChartRef.value, {
    type: 'bar',
    data: {
      labels: ['Em Análise', 'Em Andamento', 'Concluídos', 'Cancelados'],
      datasets: [{
        label: 'Quantidade',
        data: [65, 59, 80, 15],
        backgroundColor: '#36A2EB'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  })
})
</script>

<template>
  <div class="layout">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />
    
    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <!-- Adicione a saudação aqui -->
      <div class="welcome-banner">
        <h1>Bem-vindo ao Sistema de Controle de Licitações</h1>
      </div>

      <header class="dashboard-header">
        <h1>Dashboard</h1>
        <div class="header-actions">
          <span class="date">{{ currentDate }}</span>
        </div>
      </header>

      <div class="dashboard-grid">
        <!-- Cards de Estatísticas -->
        <div class="stat-card">
          <div class="stat-icon">📈</div>
          <div class="stat-info">
            <h3>Total de Editais</h3>
            <p class="stat-value">254</p>
            <p class="stat-change positive">+12.5%</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-info">
            <h3>Valor Total</h3>
            <p class="stat-value">R$ 15.7M</p>
            <p class="stat-change positive">+8.3%</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-info">
            <h3>Taxa de Sucesso</h3>
            <p class="stat-value">67%</p>
            <p class="stat-change negative">-2.1%</p>
          </div>
        </div>

        <!-- Gráficos -->
        <div class="chart-card wide">
          <h3>Editais por Mês</h3>
          <div class="chart-container">
            <canvas ref="lineChartRef"></canvas>
          </div>
        </div>

        <div class="chart-card">
          <h3>Distribuição por Categoria</h3>
          <div class="chart-container">
            <canvas ref="pieChartRef"></canvas>
          </div>
        </div>

        <div class="chart-card">
          <h3>Status dos Editais</h3>
          <div class="chart-container">
            <canvas ref="barChartRef"></canvas>
          </div>
        </div>

        <!-- Tabela de Últimos Editais -->
        <div class="table-card wide">
          <h3>Últimos Editais</h3>
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="edital in ultimosEditais" :key="edital.id">
                <td>{{ edital.codigo }}</td>
                <td>{{ edital.descricao }}</td>
                <td>{{ edital.valor }}</td>
                <td>
                  <span :class="['status', edital.status]">
                    {{ edital.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style src="../assets/styles/HomeView.css"></style>
