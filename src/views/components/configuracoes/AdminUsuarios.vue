<template>
  <div>
    <div class="section-header">
      <h2 class="section-title">Administração de Usuários</h2>
      <div class="section-actions">
        <button @click="$emit('add-user')" class="btn-add-cfg-usuarios">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="white">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          Novo Usuário
        </button>
      </div>
      <button @click="$emit('voltar')" class="btn-back">
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
                @blur="$emit('update-name', user, $event.target.value)"
                type="text"
                placeholder="Digite o nome"
                class="name-input-cfg-usuarios"
              />
            </td>
            <td class="td-cfg-usuarios">
              <input 
                :value="user.email || ''"
                @blur="$emit('update-email', user, $event.target.value)"
                type="email"
                placeholder="Digite o email"
                class="email-input-cfg-usuarios"
                :disabled="user.id === currentUser?.id"
              />
            </td>
            <td class="td-cfg-usuarios">
              <select 
                :value="user.role"
                @change="$emit('change-role', user, $event.target.value)"
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
                  @click="$emit('toggle-status', user)"
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
                  @click="$emit('reset-password', user)" 
                  class="btn-action-cfg-usuarios btn-reset-cfg-usuarios"
                  :title="'Redefinir senha'"
                >
                  <img src="/icons/senha.svg" alt="Redefinir senha" class="icon-action-cfg-usuarios" />
                </button>
                <button 
                  @click="$emit('delete-user', user)" 
                  class="btn-action-cfg-usuarios btn-delete-cfg-usuarios"
                  :disabled="user.id === currentUser?.id"
                >
                  <img src="/icons/lixeira.svg" alt="Excluir" class="icon-delete-cfg-usuarios" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminUsuarios',
  props: {
    users: Array,
    currentUser: Object,
    loading: Boolean
  },
  emits: [
    'voltar',
    'add-user',
    'update-name',
    'update-email',
    'change-role',
    'toggle-status',
    'reset-password',
    'delete-user'
  ],
  methods: {
    formatDate(date) {
      return new Date(date).toLocaleDateString("pt-BR");
    },
    formatStatus(status) {
      const statusMap = {
        ACTIVE: "Ativo",
        DISABLED: "Desativado",
        PENDING: "Pendente",
        DELETED: "Removido"
      };
      return statusMap[status] || status;
    }
  }
}
</script>

<style scoped>
/* Container da tabela */
.table-container-cfg-usuarios {
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: auto;
  background: white;
}

/* Carregando */
.loading-cfg-usuarios {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
  font-style: italic;
}

/* Tabela de usuários */
.excel-table-cfg-usuarios {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #e5e7eb;
}

/* Inputs e selects */
.name-input-cfg-usuarios,
.email-input-cfg-usuarios {
  width: 100%;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.3s ease;
  font-family: inherit;
  background: none;
  border: none;
}

.name-input-cfg-usuarios:focus,
.email-input-cfg-usuarios:focus {
  border-color: #193155;
  box-shadow: 0 0 0 3px rgba(25, 49, 85, 0.1);
  outline: none;
}

.email-input-cfg-usuarios:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.role-select-cfg-usuarios {
  width: 100%;
  padding: 0.9rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.9rem;
  color: #495057;
  background: #f8f9fa;
  cursor: pointer;
  transition: all 0.3s ease;
}

.role-select-cfg-usuarios:focus {
  outline: none;
  border-color: #193155;
  box-shadow: 0 0 0 3px rgba(25, 49, 85, 0.1);
  background: white;
}

.role-select-cfg-usuarios:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  background: #e9ecef;
}

/* Status e ações */
.status-cell-cfg-usuarios {
  padding: 0.5rem 1rem;
}

.status-controls-cfg-usuarios {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.status-badge-cfg-usuarios {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.75rem;
  border-radius: 50px;
  font-size: 0.85rem;
  font-weight: 500;
  text-transform: uppercase;
  min-width: 90px;
}

.status-badge-cfg-usuarios.active {
  background: #d4edda;
  color: #155724;
}

.status-badge-cfg-usuarios.disabled {
  background: #f8d7da;
  color: #721c24;
}

.status-badge-cfg-usuarios.pending {
  background: #fff3cd;
  color: #856404;
}

.status-badge-cfg-usuarios.deleted {
  background: #e2e8f0;
  color: #64748b;
}

.btn-toggle-cfg-usuarios {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.btn-toggle-cfg-usuarios:hover {
  background-color: #f3f4f6;
}

.btn-toggle-cfg-usuarios:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.icon-status-cfg-usuarios {
  width: 20px;
  height: 20px;
  transition: transform 0.3s ease;
}

.btn-toggle-cfg-usuarios:hover .icon-status-cfg-usuarios {
  transform: scale(1.1);
}

.actions-container-cfg-usuarios {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.btn-action-cfg-usuarios {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-reset-cfg-usuarios {
  background: #e0f2fe;
  color: #0369a1;
}

.btn-reset-cfg-usuarios:hover {
  background: #bae6fd;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(3, 105, 161, 0.15);
}

.btn-delete-cfg-usuarios {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fee2e2;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-delete-cfg-usuarios:hover:not(:disabled) {
  background: #fecaca;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(220, 38, 38, 0.15);
}

.btn-delete-cfg-usuarios:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.icon-action-cfg-usuarios,
.icon-delete-cfg-usuarios {
  width: 16px;
  height: 16px;
  transition: transform 0.2s ease;
}

.btn-reset-cfg-usuarios:hover .icon-action-cfg-usuarios,
.btn-delete-cfg-usuarios:hover .icon-delete-cfg-usuarios {
  transform: rotate(15deg);
}

/* Estilos para o cabeçalho da seção */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

.section-title {
  font-size: 1.8rem;
  font-weight: 600;
  color: #193155;
  margin: 0;
}

.section-actions {
  display: flex;
  gap: 1rem;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: transparent;
  color: #64748b;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-back:hover {
  background: #f8fafc;
  color: #193155;
}

.btn-add-cfg-usuarios {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #193155 0%, #254677 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(25, 49, 85, 0.12);
}

.btn-add-cfg-usuarios:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(25, 49, 85, 0.2);
}

/* Tema escuro */
[data-theme="dark"] .table-container-cfg-usuarios {
  background: #1e293b;
}

[data-theme="dark"] .excel-table-cfg-usuarios {
  border-color: #2d3748;
}

[data-theme="dark"] .section-title {
  color: #f9fafb;
}

[data-theme="dark"] .section-header {
  border-bottom-color: #2d3748;
}

[data-theme="dark"] .btn-back {
  border-color: #2d3748;
  color: #cbd5e1;
}

[data-theme="dark"] .btn-back:hover {
  background: #0f172a;
  color: #f1f5f9;
}

/* Responsividade */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .section-actions {
    flex-wrap: wrap;
    width: 100%;
  }
  
  .btn-back {
    margin-top: 1rem;
  }
}
</style>
