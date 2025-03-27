<template>
  <div class="acoes-column">
    <button 
      class="btn-action delete"
      @click="handleDelete"
      :title="'Excluir processo'"
    >
      <img src="/icons/lixeira.svg" alt="Excluir" class="icon" />
    </button>
  </div>
</template>

<script>
export default {
  name: 'AcoesColumn',
  props: {
    processo: {
      type: Object,
      required: true
    }
  },
  methods: {
    handleDelete() {
      this.$emit('delete', this.processo)
    }
  }
}
</script>

<style src="./AcoesColumn.css"></style>