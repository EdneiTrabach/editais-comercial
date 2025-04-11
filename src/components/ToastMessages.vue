<!-- filepath: d:\PROJETOS-EL\editais-comercial\src\components\ToastMessages.vue -->
<template>
  <div class="toast-container">
    <transition-group name="toast">
      <div 
        v-for="toast in toasts" 
        :key="toast.id" 
        :class="['toast', 'toast-' + toast.type, { 'show': toast.show }]"
      >
        <div class="toast-icon">
          <i :class="getIconClass(toast.type)"></i>
        </div>
        <div class="toast-message">{{ toast.message }}</div>
        <button type="button" class="toast-close" @click="$emit('remove-toast', toast.id)">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script>
export default {
  name: 'ToastMessages',
  props: {
    toasts: {
      type: Array,
      required: true
    }
  },
  emits: ['remove-toast'],
  methods: {
    getIconClass(type) {
      switch (type) {
        case 'success':
          return 'fas fa-check-circle';
        case 'error':
          return 'fas fa-exclamation-circle';
        case 'warning':
          return 'fas fa-exclamation-triangle';
        case 'info':
          return 'fas fa-info-circle';
        default:
          return 'fas fa-info-circle';
      }
    }
  }
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 400px;
  pointer-events: none;
}

.toast {
  padding: 14px 16px;
  border-radius: 8px;
  box-shadow: 0 6px 16px rgba(0,0,0,0.2);
  display: flex;
  align-items: center;
  min-width: 280px;
  max-width: 400px;
  transition: all 0.3s ease;
  opacity: 0;
  transform: translateX(30px);
  backdrop-filter: blur(4px);
  pointer-events: auto;
  margin-bottom: 4px;
}

.toast.show {
  opacity: 1;
  transform: translateX(0);
}

.toast-icon {
  margin-right: 14px;
  font-size: 22px;
  flex-shrink: 0;
}

.toast-message {
  font-size: 14px;
  flex: 1;
  line-height: 1.4;
  padding-right: 10px;
  word-break: break-word;
  font-weight: 500;
}

.toast-close {
  background: transparent;
  border: none;
  color: inherit;
  opacity: 0.6;
  cursor: pointer;
  font-size: 14px;
  padding: 4px 6px;
  margin-left: 4px;
  border-radius: 4px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.toast-close:hover {
  opacity: 1;
  background-color: rgba(0, 0, 0, 0.1);
}

.toast-success {
  background-color: rgba(46, 204, 113, 0.95);
  color: white;
  border-left: 5px solid #27ae60;
}

.toast-error {
  background-color: rgba(231, 76, 60, 0.95);
  color: white;
  border-left: 5px solid #c0392b;
}

.toast-warning {
  background-color: rgba(241, 196, 15, 0.95);
  color: #795014;
  border-left: 5px solid #f39c12;
}

.toast-info {
  background-color: rgba(52, 152, 219, 0.95);
  color: white;
  border-left: 5px solid #2980b9;
}

.toast-enter-active, .toast-leave-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

@media (max-width: 768px) {
  .toast-container {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: calc(100% - 20px);
  }
  
  .toast {
    min-width: auto;
    width: 100%;
    max-width: 100%;
  }
}
</style>