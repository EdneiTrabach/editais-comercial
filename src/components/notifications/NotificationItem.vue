<template>
  <div :class="['notification-item', { 'unread': !notification.read }]">
    <div class="notification-icon" :class="notification.tipo">
      <img :src="getIconForType(notification.tipo)" :alt="notification.tipo" />
    </div>
    <div class="notification-content">
      <div class="notification-header">
        <div class="title-area">
          <h4 class="notification-title">{{ notification.title }}</h4>
          <span v-if="notification.nivel" :class="['notification-level', getLevelClass(notification.nivel)]">
            {{ formatLevel(notification.nivel) }}
          </span>
        </div>
        <span class="notification-time">{{ formatTime(notification.created_at) }}</span>
      </div>
      
      <p class="notification-message">{{ notification.message }}</p>
      
      <div v-if="notification.processo" class="notification-processo">
        <span class="processo-label">Processo:</span>
        <span class="processo-numero">{{ notification.processo.numero_processo }}</span> -
        <span class="processo-orgao">{{ notification.processo.orgao }}</span>
      </div>
      
      <div v-if="notification.resolved" class="notification-resolution">
        <div class="resolution-header">
          <span class="resolution-label">Resolvido por:</span>
          <span class="resolution-time">{{ formatTime(notification.resolved_at) }}</span>
        </div>
        <div class="resolver-info">{{ notification.resolver?.nome || 'Sistema' }}</div>
        <p v-if="notification.observation" class="resolution-observation">
          {{ notification.observation }}
        </p>
      </div>
      
      <div class="notification-actions">
        <button @click="markRead" class="btn-action">
          <i class="fas fa-check"></i> Marcar como lida
        </button>
        <button @click="resolve" class="btn-action highlight">
          <i class="fas fa-clipboard-check"></i> Resolver
        </button>
      </div>
    </div>
  </div>
</template>

<script src="./NotificationItem.js"></script>