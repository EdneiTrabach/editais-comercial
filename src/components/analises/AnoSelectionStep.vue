<template>
  <div class="selection-steps">
    <AnoSelection 
      :anos="anos" 
      :processos="processos"
      :selectedAno="selectedAno"
      @select-ano="$emit('select-ano', $event)"
    />
  </div>
</template>

<script>
import AnoSelection from '@/components/lances/AnoSelection.vue'

export default {
  name: 'AnoSelectionStep',
  components: {
    AnoSelection
  },
  props: {
    anos: {
      type: Array,
      required: true
    },
    processos: {
      type: Array,
      required: true
    },
    selectedAno: {
      type: Number,
      required: true
    }
  },
  emits: ['select-ano']
}
</script>

<style scoped>
.selection-steps {
  margin-bottom: 1.5rem;
}
</style>
