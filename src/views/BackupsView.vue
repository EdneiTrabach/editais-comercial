<template>
  <div class="layout-backups">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />
    
    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <div class="header-backups">
        <h1 class="title-backups">Backup do Sistema</h1>
        <button @click="realizarBackup" class="btn-backup" :disabled="loading">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"/>
          </svg>
          {{ loading ? 'Realizando backup...' : 'Realizar Backup' }}
        </button>
      </div>

      <div class="backups-list">
        <h2>Backups Realizados</h2>
        <div v-if="loading" class="loading">Carregando backups...</div>
        
        <table v-else-if="backups.length" class="backups-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Tamanho</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="backup in backups" :key="backup.id">
              <td>{{ formatDate(backup.created_at) }}</td>
              <td>{{ formatSize(backup.size) }}</td>
              <td>
                <span :class="['status-badge', backup.status]">
                  {{ formatStatus(backup.status) }}
                </span>
              </td>
              <td class="actions">
                <button @click="downloadBackup(backup)" title="Download" class="btn-action">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                  </svg>
                </button>
                <button @click="restaurarBackup(backup)" title="Restaurar" class="btn-action">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M14 12c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zm-2-9c-4.97 0-9 4.03-9 9H0l4 4 4-4H5c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.51 0-2.91-.49-4.06-1.3l-1.42 1.44C8.04 20.3 9.94 21 12 21c4.97 0 9-4.03 9-9s-4.03-9-9-9z"/>
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-else class="no-backups">
          Nenhum backup encontrado.
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import TheSidebar from '@/components/TheSidebar.vue';
import { supabase } from '@/lib/supabase';

export default {
  name: 'BackupsView',
  components: { TheSidebar },
  setup() {
    const loading = ref(false);
    const backups = ref([]);
    const isSidebarExpanded = ref(true);

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

    const realizarBackup = async () => {
      // Implementar lógica de backup
    };

    const downloadBackup = async (backup) => {
      // Implementar download
    };

    const restaurarBackup = async (backup) => {
      // Implementar restauração
    };

    onMounted(() => {
      loadBackups();
    });

    return {
      loading,
      backups,
      isSidebarExpanded,
      handleSidebarToggle,
      formatDate,
      formatSize,
      formatStatus,
      realizarBackup,
      downloadBackup,
      restaurarBackup
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

.loading,
.no-backups {
  text-align: center;
  padding: 2rem;
  color: #666;
}
</style>