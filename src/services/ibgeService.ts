// src/services/ibgeService.ts
interface Municipio {
  id: number;
  nome: string;
}

export const ibgeService = {
  async getMunicipios(uf: string): Promise<Municipio[]> {
    try {
      const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
      if (!response.ok) throw new Error('Erro ao buscar municípios');
      const data = await response.json();
      return data.map((municipio: any) => ({
        id: municipio.id,
        nome: municipio.nome
      }));
    } catch (error) {
      console.error('Erro na requisição:', error);
      throw new Error('Não foi possível carregar os municípios');
    }
  }
};