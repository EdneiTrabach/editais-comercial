<template>
  <div class="modal-backdrop">
    <div class="modal-content">
      <div class="modal-header">
        <h2>{{ config.title || "Confirmar Ação" }}</h2>
        <button @click="$emit('close')" class="close-btn">&times;</button>
      </div>
      
      <div class="modal-body">
        <p class="message">{{ config.message }}</p>
        <p v-if="config.warning" class="warning">{{ config.warning }}</p>
        
        <div class="form-buttons">
          <button 
            type="button" 
            class="btn-secondary" 
            @click="handleCancel"
          >
            Cancelar
          </button>
          <button 
            type="button" 
            :class="['btn-primary', { 'btn-danger': isDangerAction }]"
            @click="handleConfirm"
          >
            {{ config.confirmText || "Confirmar" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';

export default {
  props: {
    config: {
      type: Object,
      required: true
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const isDangerAction = computed(() => {
      const confirmText = props.config.confirmText?.toLowerCase();
      return confirmText === 'excluir' || confirmText === 'deletar' || confirmText === 'remover';
    });

    const handleConfirm = () => {
      if (typeof props.config.onConfirm === 'function') {
        props.config.onConfirm();
      } else {
        emit('close');
      }
    };

    const handleCancel = () => {
      if (typeof props.config.onCancel === 'function') {
        props.config.onCancel();
      } else {
        emit('close');
      }
    };

    return {
      isDangerAction,
      handleConfirm,
      handleCancel
    };
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 450px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e1e1e1;
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 16px;
}

.message {
  margin-bottom: 16px;
  font-size: 16px;
}

.warning {
  color: #d93025;
  font-weight: 500;
  margin-bottom: 16px;
}

.form-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
}

.btn-danger {
  background-color: #d93025;
}
</style>