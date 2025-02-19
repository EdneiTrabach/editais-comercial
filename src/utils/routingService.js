import { calcularDistanciaHaversine } from './distance';

const OSRM_API = 'https://router.project-osrm.org/route/v1/driving';

export async function calcularDistanciaRota(origem, destino) {
  try {
    // Formato: longitude,latitude
    const coordsOrigem = `${origem.lng},${origem.lat}`;
    const coordsDestino = `${destino.longitude},${destino.latitude}`;
    
    const url = `${OSRM_API}/${coordsOrigem};${coordsDestino}?overview=false`;
    
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Falha na requisição da rota');
    }

    const data = await response.json();
    
    if (data.code !== 'Ok' || !data.routes?.[0]) {
      throw new Error('Erro ao calcular rota');
    }

    // OSRM retorna distância em metros, convertemos para km
    const distanciaKm = Math.round(data.routes[0].distance / 1000);
    return distanciaKm;

  } catch (error) {
    console.error('Erro no cálculo da rota:', error);
    // Em caso de falha, usa Haversine como fallback
    return calcularDistanciaHaversine(
      origem.lat,
      origem.lng,
      destino.latitude,
      destino.longitude
    );
  }
}