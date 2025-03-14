import { ref } from 'vue'
import { useToast } from './useToast'

export function useDistanceHandling(formData, pontoReferencia, distanciaCalculada, cidadeOrgao, distanciaManualValue, estadoDestino) {
  const distanciasSalvas = ref([])
  const { showToast } = useToast()

  // Função para salvar a distância no formData
  const salvarDistancia = () => {
    if (!pontoReferencia.value || !distanciaCalculada.value) {
      showToast('Selecione um ponto de referência e calcule a distância primeiro', 'error')
      return
    }

    formData.value.distancia_km = parseFloat(distanciaCalculada.value.replace(' km', '').replace('(aproximado)', '').trim())
    formData.value.ponto_referencia_cidade = pontoReferencia.value.cidade
    formData.value.ponto_referencia_uf = pontoReferencia.value.uf

    showToast('Distância salva com sucesso!', 'success')
  }

  const validarCidade = () => {
    return cidadeOrgao.value && cidadeOrgao.value.length >= 3
  }

  // Função para salvar distância manual
  const salvarDistanciaManual = () => {
    if (!distanciaManualValue.value || !pontoReferencia.value) {
      showToast('Digite um valor de distância e selecione um ponto de referência', 'error')
      return
    }

    formData.value.distancia_km = parseFloat(distanciaManualValue.value)
    formData.value.ponto_referencia_cidade = pontoReferencia.value.cidade
    formData.value.ponto_referencia_uf = pontoReferencia.value.uf

    showToast('Distância manual salva com sucesso!', 'success')
  }

  // Funções relacionadas a distância e municípios
  const adicionarDistanciaLista = () => {
    if (!distanciaCalculada.value || !pontoReferencia.value || !cidadeOrgao.value) {
      showToast('Selecione os pontos e calcule a distância primeiro', 'warning')
      return
    }

    const novaDistancia = {
      distancia_km: parseFloat(distanciaCalculada.value.replace(' km', '').replace('(aproximado)', '').trim()),
      // A cidade de origem (órgão) é agora o ponto de partida
      cidade_origem: cidadeOrgao.value.nome,
      uf_origem: estadoDestino.value,
      // O ponto de referência é agora o destino
      ponto_referencia_cidade: pontoReferencia.value.cidade,
      ponto_referencia_uf: pontoReferencia.value.uf,
      cidade_destino: cidadeOrgao.value.nome,
      uf_destino: estadoDestino.value
    }

    distanciasSalvas.value.push(novaDistancia)
    distanciaCalculada.value = null
    showToast('Distância adicionada à lista', 'success')
  }

  const removerDaLista = (index) => {
    distanciasSalvas.value.splice(index, 1)
    showToast('Distância removida da lista', 'success')
  }

  return {
    distanciasSalvas,
    salvarDistancia,
    validarCidade,
    salvarDistanciaManual,
    adicionarDistanciaLista,
    removerDaLista
  }
}