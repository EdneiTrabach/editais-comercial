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
  max-width: 350px;
}

.toast {
  padding: 12px 15px;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  min-width: 250px;
  max-width: 350px;
  transition: all 0.3s;
  opacity: 0;
  transform: translateY(-20px);
}

.toast.show {
  opacity: 1;
  transform: translateY(0);
}

.toast-icon {
  margin-right: 12px;
  font-size: 20px;
}

.toast-message {
  font-size: 14px;
  flex: 1;
}

.toast-success {
  background-color: #d4edda;
  color: #155724;
  border-left: 4px solid #28a745;
}

.toast-error {
  background-color: #f8d7da;
  color: #721c24;
  border-left: 4px solid #dc3545;
}

.toast-warning {
  background-color: #fff3cd;
  color: #856404;
  border-left: 4px solid #ffc107;
}

.toast-info {
  background-color: #d1ecf1;
  color: #0c5460;
  border-left: 4px solid #17a2b8;
}

.toast-enter-active, .toast-leave-active {
  transition: all 0.3s;
}

.toast-enter-from, .toast-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>