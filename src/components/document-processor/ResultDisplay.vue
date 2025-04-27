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
          <!-- Outros metadados se disponíveis -->
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
              <p v-if="textContent">{{ textContent }}</p>
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
                      <td v-for="(cell, cellIndex) in row" :key="cellIndex">
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
              Certifique-se de que a opção "Incluir Tabelas" esteja ativada nas configurações.
            </p>
          </div>
        </div>
        
        <!-- Imagens -->
        <div v-if="activeTab === 'images'" class="images-content">
          <div v-if="hasImages" class="images-wrapper">
            <div v-for="(image, index) in result.content.images" :key="index" class="image-item">
              <h5>Imagem {{ index + 1 }} <span v-if="image.page">(Página {{ image.page }})</span></h5>
              <img :src="image.dataUrl || image.url" :alt="`Imagem ${index + 1}`" />
              <p v-if="image.caption" class="image-caption">{{ image.caption }}</p>
            </div>
          </div>
          <div v-else class="no-content">
            <i class="fas fa-info-circle"></i>
            <p>Nenhuma imagem foi detectada neste documento.</p>
            <p class="suggestion">
              Certifique-se de que a opção "Incluir Imagens" esteja ativada nas configurações.
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
      activeTab: 'text',
      showDetails: false
    };
  },
  computed: {
    hasContent() {
      return this.result && this.result.content;
    },
    hasText() {
      return this.result?.content?.text && this.result.content.text !== "Sem texto extraído";
    },
    hasTables() {
      return this.result?.content?.tables && this.result.content.tables.length > 0;
    },
    hasImages() {
      return this.result?.content?.images && this.result.content.images.length > 0;
    },
    textContent() {
      // Retornar o texto extraído, garantindo que seja uma string
      return this.result?.content?.text || '';
    }
  },
  methods: {
    toggleDetails() {
      this.showDetails = !this.showDetails;
    }
  }
};
</script>