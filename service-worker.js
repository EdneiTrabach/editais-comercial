// public/service-worker.js
const CACHE_NAME = 'editais-comerciais-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/icons/pdf.svg',
  '/icons/excel.svg',
  '/icons/fallback.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .catch(error => console.error('Erro no cache:', error))
  );
});

self.addEventListener('fetch', (event) => {
  // Não intercepta requisições para o Supabase
  if (event.request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).catch(() => {
          // Retorna imagem fallback para ícones que falharem
          if (event.request.url.includes('/icons/')) {
            return caches.match('/icons/fallback.svg');
          }
          throw new Error('Network error');
        });
      })
  );
});

// Adicione este handler para lidar com reconexões
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'RECONNECT') {
    // Limpa o cache para forçar novas requisições
    caches.delete(CACHE_NAME).then(() => {
      // Notifica a página que o cache foi limpo
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'CACHE_CLEARED'
          })
        })
      })
    })
  }
})

// Adicione também este evento:
self.addEventListener('activate', (event) => {
  // Reivindicar controle imediatamente
  event.waitUntil(self.clients.claim())
})