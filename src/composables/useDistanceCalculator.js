import { ref, computed, watch } from 'vue'
import { supabase } from '@/lib/supabase' // Adicionar esta importação
import { calcularDistanciaHaversine } from '@/utils/distance.js'
import { calcularDistanciaRota } from '@/utils/googleMapsService'
import { coordenadasMunicipais } from '@/data/coordenadasMunicipios'
import { ibgeService } from '@/services/ibgeService'

export function useDistanceCalculator() {
  const pontoReferencia = ref(null)
  const cidadeOrgao = ref('')
  const distanciaCalculada = ref(null)
  const distanciaManual = ref(false)
  const distanciaManualValue = ref(null)
  const estadoDestino = ref('')
  const municipios = ref([])
  const municipiosCarregados = ref(false)
  const filtroEstadoReferencia = ref('')
  const distanciasSalvas = ref([])
  const calculandoDistancia = ref(false)

  // Array com pontos de referência por estado
  const pontosReferencia = [
    {uf: 'AC', cidade: 'Rio Branco', lat: -9.9746, lng: -67.8249 },
    {uf: 'AL', cidade: 'Maceió', lat: -9.66599, lng: -35.735 },
    {uf: 'AM', cidade: 'Manaus', lat: -3.119, lng: -60.0215 },
    {uf: 'AP', cidade: 'Macapá', lat: 0.0356, lng: -51.0705 },
    {uf: 'BA', cidade: 'Salvador', lat: -12.9718, lng: -38.5011 },
    {uf: 'BA', cidade: 'Itabuna', lat: -14.7876, lng: -39.2788 },
    {uf: 'CE', cidade: 'Fortaleza', lat: -3.7172, lng: -38.5433 },
    {uf: 'DF', cidade: 'Brasília', lat: -15.775, lng: -47.797 },
    {uf: 'ES', cidade: 'Domingos Martins', lat: -20.3632, lng: -40.6592 },
    {uf: 'ES', cidade: 'Vitória', lat: -20.2976, lng: -40.2958 },
    {uf: 'GO', cidade: 'Goiânia', lat: -16.6869, lng: -49.2648 },
    {uf: 'MA', cidade: 'São Luís', lat: -2.53874, lng: -44.2825 },
    {uf: 'MG', cidade: 'Governador Valadares', lat: -18.8513, lng: -41.9555 },
    {uf: 'MG', cidade: 'Belo Horizonte', lat: -19.9167, lng: -43.9345 },
    {uf: 'MG', cidade: 'Uberlândia', lat: -18.9113, lng: -48.2622 },
    {uf: 'MG', cidade: 'Juiz de Fora', lat: -21.7642, lng: -43.3496 },
    {uf: 'MG', cidade: 'Extrema', lat: -22.8544, lng: -46.3175 },
    {uf: 'MG', cidade: 'Varginha' , lat: -21.5557, lng: -45.4364 },
    {uf: 'MS', cidade: 'Campo Grande', lat: -20.4428, lng: -54.6468 },
    {uf: 'MT', cidade: 'Cuiabá', lat: -15.596, lng: -56.0969 },
    {uf: 'PA', cidade: 'Belém', lat: -1.4554, lng: -48.4898 },
    {uf: 'PB', cidade: 'João Pessoa', lat: -7.11532, lng: -34.8641 },
    {uf: 'PE', cidade: 'Recife', lat: -8.0476, lng: -34.877 },
    {uf: 'PI', cidade: 'Teresina', lat: -5.09194, lng: -42.8034 },
    {uf: 'PR', cidade: 'Foz do Iguaçu', lat: -25.5161, lng: -54.5856 },
    {uf: 'PR', cidade: 'Curitiba', lat: -25.4284, lng: -49.2733 },
    {uf: 'PR', cidade: 'Maringá' , lat: -23.4205, lng: -51.9333 },
    {uf: 'PR', cidade: 'Umuarama', lat: -23.7661, lng: -53.3205 },
    {uf: 'RS', cidade: 'Porto Alegre', lat: -30.0346, lng: -51.2177 },
    {uf: 'RJ', cidade: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729 },
    {uf: 'RJ', cidade: 'Nova Friburgo', lat: -22.2826, lng: -42.5311 },
    {uf: 'RN', cidade: 'Natal', lat: -5.79447, lng: -35.211 },
    {uf: 'RO', cidade: 'Porto Velho', lat: -8.76194, lng: -63.9039 },
    {uf: 'RR', cidade: 'Boa Vista', lat: 2.8235, lng: -60.6758 },
    {uf: 'SC', cidade: 'Florianópolis', lat: -27.5954, lng: -48.548 },
    {uf: 'SE', cidade: 'Aracaju', lat: -10.9472, lng: -37.0731 },
    {uf: 'SP', cidade: 'São José do Rio Preto', lat: -20.8118, lng: -49.3758 },
    {uf: 'SP', cidade: 'São José dos Campos', lat: -23.2237, lng: -45.9009 },
    {uf: 'SP', cidade: 'São Paulo', lat: -23.5505, lng: -46.6333 },
    {uf: 'SP', cidade: 'Campinas', lat: -22.9071, lng: -47.0633 },
    {uf: 'SP', cidade: 'Leme', lat: -22.1805, lng: -47.384 },
  ]

  // Pontos filtrados (computed)
  const pontosFiltrados = computed(() => {
    if (!filtroEstadoReferencia.value) {
      return pontosReferencia
    }
    return pontosReferencia.filter(ponto => ponto.uf === filtroEstadoReferencia.value)
  })

  // Função para carregar municípios quando o estado for selecionado
  const carregarMunicipios = async () => {
    if (!estadoDestino.value) {
      municipios.value = [];
      municipiosCarregados.value = false;
      return;
    }
  
    try {
      // Indicar que está carregando para feedback visual
      municipiosCarregados.value = false;
      
      console.log(`Carregando municípios para o estado: ${estadoDestino.value}`);
      
      // Em vez de usar Supabase, usar a API do IBGE
      const data = await ibgeService.getMunicipios(estadoDestino.value);
      
      console.log(`Municípios carregados: ${data.length}`);
      municipios.value = data;
      municipiosCarregados.value = true;
    } catch (error) {
      console.error('Erro ao carregar municípios:', error);
      municipios.value = [];
      municipiosCarregados.value = false;
    }
  }

  // Função para calcular distância
  const calcularDistancia = async () => {
    if (!pontoReferencia.value || !cidadeOrgao.value || !estadoDestino.value) {
      return { success: false, message: 'Selecione o ponto de origem e destino' }
    }

    try {
      calculandoDistancia.value = true
      
      const municipio = cidadeOrgao.value;
      const estado = estadoDestino.value;

      const coordenadasDestino = coordenadasMunicipais[estado]?.[municipio.nome];

      if (!coordenadasDestino) {
        throw new Error(`Coordenadas não encontradas para ${municipio.nome}/${estado}`);
      }

      const distancia = await calcularDistanciaRota(
        pontoReferencia.value,
        coordenadasDestino
      );

      distanciaCalculada.value = `${distancia} km`;
      return { success: true, message: 'Distância calculada com sucesso!' }

    } catch (error) {
      console.error('Erro ao calcular distância:', error);
      
      // Tenta fallback com Haversine
      try {
        const coordenadasDestino = coordenadasMunicipais[estadoDestino.value]?.[cidadeOrgao.value.nome];
        if (coordenadasDestino) {
          const distancia = calcularDistanciaHaversine(
            pontoReferencia.value.lat,
            pontoReferencia.value.lng,
            coordenadasDestino.latitude,
            coordenadasDestino.longitude
          );
          distanciaCalculada.value = `${distancia} km (aproximado)`;
          return { success: true, message: 'Distância aproximada calculada' }
        } else {
          return { success: false, message: 'Não foi possível calcular a distância' }
        }
      } catch (backupError) {
        return { success: false, message: 'Falha na estimativa de distância' }
      }
    } finally {
      calculandoDistancia.value = false;
    }
  }

  // Função para alternar modo manual
  const toggleModoManual = () => {
    distanciaManual.value = !distanciaManual.value;
    if (!distanciaManual.value) {
      calcularDistancia();
    }
  }

  return {
    pontoReferencia,
    cidadeOrgao,
    distanciaCalculada,
    distanciaManual,
    distanciaManualValue,
    estadoDestino,
    municipios,
    municipiosCarregados,
    filtroEstadoReferencia,
    distanciasSalvas,
    calculandoDistancia,
    pontosReferencia,
    pontosFiltrados,
    carregarMunicipios,
    calcularDistancia,
    toggleModoManual
  }
}
