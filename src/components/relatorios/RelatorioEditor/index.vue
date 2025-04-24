<template>
  <div class="editor-container">
    <div class="editor-toolbar">
      <div class="toolbar-group">
        <button class="toolbar-btn" @click="execCommand('bold')" title="Negrito">
          <i class="fas fa-bold"></i>
        </button>
        <button class="toolbar-btn" @click="execCommand('italic')" title="Itálico">
          <i class="fas fa-italic"></i>
        </button>
        <button class="toolbar-btn" @click="execCommand('underline')" title="Sublinhado">
          <i class="fas fa-underline"></i>
        </button>
      </div>
      
      <div class="toolbar-group">
        <button class="toolbar-btn" @click="execCommand('justifyLeft')" title="Alinhar à esquerda">
          <i class="fas fa-align-left"></i>
        </button>
        <button class="toolbar-btn" @click="execCommand('justifyCenter')" title="Centralizar">
          <i class="fas fa-align-center"></i>
        </button>
        <button class="toolbar-btn" @click="execCommand('justifyRight')" title="Alinhar à direita">
          <i class="fas fa-align-right"></i>
        </button>
        <button class="toolbar-btn" @click="execCommand('justifyFull')" title="Justificar">
          <i class="fas fa-align-justify"></i>
        </button>
      </div>
      
      <div class="toolbar-group">
        <select class="toolbar-select" @change="execCommandWithArg('fontSize', $event.target.value)">
          <option value="1">8pt</option>
          <option value="2">10pt</option>
          <option value="3" selected>12pt</option>
          <option value="4">14pt</option>
          <option value="5">18pt</option>
          <option value="6">24pt</option>
          <option value="7">36pt</option>
        </select>
        
        <select class="toolbar-select" @change="execCommandWithArg('formatBlock', $event.target.value)">
          <option value="p">Parágrafo</option>
          <option value="h1">Título 1</option>
          <option value="h2">Título 2</option>
          <option value="h3">Título 3</option>
          <option value="h4">Título 4</option>
        </select>
      </div>
      
      <div class="toolbar-group">
        <button class="toolbar-btn" @click="execCommand('insertUnorderedList')" title="Lista não ordenada">
          <i class="fas fa-list-ul"></i>
        </button>
        <button class="toolbar-btn" @click="execCommand('insertOrderedList')" title="Lista ordenada">
          <i class="fas fa-list-ol"></i>
        </button>
      </div>
      
      <div class="toolbar-group">
        <input type="color" class="toolbar-color" @change="execCommandWithArg('foreColor', $event.target.value)" title="Cor do texto">
      </div>
    </div>
    
    <div class="editor-wrapper">
      <div 
        class="editor-content" 
        contenteditable="true"
        @input="updateContent"
        ref="editor"
      ></div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue';

export default {
  name: 'RelatorioEditor',
  
  props: {
    processo: {
      type: Object,
      required: true
    },
    conteudo: {
      type: String,
      default: ''
    }
  },
  
  emits: ['update:conteudo'],
  
  setup(props, { emit }) {
    const editor = ref(null);
    
    // Inicializar o editor com o conteúdo
    onMounted(() => {
      if (editor.value && props.conteudo) {
        editor.value.innerHTML = props.conteudo;
      }
    });
    
    // Observar mudanças no conteúdo de props
    watch(() => props.conteudo, (newConteudo) => {
      if (editor.value && newConteudo && editor.value.innerHTML !== newConteudo) {
        editor.value.innerHTML = newConteudo;
      }
    });
    
    // Executar comandos de formatação
    const execCommand = (command) => {
      document.execCommand(command, false, null);
      updateContent();
    };
    
    const execCommandWithArg = (command, arg) => {
      document.execCommand(command, false, arg);
      updateContent();
    };
    
    // Atualizar o conteúdo quando houver alterações
    const updateContent = () => {
      if (editor.value) {
        emit('update:conteudo', editor.value.innerHTML);
      }
    };
    
    return {
      editor,
      execCommand,
      execCommandWithArg,
      updateContent
    };
  }
};
</script>

<style scoped>
.editor-container {
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  height: 100%;
  min-height: 600px;
}

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px;
  border-bottom: 1px solid #e1e1e1;
  background-color: #f9f9f9;
  border-radius: 8px 8px 0 0;
}

.toolbar-group {
  display: flex;
  gap: 5px;
  padding: 0 5px;
  border-right: 1px solid #e1e1e1;
}

.toolbar-group:last-child {
  border-right: none;
}

.toolbar-btn {
  background: none;
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  transition: all 0.2s ease;
}

.toolbar-btn:hover {
  background-color: #f0f0f0;
  border-color: #ddd;
}

.toolbar-btn:active {
  background-color: #e6e6e6;
}

.toolbar-select {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  font-size: 14px;
  color: #333;
}

.toolbar-color {
  height: 30px;
  width: 30px;
  padding: 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.editor-content {
  width: 95%;
  min-height: 100%;
  outline: none;
  background-color: white;
  padding: 20px 40px;
  box-shadow: 0 0 0 1px #e1e1e1;
  border-radius: 2px;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
}

.editor-content:focus {
  box-shadow: 0 0 0 2px #4299e1;
}

.editor-content h1, .editor-content h2, .editor-content h3, .editor-content h4 {
  margin-top: 1.5em;
  margin-bottom: 0.75em;
  font-weight: 600;
}

.editor-content p {
  margin-bottom: 1em;
}

.editor-content ul, .editor-content ol {
  margin-left: 2em;
  margin-bottom: 1em;
}
</style>