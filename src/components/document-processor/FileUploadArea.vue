<!-- filepath: c:\Users\ednei\Desktop\WORKSPACE\editais-comercial\src\components\document-processor\FileUploadArea.vue -->
<template>
  <div class="upload-container">
    <div 
      class="upload-box" 
      :class="{ 'drag-over': dragOver }" 
      @click="openFileDialog"
      @dragover.prevent="dragOver = true"
      @dragleave.prevent="dragOver = false"
      @drop.prevent="handleDrop">

      <input 
        type="file" 
        ref="fileInput" 
        style="display: none" 
        accept=".pdf,.png,.jpg,.jpeg,.tiff,.docx,.txt,.xlsx,.csv" 
        @change="handleFileChange" />

      <template v-if="!file">
        <div class="upload-placeholder">
          <i class="fas fa-cloud-upload-alt"></i>
          <h3>Arraste e solte seu documento aqui</h3>
          <p>ou clique para selecionar um arquivo</p>
          <div class="supported-formats">
            <span>Formatos suportados: PDF, PNG, JPG, DOCX, TXT, XLSX, CSV</span>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="file-selected">
          <div class="file-icon">
            <i :class="getFileIcon(file.type)"></i>
          </div>
          <div class="file-name">{{ file.name }}</div>
          <div class="file-size">{{ formatFileSize(file.size) }}</div>
          
          <div class="action-buttons">
            <button class="btn-process" @click.stop="$emit('process')">
              <i class="fas fa-cogs"></i>
              Processar Documento
            </button>
            <button class="btn-reset" @click.stop="$emit('clear')">
              <i class="fas fa-times"></i>
              Cancelar
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FileUploadArea',
  props: {
    file: Object,
    loading: Boolean,
    result: Object
  },
  emits: ['file-selected', 'file-dropped', 'process', 'clear'],
  
  data() {
    return {
      dragOver: false
    };
  },
  
  methods: {
    openFileDialog() {
      if (!this.loading && !this.result) {
        this.$refs.fileInput.click();
      }
    },
    
    handleFileChange(event) {
      const selectedFile = event.target.files[0];
      if (selectedFile) {
        this.$emit('file-selected', selectedFile);
      }
    },
    
    handleDrop(event) {
      this.dragOver = false;
      if (!this.loading && !this.result) {
        const files = event.dataTransfer.files;
        if (files.length > 0) {
          this.$emit('file-dropped', files);
        }
      }
    },
    
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    getFileIcon(fileType) {
      if (fileType.includes('pdf')) return 'fas fa-file-pdf';
      if (fileType.includes('image')) return 'fas fa-file-image';
      if (fileType.includes('word') || fileType.includes('docx')) return 'fas fa-file-word';
      if (fileType.includes('excel') || fileType.includes('xlsx') || fileType.includes('csv')) return 'fas fa-file-excel';
      if (fileType.includes('text')) return 'fas fa-file-alt';
      return 'fas fa-file';
    }
  }
}
</script>