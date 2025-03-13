import { ref, computed, watch } from 'vue'
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
    { uf: 'MG', cidade: 'Governador Valadares', lat: -18.8513, lng: -41.9555 },
    { uf: 'MG', cidade: 'Belo Horizonte', lat: -19.9167, lng: -43.9345 },
    { uf: 'MG', cidade: 'Uberlândia', lat: -18.9113, lng: -48.2622 },
    { uf: 'MG', cidade: 'Juiz de Fora', lat: -21.7642, lng: -43.3496 },
    { uf: 'SP', cidade: 'São Paulo', lat: -23.5505, lng: -46.6333 },
    { uf: 'RJ', cidade: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729 },
    { uf: 'ES', cidade: 'Vitória', lat: -20.2976, lng: -40.2958 },
    { uf: 'BA', cidade: 'Salvador', lat: -12.9718, lng: -38.5011 },
    { uf: 'PR', cidade: 'Curitiba', lat: -25.4284, lng: -49.2733 },
    { uf: 'GO', cidade: 'Goiânia', lat: -16.6869, lng: -49.2648 },
    { uf: 'RS', cidade: 'Porto Alegre', lat: -30.0346, lng: -51.2177 },
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
    if (!estadoDestino.value) return

    try {
      municipiosCarregados.value = false
      municipios.value = await ibgeService.getMunicipios(estadoDestino.value)
      municipiosCarregados.value = true
    } catch (error) {
      console.error('Erro ao carregar municípios:', error)
      throw error
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
