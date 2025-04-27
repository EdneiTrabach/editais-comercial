<!-- filepath: c:\Users\ednei\Desktop\WORKSPACE\editais-comercial\src\components\document-processor\FileUploadArea.vue -->
<template>
  <div class="upload-container">
    <div class="upload-box" @click="triggerFileUpload" @dragover.prevent @drop.prevent="handleDrop">
      <input
        type="file"
        ref="fileInput"
        style="display: none"
        @change="handleFileSelected"
        accept=".pdf,.docx,.xlsx,.html,.jpg,.png"
      />
      
      <!-- Placeholder quando não tem arquivo -->
      <div v-if="!file && !loading && !result" class="upload-placeholder">
        <i class="fas fa-cloud-upload-alt fa-3x"></i>
        <p>Arraste um documento ou clique para selecionar</p>
        <button class="btn-upload">Selecionar arquivo</button>
      </div>

      <!-- Arquivo selecionado -->
      <div v-if="file && !loading && !result" class="file-selected">
        <i class="fas fa-file-alt fa-2x"></i>
        <p>{{ file.name }}</p>
        <div class="action-buttons">
          <button class="btn-process" @click.stop="$emit('process')">Processar</button>
          <button class="btn-cancel" @click.stop="$emit('clear')">Cancelar</button>
        </div>
      </div>

      <!-- Indicador de loading -->
      <div v-if="loading" class="processing">
        <div class="spinner"></div>
        <p>Processando documento...</p>
      </div>
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
  methods: {
    triggerFileUpload() {
      if (!this.loading && !this.result) {
        this.$refs.fileInput.click();
      }
    },
    
    handleFileSelected(event) {
      const file = event.target.files[0];
      if (file) {
        this.$emit('file-selected', file);
      }
    },
    
    handleDrop(event) {
      const file = event.dataTransfer.files[0];
      if (file) {
        this.$emit('file-dropped', file);
      }
      event.preventDefault();
    }
  }
}
</script>