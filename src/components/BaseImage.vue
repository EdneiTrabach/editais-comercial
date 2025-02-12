// src/components/BaseImage.vue
<template>
  <img 
    :src="validateImagePath(src)"
    @error="handleImageError"
    :alt="alt"
    v-bind="$attrs"
  >
</template>

<script setup>
import { defineProps } from 'vue'
import { buildUrl } from '@/utils/url'

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: ''
  },
  fallbackImage: {
    type: String,
    default: '/icons/fallback.svg'
  }
})

const validateImagePath = (path) => {
  if (!path) return props.fallbackImage
  return buildUrl(path)
}

const handleImageError = (e) => {
  e.target.src = props.fallbackImage
}
</script>