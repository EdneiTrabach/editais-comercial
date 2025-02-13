<script setup>
import { ref, onMounted } from 'vue'
import { Chart } from 'chart.js/auto'
import TheSidebar from '@/components/TheSidebar.vue'

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

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
}

.main-content {
  /* margin-left: 300px; */
  padding: 2rem;
  transition: margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.main-content.expanded {
  margin-left: 0px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  font-size: 2rem;
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 50%;
}

.stat-info h3 {
  font-size: 0.9rem;
  color: #6c757d;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.stat-change {
  font-size: 0.9rem;
}

.stat-change.positive {
  color: #28a745;
}

.stat-change.negative {
  color: #dc3545;
}

.chart-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  height: fit-content;
}

.wide {
  grid-column: span 2;
}

.table-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e9ecef;
}

th {
  font-weight: 600;
  color: #495057;
}

.status {
  padding: 0.25rem 0.75rem;
  border-radius: 50px;
  font-size: 0.85rem;
}

.status.em-andamento {
  background: #fff3cd;
  color: #856404;
}

.status.concluido {
  background: #d4edda;
  color: #155724;
}

.status.pendente {
  background: #f8d7da;
  color: #721c24;
}

.welcome-banner {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
  text-align: center;
}

.welcome-banner h1 {
  color: #193155;
  font-size: 1.8rem;
  margin: 0;
  font-weight: 600;
  letter-spacing: -0.5px;
}

.chart-container {
  position: relative;
  height: 300px;
  width: 100%;
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 70px;
    padding: 1rem;
  }

  .main-content.expanded {
    margin-left: 0;
  }

  .wide {
    grid-column: span 1;
  }
}

.developer-card {
  background: white;
  margin-top: 2rem;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  transition: all 0.3s ease;
  border: 1px solid rgba(25, 49, 85, 0.1);
}

.developer-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(25, 49, 85, 0.12);
}

.developer-content {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.developer-avatar {
  position: relative;
  width: 100px;
  height: 100px;
}

.developer-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 16px;
  object-fit: cover;
  border: 3px solid #193155;
  padding: 3px;
}

.status-indicator {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 20px;
  height: 20px;
  background: #28a745;
  border: 3px solid white;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.developer-info {
  flex: 1;
}

.developer-info h3 {
  color: #6c757d;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.developer-info h2 {
  color: #193155;
  font-size: 1.8rem;
  margin: 0 0 0.5rem 0;
  font-weight: 600;
}

.developer-info p {
  color: #495057;
  margin: 0 0 1rem 0;
}

.social-links {
  display: flex;
  gap: 1rem;
}

.social-links a {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  color: #193155;
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.social-links a:hover {
  background: #193155;
  color: white;
  transform: translateY(-2px);
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(40, 167, 69, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(40, 167, 69, 0);
  }
}

@media (max-width: 768px) {
  .developer-content {
    flex-direction: column;
    text-align: center;
  }

  .social-links {
    justify-content: center;
  }
}
</style>
