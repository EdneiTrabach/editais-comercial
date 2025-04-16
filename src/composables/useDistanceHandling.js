import { ref } from 'vue'
import { useToast } from './useToast'
import { supabase } from '@/lib/supabase'  // Corrigido o caminho da importação

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
    if (!distanciaManualValue.value) {
      showToast('Digite um valor para a distância', 'error');
      return;
    }

    // Cria um objeto com todos os campos necessários
    const novaDistancia = {
      distancia_km: distanciaManualValue.value, // Texto exato digitado
      isManual: true, // Flag para identificar entrada manual
      
      // Campos obrigatórios para o banco de dados
      ponto_referencia_cidade: pontoReferencia.value?.cidade || '',
      ponto_referencia_uf: pontoReferencia.value?.uf || '',
      cidade_origem: cidadeOrgao.value?.nome || '',
      uf_origem: estadoDestino.value || '',
      texto_completo: `${distanciaManualValue.value}${pontoReferencia.value ? 
        ` de ${cidadeOrgao.value?.nome || ''}/${estadoDestino.value || ''} para ${pontoReferencia.value.cidade}/${pontoReferencia.value.uf}` : 
        ''}`
    };
    
    distanciasSalvas.value.push(novaDistancia);
    distanciaManualValue.value = ''; // Limpa o campo após salvar
    showToast('Distância adicionada com sucesso!', 'success');
  }

  // Funções relacionadas a distância e municípios
  const adicionarDistanciaLista = () => {
    if (!distanciaCalculada.value || !pontoReferencia.value || !cidadeOrgao.value) {
      showToast('Selecione os pontos e calcule a distância primeiro', 'warning');
      return;
    }

    // Extrair só o valor numérico da distância
    const kmValue = parseFloat(distanciaCalculada.value.replace(' km', '').replace('(aproximado)', '').trim());
    
    const novaDistancia = {
      distancia_km: kmValue,
      // A cidade de origem (órgão) é agora o ponto de partida
      cidade_origem: cidadeOrgao.value.nome,
      uf_origem: estadoDestino.value,
      // O ponto de referência é agora o destino
      ponto_referencia_cidade: pontoReferencia.value.cidade,
      ponto_referencia_uf: pontoReferencia.value.uf,
      cidade_destino: pontoReferencia.value.cidade,
      uf_destino: pontoReferencia.value.uf,
      // Texto completo no formato solicitado
      texto_completo: `de ${pontoReferencia.value.cidade}/${pontoReferencia.value.uf}`
    };

    distanciasSalvas.value.push(novaDistancia);
    distanciaCalculada.value = null; // Limpar após adicionar
    showToast('Distância adicionada à lista', 'success');
  }

  const removerDaLista = (index) => {
    distanciasSalvas.value.splice(index, 1)
    showToast('Distância removida da lista', 'success')
  }

  // Melhore a função salvarTodasDistancias para validar melhor os dados

  const salvarTodasDistancias = async (processoId) => {
    if (!processoId) {
      showToast('ID do processo não disponível', 'error');
      return false;
    }
  
    if (distanciasSalvas.value.length === 0) {
      console.log('Nenhuma distância para salvar');
      return true; // Não há nada para salvar, mas não é um erro
    }
  
    try {
      // Log para debug
      console.log(`Preparando ${distanciasSalvas.value.length} distâncias para salvar`);
      console.log('Distâncias a salvar:', JSON.stringify(distanciasSalvas.value));
      
      // Preparar os registros para inserção com maior validação
      const distanciasParaSalvar = distanciasSalvas.value.map(distancia => {
        // Converter string para número se necessário
        let distanciaKm = distancia.distancia_km;
        
        if (typeof distanciaKm === 'string') {
          // Remover texto e deixar apenas números e ponto/vírgula
          distanciaKm = distanciaKm.replace(/[^\d.,]/g, '').replace(',', '.');
          distanciaKm = parseFloat(distanciaKm) || 0;
        }
        
        // Criar objeto com todos os campos necessários
        return {
          processo_id: processoId,
          distancia_km: distanciaKm,
          ponto_referencia_cidade: distancia.ponto_referencia_cidade || null,
          ponto_referencia_uf: distancia.ponto_referencia_uf || null,
          cidade_destino: distancia.cidade_destino || null,
          uf_destino: distancia.uf_destino || null,
          cidade_origem: distancia.cidade_origem || cidadeOrgao.value?.nome || null,
          uf_origem: distancia.uf_origem || estadoDestino.value || null,
          texto_completo: distancia.texto_completo || 
            (distancia.isManual ? 
              `${distanciaKm} km` : 
              `de ${distancia.cidade_origem || cidadeOrgao.value?.nome || ''}/
               ${distancia.uf_origem || estadoDestino.value || ''} para 
               ${distancia.ponto_referencia_cidade || ''}/
               ${distancia.ponto_referencia_uf || ''}`),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });
      
      // Log antes da inserção
      console.log('Dados preparados para inserção:', JSON.stringify(distanciasParaSalvar));
      
      // Inserir todas as distâncias de uma vez
      const { data, error } = await supabase
        .from('processo_distancias')
        .insert(distanciasParaSalvar);

      if (error) {
        console.error('Erro na inserção:', error);
        throw error;
      }
  
      console.log('Distâncias salvas com sucesso!');
      showToast(`${distanciasParaSalvar.length} distâncias salvas com sucesso!`, 'success');
      return true;
    } catch (error) {
      console.error('Erro detalhado ao salvar distâncias:', error);
      showToast(`Erro ao salvar distâncias: ${error.message}`, 'error');
      return false;
    }
  }

  return {
    distanciasSalvas,
    salvarDistancia,
    validarCidade,
    salvarDistanciaManual,
    adicionarDistanciaLista,
    removerDaLista,
    salvarTodasDistancias  // Esta linha é essencial!
  }
}