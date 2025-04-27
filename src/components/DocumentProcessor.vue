<!-- filepath: c:\Users\ednei\Desktop\WORKSPACE\editais-comercial\src\components\DocumentProcessor.vue -->
<template>
  <div class="document-processor">
    <h2>Processador de Documentos</h2>
    
    <!-- Área de Upload -->
    <FileUploadArea 
      :file="file" 
      :loading="loading" 
      :result="result"
      @file-selected="handleFileSelected"
      @file-dropped="handleDrop"
      @process="processFile"
      @clear="clearFile"
    />
    
    <!-- Opções de processamento -->
    <ProcessingOptions 
      v-if="file && !loading && !result" 
      :options="processingOptions" 
      :server-status="serverStatus"
      @update:options="updateOptions"
    />

    <!-- Área de Resultados -->
    <ResultDisplay 
      v-if="result" 
      :result="result"
      @reset="reset"
    />
    
    <!-- Mensagem de erro visual -->
    <div v-if="error" class="process-error">
      <i class="fas fa-exclamation-triangle"></i>
      <p>{{ error }}</p>
      <button class="btn-try-again" @click="clearError">Tentar Novamente</button>
    </div>
  </div>
</template>

<script>
import FileUploadArea from './document-processor/FileUploadArea.vue';
import ResultDisplay from './document-processor/ResultDisplay.vue';
import ProcessingOptions from './document-processor/ProcessingOptions.vue';
import { processDocument, checkServerStatus } from './document-processor/documentProcessorService';
import './document-processor/documentProcessor.css';

export default {
  name: 'DocumentProcessor',
  components: {
    FileUploadArea,
    ResultDisplay,
    ProcessingOptions
  },
  data() {
    return {
      file: null,
      loading: false,
      result: null,
      error: null,
      serverStatus: null,
      processingOptions: {
        enableOcr: true,
        forceOcr: false,
        includeImages: true,
        includeTables: true
      }
    }
  },
  created() {
    this.checkServer();
  },
  methods: {
    async checkServer() {
      try {
        this.serverStatus = await checkServerStatus();
      } catch (error) {
        console.error("Erro ao verificar status do servidor:", error);
        this.serverStatus = { status: "error", docling_available: false };
      }
    },
    
    handleFileSelected(file) {
      this.file = file;
      this.error = null;
      this.result = null;
      
      // Ajustar opções com base no tipo de arquivo
      this.adjustOptionsForFileType(file);
    },
    
    handleDrop(file) {
      this.file = file;
      this.error = null;
      this.result = null;
      
      // Ajustar opções com base no tipo de arquivo
      this.adjustOptionsForFileType(file);
    },
    
    adjustOptionsForFileType(file) {
      // Ativar OCR automaticamente para imagens e PDFs digitalizados
      const isImage = file.type.startsWith('image/');
      
      // Para imagens, sempre ativar OCR e incluir imagens
      if (isImage) {
        this.processingOptions.enableOcr = true;
        this.processingOptions.includeImages = true;
      }
      
      // Verificar se é um PDF de pequeno tamanho (possivelmente digitalizado)
      const isPDF = file.type === 'application/pdf';
      const isSmallPDF = isPDF && file.size < 1024 * 1024; // Menor que 1MB
      
      if (isSmallPDF) {
        this.processingOptions.enableOcr = true;
      }
    },
    
    clearFile() {
      this.file = null;
    },
    
    clearError() {
      this.error = null;
      // Verificar o status do servidor novamente
      this.checkServer();
    },
    
    updateOptions(newOptions) {
      this.processingOptions = { ...newOptions };
    },
    
    async processFile() {
      if (!this.file) return;
      
      this.loading = true;
      this.result = null;
      this.error = null;
      
      try {
        const result = await processDocument(this.file, this.processingOptions);
        this.result = result;
        // Verificar o status do servidor após o processamento
        this.checkServer();
      } catch (error) {
        console.error("Erro ao processar documento:", error);
        this.error = `Erro ao processar o documento: ${error.message || "Falha na conexão com o servidor"}`;
      } finally {
        this.loading = false;
      }
    },
    
    reset() {
      this.file = null;
      this.result = null;
      this.error = null;
      // Verificar o status do servidor novamente
      this.checkServer();
    }
  }
}
</script>