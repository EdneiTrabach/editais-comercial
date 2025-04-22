<template>
  <div class="modal-backdrop">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Enviar Notificação</h2>
        <button @click="$emit('close')" class="close-btn">&times;</button>
      </div>
      
      <div class="modal-body">
        <form @submit.prevent="$emit('send')">
          <div class="form-group">
            <label for="title">Título:</label>
            <input
              id="title"
              v-model="notificationForm.title"
              type="text"
              required
              placeholder="Título da notificação"
            />
          </div>
          
          <div class="form-group">
            <label for="message">Mensagem:</label>
            <textarea
              id="message"
              v-model="notificationForm.message"
              required
              placeholder="Conteúdo da notificação"
              rows="4"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label for="nivel">Nível de importância:</label>
            <select id="nivel" v-model="notificationForm.nivel">
              <option value="baixo">Baixo</option>
              <option value="medio">Médio</option>
              <option value="alto">Alto</option>
              <option value="critico">Crítico</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Destinatários:</label>
            <div class="user-select-options">
              <div class="user-select-all">
                <input
                  type="checkbox"
                  id="selectAll"
                  :checked="users.length > 0 && selectedUserIds.length === users.filter(u => u.status === 'ACTIVE').length"
                  @change="$emit('toggle-all', $event)"
                />
                <label for="selectAll">Selecionar todos</label>
              </div>
              
              <div class="user-list">
                <div 
                  v-for="user in users.filter(u => u.status === 'ACTIVE')" 
                  :key="user.id"
                  class="user-item"
                >
                  <input
                    type="checkbox"
                    :id="`user-${user.id}`"
                    :checked="selectedUserIds.includes(user.id)"
                    @change="$emit('toggle-user', user.id)"
                  />
                  <label :for="`user-${user.id}`">
                    {{ user.nome || user.email }}
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <div class="form-buttons">
            <button 
              type="button" 
              class="btn-secondary" 
              @click="$emit('close')"
              :disabled="loading"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              class="btn-primary" 
              :disabled="loading || !formValid"
            >
              <span v-if="loading">Enviando...</span>
              <span v-else>Enviar Notificação</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';

export default {
  props: {
    notificationForm: {
      type: Object,
      required: true
    },
    selectedUserIds: {
      type: Array,
      required: true
    },
    users: {
      type: Array,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'send', 'toggle-all', 'toggle-user'],
  setup(props) {
    const formValid = computed(() => {
      return props.notificationForm.title && 
             props.notificationForm.message &&
             props.selectedUserIds.length > 0;
    });

    return { formValid };
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e1e1e1;
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.user-select-options {
  margin-top: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px;
}

.user-select-all {
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.user-list {
  max-height: 200px;
  overflow-y: auto;
}

.user-item {
  margin-bottom: 4px;
  display: flex;
  align-items: center;
}

.user-item input {
  margin-right: 8px;
}

.form-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>