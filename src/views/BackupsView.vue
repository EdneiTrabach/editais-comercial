<template>
  <div class="layout-backups">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />
    
    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <div class="header-backups">
        <div class="title-section">
          <h1 class="title-backups">Backup do Sistema</h1>
          <p class="subtitle-backups">Gerencie os backups do sistema e restaure dados quando necessário. Recomendamos realizar backups periódicos para garantir a segurança dos seus dados.</p>
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

      <!-- Barra de progresso de backup -->
      <div v-if="showProgressBar" class="backup-progress-container">
        <div class="backup-progress-info">
          <div>
            <div class="backup-progress-status" :class="backupStatus">
              <span v-if="backupStatus === 'running'">Backup em Andamento</span>
              <span v-else-if="backupStatus === 'success'">Backup Concluído</span>
              <span v-else-if="backupStatus === 'error'">Erro no Backup</span>
            </div>
            <div class="backup-progress-message">{{ backupMessage }}</div>
          </div>
          <div class="backup-progress-percentage">{{ backupProgress }}%</div>
        </div>
        
        <div class="backup-progress-bar">
          <div 
            class="backup-progress-fill" 
            :style="{ width: `${backupProgress}%` }"
            :class="backupStatus"
          ></div>
        </div>
        
        <!-- Log de execução do backup -->
        <div class="backup-execution-log">
          <div class="log-header">
            <h4>Log de Execução</h4>
            <button class="btn-toggle-log" @click="showExecutionLog = !showExecutionLog">
              {{ showExecutionLog ? 'Ocultar' : 'Mostrar' }} Log
            </button>
          </div>
          <div v-if="showExecutionLog" class="log-content">
            <div v-for="(log, index) in lastExecutionLogs" :key="index" class="log-line">
              {{ log }}
            </div>
          </div>
        </div>
      </div>

      <!-- Card de status do backup agendado hoje -->
      <div class="backup-scheduled-status">
        <div class="status-card" :class="statusAgendamentoHoje.status">
          <div class="status-icon">
            <svg v-if="statusAgendamentoHoje.executado && statusAgendamentoHoje.status === 'completed'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <svg v-else-if="statusAgendamentoHoje.executado && statusAgendamentoHoje.status === 'failed'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <svg v-else-if="statusAgendamentoHoje.executado && statusAgendamentoHoje.status === 'in_progress'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
            <svg v-else-if="!statusAgendamentoHoje.executado && statusAgendamentoHoje.programado" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          </div>
          <div class="status-content">
            <div class="status-title">
              <strong>Backup Agendado - Hoje</strong>
            </div>
            <div class="status-details">
              {{ statusAgendamentoHoje.mensagem }}
              <span v-if="statusAgendamentoHoje.horario" class="status-horario">
                ({{ statusAgendamentoHoje.horario }})
              </span>
            </div>
          </div>
          <div class="status-action">
            <button 
              v-if="!statusAgendamentoHoje.executado" 
              @click="realizarBackupManual" 
              class="btn-secondary"
              :disabled="backupEmProgresso"
            >
              Executar Agora
            </button>
            <button 
              v-else-if="statusAgendamentoHoje.status === 'failed'" 
              @click="realizarBackupManual" 
              class="btn-secondary"
              :disabled="backupEmProgresso"
            >
              Tentar Novamente
            </button>
          </div>
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
          
          <p v-if="ultimoBackup && ultimoBackup.status === 'completed'" style="margin-top: 0.75rem; font-size: 0.875rem; color: #4CAF50;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="vertical-align: middle; margin-right: 0.25rem;">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            Seus dados estão protegidos
          </p>
          
          <p v-if="ultimoBackup && ultimoBackup.status === 'failed'" style="margin-top: 0.75rem; font-size: 0.875rem; color: #C62828;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="vertical-align: middle; margin-right: 0.25rem;">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            Recomendamos realizar um novo backup
          </p>
          
          <p v-if="dataProximoBackup" style="margin-top: 0.75rem; font-size: 0.875rem; color: #666;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="vertical-align: middle; margin-right: 0.25rem;">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
            </svg>
            Próximo backup automático: {{ dataProximoBackup }}
          </p>
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
          <div class="stat-item">
            <span class="stat-value">{{ backupsUltimos30Dias }}</span>
            <span class="stat-label">Últimos 30 dias</span>
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
        
        <div v-else-if="backupsFiltrados.length" class="backups-table-wrapper">
          <table class="backups-table">
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
                <td>
                  <span v-if="backup.tipo === 'auto'" title="Backup automático agendado pelo sistema">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="#666" style="vertical-align: middle; margin-right: 0.25rem;">
                      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                    </svg>
                    Automático
                  </span>
                  <span v-else title="Backup iniciado manualmente por um usuário">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="#666" style="vertical-align: middle; margin-right: 0.25rem;">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                    Manual
                  </span>
                </td>
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
        </div>
        
        <div v-else-if="backups.length === 0 && !loading" class="empty-state setup-required">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="#f39c12">
            <path d="M11 15h2v2h-2v-2zm0-8h2v6h-2V7zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
          </svg>
          <h3>Configuração de backup necessária</h3>
          <p>As tabelas de backup não foram encontradas no banco de dados.</p>
          <div class="setup-instructions">
            <p>Para configurar o sistema de backups:</p>
            <ol>
              <li>Acesse o painel administrativo do Supabase</li>
              <li>Vá para a seção SQL</li>
              <li>Execute o script SQL fornecido no arquivo <code>database/scripts/create_backup_tables.sql</code></li>
              <li>Volte para esta página e atualize</li>
            </ol>
          </div>
        </div>
        
        <div v-else class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="#ccc">
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
          </svg>
          <p>Nenhum backup encontrado para os filtros selecionados</p>
          <button @click="realizarBackupManual" class="btn-primary">Realizar Backup Manual</button>
        </div>
      </div>

      <!-- Nova seção para agendamento de backups -->
      <div class="backups-section">
        <div class="section-header">
          <h2>Configuração de Backups Automáticos</h2>
          <button @click="salvarAgendamentoBackup" class="btn-primary">
            Salvar Configurações
          </button>
        </div>
        
        <div class="agendamento-form">
          <div class="form-row">
            <div class="form-group">
              <label for="frequencia">Frequência</label>
              <select 
                id="frequencia" 
                v-model="agendamentoBackup.frequencia" 
                class="select-filter"
              >
                <option 
                  v-for="frequencia in frequencias" 
                  :key="frequencia.value" 
                  :value="frequencia.value"
                >
                  {{ frequencia.label }}
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="horario">Horário</label>
              <input 
                id="horario" 
                type="time" 
                v-model="agendamentoBackup.horario" 
                class="date-filter"
              >
            </div>
          </div>
          
          <div class="form-row" v-if="agendamentoBackup.frequencia === 'semanal'">
            <div class="form-group full-width">
              <label>Dias da Semana</label>
              <div class="checkbox-group">
                <label 
                  v-for="dia in diasSemanaOptions" 
                  :key="dia.value" 
                  class="checkbox-label"
                >
                  <input 
                    type="checkbox" 
                    :value="dia.value" 
                    v-model="agendamentoBackup.diasSemana"
                  >
                  {{ dia.label }}
                </label>
              </div>
            </div>
          </div>
          
          <div class="form-row" v-if="agendamentoBackup.frequencia === 'mensal'">
            <div class="form-group">
              <label for="diaMes">Dia do Mês</label>
              <input 
                id="diaMes" 
                type="number" 
                v-model="agendamentoBackup.diaMes" 
                min="1" 
                max="28" 
                class="date-filter"
              >
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="toggle-label">
                <input 
                  type="checkbox" 
                  v-model="agendamentoBackup.ativo"
                >
                <span class="toggle-switch"></span>
                <span class="toggle-text">
                  Backups Automáticos {{ agendamentoBackup.ativo ? 'Ativados' : 'Desativados' }}
                </span>
              </label>
            </div>
          </div>
          
          <div class="info-box">
            <p>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="vertical-align: middle; margin-right: 0.25rem;">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
              Os backups automáticos serão armazenados de forma segura e podem ser restaurados quando necessário.
              Recomendamos manter esta função ativada para garantir a segurança dos seus dados.
            </p>
          </div>
          
          <!-- Adicionar botão para verificar o status atualizado -->
          <div class="form-row" style="margin-top: 1rem">
            <button @click="atualizarStatusAgendamento" class="btn-secondary">
              Verificar Status do Agendamento
            </button>
            <span v-if="statusAgendamentoHoje && statusAgendamentoHoje.horario" style="margin-left: 1rem; align-self: center">
              Horário configurado: {{ statusAgendamentoHoje.horario }}
            </span>
          </div>
        </div>
        
        <!-- Adicionando o componente de informações de agendamento -->
        <AgendamentoInfo />
      </div>

      <!-- Nova seção para visualização de estatísticas -->
      <div class="backups-section">
        <div class="section-header">
          <h2>Estatísticas de Backup</h2>
        </div>
        
        <div class="backup-stats-container">
          <div class="stats-summary">
            <div class="stat-card">
              <div class="stat-icon success">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div class="stat-value success">{{ backupStatistics.success }}</div>
              <div class="stat-label">Backups Concluídos</div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon error">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
              </div>
              <div class="stat-value error">{{ backupStatistics.failed }}</div>
              <div class="stat-label">Backups Falhos</div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                </svg>
              </div>
              <div class="stat-value">{{ backupStatistics.byMonth.reduce((acc, item) => acc + (item.completed || 0) + (item.failed || 0) + (item.in_progress || 0), 0) }}</div>
              <div class="stat-label">Total de Backups</div>
            </div>
          </div>
          
          <!-- Gráfico de barras horizontal para backups por mês -->
          <div class="stats-chart">
            <h3>Histórico de Backups (Últimos 6 meses)</h3>
            
            <div v-if="backupStatistics.byMonth.length === 0" class="no-data-message">
              Não há dados suficientes para mostrar o histórico.
            </div>
            
            <div v-else class="bar-chart">
              <div v-for="(item, index) in backupStatistics.byMonth" :key="index" class="chart-row">
                <div class="chart-label">{{ item.month }}</div>
                <div class="chart-bars">
                  <div class="chart-bar-container">
                    <div 
                      class="chart-bar success" 
                      :style="{ width: `${(item.completed / getMaxCount()) * 100}%` }"
                      :title="`${item.completed} backups concluídos`"
                    ></div>
                    <span class="chart-value">{{ item.completed }}</span>
                  </div>
                  <div class="chart-bar-container">
                    <div 
                      class="chart-bar error" 
                      :style="{ width: `${(item.failed / getMaxCount()) * 100}%` }"
                      :title="`${item.failed} backups falhos`"
                    ></div>
                    <span class="chart-value">{{ item.failed }}</span>
                  </div>
                </div>
              </div>
              
              <div class="chart-legend">
                <div class="legend-item">
                  <div class="legend-color success"></div>
                  <span>Concluídos</span>
                </div>
                <div class="legend-item">
                  <div class="legend-color error"></div>
                  <span>Falhos</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="backups-section">
        <div class="section-header">
          <h2>Sobre os Backups</h2>
        </div>
        
        <div class="backup-info">
          <h3>Dados Incluídos nos Backups</h3>
          <p>Os backups incluem todas as informações críticas do sistema, organizadas nas seguintes categorias:</p>
          
          <div class="backup-categories">
            <div class="category">
              <h4>Usuários e Acesso</h4>
              <ul>
                <li>Perfis de usuários</li>
                <li>Informações de conta</li>
              </ul>
            </div>
            
            <div class="category">
              <h4>Empresas e Relacionamentos</h4>
              <ul>
                <li>Dados de empresas</li>
                <li>Representantes</li>
                <li>Plataformas e credenciais</li>
              </ul>
            </div>
            
            <div class="category">
              <h4>Editais e Processos</h4>
              <ul>
                <li>Editais cadastrados</li>
                <li>Responsáveis por processos</li>
                <li>Dados de reuniões</li>
              </ul>
            </div>
            
            <div class="category">
              <h4>Estrutura Organizacional</h4>
              <ul>
                <li>Setores</li>
                <li>Sistemas</li>
              </ul>
            </div>
            
            <div class="category">
              <h4>Sistema e Notificações</h4>
              <ul>
                <li>Configurações</li>
                <li>Análises de IA</li>
                <li>Histórico de notificações</li>
                <li>Atualizações do sistema</li>
              </ul>
            </div>
          </div>
          
          <div class="info-box">
            <p>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="vertical-align: middle; margin-right: 0.25rem;">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
              Os arquivos de backup gerados não incluem anexos ou documentos armazenados no sistema. Para um backup completo, faça também o backup dos arquivos armazenados separadamente.
            </p>
          </div>
        </div>
      </div>

      <!-- Adicionando o componente de informações sobre os backups em ZIP -->
      <div class="backups-section">
        <div class="section-header">
          <h2>Como Utilizar os Backups</h2>
        </div>
        
        <BackupHelp />
      </div>

      <!-- Modal de Confirmação -->
      <div v-if="showConfirmModal" class="modal-overlay">
        <div class="modal-content">
          <h3>Confirmar Restauração</h3>
          <p class="warning-text">
            Atenção! Esta ação irá substituir todos os dados atuais pelos dados do backup selecionado.
            Esta ação não pode ser desfeita.
          </p>
          <p style="margin-bottom: 1.5rem; font-size: 0.875rem;">
            <strong>Data do backup:</strong> {{ backupSelecionado ? formatDate(backupSelecionado.created_at) : '' }}<br>
            <strong>Tamanho:</strong> {{ backupSelecionado ? formatSize(backupSelecionado.size) : '' }}
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
import { ref } from 'vue'
import { useBackups } from '@/composables/useBackups'
import TheSidebar from '@/components/TheSidebar.vue'
import AgendamentoInfo from '@/components/backup/AgendamentoInfo.vue'
import BackupHelp from '@/components/backup/BackupHelp.vue'

export default {
  name: 'BackupsView',
  components: { 
    TheSidebar, 
    AgendamentoInfo,
    BackupHelp
  },
  setup() {
    const showExecutionLog = ref(false)
    
    const getMaxCount = () => {
      const backupData = useBackups().backupStatistics.value.byMonth
      if (!backupData || backupData.length === 0) return 1
      
      let max = 0
      backupData.forEach(item => {
        const total = (item.completed || 0) + (item.failed || 0)
        if (total > max) max = total
      })
      
      return max === 0 ? 1 : max
    }
    
    return {
      ...useBackups(),
      showExecutionLog,
      getMaxCount
    }
  },
  beforeUnmount() {
    // Parar o monitoramento ao sair da página
    this.pararMonitoramentoAgendamento()
  }
}
</script>

<style src="@/styles/backups.css" scoped></style>