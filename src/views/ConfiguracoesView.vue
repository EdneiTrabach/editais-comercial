<template>
  <div class="layout-cfg-usuarios">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />
    
    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <div class="header-cfg-usuarios">
        <h1 class="title-cfg-usuarios">Configurações do Sistema</h1>
      </div>

      <!-- Tela inicial com cards de navegação -->
      <div v-if="activeTab === 'home'" class="cards-navigation">
        <div class="nav-card-row">
          <div class="nav-card" @click="activeTab = 'users'">
            <div class="nav-card-icon">
              <!-- SVG de usuários em vez do Font Awesome -->
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <h3 class="nav-card-title">Administração de Usuários</h3>
            <p class="nav-card-description">
              Gerencie usuários do sistema, defina permissões, ative ou desative contas e envie notificações.
            </p>
            <button class="nav-card-button">Acessar</button>
          </div>

          <div class="nav-card" @click="openSendNotificationModal">
            <div class="nav-card-icon">
              <!-- SVG de usuários em vez do Font Awesome -->
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
              </svg>
            </div>
            <h3 class="nav-card-title">Enviar Notificação </h3>
            <p class="nav-card-description">
              Envie notificações para usuários do sistema, alertas e informações importantes.
            </p>
            <button class="nav-card-button">Acessar</button>
          </div>

          <div class="nav-card" @click="activeTab = 'updates'">
            <div class="nav-card-icon">
              <!-- SVG de atualização em vez do Font Awesome -->
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
              </svg>
            </div>
            <h3 class="nav-card-title">Atualizações do Sistema</h3>
            <p class="nav-card-description">
              Registre e acompanhe atualizações do sistema, novas funcionalidades e correções de problemas.
            </p>
            <button class="nav-card-button">Acessar</button>
          </div>

          <div class="nav-card" @click="router.push('/backups')">
            <div class="nav-card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
              </svg>
            </div>
            <h3 class="nav-card-title">Backup do Sistema</h3>
            <p class="nav-card-description">
              Gerencie backups do sistema, realize download dos dados e restaure backups anteriores.
            </p>
            <button class="nav-card-button">Acessar</button>
          </div>
        </div>
      </div>

      <!-- Conteúdo da aba de usuários -->
      <div v-if="activeTab === 'users'">
        <div class="section-header">
          <h2 class="section-title">Administração de Usuários</h2>
          <div class="section-actions">
            <button @click="showAddUserModal = true" class="btn-add-cfg-usuarios">
              <!-- SVG de adição -->
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="white">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              Novo Usuário
            </button>
          </div>
          <button @click="activeTab = 'home'" class="btn-back">
            <!-- SVG de seta para esquerda -->
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
            Voltar
          </button>
        </div>
        
        <div class="table-container-cfg-usuarios">
          <div v-if="loading" class="loading-cfg-usuarios">Carregando usuários...</div>
          
          <table v-else class="excel-table-cfg-usuarios">
            <thead class="thead-cfg-usuarios">
              <tr class="tr-head-cfg-usuarios">
                <th class="th-cfg-usuarios">Nome</th>
                <th class="th-cfg-usuarios">Email</th>
                <th class="th-cfg-usuarios">Função</th>
                <th class="th-cfg-usuarios">Status</th>
                <th class="th-cfg-usuarios">Criado em</th>
                <th class="th-cfg-usuarios">Ações</th>
              </tr>
            </thead>
            <tbody class="tbody-cfg-usuarios">
              <tr v-for="user in users" :key="user.id" class="tr-body-cfg-usuarios">
                <td class="td-cfg-usuarios">
                  <input 
                    :value="user.nome || ''"
                    @blur="handleNameUpdate(user, $event.target.value)"
                    type="text"
                    placeholder="Digite o nome"
                    class="name-input-cfg-usuarios"
                  />
                </td>
                <td class="td-cfg-usuarios">
                  <input 
                    :value="user.email || ''"
                    @blur="handleEmailUpdate(user, $event.target.value)"
                    type="email"
                    placeholder="Digite o email"
                    class="email-input-cfg-usuarios"
                    :disabled="user.id === currentUser?.id"
                  />
                </td>
                <td class="td-cfg-usuarios">
                  <select 
                    :value="user.role"
                    @change="handleRoleChange(user, $event.target.value)"
                    :disabled="user.id === currentUser?.id"
                    class="role-select-cfg-usuarios"
                  >
                    <option value="user" class="option-cfg-usuarios">Usuário</option>
                    <option value="admin" class="option-cfg-usuarios">Administrador</option>
                  </select>
                </td>
                <td class="td-cfg-usuarios status-cell-cfg-usuarios">
                  <div class="status-controls-cfg-usuarios">
                    <span :class="['status-badge-cfg-usuarios', user.status?.toLowerCase()]">
                      {{ formatStatus(user.status) }}
                    </span>
                    <button 
                      @click="toggleUserStatus(user)"
                      class="btn-toggle-cfg-usuarios"
                      :disabled="user.id === currentUser?.id"
                      :title="user.status === 'ACTIVE' ? 'Desativar usuário' : 'Ativar usuário'"
                    >
                      <img 
                        :src="user.status === 'ACTIVE' ? '/icons/disable.svg' : '/icons/enable.svg'" 
                        :alt="user.status === 'ACTIVE' ? 'Desativar' : 'Ativar'" 
                        class="icon-status-cfg-usuarios"
                      />
                    </button>
                  </div>
                </td>
                <td class="td-cfg-usuarios">{{ formatDate(user.created_at) }}</td>
                <td class="td-actions-cfg-usuarios">
                  <div class="actions-container-cfg-usuarios">
                    <button 
                      @click="resetPassword(user)" 
                      class="btn-action-cfg-usuarios btn-reset-cfg-usuarios"
                      :title="'Redefinir senha'"
                    >
                      <img src="../../public/icons/senha.svg" alt="Redefinir senha" class="icon-action-cfg-usuarios" />
                    </button>
                    <button 
                      @click="deleteUser(user)" 
                      class="btn-action-cfg-usuarios btn-delete-cfg-usuarios"
                      :disabled="user.id === currentUser?.id"
                    >
                      <img src="../../public/icons/lixeira.svg" alt="Excluir" class="icon-delete-cfg-usuarios" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Conteúdo da aba de atualizações do sistema -->
      <div v-if="activeTab === 'updates'">
        <div class="section-header">
          <h2 class="section-title">Atualizações do Sistema</h2>
          <button @click="showNewUpdateForm = true" class="btn-add-cfg-usuarios">
            <!-- SVG de adição -->
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="white">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Nova Atualização
          </button>
          <button @click="activeTab = 'home'" class="btn-back">
            <!-- SVG de seta para esquerda -->
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
            Voltar
          </button>
        </div>
        
        <div v-if="systemUpdates.length > 0" class="updates-table">
          <table>
            <thead>
              <tr>
                <th>Título</th>
                <th>Versão</th>
                <th>Data</th>
                <th>Importância</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="update in systemUpdates" :key="update.id">
                <td>{{ update.title }}</td>
                <td>{{ update.version || '-' }}</td>
                <td>{{ formatDate(update.release_date) }}</td>
                <td>{{ update.importance === 'alta' ? 'Alta' : 
                       update.importance === 'media' ? 'Média' : 'Baixa' }}</td>
                <td>
                  <button @click="previewUpdate(update)" class="btn-small">
                    Visualizar
                  </button>
                  <button @click="editUpdate(update)" class="btn-small">
                    Editar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div v-else class="no-updates">
          <p>Nenhuma atualização cadastrada.</p>
        </div>
        
        <!-- Modal para adicionar/editar atualização -->
        <div v-if="showNewUpdateForm" class="modal-backdrop">
          <div class="modal">
            <h3>{{ editingUpdate ? 'Editar' : 'Nova' }} Atualização</h3>
            
            <form @submit.prevent="saveUpdate">
              <div class="form-group">
                <label>Título</label>
                <input v-model="updateForm.title" required />
              </div>
              
              <div class="form-group">
                <label>Versão</label>
                <input v-model="updateForm.version" placeholder="Ex: 1.0.0" />
              </div>
              
              <div class="form-group">
                <label>Importância</label>
                <select v-model="updateForm.importance">
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
              
              <div class="form-group">
                <label>Descrição (suporta formatação básica)</label>
                <textarea 
                  v-model="updateForm.description" 
                  rows="10" 
                  required
                  placeholder="Descreva as novidades. Use ** para negrito, * para itálico e [texto](url) para links."
                ></textarea>
              </div>
              
              <div class="form-actions">
                <button type="button" @click="showNewUpdateForm = false">
                  Cancelar
                </button>
                <button type="submit" :disabled="loading">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <!-- Modal de preview -->
        <SystemUpdateModal 
          v-if="previewingUpdate"
          :show="!!previewingUpdate"
          :updates="[previewingUpdate]"
          @close="previewingUpdate = null"
          @mark-read="() => previewingUpdate = null"
        />
      </div>
    </div>

    <!-- Modal Adicionar Usuário -->
    <div v-if="showAddUserModal" class="modal-cfg-usuarios">
      <div class="modal-content-cfg-usuarios">
        <h2 class="modal-title-cfg-usuarios">Adicionar Novo Usuário</h2>
        <form @submit.prevent="handleAddUser" class="form-cfg-usuarios">
          <div class="form-group-cfg-usuarios">
            <label class="label-cfg-usuarios">Email</label>
            <input 
              v-model="newUser.email" 
              type="email" 
              required 
              class="input-cfg-usuarios"
            />
          </div>
          <div class="form-group-cfg-usuarios">
            <label class="label-cfg-usuarios">Senha</label>
            <input 
              v-model="newUser.password" 
              type="password" 
              required 
              minlength="6"
              class="input-cfg-usuarios"
            />
          </div>
          <div class="form-group-cfg-usuarios">
            <label class="label-cfg-usuarios">Nome</label>
            <input 
              v-model="newUser.nome" 
              type="text" 
              required 
              class="input-cfg-usuarios"
            />
          </div>
          <div class="form-group-cfg-usuarios">
            <label class="label-cfg-usuarios">Função</label>
            <select v-model="newUser.role" class="select-cfg-usuarios">
              <option value="user" class="option-cfg-usuarios">Usuário</option>
              <option value="admin" class="option-cfg-usuarios">Administrador</option>
            </select>
          </div>
          <div class="modal-actions-cfg-usuarios">
            <button type="button" @click="showAddUserModal = false" class="btn-cancel-cfg-usuarios">
              Cancelar
            </button>
            <button type="submit" class="btn-confirm-cfg-usuarios" :disabled="loading">
              {{ loading ? 'Criando...' : 'Criar Usuário' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Confirm Dialog -->
    <div v-if="showConfirmDialog" class="dialog-overlay-cfg-usuarios">
      <div class="confirm-dialog-cfg-usuarios">
        <div class="confirm-content-cfg-usuarios">
          <h3 class="dialog-title-cfg-usuarios">{{ dialogConfig.title }}</h3>
          <p class="dialog-message-cfg-usuarios">{{ dialogConfig.message }}</p>
          <p v-if="dialogConfig.warning" class="warning-text-cfg-usuarios">
            {{ dialogConfig.warning }}
          </p>
          <div class="confirm-actions-cfg-usuarios">
            <button class="btn-secondary-cfg-usuarios" @click="hideConfirmDialog">
              Cancelar
            </button>
            <button 
              class="btn-danger-cfg-usuarios" 
              @click="dialogConfig.onConfirm"
            >
              {{ dialogConfig.confirmText || 'Confirmar' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Acesso Negado -->
    <div v-if="showAccessDeniedModal" class="dialog-overlay-cfg-usuarios">
      <div class="confirm-dialog-cfg-usuarios">
        <div class="confirm-content-cfg-usuarios">
          <h3 class="dialog-title-cfg-usuarios">Acesso Restrito</h3>
          <p class="dialog-message-cfg-usuarios">
            Olá, {{currentUserEmail}}
          </p>
          <p class="warning-text-cfg-usuarios">
            Você não tem permissão para acessar esta área. Esta seção é restrita apenas a administradores do sistema.
          </p>
          <div class="confirm-actions-cfg-usuarios">
            <button 
              class="btn-primary-cfg-usuarios" 
              @click="redirectToHome"
            >
              Voltar para o início
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Enviar Notificação -->
    <div v-if="showSendNotificationModal" class="modal-cfg-usuarios">
      <div class="modal-content-cfg-usuarios">
        <h2 class="modal-title-cfg-usuarios">Enviar Notificação</h2>
        <form @submit.prevent="sendNotification" class="form-cfg-usuarios">
          <div class="form-group-cfg-usuarios">
            <label class="label-cfg-usuarios">Título*</label>
            <input 
              v-model="notificationForm.title" 
              type="text" 
              required 
              class="input-cfg-usuarios"
              placeholder="Título da notificação"
            />
          </div>
          
          <div class="form-group-cfg-usuarios">
            <label class="label-cfg-usuarios">Mensagem*</label>
            <textarea 
              v-model="notificationForm.message" 
              required 
              class="input-cfg-usuarios"
              rows="4"
              placeholder="Mensagem da notificação"
            ></textarea>
          </div>
          
          <div class="form-group-cfg-usuarios">
            <label class="label-cfg-usuarios">Tipo</label>
            <select v-model="notificationForm.tipo" class="select-cfg-usuarios">
              <option value="usuario">Usuário</option>
              <option value="sistema">Sistema</option>
              <option value="alerta">Alerta</option>
              <option value="prazo">Prazo</option>
              <option value="impugnacao">Impugnação</option>
            </select>
          </div>
          
          <!-- Novo campo de nível de prioridade -->
          <div class="form-group-cfg-usuarios">
            <label class="label-cfg-usuarios">Nível de Prioridade</label>
            <select v-model="notificationForm.nivel" class="select-cfg-usuarios">
              <option value="muito_alto">Muito Alto</option>
              <option value="alto">Alto</option>
              <option value="medio" selected>Médio</option>
              <option value="leve">Leve</option>
            </select>
          </div>
          
          <div class="notification-recipients">
            <div class="recipients-header">
              <h3>Destinatários</h3>
              <label class="select-all-label">
                <input 
                  type="checkbox" 
                  @change="toggleSelectAllUsers" 
                  :checked="selectedUserIds.length === users.filter(u => u.status === 'ACTIVE').length"
                />
                Selecionar todos
              </label>
            </div>
            
            <div class="recipients-list">
              <div 
                v-for="user in users.filter(u => u.status === 'ACTIVE')" 
                :key="user.id" 
                class="recipient-item"
              >
                <label class="recipient-label">
                  <input 
                    type="checkbox" 
                    :checked="selectedUserIds.includes(user.id)" 
                    @change="toggleSelectUser(user.id)" 
                  />
                  <span class="recipient-name">{{ user.nome || user.email }}</span>
                  <span class="recipient-email">{{ user.email }}</span>
                </label>
              </div>
            </div>
          </div>
          
          <div class="modal-actions-cfg-usuarios">
            <button type="button" @click="showSendNotificationModal = false" class="btn-cancel-cfg-usuarios">
              Cancelar
            </button>
            <button type="submit" class="btn-confirm-cfg-usuarios" :disabled="loading || selectedUserIds.length === 0">
              {{ loading ? 'Enviando...' : 'Enviar Notificação' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Toast de feedback -->
    <div 
      v-if="showToast" 
      :class="['toast-cfg-usuarios', `toast-${toastConfig.type}`]"
    >
      {{ toastConfig.message }}
    </div>
  </div>
</template>

<script src="../views/ConfiguracoesView.js"></script>
<style src="../assets/styles/ConfiguracoesView.css"></style>