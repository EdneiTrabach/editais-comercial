// public/service-worker.js
const CACHE_NAME = 'editais-comercial-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/assets/index.css',
  '/assets/index.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME;
          })
          .map((cacheName) => {
            return caches.delete(cacheName);
          })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Para requisições à API do Supabase e outras externas, vamos sempre para a rede
  if (event.request.url.includes('supabase.co') || 
      event.request.url.includes('openai.com') || 
      event.request.url.includes('servicodados.ibge.gov.br')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Para outros recursos, tentamos o cache primeiro
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Se encontramos no cache, retornamos o recurso
      if (response) {
        return response;
      }
      
      // Se não está no cache, fazemos a requisição
      return fetch(event.request).then((response) => {
        // Se a resposta não é válida, retornamos a resposta diretamente
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Se for um recurso que vale a pena cachear, fazemos uma cópia
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      });
    })
  );
});