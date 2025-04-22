<template>
  <div class="acoes-column">
    <!-- Botão Editar -->
    <button 
      class="btn-icon edit" 
      @click="$emit('edit', responsavel)"
      title="Editar responsável">
      <img src="/icons/edicao.svg" alt="Editar" class="icon-small">
    </button>
    
    <!-- Botão Ativar/Inativar -->
    <button 
      class="btn-icon" 
      :class="responsavel.status === 'ACTIVE' ? 'deactivate' : 'activate'" 
      @click="$emit('toggle-status', responsavel)"
      :title="responsavel.status === 'ACTIVE' ? 'Inativar responsável' : 'Ativar responsável'">
      <img 
        :src="responsavel.status === 'ACTIVE' ? '/icons/disable.svg' : '/icons/enable.svg'" 
        alt="Status" 
        class="icon-small">
    </button>
    
    <!-- Botão Excluir -->
    <button 
      v-if="podeExcluir"
      class="btn-icon delete" 
      @click="$emit('delete', responsavel)"
      title="Excluir responsável">
      <img src="/icons/lixeira.svg" alt="Excluir" class="icon-small">
    </button>
  </div>
</template>

<script>
export default {
  name: 'ResponsavelAcoes',
  props: {
    responsavel: {
      type: Object,
      required: true
    },
    podeExcluir: {
      type: Boolean,
      default: true
    }
  },
  emits: ['edit', 'toggle-status', 'delete']
}
</script>

<style src="@/assets/styles/components/responsaveis/acoes.css" scoped></style>