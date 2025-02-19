import { GOOGLE_MAPS_API_KEY } from '../config';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return new Response('Método não permitido', { status: 405 });
  }

  try {
    const { origem, destino } = await req.json();
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origem.lat},${origem.lng}&destinations=${destino.lat},${destino.lng}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`
    );

    if (!response.ok) {
      throw new Error('Erro na requisição do Google Maps');
    }

    const data = await response.json();
    
    if (data.status === 'OK' && data.rows[0]?.elements[0]?.status === 'OK') {
      return new Response(JSON.stringify({
        status: 'OK',
        distance: data.rows[0].elements[0].distance.value
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    throw new Error('Erro ao calcular distância');
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}