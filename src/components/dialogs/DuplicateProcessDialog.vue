<template>
  <div v-if="show" class="duplicate-dialog-overlay">
    <div class="duplicate-dialog">
      <div class="duplicate-dialog-header">
        <h3>Duplicar Processo</h3>
        <button class="close-button" @click="close">×</button>
      </div>

      <div class="duplicate-dialog-content">
        <div class="processo-info">
          <div class="info-row">
            <span class="label">Processo original:</span>
            <span class="value">{{ processo.numero_processo }}</span>
          </div>
          <div class="info-row">
            <span class="label">Órgão:</span>
            <span class="value">{{ processo.orgao }}</span>
          </div>
          <div class="info-row">
            <span class="label">Data original:</span>
            <span class="value">{{ formatDate(processo.data_pregao) }} {{ formatTime(processo.hora_pregao) }}</span>
          </div>
        </div>

        <div class="divider"></div>

        <div class="form-group">
          <label for="nova-data">Nova data do pregão*:</label>
          <input 
            id="nova-data" 
            type="date" 
            v-model="novaData"
            :min="minDate"
            class="form-control"
            required>
        </div>

        <div class="form-group">
          <label for="nova-hora">Nova hora do pregão*:</label>
          <input 
            id="nova-hora" 
            type="time" 
            v-model="novaHora"
            class="form-control"
            required>
        </div>

        <fieldset class="opcoes-container">
          <legend>Opções de duplicação:</legend>
          
          <div class="option-item">
            <input type="checkbox" id="manter-status" v-model="opcoes.manterStatus">
            <label for="manter-status">Manter status ({{ formatStatus(processo.status) }})</label>
          </div>

          <div class="option-item">
            <input type="checkbox" id="copiar-responsaveis" v-model="opcoes.copiarResponsaveis">
            <label for="copiar-responsaveis">Copiar responsáveis</label>
          </div>

          <div class="option-item">
            <input type="checkbox" id="copiar-observacoes" v-model="opcoes.copiarObservacoes">
            <label for="copiar-observacoes">Copiar observações</label>
          </div>

          <div class="option-item">
            <input type="checkbox" id="copiar-impugnacoes" v-model="opcoes.copiarImpugnacoes">
            <label for="copiar-impugnacoes">Copiar dados de impugnação</label>
          </div>
        </fieldset>
      </div>

      <div class="duplicate-dialog-footer">
        <button class="cancel-button" @click="close" :disabled="loading">Cancelar</button>
        <button class="duplicate-button" @click="duplicate" :disabled="!isFormValid || loading">
          <span v-if="loading">
            <span class="loading-spinner"></span>
            Duplicando...
          </span>
          <span v-else>Duplicar</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DuplicateProcessDialog',
  
  props: {
    show: {
      type: Boolean,
      default: false
    },
    processo: {
      type: Object,
      default: () => ({})
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  
  data() {
    return {
      novaData: '',
      novaHora: '',
      opcoes: {
        manterStatus: false,
        copiarResponsaveis: true,
        copiarObservacoes: true,
        copiarImpugnacoes: false
      }
    }
  },
  
  computed: {
    isFormValid() {
      return this.novaData && this.novaHora;
    },
    
    minDate() {
      const today = new Date();
      return today.toISOString().split('T')[0];
    }
  },
  
  watch: {
    show(val) {
      if (val && this.processo) {
        this.initializeForm();
      }
    }
  },
  
  methods: {
    initializeForm() {
      // Definir uma data padrão para a nova data (amanhã)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      this.novaData = tomorrow.toISOString().split('T')[0];
      
      // Usar a hora do processo original
      this.novaHora = this.processo.hora_pregao || '10:00';
      
      // Resetar as opções para os valores padrão
      this.opcoes = {
        manterStatus: false,
        copiarResponsaveis: true,
        copiarObservacoes: true,
        copiarImpugnacoes: false
      };
    },
    
    formatDate(dateString) {
      if (!dateString) return '-';
      try {
        const [date] = dateString.split('T');
        const [year, month, day] = date.split('-');
        return `${day}/${month}/${year}`;
      } catch (error) {
        return '-';
      }
    },
    
    formatTime(time) {
      if (!time) return '-';
      try {
        return time.split(':').slice(0, 2).join(':');
      } catch (error) {
        return '-';
      }
    },
    
    formatStatus(status) {
      const statusMap = {
        'vamos_participar': 'Vamos Participar',
        'em_analise': 'Em Análise',
        'em_andamento': 'Em Andamento',
        'ganhamos': 'Ganhamos',
        'perdemos': 'Perdemos',
        'suspenso': 'Suspenso',
        'revogado': 'Revogado',
        'adiado': 'Adiado',
        'demonstracao': 'Demonstração',
        'cancelado': 'Cancelado',
        'nao_participar': 'Decidido Não Participar'
      };
      return statusMap[status] || status;
    },
    
    close() {
      this.$emit('close');
    },
    
    duplicate() {
      if (!this.isFormValid) return;
      
      this.$emit('duplicate', {
        processoOriginal: this.processo,
        novaData: this.novaData,
        novaHora: this.novaHora,
        opcoes: this.opcoes
      });
    }
  }
}
</script>

<style scoped>
.duplicate-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.duplicate-dialog {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  width: 500px;
  max-width: 90%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.duplicate-dialog-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.duplicate-dialog-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.duplicate-dialog-content {
  padding: 20px;
  overflow-y: auto;
}

.processo-info {
  background-color: #f5f5f5;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 16px;
}

.info-row {
  margin-bottom: 6px;
  display: flex;
}

.info-row .label {
  font-weight: 500;
  min-width: 130px;
}

.divider {
  height: 1px;
  background-color: #e0e0e0;
  margin: 16px 0;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.opcoes-container {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 12px;
  margin-top: 16px;
}

.opcoes-container legend {
  font-weight: 500;
  padding: 0 8px;
}

.option-item {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}

.option-item input {
  margin-right: 8px;
}

.duplicate-dialog-footer {
  padding: 16px 20px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-button {
  background-color: #f2f2f2;
  color: #333;
  border: 1px solid #ddd;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.duplicate-button {
  background-color: #2196f3;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.duplicate-button:disabled {
  background-color: #90caf9;
  cursor: not-allowed;
}

.loading-spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
  margin-right: 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>