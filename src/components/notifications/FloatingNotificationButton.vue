<template>
  <div 
    v-if="unreadCount > 0" 
    class="floating-notification-button"
    @click="onClick"
    :title="unreadCount === 1 ? '1 notificação não lida' : `${unreadCount} notificações não lidas`"
  >
    <img src="/icons/bell.svg" alt="Notificações" class="notification-icon" />
    <span class="notification-badge">{{ unreadCount }}</span>
  </div>
</template>

<script>
export default {
  name: 'FloatingNotificationButton',
  props: {
    unreadCount: {
      type: Number,
      default: 0
    }
  },
  emits: ['click'],
  setup(props, { emit }) {
    const onClick = () => {
      emit('click');
    };

    return {
      onClick
    };
  }
}
</script>

<style>
.floating-notification-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #193155 0%, #254677 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  z-index: 999;
  transition: all 0.3s ease;
}

.floating-notification-button:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.35);
}

.floating-notification-button .notification-icon {
  width: 24px;
  height: 24px;
  filter: brightness(0) invert(1);
}

.floating-notification-button .notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  background-color: #D98E77;
  color: white;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
}

/* Adicione suporte para tema escuro */
[data-theme="dark"] .floating-notification-button {
  background: linear-gradient(135deg, #254677 0%, #193155 100%);
}
</style>