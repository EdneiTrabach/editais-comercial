<template>
  <div v-if="show" 
       class="notifications-panel" 
       :style="panelStyle"
       ref="panel">
    
    <!-- Barra de arraste no topo -->
    <div class="drag-handle" 
         @mousedown="startDrag"
         @touchstart="startDrag">
      <span class="drag-icon"><i class="fas fa-grip-lines"></i></span>
    </div>

    <div class="notifications-header">
      <h3><i class="fas fa-bell"></i> Notificações</h3>
      <div class="notifications-actions">
        <button @click="markAllAsRead" class="btn-mark-all" :disabled="!hasUnread">
          <span class="check-icon">✓</span> Marcar todas como lidas
        </button>
        <button @click="close" class="btn-close">
          <span class="close-icon">×</span>
        </button>
      </div>
    </div>

    <div class="notifications-tabs">
      <button 
        @click="activeTab = 'all'" 
        :class="['tab-btn', { active: activeTab === 'all' }]"
      >
        <i class="fas fa-inbox"></i> Todas <span class="badge">{{ notifications.length }}</span>
      </button>
      <button 
        @click="activeTab = 'unread'" 
        :class="['tab-btn', { active: activeTab === 'unread' }]"
      >
        <i class="fas fa-envelope"></i> Não lidas <span class="badge">{{ unreadCount }}</span>
      </button>
      <button 
        @click="activeTab = 'resolved'" 
        :class="['tab-btn', { active: activeTab === 'resolved' }]"
      >
        <i class="fas fa-check-circle"></i> Resolvidas
      </button>
    </div>

    <div v-if="loading" class="notifications-loading">
      <i class="fas fa-spinner fa-spin"></i> Carregando notificações...
    </div>

    <div v-else-if="filteredNotifications.length === 0" class="notifications-empty">
      <i class="fas fa-bell-slash empty-icon"></i>
      <p>Nenhuma notificação {{ activeTab === 'unread' ? 'não lida' : activeTab === 'resolved' ? 'resolvida' : '' }}</p>
    </div>

    <div v-else class="notifications-list">
      <NotificationItem 
        v-for="notification in filteredNotifications" 
        :key="notification.id"
        :notification="notification"
        @mark-read="markAsRead"
        @resolve="openResolveForm"
      />
    </div>

    <!-- Formulário para resolver notificação -->
    <ResolveNotificationForm
      v-if="showResolveForm"
      :notification="selectedNotification"
      @close="showResolveForm = false"
      @resolved="onNotificationResolved"
    />

    <!-- Elementos de redimensionamento -->
    <div class="resize-handle resize-handle-se" @mousedown="startResize" @touchstart="startResize">
      <i class="fas fa-caret-right"></i>
    </div>
  </div>
</template>

<script src="./NotificationsPanel.js"></script>
<style src="../../assets/styles/notifications.css"></style>
