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
        
        <div class="error-suggestions">
          <p>Sugestões:</p>
          <ul>
            <li>Verifique se o servidor Python está rodando (uvicorn docling_api:app --reload)</li>
            <li>Tente com um arquivo diferente ou em outro formato</li>
            <li>Para PDFs digitalizados ou imagens, ative a opção OCR</li>
          </ul>
        </div>
      </div>
    </div>
    
    <div v-else-if="result.content" class="success-result">
      <!-- Metadados do documento -->
      <div class="document-metadata">
        <h4>Informações do Documento</h4>
        <div class="metadata-grid">
          <div class="metadata-item">
            <strong>Título:</strong> {{ result.metadata?.title || 'Sem título' }}
          </div>
          <div class="metadata-item">
            <strong>Tipo:</strong> {{ result.metadata?.file_type?.toUpperCase() || 'Desconhecido' }}
          </div>
          <div class="metadata-item">
            <strong>Páginas:</strong> {{ result.metadata?.pages || 'N/A' }}
          </div>
          <div class="metadata-item">
            <strong>OCR:</strong> {{ result.metadata?.processing_options?.ocr_enabled ? 'Ativado' : 'Desativado' }}
          </div>
        </div>
      </div>
      
      <!-- Abas para navegar entre diferentes tipos de conteúdo -->
      <div class="content-tabs">
        <div 
          class="tab" 
          :class="{ active: activeTab === 'text' }"
          @click="activeTab = 'text'"
        >
          <i class="fas fa-align-left"></i> Texto
        </div>
        
        <div 
          v-if="hasTables" 
          class="tab" 
          :class="{ active: activeTab === 'tables' }"
          @click="activeTab = 'tables'"
        >
          <i class="fas fa-table"></i> Tabelas ({{ tablesCount }})
        </div>
        
        <div 
          v-if="hasImages" 
          class="tab" 
          :class="{ active: activeTab === 'images' }"
          @click="activeTab = 'images'"
        >
          <i class="fas fa-image"></i> Imagens ({{ imagesCount }})
        </div>
        
        <div 
          class="tab" 
          :class="{ active: activeTab === 'raw' }"
          @click="activeTab = 'raw'"
        >
          <i class="fas fa-code"></i> JSON
        </div>
      </div>
      
      <!-- Conteúdo das abas -->
      <div class="tab-content">
        <!-- Conteúdo de Texto -->
        <div v-if="activeTab === 'text'" class="text-content">
          <div v-if="hasText" class="text-blocks">
            <div v-for="(block, index) in result.content.text_blocks" :key="index" class="text-block">
              <div class="block-header">
                <span class="page-indicator">Página {{ block.page }}</span>
                <span v-if="block.confidence !== null" class="confidence-indicator" 
                  :class="getConfidenceClass(block.confidence)">
                  Confiança: {{ Math.round(block.confidence * 100) }}%
                </span>
              </div>
              <p>{{ block.text }}</p>
            </div>
          </div>
          <div v-else class="no-content">
            <i class="fas fa-info-circle"></i>
            <p>Nenhum texto foi detectado neste documento.</p>
            <p class="suggestion">
              Se o documento contém texto visível, tente ativar a opção "Forçar OCR" nas configurações.
            </p>
          </div>
        </div>
        
        <!-- Tabelas -->
        <div v-if="activeTab === 'tables'" class="tables-content">
          <div v-if="hasTables" class="tables-wrapper">
            <div v-for="table in result.content.tables" :key="table.id" class="table-item">
              <h5>Tabela {{ table.id }} <span v-if="table.page">(Página {{ table.page }})</span></h5>
              <div class="table-wrapper">
                <table class="extracted-table">
                  <tbody>
                    <tr v-for="(row, rowIndex) in table.cells" :key="rowIndex">
                      <td v-for="(cell, cellIndex) in row" :key="cellIndex"
                          :rowspan="cell.row_span" :colspan="cell.col_span">
                        {{ cell.text }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div v-else class="no-content">
            <i class="fas fa-info-circle"></i>
            <p>Nenhuma tabela foi detectada neste documento.</p>
            <p class="suggestion">
              Certifique-se de que a opção "Incluir tabelas" esteja ativada nas configurações.
            </p>
          </div>
        </div>
        
        <!-- Imagens -->
        <div v-if="activeTab === 'images'" class="images-content">
          <div v-if="hasImages" class="images-wrapper">
            <div v-for="image in result.content.pictures" :key="image.id" class="image-item">
              <h5>Imagem {{ image.id }} <span v-if="image.page">(Página {{ image.page }})</span></h5>
              <div class="image-container">
                <img v-if="image.image_base64" :src="`data:image/jpeg;base64,${image.image_base64}`" alt="Imagem extraída">
                <div v-else class="no-image-preview">
                  <i class="fas fa-image"></i>
                  <p>Prévia da imagem não disponível</p>
                </div>
              </div>
              <div v-if="image.description" class="image-description">
                <strong>Descrição:</strong> {{ image.description }}
              </div>
              <div v-if="image.classification" class="image-classification">
                <strong>Classificação:</strong> {{ image.classification }}
              </div>
            </div>
          </div>
          <div v-else class="no-content">
            <i class="fas fa-info-circle"></i>
            <p>Nenhuma imagem foi detectada neste documento.</p>
            <p class="suggestion">
              Certifique-se de que a opção "Incluir imagens" esteja ativada nas configurações.
            </p>
          </div>
        </div>
        
        <!-- Visualização JSON -->
        <div v-if="activeTab === 'raw'" class="raw-content">
          <pre>{{ JSON.stringify(result, null, 2) }}</pre>
        </div>
      </div>
      
      <button class="btn-reset" @click="$emit('reset')">Processar outro documento</button>
    </div>
    
    <div v-else class="no-content-wrapper">
      <div class="no-content">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Nenhum conteúdo foi detectado neste documento.</p>
        <p class="suggestion">
          Tente com um formato de arquivo diferente ou ative as opções de OCR nas configurações.
        </p>
        <button class="btn-reset" @click="$emit('reset')">Processar outro documento</button>
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
      showDetails: false,
      activeTab: 'text'
    }
  },
  computed: {
    hasText() {
      return this.result.content?.text_blocks?.length > 0;
    },
    hasTables() {
      return this.result.content?.tables?.length > 0;
    },
    hasImages() {
      return this.result.content?.pictures?.length > 0;
    },
    tablesCount() {
      return this.result.content?.tables?.length || 0;
    },
    imagesCount() {
      return this.result.content?.pictures?.length || 0;
    }
  },
  methods: {
    toggleDetails() {
      this.showDetails = !this.showDetails;
    },
    getConfidenceClass(confidence) {
      if (!confidence) return '';
      
      if (confidence >= 0.9) return 'high-confidence';
      if (confidence >= 0.7) return 'medium-confidence';
      return 'low-confidence';
    }
  }
}
</script>