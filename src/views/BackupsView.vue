<template>
  <div class="layout-backups">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />
    
    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <div class="header-backups">
        <div class="title-section">
          <h1 class="title-backups">Backup do Sistema</h1>
          <p class="subtitle-backups">Gerencie os backups do sistema e restaure dados quando necessário</p>
        </div>
        <div class="header-actions">
          <button 
            @click="realizarBackupManual" 
            class="btn-backup" 
            :disabled="loading || backupEmProgresso"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"/>
            </svg>
            {{ backupEmProgresso ? 'Backup em andamento...' : 'Realizar Backup Manual' }}
          </button>
        </div>
      </div>

      <!-- Card de Status -->
      <div class="status-card">
        <div class="status-info">
          <h3>Status do Último Backup</h3>
          <p v-if="ultimoBackup">
            Realizado em: {{ formatDate(ultimoBackup.created_at) }}
            <span :class="['status-badge', ultimoBackup.status]">
              {{ formatStatus(ultimoBackup.status) }}
            </span>
          </p>
          <p v-else>Nenhum backup realizado ainda</p>
        </div>
        <div class="backup-stats">
          <div class="stat-item">
            <span class="stat-value">{{ totalBackups }}</span>
            <span class="stat-label">Total de Backups</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ espacoTotal }}</span>
            <span class="stat-label">Espaço Total</span>
          </div>
        </div>
      </div>

      <!-- Lista de Backups -->
      <div class="backups-section">
        <div class="section-header">
          <h2>Histórico de Backups</h2>
          <div class="filtros">
            <select v-model="filtroStatus" class="select-filter">
              <option value="">Todos os Status</option>
              <option value="completed">Concluídos</option>
              <option value="in_progress">Em Andamento</option>
              <option value="failed">Falhos</option>
            </select>
            <input 
              type="date" 
              v-model="filtroData" 
              class="date-filter"
              :max="today"
            >
          </div>
        </div>

        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Carregando backups...</p>
        </div>
        
        <table v-else-if="backupsFiltrados.length" class="backups-table">
          <thead>
            <tr>
              <th>Data e Hora</th>
              <th>Tipo</th>
              <th>Tamanho</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="backup in backupsFiltrados" :key="backup.id">
              <td>{{ formatDate(backup.created_at) }}</td>
              <td>{{ backup.tipo === 'auto' ? 'Automático' : 'Manual' }}</td>
              <td>{{ formatSize(backup.size) }}</td>
              <td>
                <span :class="['status-badge', backup.status]">
                  {{ formatStatus(backup.status) }}
                </span>
              </td>
              <td class="actions">
                <button 
                  @click="downloadBackup(backup)" 
                  :disabled="backup.status !== 'completed'"
                  class="btn-action download"
                  :title="backup.status !== 'completed' ? 'Backup não disponível' : 'Download'"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                  </svg>
                </button>
                <button 
                  @click="confirmarRestauracao(backup)" 
                  :disabled="backup.status !== 'completed'"
                  class="btn-action restore"
                  :title="backup.status !== 'completed' ? 'Restauração não disponível' : 'Restaurar'"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M14 12c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zm-2-9c-4.97 0-9 4.03-9 9H0l4 4 4-4H5c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.51 0-2.91-.49-4.06-1.3l-1.42 1.44C8.04 20.3 9.94 21 12 21c4.97 0 9-4.03 9-9s-4.03-9-9-9z"/>
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-else class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="#ccc">
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
          </svg>
          <p>Nenhum backup encontrado</p>
          <button @click="realizarBackupManual" class="btn-primary">Realizar Primeiro Backup</button>
        </div>
      </div>

      <!-- Modal de Confirmação -->
      <div v-if="showConfirmModal" class="modal-overlay">
        <div class="modal-content">
          <h3>Confirmar Restauração</h3>
          <p class="warning-text">
            Atenção! Esta ação irá substituir todos os dados atuais pelos dados do backup selecionado.
            Esta ação não pode ser desfeita.
          </p>
          <div class="modal-actions">
            <button @click="showConfirmModal = false" class="btn-secondary">Cancelar</button>
            <button @click="restaurarBackup" class="btn-danger">Confirmar Restauração</button>
          </div>
        </div>
      </div>

      <!-- Toast de Feedback -->
      <div v-if="showToast" :class="['toast', toastType]">
        {{ toastMessage }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'; // Adicione computed na importação
import TheSidebar from '@/components/TheSidebar.vue';
import { supabase } from '@/lib/supabase';

export default {
  name: 'BackupsView',
  components: { TheSidebar },
  setup() {
    const loading = ref(false);
    const backups = ref([]);
    const isSidebarExpanded = ref(true);
    const backupEmProgresso = ref(false);
    const ultimoBackup = ref(null);
    const totalBackups = ref(0);
    const espacoTotal = ref('0 Bytes');
    const filtroStatus = ref('');
    const filtroData = ref('');
    const showConfirmModal = ref(false);
    const showToast = ref(false);
    const toastMessage = ref('');
    const toastType = ref('');

    const handleSidebarToggle = (expanded) => {
      isSidebarExpanded.value = expanded;
    };

    const loadBackups = async () => {
      try {
        loading.value = true;
        const { data, error } = await supabase
          .from('system_backups')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        backups.value = data;
        if (data.length) {
          ultimoBackup.value = data[0];
          totalBackups.value = data.length;
          espacoTotal.value = formatSize(data.reduce((acc, backup) => acc + backup.size, 0));
        }
      } catch (error) {
        console.error('Erro ao carregar backups:', error);
      } finally {
        loading.value = false;
      }
    };

    const formatDate = (date) => {
      return new Date(date).toLocaleString('pt-BR');
    };

    const formatSize = (bytes) => {
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      if (bytes === 0) return '0 Byte';
      const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
      return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    };

    const formatStatus = (status) => {
      const statusMap = {
        'completed': 'Concluído',
        'in_progress': 'Em Andamento',
        'failed': 'Falhou'
      };
      return statusMap[status] || status;
    };

    const realizarBackupManual = async () => {
      // Implementar lógica de backup manual
    };

    const downloadBackup = async (backup) => {
      // Implementar download
    };

    const confirmarRestauracao = (backup) => {
      showConfirmModal.value = true;
    };

    const restaurarBackup = async () => {
      // Implementar restauração
    };

    const backupsFiltrados = computed(() => {
      return backups.value.filter(backup => {
        const statusMatch = !filtroStatus.value || backup.status === filtroStatus.value;
        const dateMatch = !filtroData.value || new Date(backup.created_at).toLocaleDateString('pt-BR') === new Date(filtroData.value).toLocaleDateString('pt-BR');
        return statusMatch && dateMatch;
      });
    });

    const today = computed(() => {
      return new Date().toISOString().split('T')[0];
    });

    onMounted(() => {
      loadBackups();
    });

    return {
      loading,
      backups,
      isSidebarExpanded,
      backupEmProgresso,
      ultimoBackup,
      totalBackups,
      espacoTotal,
      filtroStatus,
      filtroData,
      showConfirmModal,
      showToast,
      toastMessage,
      toastType,
      handleSidebarToggle,
      formatDate,
      formatSize,
      formatStatus,
      realizarBackupManual,
      downloadBackup,
      confirmarRestauracao,
      restaurarBackup,
      backupsFiltrados,
      today // Adicione aqui
    };
  }
};
</script>

<style scoped>
.layout-backups {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  padding: 2rem;
  transition: margin-left 0.3s;
}

.main-content.expanded {
  margin-left: 0;
}

.header-backups {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.title-section {
  display: flex;
  flex-direction: column;
}

.subtitle-backups {
  font-size: 0.875rem;
  color: #666;
}

.header-actions {
  display: flex;
  align-items: center;
}

.btn-backup {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-backup:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.status-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 2rem;
}

.status-info {
  display: flex;
  flex-direction: column;
}

.backup-stats {
  display: flex;
  gap: 2rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
}

.stat-label {
  font-size: 0.875rem;
  color: #666;
}

.backups-section {
  margin-top: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.filtros {
  display: flex;
  gap: 1rem;
}

.select-filter,
.date-filter {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  color: #666;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 4px solid #ddd;
  border-top: 4px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.backups-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.backups-table th,
.backups-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
}

.status-badge.completed {
  background-color: #E8F5E9;
  color: #2E7D32;
}

.status-badge.in_progress {
  background-color: #E3F2FD;
  color: #1565C0;
}

.status-badge.failed {
  background-color: #FFEBEE;
  color: #C62828;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn-action {
  padding: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
}

.btn-action:hover {
  color: #000;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  color: #666;
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 4px;
  max-width: 500px;
  width: 100%;
}

.warning-text {
  color: #C62828;
  margin-bottom: 1rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn-secondary {
  padding: 0.5rem 1rem;
  background-color: #ddd;
  color: #333;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-danger {
  padding: 0.5rem 1rem;
  background-color: #C62828;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.toast {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  padding: 1rem;
  border-radius: 4px;
  color: white;
  animation: fadeInOut 3s;
}

.toast.success {
  background-color: #4CAF50;
}

.toast.error {
  background-color: #C62828;
}

@keyframes fadeInOut {
  0%, 100% { opacity: 0; }
  10%, 90% { opacity: 1; }
}
</style>