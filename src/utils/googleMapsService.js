import { calcularDistanciaHaversine } from './distance';

// Removendo dependência da API Google Maps que está falhando
const CACHE_KEY = 'distancias_cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 horas

const cache = new Map();

// Carrega cache existente
try {
  const savedCache = localStorage.getItem(CACHE_KEY);
  if (savedCache) {
    const { data, timestamp } = JSON.parse(savedCache);
    if (Date.now() - timestamp < CACHE_EXPIRY) {
      data.forEach(([key, value]) => cache.set(key, value));
    }
  }
} catch (error) {
  console.warn('Erro ao carregar cache:', error);
}

// Usando OSRM API pública gratuita em vez da API Google Maps com problemas
export async function calcularDistanciaRota(origem, destino) {
  try {
    const cacheKey = `${origem.lat},${origem.lng}-${destino.latitude},${destino.longitude}`;
    
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    // Usando o OSRM API (Open Source Routing Machine)
    const urlOSRM = `https://router.project-osrm.org/route/v1/driving/${origem.lng},${origem.lat};${destino.longitude},${destino.latitude}?overview=false`;
    
    const response = await fetch(urlOSRM);

    if (!response.ok) {
      throw new Error('Erro na requisição do serviço de distância');
    }

    const data = await response.json();
    
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      // OSRM retorna distância em metros, convertemos para km
      const distanciaKm = Math.round(data.routes[0].distance / 1000);
      
      // Salvar no cache
      cache.set(cacheKey, distanciaKm);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: Array.from(cache.entries()),
          timestamp: Date.now()
        }));
      } catch (e) {
        console.warn('Erro ao salvar no cache:', e);
      }
      
      return distanciaKm;
    }
    
    throw new Error('Não foi possível calcular a rota');

  } catch (error) {
    console.error('Erro no cálculo da rota:', error);
    // Fallback para cálculo Haversine
    return calcularDistanciaHaversine(
      origem.lat,
      origem.lng,
      destino.latitude, 
      destino.longitude
    );
  }
}