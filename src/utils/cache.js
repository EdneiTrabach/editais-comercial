// Em um arquivo utils/cache.js
export function limparCachesLocais() {
  localStorage.clear();
  sessionStorage.clear();
  
  // Limpar qualquer mapa de cache que você esteja usando
  window.caches && window.caches.keys().then(keys => {
    keys.forEach(key => window.caches.delete(key));
  });
  
  console.log('Caches locais limpos com sucesso');
}

// Chame esta função em main.js ou App.vue
import { limparCachesLocais } from './utils/cache';
limparCachesLocais();