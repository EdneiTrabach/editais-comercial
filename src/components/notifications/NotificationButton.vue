<template>
  <button class="notifications-btn sidebar-menu-link" @click="onClick">
    <div class="notification-icon-wrapper">
      <img src="/icons/bell.svg" alt="Notificações" class="icon" />
      <span v-if="count > 0" class="notification-badge">{{ count }}</span>
    </div>
    <span class="link-text">Notificações</span>
  </button>
</template>

<script>
export default {
  name: 'NotificationButton',
  props: {
    count: {
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

<style scoped>
.notifications-btn {
  position: relative;
}

.notification-icon-wrapper {
  position: relative;
  display: inline-block;
}

.notification-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: #ff4757;
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 0.7rem;
  font-weight: bold;
}

/* Estilos específicos para dark mode */
[data-theme="dark"] .notification-badge {
  background-color: #ff6b81;
}
</style>