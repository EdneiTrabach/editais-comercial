<!-- filepath: c:\Users\ednei\Desktop\WORKSPACE\editais-comercial\src\components\DocumentProcessor.vue -->
<template>
  <div class="layout">
    <!-- Adicionar o Sidebar -->
    <TheSidebar @sidebarToggle="handleSidebarToggle" />
    
    <div class="document-processor-container">
      <div class="document-processor-content" :class="{'sidebar-collapsed': !isSidebarExpanded}">
        <!-- Header melhorado com gradiente e ícone -->
        <div class="document-header">
          <div class="header-left">
            <div class="header-icon-title">
              <div class="header-icon">
                <i class="fas fa-file-alt"></i>
              </div>
              <div>
                <h2 class="page-title">Processador de Documentos</h2>
                <p class="page-description">Extraia texto e dados de PDFs, documentos e imagens usando OCR</p>
              </div>
            </div>
          </div>
          <div class="header-actions">
            <button class="btn-tour" @click="startTour" title="Tour guiado">
              <i class="fas fa-question-circle"></i>
              <span>Guia</span>
            </button>
            <button class="btn-settings" @click="showOptions = !showOptions" title="Configurações">
              <i class="fas fa-cog"></i>
              <span>Opções</span>
            </button>
          </div>
        </div>

        <div class="document-processor-main">
          <!-- Área de Upload com feedback visual melhorado -->
          <FileUploadArea 
            :file="file" 
            :loading="loading" 
            :result="result"
            @file-selected="handleFileSelected"
            @file-dropped="handleDrop"
            @process="processFile"
            @clear="clearFile"
            class="document-upload-area"
          />
          
          <!-- Painel lateral de opções com transição suave -->
          <div 
            class="processing-options-panel" 
            :class="{'panel-visible': showOptions || (file && !loading && !result)}"
          >
            <button class="close-panel" @click="showOptions = false" v-if="showOptions">
              <i class="fas fa-times"></i>
            </button>
            
            <ProcessingOptions 
              :options="processingOptions" 
              :server-status="serverStatus"
              @update:options="updateOptions"
            />
          </div>

          <!-- Área de Resultados com UI aprimorada -->
          <ResultDisplay 
            v-if="result" 
            :result="result"
            @reset="reset"
            class="result-area"
          />
          
          <!-- Mensagem de erro visual aprimorada -->
          <div v-if="error" class="process-error">
            <h3><i class="fas fa-exclamation-circle"></i> Erro ao processar o documento</h3>
            <p>{{ error }}</p>
            <button @click="clearError" class="btn-try-again">Tentar novamente</button>
          </div>
        </div>

        <!-- Overlay de carregamento com animação melhorada -->
        <div v-if="loading" class="loading-overlay">
          <div class="loading-container">
            <div class="spinner"></div>
            <p>Processando documento...</p>
            <div class="progress-bar">
              <div class="progress-fill"></div>
            </div>
          </div>
        </div>

        <!-- Feedback de server status -->
        <div v-if="serverStatus && serverStatus.status === 'error'" class="server-status-warning">
          <i class="fas fa-exclamation-triangle"></i>
          <span>Servidor de processamento indisponível. Algumas funções podem estar limitadas.</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import FileUploadArea from './document-processor/FileUploadArea.vue';
import ProcessingOptions from './document-processor/ProcessingOptions.vue';
import ResultDisplay from './document-processor/ResultDisplay.vue';
import TheSidebar from './TheSidebar.vue'; // Importando o componente TheSidebar
import { checkServerStatus, processDocument } from './document-processor/documentProcessorService';
import { ref, onMounted, watch, nextTick } from 'vue';

export default {
  name: 'DocumentProcessor',
  components: {
    FileUploadArea,
    ProcessingOptions,
    ResultDisplay,
    TheSidebar // Registrando o componente
  },
  setup() {
    const file = ref(null);
    const loading = ref(false);
    const error = ref(null);
    const result = ref(null);
    const serverStatus = ref(null);
    const isSidebarExpanded = ref(true);
    const showOptions = ref(false);
    const tourActive = ref(false);
    
    const processingOptions = ref({
      enableOcr: true,
      forceOcr: false,
      includeImages: true,
      includeTables: true
    });

    // Função para manipular o toggle do sidebar
    const handleSidebarToggle = (expanded) => {
      isSidebarExpanded.value = expanded;
    };

    // Detectar o estado do sidebar usando localStorage
    const detectSidebarState = () => {
      const savedState = localStorage.getItem('sidebarState');
      // Se não houver estado salvo, considerar como expandido por padrão
      isSidebarExpanded.value = savedState === null ? true : savedState === 'true';
      console.log('Estado do sidebar detectado:', isSidebarExpanded.value);
    };
    
    // Observar alterações no armazenamento local
    const handleStorage = (event) => {
      if (event.key === 'sidebarState') {
        isSidebarExpanded.value = event.newValue === 'true';
      }
    };

    // Verificar status do servidor ao iniciar
    const checkServer = async () => {
      try {
        serverStatus.value = await checkServerStatus();
      } catch (err) {
        console.error('Erro ao verificar status do servidor:', err);
        serverStatus.value = {
          status: 'error',
          docling_available: false,
          error_message: err.message
        };
      }
    };
    
    onMounted(() => {
      // Detectar estado inicial do sidebar
      detectSidebarState();
      
      // Adicionar listener para alterações no localStorage
      window.addEventListener('storage', handleStorage);
      
      // Monitorar mudanças diretamente na classe do documento
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && 
              mutation.attributeName === 'class' && 
              mutation.target.classList.contains('main-content')) {
            const hasExpandedClass = mutation.target.classList.contains('expanded');
            isSidebarExpanded.value = hasExpandedClass;
          }
        });
      });
      
      // Observar mudanças de classe no main-content
      const mainContent = document.querySelector('.main-content');
      if (mainContent) {
        observer.observe(mainContent, { attributes: true });
        isSidebarExpanded.value = mainContent.classList.contains('expanded');
      }
      
      // Iniciar monitoramento de status de processos
      console.log('Iniciando monitoramento de status de processos');
      checkServer();
      
      // Verificar status a cada 60 segundos
      const interval = setInterval(() => {
        checkServer();
      }, 60000);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('storage', handleStorage);
        observer.disconnect();
      };
    });
    
    const handleFileSelected = (selectedFile) => {
      file.value = selectedFile;
      
      // Auto-configurar opções com base no tipo de arquivo
      if (selectedFile.type === 'image/jpeg' || selectedFile.type === 'image/png') {
        processingOptions.value.enableOcr = true;
        processingOptions.value.forceOcr = true;
        processingOptions.value.includeImages = true;
      }
      
      // Verificar se é um PDF de pequeno tamanho (possivelmente digitalizado)
      const isPDF = selectedFile.type === 'application/pdf';
      const isSmallPDF = isPDF && selectedFile.size < 1024 * 1024; // Menor que 1MB
      
      if (isSmallPDF) {
        processingOptions.value.enableOcr = true;
      }
      
      // Mostrar opções quando um arquivo é selecionado
      showOptions.value = true;
    };
    
    const handleDrop = (files) => {
      if (files && files.length > 0) {
        handleFileSelected(files[0]);
      }
    };
    
    const clearFile = () => {
      file.value = null;
      showOptions.value = false;
    };
    
    const clearError = () => {
      error.value = null;
      // Verificar o status do servidor novamente
      checkServer();
    };
    
    const updateOptions = (newOptions) => {
      processingOptions.value = { ...newOptions };
    };
    
    const reset = () => {
      file.value = null;
      result.value = null;
      error.value = null;
      showOptions.value = false;
    };
    
    const processFile = async () => {
      if (!file.value) return;
      
      loading.value = true;
      result.value = null;
      error.value = null;
      
      try {
        const result_data = await processDocument(file.value, processingOptions.value);
        result.value = result_data;
        showOptions.value = false;
      } catch (err) {
        console.error('Erro ao processar documento:', err);
        error.value = err.message || 'Erro desconhecido ao processar o documento.';
      } finally {
        loading.value = false;
      }
    };
    
    const startTour = () => {
      tourActive.value = true;
      // Aqui você pode implementar um tour do componente
      // usando bibliotecas como Shepherd.js ou intro.js
      alert('Tour do processador de documentos (a ser implementado)');
      tourActive.value = false;
    };
    
    return {
      file,
      loading,
      error,
      result,
      serverStatus,
      processingOptions,
      isSidebarExpanded,
      showOptions,
      tourActive,
      handleFileSelected,
      handleDrop,
      clearFile,
      clearError,
      updateOptions,
      processFile,
      reset,
      startTour,
      handleSidebarToggle // Exportando a função
    };
  }
};
</script>

<style>
@import './document-processor/documentProcessor.css';

/* Estilos adicionais para integração com o sidebar */
.layout {
  display: flex;
  min-height: 100vh;
  width: 100%;
  position: relative;
  overflow: hidden;
}

/* Garantir que o sidebar fique visível e na posição correta */
.layout .sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
}

.document-processor-container {
  flex: 1;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
  position: relative;
}

.document-processor-content {
  height: 100vh;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 1.5rem 2rem;
  overflow-x: hidden;
  overflow-y: auto;
  margin-left: 280px; /* Quando sidebar está expandido */
  box-sizing: border-box;
}

.document-processor-content.sidebar-collapsed {
  margin-left: 80px; /* Quando sidebar está recolhido */
}

/* Ajuste responsivo */
@media (max-width: 768px) {
  .document-processor-content {
    margin-left: 70px;
    padding: 1.25rem;
  }
}

/* Garantir que o conteúdo permaneça visível mesmo que haja problemas com o sidebar */
.document-processor-main {
  position: relative;
  z-index: 1;
}
</style>