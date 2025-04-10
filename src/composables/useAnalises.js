import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'

export function useAnalises() {
  const step = ref(0)
  const isSidebarExpanded = ref(false)
  const processos = ref([])
  const sistemas = ref([])
  const selectedProcesso = ref(null)
  const sistemasAnalise = ref([])
  const alteracoesPendentes = ref(false)
  const showConfirmDialog = ref(false)
  const acaoAposSalvar = ref(null)
  const anoSelecionado = ref(new Date().getFullYear())

  // Computed para processo atual
  const processoAtual = computed(() => {
    if (!selectedProcesso.value || !processos.value) return null
    return processos.value.find(p => p.id === selectedProcesso.value) || null
  })

  // Computed para filtrar processos por ano (modificado)
  const processosFiltrados = computed(() => {
    if (!processos.value) return [];
    
    return processos.value.filter(processo => {
      const anoPregao = processo.data_pregao ? new Date(processo.data_pregao).getFullYear() : null;
      const anoProcesso = processo.ano ? parseInt(processo.ano) : null;
      
      return anoPregao === anoSelecionado.value || anoProcesso === anoSelecionado.value;
    });
  })

  // Computed para anos disponíveis
  const anosDisponiveis = computed(() => {
    const anos = new Set(processos.value.map(p => {
      return p.data_pregao ? new Date(p.data_pregao).getFullYear() : null;
    }).filter(Boolean));
    return Array.from(anos).sort((a, b) => b - a); // Ordem decrescente
  })

  // Computed para verificar se pode avançar
  const podeAvancar = computed(() => {
    if (step.value === 0) return !!anoSelecionado.value
    if (step.value === 1) return !!selectedProcesso.value
    return false
  })

  // Computed para porcentagem geral
  const porcentagemGeralAtendimento = computed(() => {
    if (!sistemasAnalise.value.length) return 0
    
    const totais = sistemasAnalise.value.reduce((acc, sistema) => {
      acc.atendidos += sistema.atendidos
      acc.total += sistema.totalItens
      return acc
    }, { atendidos: 0, total: 0 })
    
    return calcularPorcentagem(totais.atendidos, totais.total)
  })

  // Função para selecionar ano
  const selecionarAno = (ano) => {
    anoSelecionado.value = ano
    step.value = 1
  }

  // Modificar a função selectProcesso para sincronizar automaticamente
  const selectProcesso = async (processo) => {
    try {
      // Garantir que o ID seja tratado como string, já que é um UUID
      selectedProcesso.value = typeof processo === 'object' ? processo.id : processo;
      
      // Carregar e sincronizar sistemas do processo selecionado
      const resultadoSinc = await carregarAnalisesSistemas();
      
      // Se houve sincronização de sistemas, mostrar feedback
      if (resultadoSinc && (resultadoSinc.adicionados > 0 || resultadoSinc.removidos > 0)) {
        console.log(`Sincronização automática: ${resultadoSinc.adicionados} sistemas adicionados, ${resultadoSinc.removidos} sistemas removidos`);
        showToast(`Sistemas sincronizados automaticamente: ${resultadoSinc.adicionados} adicionados, ${resultadoSinc.removidos} removidos`, 'info');
      }
      
      // Avançar para a próxima etapa
      step.value = 2;
    } catch (error) {
      console.error('Erro ao selecionar processo:', error);
      showToast('Erro ao carregar dados do processo selecionado', 'error');
    }
  };

  // Modifique a função carregarAnalisesSistemas para incluir linhas personalizadas
  const carregarAnalisesSistemas = async () => {
    try {
      if (!selectedProcesso.value) return;
      
      // Primeiro, buscar dados do processo para obter sistemas_ativos atualizados
      const { data: processoData, error: processoError } = await supabase
        .from('processos')
        .select('sistemas_ativos')
        .eq('id', selectedProcesso.value)
        .single();
        
      if (processoError) throw processoError;
      
      // Converter sistemas_ativos para array (garantindo consistência)
      const sistemasAtivos = Array.isArray(processoData.sistemas_ativos) 
        ? processoData.sistemas_ativos 
        : (processoData.sistemas_ativos ? JSON.parse(JSON.stringify(processoData.sistemas_ativos)) : []);
      
      console.log('Sistemas ativos no processo:', sistemasAtivos);
      
      // Buscar registros existentes na tabela analises_itens, incluindo linhas personalizadas
      const { data: analiseItens, error: analiseError } = await supabase
        .from('analises_itens')
        .select(`
          id, 
          processo_id, 
          sistema_id, 
          total_itens, 
          nao_atendidos, 
          obrigatorio, 
          percentual_minimo,
          is_custom_line,
          sistema_nome_personalizado,
          sistemas:sistema_id (id, nome)
        `)
        .eq('processo_id', selectedProcesso.value);
      
      if (analiseError) throw analiseError;
      
      // Filtrar sistemas regulares (não personalizados)
      const analiseItensSistemas = analiseItens.filter(item => !item.is_custom_line);
      
      // Mapear sistemas_ids já registrados na tabela analises_itens
      const sistemasIdsRegistrados = analiseItensSistemas.map(item => item.sistema_id);
      console.log('Sistemas já registrados:', sistemasIdsRegistrados);
      
      // Verificar se há sistemas novos para adicionar (em sistemas_ativos mas não em analises_itens)
      const sistemasNovos = sistemasAtivos.filter(id => !sistemasIdsRegistrados.includes(id));
      console.log('Sistemas novos para adicionar:', sistemasNovos);
      
      // Verificar sistemas que não estão mais ativos (em analises_itens mas não em sistemas_ativos)
      const sistemasRemovidos = sistemasIdsRegistrados.filter(id => 
        id !== null && !sistemasAtivos.includes(id));
      console.log('Sistemas removidos:', sistemasRemovidos);
      
      // Processamento em lote: adicionar novos e remover antigos
      const promises = [];
      
      // Se houver novos sistemas, adicioná-los à tabela analises_itens
      if (sistemasNovos.length > 0) {
        // Buscar informações de nome dos sistemas novos
        const { data: novosSistemasData } = await supabase
          .from('sistemas')
          .select('id, nome')
          .in('id', sistemasNovos);
        
        // Preparar registros para inserção
        if (novosSistemasData && novosSistemasData.length > 0) {
          const novosRegistros = novosSistemasData.map(sistema => ({
            processo_id: selectedProcesso.value,
            sistema_id: sistema.id,
            total_itens: 0,
            nao_atendidos: 0,
            obrigatorio: false,
            is_custom_line: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));
          
          // Adicionar à lista de promises
          promises.push(
            supabase.from('analises_itens').insert(novosRegistros)
          );
        }
      }
      
      // Remover sistemas que não estão mais ativos
      if (sistemasRemovidos.length > 0) {
        promises.push(
          supabase
            .from('analises_itens')
            .delete()
            .eq('processo_id', selectedProcesso.value)
            .in('sistema_id', sistemasRemovidos)
            .eq('is_custom_line', false) // Não remover linhas personalizadas
        );
      }
      
      // Executar todas as operações
      if (promises.length > 0) {
        await Promise.all(promises);
      }
      
      // Buscar os dados atualizados após as modificações
      const { data: dadosAtualizados, error: refreshError } = await supabase
        .from('analises_itens')
        .select(`
          id, 
          processo_id, 
          sistema_id, 
          total_itens, 
          nao_atendidos, 
          obrigatorio, 
          percentual_minimo,
          is_custom_line,
          sistema_nome_personalizado,
          sistemas:sistema_id (id, nome)
        `)
        .eq('processo_id', selectedProcesso.value);
        
      if (refreshError) throw refreshError;
      
      // Mapear os resultados para o formato esperado pela UI
      sistemasAnalise.value = dadosAtualizados.map(item => {
        const atendidos = item.total_itens - item.nao_atendidos;
        
        return {
          id: item.id,
          sistema_id: item.sistema_id,
          nome: item.is_custom_line ? item.sistema_nome_personalizado : (item.sistemas ? item.sistemas.nome : 'Sistema desconhecido'),
          totalItens: item.total_itens || 0,
          naoAtendidos: item.nao_atendidos || 0,
          atendidos: atendidos || 0,
          obrigatorio: item.obrigatorio || false,
          percentualMinimo: item.percentual_minimo || 70,
          isCustomLine: item.is_custom_line || false
        };
      });
      
      return { adicionados: sistemasNovos.length, removidos: sistemasRemovidos.length };
      
    } catch (error) {
      console.error('Erro ao carregar análises dos sistemas:', error);
      throw error;
    }
  }

  const criarTabelaAnalises = async () => {
    try {
      const { error } = await supabase.rpc('criar_tabela_analises')
      if (error) throw error
    } catch (err) {
      console.error('Erro ao criar tabela:', err)
    }
  }

  // Modifique a função loadProcessos para usar uma abordagem alternativa

  const loadProcessos = async () => {
    try {
      // Buscar todos registros da tabela analises_itens
      const { data: analiseData, error: analiseError } = await supabase
        .from('analises_itens')
        .select('processo_id');
        
      if (analiseError) throw analiseError;
      
      if (!analiseData || analiseData.length === 0) {
        processos.value = [];
        return;
      }
      
      // Extrair IDs de processos únicos
      const processosIds = [...new Set(analiseData.map(item => item.processo_id))];
      
      // Buscar os detalhes dos processos
      const { data: processosData, error: processosError } = await supabase
        .from('processos')
        .select('*')
        .in('id', processosIds)
        .order('data_pregao', { ascending: false });
      
      if (processosError) throw processosError;
      
      processos.value = processosData || [];
      
    } catch (error) {
      console.error('Erro ao carregar processos para análise:', error);
    }
  };

  // Navegação entre etapas
  const voltarEtapa = () => {
    if (step.value > 0) {
      step.value--
      if (step.value === 0) {
        selectedProcesso.value = null
      }
    }
  }

  const avancarEtapa = () => {
    if (step.value < 2 && podeAvancar.value) {
      step.value++
    }
  }

  // Função auxiliar para cálculo de porcentagem
  const calcularPorcentagem = (valor, total) => {
    if (!total) return 0
    return Number(((valor / total) * 100).toFixed(2))
  }

  // Adicionar onMounted para carregar processos automaticamente
  onMounted(async () => {
    await loadProcessos()
  })

  return {
    step,
    isSidebarExpanded,
    processos,
    sistemas,
    selectedProcesso,
    processoAtual,
    sistemasAnalise,
    anosDisponiveis,
    anoSelecionado,
    processosFiltrados,
    podeAvancar,
    porcentagemGeralAtendimento,
    handleSidebarToggle: (expanded) => isSidebarExpanded.value = expanded,
    selecionarAno,
    selectProcesso,
    voltarEtapa,
    avancarEtapa,
    calcularPorcentagem,
    loadProcessos,
    carregarAnalisesSistemas,
    alteracoesPendentes,
    showConfirmDialog,
    acaoAposSalvar
  }
}