import { calcularDistanciaHaversine } from './distance';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
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

    // Usando API própria como proxy para o Google Maps
    const response = await fetch('/api/calcular-distancia', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ origem, destino })
    });

    if (!response.ok) {
      throw new Error('Erro na requisição do serviço de distância');
    }

    const data = await response.json();
    
    if (data.status === 'OK') {
      const distanciaKm = Math.round(data.distance / 1000);
      
      cache.set(cacheKey, distanciaKm);
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: Array.from(cache.entries()),
        timestamp: Date.now()
      }));
      
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