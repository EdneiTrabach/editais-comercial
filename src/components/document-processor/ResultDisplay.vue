<!-- filepath: c:\Users\ednei\Desktop\WORKSPACE\editais-comercial\src\components\document-processor\ResultDisplay.vue -->
<template>
  <div class="result-container">
    <h3>Resultado do Processamento</h3>
    
    <div v-if="result.error" class="error-message">
      <i class="fas fa-exclamation-circle"></i>
      <div class="error-details">
        <h4>Não foi possível processar o documento</h4>
        <p>{{ result.error }}</p>
        
        <div v-if="showDetails" class="technical-details">
          <pre>{{ result.details || 'Sem detalhes adicionais' }}</pre>
        </div>
        
        <button class="btn-toggle-details" @click="toggleDetails">
          {{ showDetails ? 'Ocultar Detalhes Técnicos' : 'Ver Detalhes Técnicos' }}
        </button>
      </div>
    </div>
    
    <div v-else-if="hasContent" class="success-result">
      <!-- Metadados do documento -->
      <div class="document-metadata">
        <h4>Informações do Documento</h4>
        <div class="metadata-grid">
          <div class="metadata-item">
            <strong>Arquivo:</strong> {{ result.metadata?.filename || 'Documento sem título' }}
          </div>
          <div class="metadata-item">
            <strong>Páginas:</strong> {{ result.metadata?.pages || '1' }}
          </div>
          <div class="metadata-item">
            <strong>Tipo:</strong> {{ result.metadata?.file_type || 'PDF' }}
          </div>
        </div>
      </div>

      <!-- Abas de navegação -->
      <div class="tabs">
        <button 
          :class="['tab-button', { active: activeTab === 'text' }]" 
          @click="activeTab = 'text'"
        >Texto</button>
        <button 
          :class="['tab-button', { active: activeTab === 'tables' }]" 
          @click="activeTab = 'tables'"
        >Tabelas</button>
        <button 
          :class="['tab-button', { active: activeTab === 'images' }]" 
          @click="activeTab = 'images'"
        >Imagens</button>
        <button 
          :class="['tab-button', { active: activeTab === 'raw' }]" 
          @click="activeTab = 'raw'"
        >JSON</button>
      </div>
      
      <!-- Conteúdo das abas -->
      <div class="tab-content">
        <!-- Texto -->
        <div v-if="activeTab === 'text'" class="text-content">
          <div v-if="hasText" class="text-wrapper">
            <div class="text-content-inner">
              <div v-if="isTextFormatted" v-html="formattedText"></div>
              <pre v-else>{{ textContent }}</pre>
            </div>
            <div class="text-actions">
              <button @click="copyText" class="btn-action">
                <i class="fas fa-copy"></i> Copiar Texto
              </button>
              <button @click="downloadText" class="btn-action">
                <i class="fas fa-download"></i> Baixar TXT
              </button>
            </div>
          </div>
          <div v-else class="no-content">
            <i class="fas fa-file-alt"></i>
            <p>Nenhum texto foi detectado neste documento.</p>
            <p class="suggestion">
              Tente ativar a opção "Forçar OCR" nas configurações.
            </p>
          </div>
        </div>
        
        <!-- Tabelas -->
        <div v-else-if="activeTab === 'tables'" class="tables-content">
          <div v-if="hasTables" class="tables-wrapper">
            <div v-for="(table, index) in result.content.tables" :key="index" class="table-item">
              <h5>Tabela {{ index + 1 }}{{ table.page ? ` (Página ${table.page})` : '' }}</h5>
              <div class="table-wrapper">
                <table class="extracted-table">
                  <tbody>
                    <tr v-for="(row, rowIndex) in table.data" :key="rowIndex">
                      <td v-for="(cell, cellIndex) in row" :key="cellIndex">
                        {{ cell }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="table-actions">
                <button @click="downloadTable(table, index)" class="btn-action">
                  <i class="fas fa-download"></i> Baixar CSV
                </button>
              </div>
            </div>
          </div>
          <div v-else class="no-content">
            <i class="fas fa-table"></i>
            <p>Nenhuma tabela foi detectada neste documento.</p>
            <p class="suggestion">
              Certifique-se de que a opção "Incluir Tabelas" esteja ativada nas configurações.
            </p>
          </div>
        </div>
        
        <!-- Imagens -->
        <div v-else-if="activeTab === 'images'" class="images-content">
          <div v-if="hasImages" class="images-wrapper">
            <div v-for="(image, index) in result.content.images" :key="index" class="image-item">
              <h5>Imagem {{ index + 1 }}{{ image.page ? ` (Página ${image.page})` : '' }}</h5>
              <div class="image-container">
                <img v-if="image.dataUrl" :src="image.dataUrl" :alt="`Imagem ${index + 1}`" @click="enlargeImage(image)" />
                <div v-else class="no-image-preview">
                  <i class="fas fa-image"></i>
                  <span>Prévia indisponível</span>
                </div>
              </div>
              <div v-if="image.description" class="image-description">
                <strong>Descrição:</strong> {{ image.description }}
              </div>
              <div v-if="image.type" class="image-type">
                <strong>Tipo:</strong> {{ image.type }}
              </div>
            </div>
          </div>
          <div v-else class="no-content">
            <i class="fas fa-images"></i>
            <p>Nenhuma imagem foi detectada neste documento.</p>
            <p class="suggestion">
              Certifique-se de que a opção "Incluir Imagens" esteja ativada nas configurações.
            </p>
          </div>
        </div>
        
        <!-- JSON -->
        <div v-else-if="activeTab === 'raw'" class="raw-content">
          <div class="raw-actions">
            <button @click="copyJson" class="btn-action">
              <i class="fas fa-copy"></i> Copiar JSON
            </button>
          </div>
          <pre>{{ JSON.stringify(result, null, 2) }}</pre>
        </div>
      </div>
      
      <!-- Botão para processar outro documento -->
      <div class="action-buttons">
        <button class="btn-reset" @click="$emit('reset')">
          <i class="fas fa-redo"></i> Processar outro documento
        </button>
      </div>
      
      <!-- Modal para imagem ampliada -->
      <div v-if="enlargedImage" class="image-modal" @click="closeEnlargedImage">
        <div class="image-modal-content">
          <img :src="enlargedImage" @click.stop />
          <button class="close-modal" @click.stop="closeEnlargedImage">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>
    
    <div v-else class="no-content-wrapper">
      <div class="no-content">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Nenhum conteúdo foi extraído do documento.</p>
        <p class="suggestion">
          Tente com outro formato de arquivo ou ative as opções de OCR nas configurações.
        </p>
        <button class="btn-reset" @click="$emit('reset')">
          <i class="fas fa-redo"></i> Processar outro documento
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
  data() {
    return {
      activeTab: 'text',
      showDetails: false,
      enlargedImage: null
    };
  },
  computed: {
    hasContent() {
      return this.result && this.result.content && (
        this.hasText || this.hasTables || this.hasImages
      );
    },
    hasText() {
      return this.result?.content?.text && 
        this.result.content.text !== "Sem texto extraído" &&
        this.result.content.text.trim() !== "";
    },
    hasTables() {
      return this.result?.content?.tables && 
             Array.isArray(this.result.content.tables) && 
             this.result.content.tables.length > 0;
    },
    hasImages() {
      return this.result?.content?.images && 
             Array.isArray(this.result.content.images) && 
             this.result.content.images.length > 0;
    },
    textContent() {
      return this.result?.content?.text || '';
    },
    isTextFormatted() {
      // Verificar se o texto contém padrões que indicam formatação
      const text = this.textContent;
      return text.includes('--- Página') || text.includes('\n\n');
    },
    formattedText() {
      if (!this.textContent) return '';
      
      // Formatar o texto com quebras de linha HTML e destacar cabeçalhos de página
      return this.textContent
        .replace(/--- Página (\d+) ---/g, '<h4 class="page-header">Página $1</h4>')
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n/g, '<br>');
    }
  },
  methods: {
    toggleDetails() {
      this.showDetails = !this.showDetails;
    },
    copyText() {
      navigator.clipboard.writeText(this.textContent)
        .then(() => alert('Texto copiado para a área de transferência!'))
        .catch(err => console.error('Erro ao copiar texto:', err));
    },
    copyJson() {
      navigator.clipboard.writeText(JSON.stringify(this.result, null, 2))
        .then(() => alert('JSON copiado para a área de transferência!'))
        .catch(err => console.error('Erro ao copiar JSON:', err));
    },
    downloadText() {
      const blob = new Blob([this.textContent], { type: 'text/plain' });
      this.downloadFile(blob, `${this.result.metadata?.filename || 'documento'}_texto.txt`);
    },
    downloadTable(table, index) {
      // Converter tabela para formato CSV
      let csvContent = '';
      if (table.data && Array.isArray(table.data)) {
        csvContent = table.data.map(row => 
          row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ).join('\n');
      }
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      this.downloadFile(blob, `${this.result.metadata?.filename || 'documento'}_tabela_${index + 1}.csv`);
    },
    downloadFile(blob, fileName) {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(link.href);
    },
    enlargeImage(image) {
      this.enlargedImage = image.dataUrl;
    },
    closeEnlargedImage() {
      this.enlargedImage = null;
    }
  }
};
</script>

<style src="./ResultDisplay.css"></style>