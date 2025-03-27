<template>
  <div class="cards-navigation">
    <div class="nav-card-row">
      <div class="nav-card" @click="$emit('navigate', 'users')">
        <div class="nav-card-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
        <h3 class="nav-card-title">Administração de Usuários</h3>
        <p class="nav-card-description">
          Gerencie usuários do sistema, defina permissões, ative ou desative contas e envie notificações.
        </p>
        <button class="nav-card-button">Acessar</button>
      </div>

      <div class="nav-card" @click="$emit('open-notification')">
        <div class="nav-card-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
          </svg>
        </div>
        <h3 class="nav-card-title">Enviar Notificação </h3>
        <p class="nav-card-description">
          Envie notificações para usuários do sistema, alertas e informações importantes.
        </p>
        <button class="nav-card-button">Acessar</button>
      </div>

      <div class="nav-card" @click="$emit('navigate', 'updates')">
        <div class="nav-card-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
            <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
        </div>
        <h3 class="nav-card-title">Atualizações do Sistema</h3>
        <p class="nav-card-description">
          Registre e acompanhe atualizações do sistema, novas funcionalidades e correções de problemas.
        </p>
        <button class="nav-card-button">Acessar</button>
      </div>

      <div class="nav-card" @click="router.push('/backups')">
        <div class="nav-card-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
          </svg>
        </div>
        <h3 class="nav-card-title">Backup do Sistema</h3>
        <p class="nav-card-description">
          Gerencie backups do sistema, realize download dos dados e restaure backups anteriores.
        </p>
        <button class="nav-card-button">Acessar</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HomeConfiguracoes',
  props: {
    router: Object
  },
  emits: ['navigate', 'open-notification']
}
</script>

<style scoped>
/* Estilos para os cards de navegação */
.cards-navigation {
  padding: 2rem 0;
}

.nav-card-row {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.nav-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 2rem;
  flex: 1;
  min-width: 300px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.nav-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.12);
}

.nav-card-icon {
  font-size: 3rem;
  color: #193155;
  margin-bottom: 1.5rem;
  background: rgba(59, 130, 246, 0.1);
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-card-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1rem;
}

.nav-card-description {
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 1.5rem;
  flex-grow: 1;
}

.nav-card-button {
  background: linear-gradient(135deg, #193155 0%, #254677 100%);
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-card-button:hover {
  background: linear-gradient(135deg, #254677 0%, #193155 100%);
  transform: translateY(-2px);
}

/* Tema escuro para os cards */
[data-theme="dark"] .nav-card {
  background: #1e293b;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

[data-theme="dark"] .nav-card-icon {
  background: rgba(59, 130, 246, 0.2);
  color: white;
}

[data-theme="dark"] .nav-card-title {
  color: #f8fafc;
}

[data-theme="dark"] .nav-card-description {
  color: #cbd5e1;
}

/* Responsividade */
@media (max-width: 768px) {
  .nav-card-row {
    flex-direction: column;
  }
}
</style>
