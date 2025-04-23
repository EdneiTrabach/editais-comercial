<template>
  <div class="color-cell-container">
    <div class="color-indicator" :style="colorStyle"></div>
    <span class="color-hex">{{ color }}</span>
  </div>
</template>

<script>
export default {
  name: 'ColorCell',
  props: {
    color: {
      type: String,
      default: '#FFFFFF'
    }
  },
  computed: {
    colorStyle() {
      return {
        backgroundColor: this.color || '#FFFFFF',
        border: this.color === '#FFFFFF' ? '1px solid #e5e7eb' : 'none'
      };
    }
  }
}
</script>

<style scoped>
.color-cell-container {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
}

.color-indicator {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.color-hex {
  font-size: 0.85rem;
  color: #64748b;
  font-family: monospace;
}
</style>