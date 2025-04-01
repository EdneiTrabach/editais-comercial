<template>
  <div v-if="show" class="update-modal-backdrop">
    <div class="update-modal">
      <div class="update-modal-header">
        <h2>{{ currentUpdate.title }}</h2>
        <span class="version-tag" v-if="currentUpdate.version">v{{ currentUpdate.version }}</span>
      </div>
      
      <div class="update-modal-content">
        <div v-html="formattedDescription"></div>
        
        <div class="update-navigation" v-if="updates.length > 1">
          <span>{{ currentIndex + 1 }} de {{ updates.length }}</span>
          <div class="nav-buttons">
            <button 
              @click="previousUpdate" 
              :disabled="currentIndex === 0"
              class="nav-button"
            >
              ← Anterior
            </button>
            <button 
              @click="nextUpdate" 
              :disabled="currentIndex === updates.length - 1"
              class="nav-button"
            >
              Próximo →
            </button>
          </div>
        </div>
      </div>
      
      <div class="update-modal-footer">
        <button @click="markAsRead" class="read-button">
          Confirmar Leitura
        </button>
        <button @click="closeModal" class="close-button" :disabled="isForced && !allRead">
          {{ isForced && !allRead ? 'Leia todas as atualizações primeiro' : 'Fechar' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { supabase } from '@/lib/supabase';

export default {
  name: 'SystemUpdateModal',
  props: {
    updates: {
      type: Array,
      default: () => []
    },
    show: {
      type: Boolean,
      default: false
    },
    isForced: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'mark-read'],
  setup(props, { emit }) {
    const currentIndex = ref(0);
    const readUpdates = ref(new Set());
    
    const currentUpdate = computed(() => {
      return props.updates[currentIndex.value] || { 
        title: 'Sem atualizações',
        description: 'Não há novas atualizações disponíveis.',
        version: '',
        release_date: new Date().toISOString()
      };
    });
    
    // Verificar se todas as atualizações foram lidas
    const allRead = computed(() => {
      if (!props.isForced) return true;
      return props.updates.length > 0 && readUpdates.value.size >= props.updates.length;
    });
    
    // Formatação da descrição (mantido igual)
    const formattedDescription = computed(() => {
      const text = currentUpdate.value.description || '';
      return text
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    });
    
    const nextUpdate = () => {
      if (currentIndex.value < props.updates.length - 1) {
        currentIndex.value++;
      }
    };
    
    const previousUpdate = () => {
      if (currentIndex.value > 0) {
        currentIndex.value--;
      }
    };
    
    const markAsRead = async () => {
      try {
        // Marcar a atualização atual como lida
        await emit('mark-read', currentUpdate.value.id);
        
        // Registrar localmente que essa atualização foi lida
        readUpdates.value.add(currentUpdate.value.id);
        
        if (currentIndex.value < props.updates.length - 1) {
          // Se houver mais atualizações, avance para a próxima
          nextUpdate();
        } else if (allRead.value) {
          // Se todas foram lidas, feche o modal
          closeModal();
        }
      } catch (error) {
        console.error('Erro ao marcar como lida:', error);
      }
    };
    
    const closeModal = () => {
      // Se estiver em modo forçado e nem todas foram lidas, impedir fechamento
      if (props.isForced && !allRead.value) {
        alert('Por favor, leia todas as atualizações antes de continuar.');
        return;
      }
      
      emit('close');
    };
    
    return {
      currentIndex,
      currentUpdate,
      formattedDescription,
      nextUpdate,
      previousUpdate,
      markAsRead,
      closeModal,
      allRead
    };
  }
}
</script>

<style>
.update-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.update-modal {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modal-appear 0.3s ease-out;
}

@keyframes modal-appear {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.update-modal-header {
  padding: 1.5rem;
  background: linear-gradient(135deg, #193155 0%, #1c3b6e 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.update-modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.version-tag {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  padding: 4px 10px;
  font-size: 0.8rem;
  font-weight: 500;
}

.update-modal-content {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.update-navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #eaeaea;
}

.nav-buttons {
  display: flex;
  gap: 0.5rem;
}

.nav-button {
  background-color: #f3f4f6;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.nav-button:hover:not(:disabled) {
  background-color: #e5e7eb;
}

.nav-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.update-modal-footer {
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  border-top: 1px solid #eaeaea;
  background-color: #f9fafb;
}

.read-button {
  background-color: #193155;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.25rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.read-button:hover {
  background-color: #132641;
  transform: translateY(-1px);
}

.close-button {
  border: 1px solid #d1d5db;
  background-color: white;
  border-radius: 4px;
  padding: 0.75rem 1.25rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.close-button:hover {
  background-color: #f3f4f6;
}

/* Adicionar estilo para botão desabilitado */
.close-button:disabled {
  background-color: #f1f1f1;
  color: #999;
  cursor: not-allowed;
  border-color: #ddd;
}
</style>