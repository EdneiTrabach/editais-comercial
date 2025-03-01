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
  // Para requisições de navegação, responder com index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html')
        .then(response => response || fetch(event.request))
    );
    return;
  }
  
  // Não interceptar requisições para o Supabase
  if (event.request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // Retorna fallback para ícones ou imagens
            if (event.request.url.match(/\.(jpg|jpeg|png|gif|svg)$/)) {
              return caches.match('/icons/fallback.svg');
            }
            
            throw new Error('Network error');
          });
      })
  );
});

// Adicionar evento de ativação para limpar caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );
});