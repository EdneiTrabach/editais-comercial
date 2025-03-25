<template>
  <div class="empresa-vencedora-coluna">
    <!-- Modo de edição -->
    <EditMode
      v-if="isEditing"
      :empresas="empresas"
      :selected-empresa="selectedEmpresa"
      :numero-contrato="numeroContrato"
      @update:selected-empresa="selectedEmpresa = $event"
      @update:numero-contrato="numeroContrato = $event"
      @save="saveChanges"
      @cancel="cancelEdit"
    />
    
    <!-- Modo de visualização -->
    <DisplayMode
      v-else
      :empresa-nome="empresaNome"
      :numero-contrato="numeroContrato"
      :dados-analise="dadosAnalise"
      @dblclick="startEdit"
    />
  </div>
</template>

<script>
import { onMounted } from 'vue';
import { useEmpresaVencedora } from '@/composables/useEmpresaVencedora';
import EditMode from './EditMode.vue';
import DisplayMode from './DisplayMode.vue';

export default {
  name: 'EmpresaVencedoraColuna',
  
  components: {
    EditMode,
    DisplayMode
  },
  
  props: {
    processo: {
      type: Object,
      required: true
    }
  },
  
  emits: ['update'],
  
  setup(props, { emit }) {
    const {
      empresas,
      isEditing,
      selectedEmpresa,
      numeroContrato,
      dadosAnalise,
      empresaNome,
      loadEmpresas,
      checkDadosAnaliseAutomatica,
      startEdit,
      cancelEdit,
      saveChanges
    } = useEmpresaVencedora(props, emit);
    
    onMounted(async () => {
      await loadEmpresas();
      checkDadosAnaliseAutomatica();
    });
    
    return {
      empresas,
      isEditing,
      selectedEmpresa,
      numeroContrato,
      dadosAnalise,
      empresaNome,
      startEdit,
      cancelEdit,
      saveChanges
    };
  }
}
</script>

<style scoped>
.empresa-vencedora-coluna {
  width: 100%;
  min-height: 24px;
  display: flex;
  align-items: center;
  padding: 6px;
  box-sizing: border-box;
}
</style>