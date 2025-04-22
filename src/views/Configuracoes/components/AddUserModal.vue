<template>
  <div class="modal-backdrop">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Adicionar Novo Usuário</h2>
        <button @click="$emit('close')" class="close-btn">&times;</button>
      </div>
      
      <div class="modal-body">
        <form @submit.prevent="$emit('add-user')">
          <div class="form-group">
            <label for="email">Email:</label>
            <input
              id="email"
              v-model="newUser.email"
              type="email"
              required
              placeholder="Email do usuário"
            />
          </div>
          
          <div class="form-group">
            <label for="nome">Nome:</label>
            <input
              id="nome"
              v-model="newUser.nome"
              type="text"
              required
              placeholder="Nome completo"
            />
          </div>
          
          <div class="form-group">
            <label for="password">Senha:</label>
            <input
              id="password"
              v-model="newUser.password"
              type="password"
              required
              placeholder="Senha provisória"
            />
          </div>
          
          <div class="form-group">
            <label for="role">Função:</label>
            <select id="role" v-model="newUser.role">
              <option value="user">Usuário</option>
              <option value="admin">Administrador</option>
            </select>
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
              <span v-if="loading">Criando...</span>
              <span v-else>Criar Usuário</span>
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
    newUser: {
      type: Object,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'add-user'],
  setup(props) {
    const formValid = computed(() => {
      return props.newUser.email && 
             props.newUser.nome && 
             props.newUser.password &&
             props.newUser.role;
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
  max-width: 500px;
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
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
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