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

  // Modificação no composable useAnalises.js
  const porcentagemGeralAtendimento = computed(() => {
    if (!sistemasAnalise.value.length) return 0
    
    const totais = sistemasAnalise.value.reduce((acc, sistema) => {
      acc.totalItens += sistema.totalItens
      acc.naoAtendidos += sistema.naoAtendidos
      return acc
    }, { totalItens: 0, naoAtendidos: 0 })
    
    if (totais.totalItens === 0) return 0;
    
    // Calcula porcentagem de atendimento (complemento do não atendimento)
    const percentualNaoAtendimento = (totais.naoAtendidos / totais.totalItens) * 100;
    return 100 - percentualNaoAtendimento;
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
      
      // Buscar registros existentes na tabela analises_itens (incluindo ordem de exibição)
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
          ordem_exibicao,
          sistemas:sistema_id (id, nome)
        `)
        .eq('processo_id', selectedProcesso.value)
        .order('ordem_exibicao', { ascending: true, nullsLast: true }); // Ordenar por ordem_exibicao
      
      if (analiseError) throw analiseError;
      
      // Separar os itens normais e as anotações
      const analiseItensSistemas = analiseItens ? 
        analiseItens.filter(item => !item.is_custom_line) : [];
      
      const analiseItensAnotacoes = analiseItens ? 
        analiseItens.filter(item => item.is_custom_line) : [];
        
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
      
      // Modificar o mapeamento de sistemas para aplicar as classes corretas
      sistemasAnalise.value = dadosAtualizados.map(item => {
        const atendidos = item.total_itens - item.nao_atendidos;
        const isCustomLine = item.is_custom_line || (item.sistema_nome_personalizado && !item.sistema_id);
        
        // Base do objeto sistema para ambos os tipos (normal e personalizado)
        const sistema = {
          id: item.id,
          nome: isCustomLine ? item.sistema_nome_personalizado || 'Anotação' : (item.sistemas ? item.sistemas.nome : 'Sistema desconhecido'),
          sistema_id: isCustomLine ? null : item.sistema_id,
          isCustomLine: isCustomLine,
          totalItens: item.total_itens || 0,
          naoAtendidos: item.nao_atendidos || 0,
          atendidos: atendidos || 0,
          obrigatorio: item.obrigatorio || false,
          percentualMinimo: item.percentual_minimo || 70,
          classeEstilo: '' // Será definido abaixo
        };
        
        // Calcular percentual de atendimento
        if (sistema.totalItens > 0) {
          const percentualAtendimento = (sistema.atendidos / sistema.totalItens) * 100;
          
          // Definir classe com base no atendimento, independente de ser linha personalizada ou não
          if (percentualAtendimento >= sistema.percentualMinimo) {
            sistema.classeEstilo = 'atende-status-forte';
          } else {
            sistema.classeEstilo = 'nao-atende-status-forte';
          }
        } else {
          sistema.classeEstilo = 'neutro'; // Nem atende nem não atende
        }
        
        return sistema;
      });
      
      // Ao final do procedimento, verificar e corrigir ordenação
      await atualizarOrdemExibicao(dadosAtualizados);
      
      return { 
        adicionados: sistemasNovos.length, 
        removidos: sistemasRemovidos.length 
      };
      
    } catch (error) {
      console.error('Erro ao carregar análises dos sistemas:', error);
      throw error;
    }
  }

  // Adicione esta função auxiliar para garantir que todos os itens tenham ordem_exibicao
  const atualizarOrdemExibicao = async (itens) => {
    try {
      // Verificar se há itens sem ordem_exibicao
      const itensSemOrdem = itens.filter(item => item.ordem_exibicao === null);
      
      if (itensSemOrdem.length > 0) {
        // Encontrar o maior valor de ordem_exibicao
        let maiorOrdem = -1;
        itens.forEach(item => {
          if (item.ordem_exibicao !== null && item.ordem_exibicao > maiorOrdem) {
            maiorOrdem = item.ordem_exibicao;
          }
        });
        
        // Criar array de promessas para atualização
        const promises = [];
        
        // Para cada item sem ordem, atribuir um valor incremental
        itensSemOrdem.forEach((item, index) => {
          const novaOrdem = maiorOrdem + 1 + index;
          
          promises.push(
            supabase
              .from('analises_itens')
              .update({ ordem_exibicao: novaOrdem })
              .eq('id', item.id)
          );
        });
        
        // Executar atualizações em batch
        if (promises.length > 0) {
          await Promise.all(promises);
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar ordem de exibição:', error);
      // Não propagar o erro para não interromper o carregamento principal
    }
  };

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

  // Adicione esta função ao useAnalises.js antes do return
  const getStatusAtendimento = (sistema) => {
    if (!sistema.totalItens) return { status: 'neutro', classe: '' };
    
    const percentualAtendimento = calcularPorcentagem(sistema.atendidos, sistema.totalItens);
    const percentualMinimo = sistema.percentualMinimo || 70;
    
    if (percentualAtendimento >= percentualMinimo) {
      return { status: 'atende', classe: 'atende-percentual' };
    } else {
      return { status: 'nao-atende', classe: 'nao-atende-percentual' };
    }
  };

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
    acaoAposSalvar,
    getStatusAtendimento,
  }
}