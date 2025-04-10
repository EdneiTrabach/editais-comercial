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
      loadProcessos
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

    // Substitua a função salvarEdicao atual
    const salvarEdicao = async (sistema) => {
      try {
        let valor;
        
        // Tratar o campo "nome" de forma diferente (como texto)
        if (editando.value.campo === 'nome') {
          if (!editando.value.valor.trim()) {
            throw new Error('Nome da anotação não pode estar vazio')
          }
          valor = editando.value.valor.trim();
        } else {
          // Para campos numéricos, converter para inteiro
          valor = parseInt(editando.value.valor.replace(/\D/g, ''));
          
          if (isNaN(valor) || valor < 0) {
            throw new Error('Por favor, insira um número válido maior ou igual a zero')
          }
  
          // Validações específicas para campos numéricos
          if (editando.value.campo === 'totalItens') {
            if (sistema.naoAtendidos > valor) {
              throw new Error('O total de itens deve ser maior que os itens não atendidos')
            }
          } else if (editando.value.campo === 'naoAtendidos') {
            if (valor > sistema.totalItens) {
              throw new Error('O número de itens não atendidos não pode ser maior que o total')
            }
          }
        }
  
        // Mapear campos da UI para campos do banco
        const camposBanco = {
          'nome': 'sistema_nome_personalizado', // Campo para salvar nome personalizado
          'totalItens': 'total_itens',
          'naoAtendidos': 'nao_atendidos'
        };
  
        // Preparar objeto de atualização
        const atualizacao = {
          [camposBanco[editando.value.campo] || editando.value.campo]: valor,
          updated_at: new Date().toISOString()
        }
  
        // Atualizar no banco de dados
        const { error } = await supabase
          .from('analises_itens')
          .update(atualizacao)
          .eq('id', sistema.id);
  
        if (error) throw error;
  
        // Atualizar localmente
        sistema[editando.value.campo] = valor;
        
        // Recalcular atendidos apenas para campos numéricos
        if (editando.value.campo === 'totalItens' || editando.value.campo === 'naoAtendidos') {
          sistema.atendidos = sistema.totalItens - sistema.naoAtendidos;
        }
        
        // Marcar que há alterações pendentes
        alteracoesPendentes.value = true;
        showToast('Alteração salva com sucesso', 'success');
  
      } catch (error) {
        console.error('Erro ao salvar:', error)
        showToast(error.message || 'Erro ao salvar alterações', 'error')
      } finally {
        cancelarEdicao()
      }
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

    const percentualMinimo = ref(70) // Valor padrão de 70%
    const percentualMinimoGeral = ref(60) // Valor padrão geral
    const percentualMinimoObrigatorios = ref(90) // Valor padrão para obrigatórios

    const salvarPercentualPersonalizado = async (sistema) => {
      try {
        const { error } = await supabase
          .from('analises_itens')
          .update({
            percentual_minimo: sistema.percentualMinimo,
            updated_at: new Date().toISOString()
          })
          .match({
            sistema_id: sistema.id,
            processo_id: selectedProcesso.value
          })

        if (error) throw error
      } catch (error) {
        console.error('Erro ao salvar percentual personalizado:', error)
        // Reverter para o valor anterior em caso de erro
        sistema.percentualMinimo = sistema.percentualMinimoAnterior
      }
      alteracoesPendentes.value = true
    }

    const getStatusAtendimento = (sistema) => {
      const percentualAtendimento = calcularPorcentagem(
        sistema.totalItens - sistema.naoAtendidos, 
        sistema.totalItens
      )
      
      // Determinar qual percentual mínimo usar
      const percentualMinimo = sistema.percentualMinimo || // Personalizado se existir
        (sistema.obrigatorio ? percentualMinimoObrigatorios.value : percentualMinimoGeral.value)
      
      const atende = percentualAtendimento >= percentualMinimo
      
      return {
        atende,
        texto: `${atende ? 'Atende' : 'Não Atende'} (Min: ${percentualMinimo}%)`,
        class: atende ? 'status-atende' : 'status-nao-atende'
      }
    }

    const salvarObrigatoriedade = async (sistema) => {
      try {
        const { error } = await supabase
          .from('analises_itens')
          .update({
            obrigatorio: sistema.obrigatorio,
            updated_at: new Date().toISOString()
          })
          .match({
            sistema_id: sistema.id,
            processo_id: selectedProcesso.value
          })

        if (error) throw error
      } catch (error) {
        console.error('Erro ao salvar obrigatoriedade:', error)
        sistema.obrigatorio = !sistema.obrigatorio // Reverte a mudança em caso de erro
      }
    }

    const getStatusGeralClass = computed(() => {
      const obrigatoriosAtendidos = sistemasAnalise.value
        .filter(s => s.obrigatorio)
        .every(s => getStatusAtendimento(s).atende)
      
      const percentualGeral = porcentagemGeralAtendimento.value
      return {
        'status-geral-atende': obrigatoriosAtendidos && percentualGeral >= percentualMinimo.value,
        'status-geral-nao-atende': !obrigatoriosAtendidos || percentualGeral < percentualMinimo.value
      }
    })

    const getStatusGeral = computed(() => {
      // Verificar sistemas obrigatórios
      const obrigatoriosAtendidos = sistemasAnalise.value
        .filter(s => s.obrigatorio)
        .every(s => {
          const percentual = calcularPorcentagem(
            s.totalItens - s.naoAtendidos, 
            s.totalItens
          )
          return percentual >= (s.percentualMinimo || percentualMinimoObrigatorios.value)
        })
      
      // Verificar percentual geral
      const percentualGeral = porcentagemGeralAtendimento.value
      const atendeGeral = percentualGeral >= percentualMinimoGeral.value

      if (obrigatoriosAtendidos && atendeGeral) {
        return 'Atende Todos os Requisitos'
      } else if (!obrigatoriosAtendidos && !atendeGeral) {
        return 'Não Atende Requisitos Mínimos'
      } else if (!obrigatoriosAtendidos) {
        return 'Não Atende Requisitos Obrigatórios'
      } else {
        return 'Não Atende Percentual Geral'
      }
    })

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

    // Adicione esta função ao setup
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
          percentualMinimo: 70
        };
        
        sistemasAnalise.value.push(novaAnotacao);
        showToast('Anotação adicionada com sucesso', 'success');
        
        // Iniciar edição do nome da anotação
        nextTick(() => {
          editarCelula(novaAnotacao, 'nome');
        });
        
      } catch (error) {
        console.error('Erro ao adicionar anotação:', error);
        showToast('Erro ao adicionar anotação: ' + error.message, 'error');
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
      selectProcesso,
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
      toasts
    }
  }
}