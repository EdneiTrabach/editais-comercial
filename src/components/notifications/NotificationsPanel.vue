<template>
  <div v-if="show" 
       class="notifications-panel" 
       :style="panelStyle"
       ref="panel">
    
    <!-- Barra de arraste no topo -->
    <div class="drag-handle" 
         @mousedown="startDrag"
         @touchstart="startDrag">
      <span class="drag-icon">⋮⋮</span>
    </div>

    <div class="notifications-header">
      <h3>Notificações</h3>
      <div class="notifications-actions">
        <button @click="markAllAsRead" class="btn-mark-all" :disabled="!hasUnread">
          Marcar todas como lidas
        </button>
        <button @click="close" class="btn-close">
          <span class="close-icon">&times;</span>
        </button>
      </div>
    </div>

    <div class="notifications-tabs">
      <button 
        @click="activeTab = 'all'" 
        :class="['tab-btn', { active: activeTab === 'all' }]"
      >
        Todas ({{ notifications.length }})
      </button>
      <button 
        @click="activeTab = 'unread'" 
        :class="['tab-btn', { active: activeTab === 'unread' }]"
      >
        Não lidas ({{ unreadCount }})
      </button>
      <button 
        @click="activeTab = 'resolved'" 
        :class="['tab-btn', { active: activeTab === 'resolved' }]"
      >
        Resolvidas
      </button>
    </div>

    <div v-if="loading" class="notifications-loading">
      Carregando notificações...
    </div>

    <div v-else-if="filteredNotifications.length === 0" class="notifications-empty">
      <svg class="empty-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
      </svg>
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
    <div class="resize-handle resize-handle-se" @mousedown="startResize" @touchstart="startResize"></div>
  </div>
</template>

<script src="./NotificationsPanel.js"></script>
<style src="../../assets/styles/notifications.css"></style>
