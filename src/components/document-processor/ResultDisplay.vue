<!-- filepath: c:\Users\ednei\Desktop\WORKSPACE\editais-comercial\src\components\document-processor\ResultDisplay.vue -->
<template>
  <div class="result-container">
    <div class="result-header">
      <h3>Resultados do processamento</h3>
      <button class="btn-reset" @click="$emit('reset')">
        <i class="fas fa-redo-alt"></i>
        Processar novo documento
      </button>
    </div>

    <div class="result-tabs">
      <div 
        v-for="tab in tabs" 
        :key="tab.id"
        class="tab" 
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id">
        <i :class="tab.icon"></i>
        {{ tab.label }}
        <span class="content-badge" v-if="tab.badge">{{ tab.badge }}</span>
      </div>
    </div>

    <div class="tab-content">
      <!-- Guia de Texto -->
      <div v-if="activeTab === 'text'" class="text-content">
        <div v-if="result.text && result.text.length > 0" class="text-blocks">
          <div v-for="(block, index) in result.text" :key="index" class="text-block">
            <div class="block-header">
              <span>Bloco #{{ index + 1 }}</span>
              <span 
                class="confidence-indicator" 
                :class="getConfidenceClass(block.confidence)">
                Confiança: {{ Math.round(block.confidence * 100) }}%
              </span>
            </div>
            <p>{{ block.content }}</p>
          </div>
        </div>
        <div v-else class="no-content">
          <i class="fas fa-file-alt"></i>
          <p>Nenhum texto foi encontrado no documento.</p>
        </div>
      </div>
      
      <!-- Guia de Tabelas -->
      <div v-else-if="activeTab === 'tables'" class="tables-content">
        <div v-if="result.tables && result.tables.length > 0" class="tables-wrapper">
          <div v-for="(table, index) in result.tables" :key="index" class="table-item">
            <h5>Tabela {{ index + 1 }}</h5>
            <div class="table-wrapper">
              <table class="extracted-table">
                <tr v-for="(row, rowIndex) in table.data" :key="rowIndex">
                  <td v-for="(cell, cellIndex) in row" :key="cellIndex">
                    {{ cell }}
                  </td>
                </tr>
              </table>
            </div>
            <div class="table-actions">
              <button class="btn-copy" @click="copyTable(table)">
                <i class="fas fa-copy"></i> Copiar tabela
              </button>
              <button class="btn-export" @click="exportTableAsCsv(table, index)">
                <i class="fas fa-file-csv"></i> Exportar CSV
              </button>
            </div>
          </div>
        </div>
        <div v-else class="no-content">
          <i class="fas fa-table"></i>
          <p>Nenhuma tabela foi encontrada no documento.</p>
        </div>
      </div>
      
      <!-- Guia de Imagens -->
      <div v-else-if="activeTab === 'images'" class="images-content">
        <div v-if="result.images && result.images.length > 0" class="images-wrapper">
          <div v-for="(image, index) in result.images" :key="index" class="image-item">
            <h5>Imagem {{ index + 1 }}</h5>
            <div class="image-container">
              <img v-if="image.src" :src="image.src" :alt="'Imagem ' + (index + 1)" />
              <div v-else class="no-image-preview">
                <i class="fas fa-image"></i>
                <span>Prévia indisponível</span>
              </div>
            </div>
            <div class="image-description" v-if="image.description">
              <strong>Descrição:</strong> {{ image.description }}
            </div>
            <div class="image-classification" v-if="image.classification">
              <strong>Tipo:</strong> {{ image.classification }}
            </div>
          </div>
        </div>
        <div v-else class="no-content">
          <i class="fas fa-images"></i>
          <p>Nenhuma imagem foi encontrada no documento.</p>
        </div>
      </div>
      
      <!-- Guia de Metadata -->
      <div v-else-if="activeTab === 'metadata'" class="metadata-content">
        <div class="document-metadata">
          <h4>Informações do documento</h4>
          <div class="metadata-grid">
            <div class="metadata-item" v-for="(value, key) in formattedMetadata" :key="key">
              <span class="metadata-label">{{ key }}:</span>
              <span class="metadata-value">{{ value }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Guia de JSON -->
      <div v-else-if="activeTab === 'raw'" class="raw-content">
        <pre>{{ JSON.stringify(result, null, 2) }}</pre>
        <p class="suggestion">Dica: Você pode copiar este JSON para usar em outras aplicações</p>
        <button class="btn-copy-json" @click="copyJson">
          <i class="fas fa-copy"></i> Copiar JSON
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ResultDisplay',
  props: {
    result: {
      type: Object,
      required: true
    }
  },
  emits: ['reset'],
  
  data() {
    return {
      activeTab: 'text',
      copySuccess: false
    };
  },
  
  computed: {
    tabs() {
      const textCount = (this.result.text && Array.isArray(this.result.text)) ? this.result.text.length : 0;
      const tableCount = (this.result.tables && Array.isArray(this.result.tables)) ? this.result.tables.length : 0;
      const imageCount = (this.result.images && Array.isArray(this.result.images)) ? this.result.images.length : 0;
      
      return [
        { id: 'text', label: 'Texto', icon: 'fas fa-file-alt', badge: textCount > 0 ? textCount : null },
        { id: 'tables', label: 'Tabelas', icon: 'fas fa-table', badge: tableCount > 0 ? tableCount : null },
        { id: 'images', label: 'Imagens', icon: 'fas fa-images', badge: imageCount > 0 ? imageCount : null },
        { id: 'metadata', label: 'Metadados', icon: 'fas fa-info-circle' },
        { id: 'raw', label: 'JSON', icon: 'fas fa-code' }
      ];
    },
    
    formattedMetadata() {
      if (!this.result.metadata) return {};
      
      const formatted = {};
      
      if (this.result.metadata.title) {
        formatted['Título'] = this.result.metadata.title;
      }
      
      if (this.result.metadata.author) {
        formatted['Autor'] = this.result.metadata.author;
      }
      
      if (this.result.metadata.creation_date) {
        formatted['Data de criação'] = new Date(this.result.metadata.creation_date).toLocaleDateString();
      }
      
      if (this.result.metadata.modification_date) {
        formatted['Última modificação'] = new Date(this.result.metadata.modification_date).toLocaleDateString();
      }
      
      if (this.result.metadata.pages) {
        formatted['Páginas'] = this.result.metadata.pages;
      }
      
      if (this.result.metadata.format) {
        formatted['Formato'] = this.result.metadata.format;
      }
      
      if (this.result.metadata.size) {
        formatted['Tamanho'] = this.formatSize(this.result.metadata.size);
      }
      
      if (this.result.metadata.keywords && this.result.metadata.keywords.length) {
        formatted['Palavras-chave'] = this.result.metadata.keywords.join(', ');
      }
      
      return formatted;
    }
  },
  
  methods: {
    getConfidenceClass(confidence) {
      if (confidence >= 0.8) return 'high-confidence';
      if (confidence >= 0.5) return 'medium-confidence';
      return 'low-confidence';
    },
    
    formatSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    copyTable(table) {
      if (!table || !table.data) return;
      
      // Converter a tabela em texto
      const tableText = table.data
        .map(row => row.join('\t'))
        .join('\n');
        
      // Copiar para a área de transferência
      navigator.clipboard.writeText(tableText).then(() => {
        this.showToast('Tabela copiada para a área de transferência!');
      }).catch(err => {
        console.error('Falha ao copiar tabela:', err);
      });
    },
    
    exportTableAsCsv(table, index) {
      if (!table || !table.data) return;
      
      // Converter a tabela para CSV
      const csvContent = table.data
        .map(row => row.map(cell => `"${cell || ''}"`).join(','))
        .join('\n');
        
      // Criar o elemento de download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `tabela_${index + 1}.csv`);
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    
    copyJson() {
      const jsonStr = JSON.stringify(this.result, null, 2);
      navigator.clipboard.writeText(jsonStr).then(() => {
        this.showToast('JSON copiado para a área de transferência!');
      }).catch(err => {
        console.error('Falha ao copiar JSON:', err);
      });
    },
    
    showToast(message) {
      // Implementar uma função de toast simples
      const toast = document.createElement('div');
      toast.className = 'toast-message';
      toast.textContent = message;
      
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.classList.add('show');
      }, 10);
      
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 500);
      }, 2500);
    }
  }
}
</script>

<style scoped>
.result-container {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  animation: fadeIn 0.3s ease-out;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.result-header h3 {
  margin: 0;
  color: #193155;
  font-size: 1.25rem;
  font-weight: 600;
}

.result-tabs {
  display: flex;
  border-bottom: 1px solid #e2e8f0;
  background-color: #f8fafc;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f8fafc;
}

.result-tabs::-webkit-scrollbar {
  height: 8px;
}

.result-tabs::-webkit-scrollbar-track {
  background: #f8fafc;
}

.result-tabs::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 4px;
}

.tab {
  padding: 1rem 1.5rem;
  color: #64748b;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tab.active {
  color: #193155;
  border-bottom-color: #193155;
  background-color: rgba(25, 49, 85, 0.05);
}

.tab:hover:not(.active) {
  color: #193155;
  background-color: rgba(25, 49, 85, 0.02);
}

.content-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background-color: #193155;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
}

.tab-content {
  padding: 1.5rem;
  min-height: 300px;
  max-height: 700px;
  overflow-y: auto;
}

.text-blocks {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.text-block {
  background-color: #f8fafc;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #193155;
}

.block-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #64748b;
  margin-bottom: 0.5rem;
}

.confidence-indicator {
  font-weight: 500;
}

.high-confidence {
  color: #16a34a;
}

.medium-confidence {
  color: #d97706;
}

.low-confidence {
  color: #dc2626;
}

.tables-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.table-item {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  background-color: white;
}

.table-item h5 {
  background-color: #f1f5f9;
  margin: 0;
  padding: 0.75rem 1rem;
  font-weight: 600;
  color: #334155;
  border-bottom: 1px solid #e2e8f0;
}

.table-wrapper {
  padding: 1rem;
  overflow-x: auto;
}

.extracted-table {
  width: 100%;
  border-collapse: collapse;
}

.extracted-table td {
  border: 1px solid #e2e8f0;
  padding: 8px 12px;
}

.table-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid #e2e8f0;
  background-color: #f8fafc;
}

.btn-copy, .btn-export, .btn-copy-json {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-copy {
  background-color: #f1f5f9;
  color: #334155;
}

.btn-copy:hover {
  background-color: #e2e8f0;
}

.btn-export, .btn-copy-json {
  background-color: #193155;
  color: white;
}

.btn-export:hover, .btn-copy-json:hover {
  background-color: #254677;
}

.images-wrapper {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.image-item {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  background-color: white;
}

.image-item h5 {
  background-color: #f1f5f9;
  margin: 0;
  padding: 0.75rem 1rem;
  font-weight: 600;
  color: #334155;
  border-bottom: 1px solid #e2e8f0;
}

.image-container {
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  background-color: #f8fafc;
}

.image-container img {
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
}

.no-image-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  color: #94a3b8;
}

.no-image-preview i {
  font-size: 2.5rem;
}

.image-description, .image-classification {
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  border-top: 1px solid #e2e8f0;
}

.document-metadata {
  background-color: #f8fafc;
  border-radius: 8px;
  padding: 1.5rem;
}

.document-metadata h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #193155;
  font-weight: 600;
}

.metadata-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.metadata-item {
  display: flex;
  flex-direction: column;
}

.metadata-label {
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 0.25rem;
}

.metadata-value {
  font-weight: 500;
  color: #334155;
}

.raw-content {
  background-color: #1e293b;
  color: #e2e8f0;
  padding: 1.5rem;
  border-radius: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9rem;
  white-space: pre-wrap;
  overflow-x: auto;
  margin-bottom: 1rem;
}

pre {
  margin: 0;
}

.suggestion {
  color: #64748b;
  font-style: italic;
  margin-bottom: 1rem;
}

.no-content {
  padding: 3rem 1.5rem;
  text-align: center;
  background-color: #f8fafc;
  border-radius: 8px;
  color: #64748b;
}

.no-content i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #cbd5e1;
}

.toast-message {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 1rem 1.5rem;
  background-color: #193155;
  color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.3s ease;
}

.toast-message.show {
  opacity: 1;
  transform: translateY(0);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Dark mode support */
[data-theme="dark"] .result-container {
  background-color: #1e293b;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

[data-theme="dark"] .result-header {
  border-bottom-color: #334155;
}

[data-theme="dark"] .result-header h3 {
  color: #e2e8f0;
}

[data-theme="dark"] .result-tabs {
  background-color: #0f172a;
  border-bottom-color: #334155;
}

[data-theme="dark"] .result-tabs::-webkit-scrollbar-track {
  background: #0f172a;
}

[data-theme="dark"] .result-tabs::-webkit-scrollbar-thumb {
  background-color: #475569;
}

[data-theme="dark"] .tab {
  color: #94a3b8;
}

[data-theme="dark"] .tab.active {
  color: #e2e8f0;
  border-bottom-color: #3b82f6;
  background-color: rgba(59, 130, 246, 0.05);
}

[data-theme="dark"] .tab:hover:not(.active) {
  color: #e2e8f0;
  background-color: rgba(59, 130, 246, 0.02);
}

[data-theme="dark"] .content-badge {
  background-color: #3b82f6;
}

[data-theme="dark"] .tab-content {
  color: #e2e8f0;
}

[data-theme="dark"] .text-block {
  background-color: #334155;
  border-left-color: #3b82f6;
}

[data-theme="dark"] .block-header {
  color: #94a3b8;
}

[data-theme="dark"] .tables-wrapper {
  color: #e2e8f0;
}

[data-theme="dark"] .table-item {
  background-color: #334155;
  border-color: #475569;
}

[data-theme="dark"] .table-item h5 {
  background-color: #475569;
  color: #e2e8f0;
  border-bottom-color: #475569;
}

[data-theme="dark"] .table-wrapper {
  background-color: #1e293b;
}

[data-theme="dark"] .extracted-table td {
  border-color: #475569;
}

[data-theme="dark"] .table-actions {
  background-color: #475569;
}

[data-theme="dark"] .btn-copy {
  background-color: #475569;
  color: #e2e8f0;
}

[data-theme="dark"] .btn-copy:hover {
  background-color: #64748b;
}

[data-theme="dark"] .btn-export, [data-theme="dark"] .btn-copy-json {
  background-color: #3b82f6;
}

[data-theme="dark"] .btn-export:hover, [data-theme="dark"] .btn-copy-json:hover {
  background-color: #2563eb;
}

[data-theme="dark"] .images-wrapper {
  color: #e2e8f0;
}

[data-theme="dark"] .image-item {
  background-color: #334155;
  border-color: #475569;
}

[data-theme="dark"] .image-item h5 {
  background-color: #475569;
  color: #e2e8f0;
  border-bottom-color: #475569;
}

[data-theme="dark"] .image-container {
  background-color: #1e293b;
}

[data-theme="dark"] .no-image-preview {
  color: #94a3b8;
}

[data-theme="dark"] .image-description, [data-theme="dark"] .image-classification {
  background-color: #475569;
  border-top-color: #475569;
}

[data-theme="dark"] .document-metadata {
  background-color: #334155;
}

[data-theme="dark"] .document-metadata h4 {
  color: #e2e8f0;
}

[data-theme="dark"] .metadata-item {
  color: #e2e8f0;
}

[data-theme="dark"] .metadata-label {
  color: #94a3b8;
}

[data-theme="dark"] .raw-content {
  background-color: #0f172a;
  color: #e2e8f0;
}

[data-theme="dark"] .suggestion {
  color: #94a3b8;
}

[data-theme="dark"] .no-content {
  background-color: #334155;
  color: #94a3b8;
}

[data-theme="dark"] .no-content i {
  color: #64748b;
}

[data-theme="dark"] .toast-message {
  background-color: #3b82f6;
}
</style>