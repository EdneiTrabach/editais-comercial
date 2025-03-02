<script setup>
import { RouterView } from 'vue-router'
import { ref, watch, onMounted } from 'vue'
import NavigationButtons from './components/NavigationButtons.vue'

// Definir a variável isSidebarExpanded
const isSidebarExpanded = ref(true) // Valor padrão: expandido

// Carregar o estado do sidebar do localStorage na montagem
onMounted(() => {
  const savedState = localStorage.getItem('sidebarState')
  if (savedState !== null) {
    isSidebarExpanded.value = savedState === 'true'
  }
})

// Função para atualizar o estado quando o sidebar mudar
const handleSidebarToggle = (expanded) => {
  isSidebarExpanded.value = expanded
}

// Opcional: escutar eventos do localStorage para sincronização entre componentes
window.addEventListener('storage', (event) => {
  if (event.key === 'sidebarState') {
    isSidebarExpanded.value = event.newValue === 'true'
  }
})
</script>

<template>
  <div class="app-container">
    <RouterView @sidebarToggle="handleSidebarToggle" />
    <NavigationButtons :isSidebarExpanded="isSidebarExpanded" />
  </div>
</template>

<style scoped>
* {
  font-family: 'Roboto', sans-serif;
  box-sizing: border-box;
}
header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

#app {
  height: 100%;
  font-family: 'Roboto', sans-serif;
  position: relative;
}
</style>
