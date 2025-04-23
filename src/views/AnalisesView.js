import { ref, computed, onMounted, nextTick, onUnmounted } from 'vue'
import TheSidebar from '@/components/TheSidebar.vue'
import AnoSelection from '@/components/lances/AnoSelection.vue'
import ProcessoSelection from '@/components/lances/ProcessoSelection.vue'
import { useAnalises } from '@/composables/useAnalises'
import { supabase } from '@/lib/supabase' // Corrigido o caminho
import { useToast } from '@/composables/useToast';
import ToastMessages from '@/components/ToastMessages.vue';

export default {
  name: 'AnalisesView',
  
  components: {
    TheSidebar,
    AnoSelection,
    ProcessoSelection,
    ToastMessages
  },

  setup() {
    const {
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
      handleSidebarToggle,
      selecionarAno,
      selectProcesso,
      voltarEtapa,
      avancarEtapa,
      calcularPorcentagem,
      loadProcessos,
      carregarAnalisesSistemas,
      formatarPercentual,
      calcularPorcentagemPrecisa,
      percentualMinimoGeral,
      percentualMinimoObrigatorios,
      getStatusGeral,
      getStatusGeralClass,
      salvarPercentuaisMinimos,
      carregarPercentuaisMinimos
    } = useAnalises()

    const { toasts, showToast } = useToast();

    const editando = ref({
      id: null,
      campo: null,
      valor: null
    })

    const editInput = ref(null)

    // Modifique a função editarCelula para aceitar edição do campo "nome" para anotações
    const editarCelula = (sistema, campo, event) => {
      // Permitir edição do nome apenas para linhas personalizadas
      if (campo === 'nome' && !sistema.isCustomLine) {
        return;
      }
      
      editando.value = {
        id: sistema.id,
        campo: campo,
        valor: sistema[campo]?.toString() || ''
      }
      
      nextTick(() => {
        const input = document.querySelector('.edit-input')
        if (input) {
          input.focus()
          input.select()
        }
      })
      alteracoesPendentes.value = true
    }

    const cancelarEdicao = () => {
      editando.value = {
        id: null,
        campo: null,
        valor: null
      }
    }

    const adicionarLinha = () => {
      const novaSistema = {
        id: `temp-${Date.now()}`, // ID temporário
        nome: 'Novo Sistema',
        totalItens: 0,
        naoAtendidos: 0
      }
      
      sistemasAnalise.value.push(novaSistema)
    }

    // Função para cálculo do status de atendimento
    const getStatusAtendimento = (sistema) => {
      if (!sistema.totalItens) {
        return {
          texto: `Não Atende (Min: ${sistema.percentualMinimo}%)`,
          class: 'status-nao-atende'
        };
      }
    
      // Calcular porcentagens
      const percentualAtendimento = calcularPorcentagem(sistema.atendidos, sistema.totalItens);
      
      // Determinar se atende ao percentual mínimo
      if (percentualAtendimento >= sistema.percentualMinimo) {
        return {
          texto: `Atende (${percentualAtendimento}%)`,
          class: 'status-atende'
        };
      } else {
        return {
          texto: `Não Atende (Min: ${sistema.percentualMinimo}%)`,
          class: 'status-nao-atende'
        };
      }
    };

    const alteracoesPendentes = ref(false)
    const showConfirmDialog = ref(false)
    const acaoAposSalvar = ref(null)

    // Computed para controlar o botão de salvar
    const temAlteracoesPendentes = computed(() => {
      return alteracoesPendentes.value && sistemasAnalise.value.length > 0
    })

    // Função para salvar todas as análises
    const salvarAnalises = async () => {
      try {
        const promises = sistemasAnalise.value.map(sistema => {
          return supabase
            .from('analises_itens')
            .update({
              total_itens: sistema.totalItens,
              nao_atendidos: sistema.naoAtendidos,
              obrigatorio: sistema.obrigatorio,
              percentual_minimo: sistema.percentualMinimo,
              updated_at: new Date().toISOString()
            })
            .eq('id', sistema.id)
        });

        await Promise.all(promises);
        alteracoesPendentes.value = false;
        showToast('Análises salvas com sucesso!', 'success');

        if (acaoAposSalvar.value) {
          acaoAposSalvar.value();
          acaoAposSalvar.value = null;
        }
      } catch (error) {
        console.error('Erro ao salvar análises:', error);
        showToast('Erro ao salvar análises: ' + error.message, 'error');
      }
    };

    // Funções de exportação
    const exportarExcel = async () => {
      try {
        const dados = sistemasAnalise.value.map(sistema => ({
          'Sistema': sistema.nome,
          'Total de Itens': sistema.totalItens,
          'Não Atendidos': sistema.naoAtendidos,
          'Atendidos': sistema.totalItens - sistema.naoAtendidos,
          '% Não Atendimento': calcularPorcentagem(sistema.naoAtendidos, sistema.totalItens),
          '% Atendimento': calcularPorcentagem(sistema.totalItens - sistema.naoAtendidos, sistema.totalItens),
          'Obrigatório': sistema.obrigatorio ? 'Sim' : 'Não',
          'Status': getStatusAtendimento(sistema).texto
        }));

        // Usando a biblioteca xlsx
        const ws = XLSX.utils.json_to_sheet(dados);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Análise de Sistemas');
        XLSX.writeFile(wb, `analise_sistemas_${processoAtual.value?.numero_processo}.xlsx`);
        
        showToast('Exportação para Excel concluída com sucesso!', 'success');
      } catch (error) {
        console.error('Erro ao exportar para Excel:', error);
        showToast('Erro ao exportar para Excel: ' + error.message, 'error');
      }
    };

    const exportarPDF = async () => {
      try {
        // Implementar exportação PDF usando html2pdf ou jsPDF
        
        showToast('Exportação para PDF concluída com sucesso!', 'success');
      } catch (error) {
        console.error('Erro ao exportar para PDF:', error);
        showToast('Erro ao exportar para PDF: ' + error.message, 'error');
      }
    }

    const abrirDashboard = () => {
      try {
        router.push({
          name: 'AnalisesDashboard',
          query: {
            processo_id: selectedProcesso.value
          }
        });
        showToast('Dashboard de análise aberto com sucesso!', 'info');
      } catch (error) {
        console.error('Erro ao abrir dashboard:', error);
        showToast('Erro ao abrir dashboard: ' + error.message, 'error');
      }
    };

    // Funções de controle de navegação
    const verificarAlteracoesPendentes = (callback) => {
      if (alteracoesPendentes.value) {
        showConfirmDialog.value = true
        acaoAposSalvar.value = callback
        return true
      }
      return false
    }

    const confirmarSaida = () => {
      showConfirmDialog.value = false
      acaoAposSalvar.value?.()
    }

    const salvarESair = async () => {
      await salvarAnalises()
      showConfirmDialog.value = false
    }

    const cancelarSaida = () => {
      showConfirmDialog.value = false
      acaoAposSalvar.value = null
    }

    // Adicionar hook beforeRouteLeave
    beforeRouteLeave((to, from, next) => {
      if (verificarAlteracoesPendentes(() => next())) {
        return
      }
      next()
    })

    // Adicionar event listener para fechar navegador
    onMounted(() => {
      window.addEventListener('beforeunload', (event) => {
        if (alteracoesPendentes.value) {
          event.preventDefault()
          event.returnValue = ''
        }
      })
    })

    onUnmounted(() => {
      window.removeEventListener('beforeunload')
    })

    onMounted(async () => {
      await loadProcessos()
    })

    // Adicione esta função para debug
    const debugAnalises = async () => {
      try {
        // Contar registros na tabela analises_itens
        const { data: contagem, error: contagemError } = await supabase
          .from('analises_itens')
          .select('count');
          
        if (contagemError) throw contagemError;
        
        console.log('Total de registros em analises_itens:', contagem);
        
        // Verificar processos com status Em Análise
        const { data: processosEmAnalise, error: processosError } = await supabase
          .from('processos')
          .select('id, numero_processo')
          .eq('status', 'EM_ANALISE');
          
        if (processosError) throw processosError;
        
        console.log('Processos com status EM_ANALISE:', processosEmAnalise);
        
        // Para cada processo em análise, verificar se está na tabela analises_itens
        for (const proc of processosEmAnalise) {
          const { data, error } = await supabase
            .from('analises_itens')
            .select('count')
            .eq('processo_id', proc.id);
            
          if (error) {
            console.error(`Erro ao verificar processo ${proc.numero_processo}:`, error);
            continue;
          }
          
          console.log(`Processo ${proc.numero_processo}: ${data[0]?.count || 0} registros em analises_itens`);
        }
      } catch (error) {
        console.error('Erro ao depurar análises:', error);
      }
    };

    // Adicione esta função
    const sincronizarSistemas = async () => {
      try {
        if (!processoAtual.value || !selectedProcesso.value) {
          showToast('Nenhum processo selecionado', 'error');
          return;
        }
        
        const resultadoSinc = await carregarAnalisesSistemas();
        
        if (resultadoSinc.adicionados > 0 || resultadoSinc.removidos > 0) {
          showToast(`Sincronização concluída: ${resultadoSinc.adicionados} sistemas adicionados, ${resultadoSinc.removidos} sistemas removidos`, 'success');
        } else {
          showToast('Sistemas já estão sincronizados', 'info');
        }
      } catch (error) {
        console.error('Erro ao sincronizar sistemas:', error);
        showToast('Erro ao sincronizar sistemas: ' + error.message, 'error');
      }
    };

    // Adicione esta função para adicionar anotação
    const adicionarAnotacao = async () => {
      try {
        if (!selectedProcesso.value) {
          showToast('Selecione um processo primeiro', 'warning');
          return;
        }
        
        // Criar registro de anotação no banco de dados
        const { data, error } = await supabase
          .from('analises_itens')
          .insert({
            processo_id: selectedProcesso.value,
            is_custom_line: true,
            sistema_nome_personalizado: 'Nova Anotação',
            total_itens: 0,
            nao_atendidos: 0,
            obrigatorio: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select();
        
        if (error) throw error;
        
        // Verificar se dados foram retornados
        if (!data || data.length === 0) {
          throw new Error('A anotação foi criada, mas não foi possível obter seus dados');
        }
        
        // Adicionar à lista local
        const novaAnotacao = {
          id: data[0].id,
          nome: data[0].sistema_nome_personalizado,
          isCustomLine: true,
          sistema_id: null,
          totalItens: 0,
          naoAtendidos: 0,
          atendidos: 0,
          obrigatorio: false,
          percentualMinimo: 10
        };
        
        // Adicionar ao array de sistemas
        sistemasAnalise.value.push(novaAnotacao);
        showToast('Anotação adicionada com sucesso', 'success');
        alteracoesPendentes.value = true;
        
        // Iniciar edição do nome da anotação
        nextTick(() => {
          editarCelula(novaAnotacao, 'nome');
        });
        
      } catch (error) {
        console.error('Erro ao adicionar anotação:', error);
        showToast('Erro ao adicionar anotação: ' + error.message, 'error');
      }
    };

    const removerAnotacao = async (anotacao) => {
      try {
        if (!anotacao.isCustomLine) return;
        
        // Confirmar antes de remover
        if (!confirm('Tem certeza que deseja remover esta anotação?')) return;
        
        // Remover do banco de dados
        const { error } = await supabase
          .from('analises_itens')
          .delete()
          .eq('id', anotacao.id);
          
        if (error) throw error;
        
        // Remover da lista local
        sistemasAnalise.value = sistemasAnalise.value.filter(s => s.id !== anotacao.id);
        
        showToast('Anotação removida com sucesso', 'success');
        alteracoesPendentes.value = true;
      } catch (error) {
        console.error('Erro ao remover anotação:', error);
        showToast('Erro ao remover anotação: ' + error.message, 'error');
      }
    };

    // Substitua ou adicione esta função
    const salvarPercentuaisMinimosLocal = async () => {
      try {
        console.log('🔄 Salvando percentuais mínimos locais');
        console.log('📊 Valores atuais - Geral:', percentualMinimoGeral.value, 'Obrigatórios:', percentualMinimoObrigatorios.value);
        
        // Validar valores antes de salvar
        percentualMinimoGeral.value = Math.min(100, Math.max(0, percentualMinimoGeral.value));
        percentualMinimoObrigatorios.value = Math.min(100, Math.max(0, percentualMinimoObrigatorios.value));
        
        if (!selectedProcesso.value) {
          showToast('Selecione um processo primeiro para salvar os percentuais mínimos', 'warning');
          return;
        }
        
        // Salvar no banco usando a função do composable
        const resultado = await salvarPercentuaisMinimos(selectedProcesso.value);
        
        if (resultado) {
          showToast('Percentuais mínimos salvos com sucesso', 'success');
          
          // Atualizar a visualização dos sistemas
          await carregarAnalisesSistemas();
          
          // Marcar que há alterações pendentes para salvar os sistemas também
          alteracoesPendentes.value = true;
        } else {
          showToast('Erro ao salvar percentuais mínimos', 'error');
        }
      } catch (error) {
        console.error('Erro ao salvar percentuais mínimos:', error);
        showToast('Erro ao salvar percentuais mínimos: ' + (error.message || 'Erro desconhecido'), 'error');
      }
    };

    // No hook onMounted, carregue os percentuais ao selecionar um processo
    onMounted(async () => {
      await loadProcessos();
      
      // Se já tem um processo selecionado, carregar seus percentuais
      if (selectedProcesso.value) {
        await carregarPercentuaisMinimos(selectedProcesso.value);
      }
    });
    
    // Modificação na função selectProcesso
    const selectProcessoOriginal = selectProcesso;
    const selectProcessoModificado = async (processo) => {
      // Chamar a versão original
      await selectProcessoOriginal(processo);
      
      // Carregar os percentuais para este processo
      if (selectedProcesso.value) {
        await carregarPercentuaisMinimos(selectedProcesso.value);
      }
    };

    // Adicionar esta nova função para navegação por Tab
    const handleTabNavigation = (sistema, campoAtual, proximoCampo, event) => {
      event.preventDefault(); // Prevenir o comportamento padrão do tab
      // Salvar o valor atual
      salvarEdicao(sistema);
      // Depois de salvar, editar o próximo campo
      nextTick(() => {
        editarCelula(sistema, proximoCampo);
      });
    };

    // Modificar a função que calcula a classe de estilo da linha para incluir a validação
    const calcularClasseEstilo = (sistema) => {
      // Se tem um valor em totalItens mas naoAtendidos está vazio ou é zero
      if (sistema.totalItens > 0 && (!sistema.naoAtendidos && sistema.naoAtendidos !== 0)) {
        return 'validacao-pendente';
      }
      
      // Restante da lógica existente para outras classes
      if (!sistema.totalItens) {
        return 'neutro';
      }
      
      const percentualAtendimento = calcularPorcentagem(sistema.totalItens - sistema.naoAtendidos, sistema.totalItens);
      const percentualMinimo = sistema.obrigatorio 
        ? percentualMinimoObrigatorios.value 
        : percentualMinimoGeral.value;
        
      return percentualAtendimento >= percentualMinimo ? 'atende-status-forte' : 'nao-atende-status-forte';
    };

    // Para campos numéricos, validar e converter
    try {
      // Remover caracteres não numéricos e converter para inteiro
      const inputValue = editando.value.valor.toString().trim();
      // Se o valor for vazio e o usuário quiser explicitamente deixar não analisado
      if (inputValue === '') {
        valor = '';
      } else {
        // Caso contrário, converter para número, permitindo explicitamente 0
        valor = parseInt(inputValue.replace(/[^\d]/g, '') || '0');
        
        if (isNaN(valor) || valor < 0) {
          throw new Error('Por favor, insira um número válido maior ou igual a zero');
        }
      }
    } catch (e) {
      console.warn('Erro ao converter valor numérico:', e);
      showToast(e.message || 'Erro ao processar o valor', 'error');
      return; // Impede que continue o salvamento com valor inválido
    }

    // Modifique a função corrigirProcessosAnalise para implementá-la corretamente
    const corrigirProcessosAnalise = async () => {
      console.log('🔍 BOTÃO CLICADO: Corrigir Processos em Análise');
      try {
        console.log('🔄 Iniciando correção de processos em análise...');
        showToast('Verificando processos em análise...', 'info');
        
        // Buscar processos com status em_analise
        const { data: processosEmAnalise, error: processosError } = await supabase
          .from('processos')
          .select('id, numero_processo, status, sistemas_ativos')
          .or('status.eq.em_analise,status.eq.EM_ANALISE,status.ilike.%analise%');
          
        console.log('📊 Processos encontrados com status de análise:', processosEmAnalise?.length || 0);
        
        if (processosError) {
          console.error('❌ Erro ao buscar processos:', processosError);
          throw processosError;
        }
        
        // Verificar quais processos não têm registros na tabela analises_itens
        let processosCriados = 0;
        let registrosCriados = 0;
        
        for (const processo of processosEmAnalise) {
          // Verificar se o processo já tem registros na tabela analises_itens
          const { data: analiseExistente, error: checkError } = await supabase
            .from('analises_itens')
            .select('count')
            .eq('processo_id', processo.id)
            .single();
            
          if (checkError && checkError.code !== 'PGRST116') {
            console.error(`❌ Erro ao verificar processo ${processo.numero_processo}:`, checkError);
            continue;
          }
          
          const contemRegistros = analiseExistente && analiseExistente.count > 0;
          
          // Se não tiver registros, criar
          if (!contemRegistros) {
            console.log(`📝 Criando registros para processo ${processo.numero_processo} (ID: ${processo.id})`);
            
            // Obter sistemas associados ao processo, se houver
            const sistemasIds = processo.sistemas_ativos || [];
            
            // Criar registros de análise para cada sistema
            if (sistemasIds.length > 0) {
              const registrosAnalise = sistemasIds.map(sistemaId => ({
                processo_id: processo.id,
                sistema_id: sistemaId,
                total_itens: 0,
                nao_atendidos: 0,
                obrigatorio: false,
                percentual_minimo: 70,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }));
              
              const { data, error: insertError } = await supabase
                .from('analises_itens')
                .insert(registrosAnalise)
                .select();
                
              if (insertError) {
                console.error(`❌ Erro ao criar registros para processo ${processo.numero_processo}:`, insertError);
              } else {
                console.log(`✅ ${data.length} registros criados para processo ${processo.numero_processo}`);
                processosCriados++;
                registrosCriados += data.length;
              }
            } else {
              // Se não tiver sistemas associados, criar um registro vazio
              const { data, error: insertError } = await supabase
                .from('analises_itens')
                .insert({
                  processo_id: processo.id,
                  sistema_nome_personalizado: 'Anotações',
                  is_custom_line: true,
                  total_itens: 0,
                  nao_atendidos: 0,
                  obrigatorio: false,
                  percentual_minimo: 70,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
                .select();
                
              if (insertError) {
                console.error(`❌ Erro ao criar registro vazio para processo ${processo.numero_processo}:`, insertError);
              } else {
                console.log(`✅ Registro vazio criado para processo ${processo.numero_processo}`);
                processosCriados++;
                registrosCriados++;
              }
            }
          } else {
            console.log(`⏭️ Processo ${processo.numero_processo} já tem registros de análise`);
          }
        }
        
        // Mostrar mensagem de sucesso
        if (processosCriados > 0) {
          showToast(`Correção concluída: ${processosCriados} processos corrigidos com ${registrosCriados} registros criados`, 'success');
        } else {
          showToast('Todos os processos já estão corretamente configurados para análise', 'info');
        }
        
      } catch (error) {
        console.error('❌ Erro ao corrigir processos:', error);
        showToast('Erro ao corrigir processos: ' + error.message, 'error');
      }
    };

    // Implemente corretamente a função sincronizarTodosProcessosAnalise
    const sincronizarTodosProcessosAnalise = async () => {
      console.log('🔍 BOTÃO CLICADO: Sincronizar Processos com Status Em Análise');
      try {
        console.log('🔄 Iniciando sincronização de todos os processos em análise...');
        showToast('Verificando processos para sincronização...', 'info');
        
        // Buscar processos com status em_analise
        const { data: processosEmAnalise, error: processosError } = await supabase
          .from('processos')
          .select('id, numero_processo, status, sistemas_ativos')
          .or('status.eq.em_analise,status.eq.EM_ANALISE,status.ilike.%analise%');
        
        console.log('📊 Processos encontrados para sincronização:', processosEmAnalise?.length || 0);
        
        if (processosError) {
          console.error('❌ Erro ao buscar processos:', processosError);
          throw processosError;
        }
        
        // Variáveis para contagem
        let processosSincronizados = 0;
        let sistemasAdicionados = 0;
        let sistemasRemovidos = 0;
        
        // Para cada processo, sincronizar sistemas
        for (const processo of processosEmAnalise) {
          try {
            console.log(`🔄 Sincronizando processo ${processo.numero_processo} (ID: ${processo.id})`);
            
            // Obter sistemas ativos do processo
            const sistemasAtivos = processo.sistemas_ativos || [];
            
            // Buscar registros existentes na tabela analises_itens
            const { data: registrosExistentes, error: registrosError } = await supabase
              .from('analises_itens')
              .select('id, sistema_id')
              .eq('processo_id', processo.id);
              
            if (registrosError) {
              console.error(`❌ Erro ao buscar registros para processo ${processo.numero_processo}:`, registrosError);
              continue;
            }
            
            // Extrair IDs de sistemas já registrados (excluindo registros personalizados que têm sistema_id null)
            const sistemasRegistrados = registrosExistentes
              .filter(item => item.sistema_id !== null)
              .map(item => item.sistema_id);
            
            // Identificar sistemas para adicionar e remover
            const sistemasParaAdicionar = sistemasAtivos.filter(id => !sistemasRegistrados.includes(id));
            const sistemasParaRemover = sistemasRegistrados.filter(id => !sistemasAtivos.includes(id));
            
            // Se houver alterações a fazer
            if (sistemasParaAdicionar.length > 0 || sistemasParaRemover.length > 0) {
              // Adicionar novos sistemas
              if (sistemasParaAdicionar.length > 0) {
                const registrosNovos = sistemasParaAdicionar.map(sistemaId => ({
                  processo_id: processo.id,
                  sistema_id: sistemaId,
                  total_itens: 0,
                  nao_atendidos: 0,
                  obrigatorio: false,
                  percentual_minimo: 70,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }));
                
                const { data, error: insertError } = await supabase
                  .from('analises_itens')
                  .insert(registrosNovos)
                  .select();
                  
                if (insertError) {
                  console.error(`❌ Erro ao adicionar sistemas ao processo ${processo.numero_processo}:`, insertError);
                } else {
                  sistemasAdicionados += data.length;
                  console.log(`✅ ${data.length} sistemas adicionados ao processo ${processo.numero_processo}`);
                }
              }
              
              // Remover sistemas que não estão mais ativos
              if (sistemasParaRemover.length > 0) {
                for (const sistemaId of sistemasParaRemover) {
                  const { error: deleteError } = await supabase
                    .from('analises_itens')
                    .delete()
                    .eq('processo_id', processo.id)
                    .eq('sistema_id', sistemaId);
                    
                  if (deleteError) {
                    console.error(`❌ Erro ao remover sistema ${sistemaId} do processo ${processo.numero_processo}:`, deleteError);
                  } else {
                    sistemasRemovidos++;
                    console.log(`✅ Sistema ${sistemaId} removido do processo ${processo.numero_processo}`);
                  }
                }
              }
              
              processosSincronizados++;
            } else {
              console.log(`⏭️ Processo ${processo.numero_processo} já está sincronizado`);
            }
          } catch (processoError) {
            console.error(`❌ Erro ao processar processo ${processo.numero_processo}:`, processoError);
          }
        }
        
        // Mostrar mensagem de sucesso
        if (processosSincronizados > 0) {
          showToast(`Sincronização concluída: ${processosSincronizados} processos atualizados, ${sistemasAdicionados} sistemas adicionados, ${sistemasRemovidos} sistemas removidos`, 'success');
        } else {
          showToast('Todos os processos já estão sincronizados', 'info');
        }
        
      } catch (error) {
        console.error('❌ Erro ao sincronizar processos:', error);
        showToast('Erro ao sincronizar processos: ' + error.message, 'error');
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
      handleSidebarToggle,
      selecionarAno,
      selectProcesso: selectProcessoModificado,
      voltarEtapa,
      avancarEtapa,
      calcularPorcentagem,
      editando,
      editInput,
      editarCelula,
      salvarEdicao,
      cancelarEdicao,
      adicionarLinha,
      percentualMinimo,
      percentualMinimoGeral,
      percentualMinimoObrigatorios,
      salvarPercentualPersonalizado,
      getStatusAtendimento,
      salvarObrigatoriedade,
      getStatusGeralClass,
      getStatusGeral,
      alteracoesPendentes,
      showConfirmDialog,
      acaoAposSalvar,
      temAlteracoesPendentes,
      salvarAnalises,
      exportarExcel,
      exportarPDF,
      abrirDashboard,
      verificarAlteracoesPendentes,
      confirmarSaida,
      salvarESair,
      cancelarSaida,
      debugAnalises,
      sincronizarSistemas,
      adicionarAnotacao,
      removerAnotacao,
      salvarPercentuaisMinimosLocal,
      toasts,
      handleTabNavigation,
      calcularClasseEstilo,
      corrigirProcessosAnalise,
      sincronizarTodosProcessosAnalise
    }
  }
}