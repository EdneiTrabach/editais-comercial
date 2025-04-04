<template>
  <div v-if="show" class="system-update-modal">
    <div class="modal-content">
      <h2>Atualizações do Sistema</h2>
      
      <div v-if="updates && updates.length > 0" class="updates-list">
        <div 
          v-for="update in updates" 
          :key="update.id" 
          class="update-item"
        >
          <h3>{{ update.title }}</h3>
          <div class="update-date">{{ formatDate(update.created_at) }}</div>
          <div class="update-content" v-html="update.content"></div>
        </div>
      </div>
      <div v-else class="no-updates">
        Não há atualizações disponíveis no momento.
      </div>
      
      <div class="modal-actions">
        <button 
          @click="confirmRead" 
          class="btn-primary"
        >
          Confirmar Leitura
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SystemUpdateModal',
  
  props: {
    show: {
      type: Boolean,
      default: false
    },
    updates: {
      type: Array,
      default: () => []
    },
    isForced: {
      type: Boolean,
      default: false
    }
  },
  
  methods: {
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    
    confirmRead() {
      // Marcar todas as atualizações como lidas
      if (this.updates && this.updates.length > 0) {
        // Salvar o ID da última atualização no localStorage
        localStorage.setItem('lastReadUpdateId', this.updates[0].id);
        
        // Emitir evento para o componente pai
        this.$emit('mark-read', this.updates);
        
        // Fechar o modal
        this.$emit('close');
      }
    }
  }
}
</script>

<style scoped>
.system-update-modal {
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  width: 80%;
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

h2 {
  margin-top: 0;
  color: #2c3e50;
  border-bottom: 1px solid #eee;
  padding-bottom: 1rem;
}

.updates-list {
  margin-bottom: 1.5rem;
}

.update-item {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
}

.update-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.update-date {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.update-content {
  line-height: 1.6;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.btn-primary {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: #45a049;
}

.no-updates {
  text-align: center;
  padding: 2rem 0;
  color: #666;
}
</style>