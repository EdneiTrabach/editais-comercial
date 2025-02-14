<template>
  <label :class="{ 'required': isRequired }">
    {{ text }}
    <span v-if="isRequired" class="required-mark">*</span>
  </label>
</template>

<script setup>
defineProps({
  text: {
    type: String,
    required: true
  },
  isRequired: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.required {
  display: flex;
  gap: 0.2rem;
  align-items: baseline;
}

.required-mark {
  color: #dc3545;
  font-weight: bold;
}
</style>
