<template>
  <div>
    <div class="processos-header">
      <h2>Selecione um processo para análise</h2>
      <div class="processos-actions">
        <button class="btn-novo-processo" @click="showNovoProcessoModal = true">
          <i class="fas fa-plus"></i> Criar Novo Processo
        </button>
        <button @click="$emit('sincronizar')" class="btn-sincronizar" :disabled="loading">
          <i class="fas fa-sync-alt"></i>
          Sincronizar Processos
        </button>
      </div>
    </div>
    
    <div v-if="processos.length === 0" class="info-message">
      <p>Não foram encontrados processos em análise para o ano {{ anoSelecionado }}.</p>
      <button @click="$emit('sincronizar')" class="btn-sincronizar-small">
        Sincronizar Processos
      </button>
    </div>
    
    <ProcessoSelection
      :processos="processos"
      :selectedProcesso="selectedProcesso"
      @select-processo="$emit('select-processo', $event)"
    />
  </div>
</template>

<script>
import ProcessoSelection from '@/components/lances/ProcessoSelection.vue'
import { ref } from 'vue'

export default {
  name: 'ProcessoSelectionStep',
  components: {
    ProcessoSelection
  },
  props: {
    processos: {
      type: Array,
      required: true
    },
    selectedProcesso: {
      type: String,
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    },
    anoSelecionado: {
      type: Number,
      required: true
    }
  },
  setup(props, { emit }) {
    const showNovoProcessoModal = ref(false);
    
    return {
      showNovoProcessoModal
    }
  },
  emits: ['select-processo', 'sincronizar']
}
</script>

<style scoped>
.processos-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.processos-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.btn-sincronizar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-sincronizar:hover:not(:disabled) {
  background: #4f46e5;
  transform: translateY(-1px);
}

.btn-sincronizar:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

.btn-novo-processo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #10b981; /* Verde */
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-novo-processo:hover {
  background: #059669; /* Verde mais escuro */
  transform: translateY(-1px);
}

.btn-sincronizar-small {
  padding: 0.5rem 1rem;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 0.5rem;
}

.btn-sincronizar-small:hover {
  background: #4f46e5;
}

.info-message {
  background-color: #f0f9ff;
  border-left: 4px solid #3b82f6;
  padding: 1rem;
  margin: 1rem 0;
  border-radius: 0 8px 8px 0;
}
</style>
