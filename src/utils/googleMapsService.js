import { calcularDistanciaHaversine } from './distance';

// Cache para distâncias já calculadas
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

export async function calcularDistanciaRota(origem, destino) {
  try {
    const cacheKey = `${origem.lat},${origem.lng}-${destino.latitude},${destino.longitude}`;
    
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    // Usando Haversine para cálculo local (sem chamadas de API)
    const distancia = calcularDistanciaHaversine(
      origem.lat,
      origem.lng,
      destino.latitude,
      destino.longitude
    );
    
    // Salvar no cache
    cache.set(cacheKey, distancia);
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: Array.from(cache.entries()),
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('Erro ao salvar no cache:', e);
    }
    
    return distancia;
    
  } catch (error) {
    console.error('Erro no cálculo da distância:', error);
    return calcularDistanciaHaversine(
      origem.lat,
      origem.lng,
      destino.latitude, 
      destino.longitude
    );
  }
}