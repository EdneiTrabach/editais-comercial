<!-- filepath: c:\Users\ednei\Desktop\WORKSPACE\editais-comercial\src\components\document-processor\ProcessingOptions.vue -->
<template>
  <div class="processing-options">
    <h4>Opções de Processamento</h4>
    
    <div class="server-status" v-if="serverStatus">
      <div :class="`status-indicator ${serverStatus.docling_available ? 'status-ok' : 'status-error'}`"></div>
      <div class="status-details">
        <strong>Status do servidor:</strong> {{ serverStatus.status }}
        <div v-if="!serverStatus.docling_available" class="status-warning">
          <i class="fas fa-exclamation-triangle"></i>
          Biblioteca Docling não disponível no servidor
        </div>
        <div v-else class="status-ok-text">
          <i class="fas fa-check-circle"></i>
          Docling pronto para uso
        </div>
      </div>
    </div>
    
    <div class="options-grid">
      <div class="option-item">
        <label>
          <input type="checkbox" v-model="localOptions.enableOcr" @change="emitUpdate">
          Ativar OCR
        </label>
        <span class="option-description">Reconhecimento ótico de caracteres para extrair texto de imagens e PDFs digitalizados</span>
      </div>
      
      <div class="option-item">
        <label>
          <input type="checkbox" v-model="localOptions.forceOcr" @change="emitUpdate">
          Forçar OCR
        </label>
        <span class="option-description">Forçar OCR mesmo quando o PDF já contém texto (útil para PDFs com problemas)</span>
      </div>
      
      <div class="option-item">
        <label>
          <input type="checkbox" v-model="localOptions.includeImages" @change="emitUpdate">
          Incluir Imagens
        </label>
        <span class="option-description">Extrair e processar imagens encontradas no documento</span>
      </div>
      
      <div class="option-item">
        <label>
          <input type="checkbox" v-model="localOptions.includeTables" @change="emitUpdate">
          Incluir Tabelas
        </label>
        <span class="option-description">Detectar e estruturar tabelas encontradas no documento</span>
      </div>
    </div>
    
    <div v-if="!serverStatus || !serverStatus.docling_available" class="docling-instructions">
      <h5>Como resolver problemas com Docling:</h5>
      <ol>
        <li>Verifique se o servidor Python está rodando: <code>uvicorn docling_api:app --reload</code></li>
        <li>Reinstale o Docling: <code>pip uninstall -y docling && pip install docling</code></li>
        <li>Verifique se há erros no terminal do servidor Python</li>
      </ol>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    options: {
      type: Object,
      default: () => ({
        enableOcr: true,
        forceOcr: false,
        includeImages: true,
        includeTables: true
      })
    },
    serverStatus: {
      type: Object,
      default: null
    }
  },
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
  methods: {
    emitUpdate() {
      this.$emit('update:options', { ...this.localOptions });
    }
  }
};
</script>

<style scoped>
.processing-options {
  margin: 20px 0;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid #193155;
}

.processing-options h4 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #193155;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
}

.option-item {
  display: flex;
  flex-direction: column;
}

.option-item label {
  display: flex;
  align-items: center;
  font-weight: 500;
  margin-bottom: 5px;
  cursor: pointer;
}

.option-item input {
  margin-right: 8px;
}

.option-description {
  font-size: 0.8rem;
  color: #666;
  margin-left: 20px;
}

.server-status {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 10px;
}

.status-ok {
  background-color: #28a745;
}

.status-error {
  background-color: #dc3545;
}

.status-details {
  font-size: 0.9rem;
}

.status-warning {
  color: #dc3545;
  margin-top: 5px;
  font-size: 0.8rem;
}

.status-ok-text {
  color: #28a745;
  margin-top: 5px;
  font-size: 0.8rem;
}

.docling-instructions {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-left: 3px solid #dc3545;
  border-radius: 4px;
  font-size: 0.9rem;
}

.docling-instructions code {
  background-color: #e9ecef;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
}

.docling-instructions h5 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1rem;
}

.docling-instructions ol {
  margin-bottom: 0;
  padding-left: 20px;
}

.docling-instructions li {
  margin-bottom: 5px;
}
</style>