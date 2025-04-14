<template>
  <i class="fas fa-microchip" :style="{ color: color }" :class="classes"></i>
</template>

<script>
export default {
  name: 'IconSistemasImplantar',
  props: {
    color: {
      type: String,
      default: 'currentColor'
    },
    classes: {
      type: String,
      default: ''
    }
  }
}
</script>