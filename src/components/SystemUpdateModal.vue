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
          <div class="update-header" @click="toggleExpand(update.id)">
            <h3>{{ update.title }}</h3>
            <button class="toggle-btn">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                stroke-width="2" 
                stroke-linecap="round" 
                stroke-linejoin="round"
                :class="{ 'rotate-180': expandedItems.includes(update.id) }"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>
          
          <div v-show="expandedItems.includes(update.id)" class="update-details">
            <div class="update-date">{{ formatDate(update.release_date) }}</div>
            <div class="update-content" v-html="formatarDescricao(update.description)"></div>
            <div v-if="update.version" class="update-version">Versão: {{ update.version }}</div>
          </div>
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
  
  data() {
    return {
      expandedItems: [] // Array para armazenar IDs dos itens expandidos
    }
  },
  
  methods: {
    toggleExpand(id) {
      // Se já estiver na lista, remove (recolhe); se não, adiciona (expande)
      const index = this.expandedItems.indexOf(id);
      if (index > -1) {
        this.expandedItems.splice(index, 1);
      } else {
        this.expandedItems.push(id);
      }
    },
    
    formatDate(dateString) {
      if (!dateString) return '';
      
      try {
        // Criar objeto de data a partir da string UTC
        const date = new Date(dateString);
        
        // Verificar se a data é válida
        if (isNaN(date.getTime())) {
          console.error('Data inválida:', dateString);
          return 'Data inválida';
        }
        
        // Opções para formatação com o fuso horário de Brasília (BRT: UTC-3)
        const options = {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/Sao_Paulo'  // Fuso horário de Brasília
        };
        
        return new Intl.DateTimeFormat('pt-BR', options).format(date);
      } catch (error) {
        console.error('Erro ao formatar data:', error, dateString);
        return 'Erro ao formatar data';
      }
    },
    
    formatarDescricao(texto) {
      if (!texto) return '';
      
      // Converte ** para negrito
      texto = texto.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // Converte * para itálico 
      texto = texto.replace(/\*(.*?)\*/g, '<em>$1</em>');
      
      // Converte [texto](url) para links
      texto = texto.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
      
      // Converte quebras de linha
      texto = texto.replace(/\n/g, '<br>');
      
      return texto;
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
  margin-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
}

.update-item:last-child {
  border-bottom: none;
}

.update-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.update-header:hover {
  background-color: #f9f9f9;
}

.update-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #2c3e50;
}

.toggle-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rotate-180 {
  transform: rotate(180deg);
  transition: transform 0.3s ease;
}

.update-details {
  padding: 0.5rem 1rem 1rem;
  border-top: 1px solid #f0f0f0;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.update-date {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.update-content {
  line-height: 1.6;
  font-size: 14px;
  padding: 10px 0;
  white-space: pre-line;
  color: var(--text-color, #333);
}

.update-version {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
  font-style: italic;
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