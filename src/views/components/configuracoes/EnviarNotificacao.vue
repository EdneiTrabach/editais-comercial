<template>
  <div class="modal-cfg-usuarios">
    <div class="modal-content-cfg-usuarios">
      <h2 class="modal-title-cfg-usuarios">Enviar Notificação</h2>
      <form @submit.prevent="$emit('send')" class="form-cfg-usuarios">
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
                @change="$emit('toggle-all', $event)" 
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
                  @change="$emit('toggle-user', user.id)" 
                />
                <span class="recipient-name">{{ user.nome || user.email }}</span>
                <span class="recipient-email">{{ user.email }}</span>
              </label>
            </div>
          </div>
        </div>
        
        <div class="modal-actions-cfg-usuarios">
          <button type="button" @click="$emit('close')" class="btn-cancel-cfg-usuarios">
            Cancelar
          </button>
          <button type="submit" class="btn-confirm-cfg-usuarios" :disabled="loading || selectedUserIds.length === 0">
            {{ loading ? 'Enviando...' : 'Enviar Notificação' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'EnviarNotificacao',
  props: {
    notificationForm: Object,
    selectedUserIds: Array,
    users: Array,
    loading: Boolean
  },
  emits: ['close', 'send', 'toggle-all', 'toggle-user']
}
</script>

<style scoped>
.label-cfg-usuarios {
  font-weight: 500;
  font-size: 0.95rem;
  color: #374151;
  margin-bottom: 0.25rem;
}

.recipient-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.recipient-name {
  font-weight: 500;
}

.recipient-email {
  font-size: 13px;
  color: #64748b;
}

[data-theme="dark"] .label-cfg-usuarios {
  color: #e5e7eb;
}

[data-theme="dark"] .recipient-email {
  color: #94a3b8;
}

/* O restante dos estilos já está definido no CSS global */
</style>
