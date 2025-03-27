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
import { useBackups } from '@/composables/useBackups'
import TheSidebar from '@/components/TheSidebar.vue'

export default {
  name: 'BackupsView',
  components: { TheSidebar },
  setup() {
    return {
      ...useBackups()
    }
  }
}
</script>

<style src="@/styles/backups.css" scoped></style>