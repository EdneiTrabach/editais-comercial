<template>
  <div class="resolve-form-overlay">
    <div class="resolve-form">
      <div class="resolve-form-header">
        <h3>Resolver Notificação</h3>
        <button @click="close" class="btn-close">
          <span class="close-icon">&times;</span>
        </button>
      </div>

      <div class="notification-details">
        <div class="notification-title-row">
          <h4>{{ notification.title }}</h4>
          <span v-if="notification.nivel" :class="['notification-level', getLevelClass(notification.nivel)]">
            {{ formatLevel(notification.nivel) }}
          </span>
        </div>
        <p>{{ notification.message }}</p>
        
        <div v-if="notification.processo" class="notification-processo">
          <span class="processo-label">Processo:</span>
          <span class="processo-numero">{{ notification.processo.numero_processo }}</span> -
          <span class="processo-orgao">{{ notification.processo.orgao }}</span>
        </div>
      </div>

      <div class="form-group">
        <label for="observation">Observação (opcional)</label>
        <textarea 
          id="observation" 
          v-model="observation" 
          placeholder="Adicione uma observação sobre a resolução..."
          rows="4"
        ></textarea>
      </div>

      <div class="form-actions">
        <button @click="close" class="btn-cancel">Cancelar</button>
        <button @click="handleResolve" class="btn-resolve" :disabled="loading">
          {{ loading ? 'Resolvendo...' : 'Resolver' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script src="./ResolveNotificationForm.js"></script>