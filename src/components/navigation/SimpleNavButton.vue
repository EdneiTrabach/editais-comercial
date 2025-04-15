<template>
  <button 
    :class="['nav-button', direction, { disabled }]" 
    :disabled="disabled"
    @click="$emit('click')"
  >
    <span v-if="direction === 'prev'" class="icon">←</span>
    <span class="text">{{ text }}</span>
    <span v-if="direction === 'next'" class="icon">→</span>
  </button>
</template>

<script>
export default {
  name: 'SimpleNavButton',
  props: {
    direction: {
      type: String,
      default: 'next',
      validator: (value) => ['next', 'prev'].includes(value)
    },
    text: {
      type: String,
      required: true
    },
    disabled: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style scoped>
.nav-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  background: linear-gradient(45deg, #2768b3, #3182ce);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-button:hover:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.nav-button:active:not(.disabled) {
  transform: translateY(0);
}

.nav-button.disabled {
  background: #94a3b8;
  cursor: not-allowed;
  opacity: 0.7;
}

.icon {
  font-size: 18px;
  line-height: 1;
}

.prev .icon {
  margin-right: 4px;
}

.next .icon {
  margin-left: 4px;
}

@keyframes pulse {
  0% { opacity: 0.8; }
  50% { opacity: 1; }
  100% { opacity: 0.8; }
}

.nav-button:not(.disabled) .icon {
  animation: pulse 1.5s infinite;
}
</style>