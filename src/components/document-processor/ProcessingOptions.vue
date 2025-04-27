<!-- filepath: c:\Users\ednei\Desktop\WORKSPACE\editais-comercial\src\components\document-processor\ProcessingOptions.vue -->
<template>
  <div class="processing-options">
    <h3 class="options-title">Opções de processamento</h3>
    
    <div class="server-status-indicator" :class="serverStatusClass">
      <div class="status-icon">
        <i :class="serverStatusIcon"></i>
      </div>
      <div class="status-info">
        <div class="status-title">Status do servidor</div>
        <div class="status-message">{{ serverStatusMessage }}</div>
      </div>
    </div>
    
    <div class="options-group">
      <div class="option-item">
        <div class="option-label-wrapper">
          <label class="option-label">
            <input type="checkbox" v-model="localOptions.enableOcr" @change="emitOptions">
            <span class="checkbox-custom"></span>
            <span>Ativar OCR</span>
          </label>
          <div class="option-tooltip">
            <i class="fas fa-info-circle"></i>
            <div class="tooltip-content">
              OCR (Reconhecimento Óptico de Caracteres) permite extrair texto de imagens e PDFs digitalizados.
            </div>
          </div>
        </div>
        <p class="option-description">Extrair texto de imagens e PDFs digitalizados</p>
      </div>
      
      <div class="option-item" :class="{ disabled: !localOptions.enableOcr }">
        <div class="option-label-wrapper">
          <label class="option-label" :class="{ disabled: !localOptions.enableOcr }">
            <input 
              type="checkbox" 
              v-model="localOptions.forceOcr" 
              :disabled="!localOptions.enableOcr"
              @change="emitOptions">
            <span class="checkbox-custom"></span>
            <span>Forçar OCR</span>
          </label>
          <div class="option-tooltip">
            <i class="fas fa-info-circle"></i>
            <div class="tooltip-content">
              Aplica OCR mesmo que o documento já possua texto selecionável.
            </div>
          </div>
        </div>
        <p class="option-description">Aplica OCR mesmo em documentos com texto</p>
      </div>
      
      <div class="option-item">
        <div class="option-label-wrapper">
          <label class="option-label">
            <input 
              type="checkbox" 
              v-model="localOptions.includeImages" 
              @change="emitOptions">
            <span class="checkbox-custom"></span>
            <span>Extrair imagens</span>
          </label>
          <div class="option-tooltip">
            <i class="fas fa-info-circle"></i>
            <div class="tooltip-content">
              Extrai e identifica imagens contidas no documento.
            </div>
          </div>
        </div>
        <p class="option-description">Identificar e extrair imagens do documento</p>
      </div>
      
      <div class="option-item">
        <div class="option-label-wrapper">
          <label class="option-label">
            <input 
              type="checkbox" 
              v-model="localOptions.includeTables" 
              @change="emitOptions">
            <span class="checkbox-custom"></span>
            <span>Extrair tabelas</span>
          </label>
          <div class="option-tooltip">
            <i class="fas fa-info-circle"></i>
            <div class="tooltip-content">
              Identifica e estrutura tabelas encontradas no documento.
            </div>
          </div>
        </div>
        <p class="option-description">Identificar e estruturar tabelas do documento</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProcessingOptions',
  props: {
    options: {
      type: Object,
      required: true
    },
    serverStatus: {
      type: Object,
      default: () => ({ status: 'unknown' })
    }
  },
  
  emits: ['update:options'],
  
  data() {
    return {
      localOptions: { ...this.options }
    };
  },
  
  watch: {
    options: {
      handler(newOptions) {
        this.localOptions = { ...newOptions };
      },
      deep: true
    }
  },
  
  computed: {
    serverStatusClass() {
      if (!this.serverStatus) return 'status-unknown';
      
      switch (this.serverStatus.status) {
        case 'online': return 'status-online';
        case 'error': return 'status-error';
        case 'warning': return 'status-warning';
        default: return 'status-unknown';
      }
    },
    
    serverStatusIcon() {
      if (!this.serverStatus) return 'fas fa-question-circle';
      
      switch (this.serverStatus.status) {
        case 'online': return 'fas fa-check-circle';
        case 'error': return 'fas fa-exclamation-circle';
        case 'warning': return 'fas fa-exclamation-triangle';
        default: return 'fas fa-question-circle';
      }
    },
    
    serverStatusMessage() {
      if (!this.serverStatus) return 'Status desconhecido';
      
      switch (this.serverStatus.status) {
        case 'online': return 'Servidor online e operacional';
        case 'error': return this.serverStatus.error_message || 'Servidor indisponível';
        case 'warning': return this.serverStatus.warning_message || 'Operando com limitações';
        default: return 'Verificando status do servidor...';
      }
    }
  },
  
  methods: {
    emitOptions() {
      this.$emit('update:options', { ...this.localOptions });
    }
  }
}
</script>

<style scoped>
.processing-options {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.options-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #193155;
  margin: 0 0 1rem 0;
  position: relative;
}

.options-title::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -0.5rem;
  width: 40px;
  height: 3px;
  background: linear-gradient(90deg, #193155, #254677);
  border-radius: 2px;
}

.server-status-indicator {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.status-online {
  background-color: #f0fdf4;
  border-left: 3px solid #16a34a;
}

.status-error {
  background-color: #fef2f2;
  border-left: 3px solid #dc2626;
}

.status-warning {
  background-color: #fffbeb;
  border-left: 3px solid #d97706;
}

.status-unknown {
  background-color: #f1f5f9;
  border-left: 3px solid #64748b;
}

.status-icon {
  font-size: 1.5rem;
}

.status-online .status-icon {
  color: #16a34a;
}

.status-error .status-icon {
  color: #dc2626;
}

.status-warning .status-icon {
  color: #d97706;
}

.status-unknown .status-icon {
  color: #64748b;
}

.status-title {
  font-weight: 600;
  font-size: 0.9rem;
}

.status-message {
  font-size: 0.85rem;
  opacity: 0.8;
}

.options-group {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.option-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.option-label-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.option-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
}

.option-label.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.option-label input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.checkbox-custom {
  position: relative;
  display: inline-block;
  width: 18px;
  height: 18px;
  background-color: #fff;
  border: 2px solid #cbd5e1;
  border-radius: 3px;
  transition: all 0.2s;
}

.option-label input:checked ~ .checkbox-custom {
  background-color: #193155;
  border-color: #193155;
}

.option-label input:checked ~ .checkbox-custom::after {
  content: '';
  position: absolute;
  display: block;
  left: 5px;
  top: 1px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.option-description {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0;
  padding-left: 2.25rem;
}

.option-tooltip {
  position: relative;
  color: #64748b;
  font-size: 1rem;
  cursor: help;
}

.tooltip-content {
  position: absolute;
  right: 0;
  top: calc(100% + 5px);
  width: 250px;
  background-color: white;
  border-radius: 8px;
  padding: 0.75rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  font-size: 0.85rem;
  color: #334155;
  z-index: 10;
  visibility: hidden;
  opacity: 0;
  transition: all 0.2s;
  pointer-events: none;
}

.option-tooltip:hover .tooltip-content {
  visibility: visible;
  opacity: 1;
}

/* Dark mode support */
[data-theme="dark"] .options-title {
  color: #e2e8f0;
}

[data-theme="dark"] .server-status-indicator {
  background-color: rgba(30, 41, 59, 0.5);
  border-left-color: rgba(255, 255, 255, 0.2);
}

[data-theme="dark"] .status-online {
  background-color: rgba(22, 163, 74, 0.1);
  border-left-color: #16a34a;
}

[data-theme="dark"] .status-error {
  background-color: rgba(220, 38, 38, 0.1);
  border-left-color: #dc2626;
}

[data-theme="dark"] .status-warning {
  background-color: rgba(217, 119, 6, 0.1);
  border-left-color: #d97706;
}

[data-theme="dark"] .checkbox-custom {
  background-color: #1e293b;
  border-color: #475569;
}

[data-theme="dark"] .option-label input:checked ~ .checkbox-custom {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

[data-theme="dark"] .option-description {
  color: #94a3b8;
}

[data-theme="dark"] .tooltip-content {
  background-color: #1e293b;
  color: #e2e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
</style>