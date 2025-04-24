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