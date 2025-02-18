// src/services/ibgeService.ts

interface Municipio {
  id: number;
  nome: string;
  latitude: number;
  longitude: number;
}

// Criar um banco de coordenadas local
const coordenadasMunicipios = new Map<string, {latitude: number, longitude: number}>();

// Função para carregar coordenadas do banco de dados local
const carregarCoordenadas = async (uf: string) => {
  try {
    // Primeiro tenta carregar do localStorage para cache
    const cacheKey = `coordenadas_${uf}`;
    const cachedData = localStorage.getItem(cacheKey);
    
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    // Se não houver cache, carrega da API do IBGE e depois geocodifica
    const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
    const municipios = await response.json();
    
    // Salva em cache
    localStorage.setItem(cacheKey, JSON.stringify(municipios));
    
    return municipios;
  } catch (error) {
    console.error('Erro ao carregar coordenadas:', error);
    throw new Error('Não foi possível carregar as coordenadas dos municípios');
  }
};

export const ibgeService = {
  async getMunicipios(uf: string): Promise<Municipio[]> {
    try {
      const municipios = await carregarCoordenadas(uf);
      
      return municipios.map((municipio: any) => ({
        id: municipio.id,
        nome: municipio.nome,
        // Aqui usamos as coordenadas do nosso banco local
        latitude: coordenadasMunicipios.get(municipio.id)?.latitude || 0,
        longitude: coordenadasMunicipios.get(municipio.id)?.longitude || 0
      }));

    } catch (error) {
      console.error('Erro na requisição:', error);
      throw new Error('Não foi possível carregar os municípios');
    }
  }
};