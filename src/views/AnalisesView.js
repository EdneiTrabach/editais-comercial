import { ref, computed, onMounted, nextTick, onUnmounted } from 'vue'
import TheSidebar from '@/components/TheSidebar.vue'
import AnoSelection from '@/components/lances/AnoSelection.vue'
import ProcessoSelection from '@/components/lances/ProcessoSelection.vue'
import { useAnalises } from '@/composables/useAnalises'
import { supabase } from '@/lib/supabase' // Corrigido o caminho

export default {
  name: 'AnalisesView',
  
  components: {
    TheSidebar,
    AnoSelection,
    ProcessoSelection
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

    const editando = ref({
      id: null,
      campo: null,
      valor: null
    })

    const editInput = ref(null)

    const editarCelula = (sistema, campo, event) => {
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

    const salvarEdicao = async (sistema) => {
      try {
        const valor = parseInt(editando.value.valor.replace(/\D/g, ''))
        
        if (isNaN(valor) || valor < 0) {
          throw new Error('Por favor, insira um número válido maior ou igual a zero')
        }

        // Validações específicas
        if (editando.value.campo === 'totalItens') {
          if (sistema.naoAtendidos > valor) {
            throw new Error('O total de itens deve ser maior que os itens não atendidos')
          }
        } else if (editando.value.campo === 'naoAtendidos') {
          if (valor > sistema.totalItens) {
            throw new Error('O número de itens não atendidos não pode ser maior que o total')
          }
        }

        const atualizacao = {
          [editando.value.campo]: valor,
          updated_at: new Date().toISOString()
        }

        // Atualizar no banco de dados
        const { error } = await supabase
          .from('analises_itens')
          .update(atualizacao)
          .match({
            sistema_id: sistema.id,
            processo_id: selectedProcesso.value
          })

        if (error) throw error

        // Atualizar localmente
        sistema[editando.value.campo] = valor

      } catch (error) {
        console.error('Erro ao salvar:', error)
        alert(error.message || 'Erro ao salvar alterações')
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
            .upsert({
              sistema_id: sistema.id,
              processo_id: selectedProcesso.value,
              totalItens: sistema.totalItens,
              naoAtendidos: sistema.naoAtendidos,
              obrigatorio: sistema.obrigatorio,
              percentual_minimo: sistema.percentualMinimo,
              updated_at: new Date().toISOString()
            })
        })

        await Promise.all(promises)
        alteracoesPendentes.value = false
        showToast('Análises salvas com sucesso!', 'success')

        if (acaoAposSalvar.value) {
          acaoAposSalvar.value()
          acaoAposSalvar.value = null
        }
      } catch (error) {
        console.error('Erro ao salvar análises:', error)
        showToast('Erro ao salvar análises', 'error')
      }
    }

    // Funções de exportação
    const exportarExcel = async () => {
      const dados = sistemasAnalise.value.map(sistema => ({
        'Sistema': sistema.nome,
        'Total de Itens': sistema.totalItens,
        'Não Atendidos': sistema.naoAtendidos,
        'Atendidos': sistema.totalItens - sistema.naoAtendidos,
        '% Não Atendimento': calcularPorcentagem(sistema.naoAtendidos, sistema.totalItens),
        '% Atendimento': calcularPorcentagem(sistema.totalItens - sistema.naoAtendidos, sistema.totalItens),
        'Obrigatório': sistema.obrigatorio ? 'Sim' : 'Não',
        'Status': getStatusAtendimento(sistema).texto
      }))

      // Usando a biblioteca xlsx
      const ws = XLSX.utils.json_to_sheet(dados)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Análise de Sistemas')
      XLSX.writeFile(wb, `analise_sistemas_${processoAtual.value?.numero_processo}.xlsx`)
    }

    const exportarPDF = async () => {
      // Implementar exportação PDF usando html2pdf ou jsPDF
    }

    const abrirDashboard = () => {
      router.push({
        name: 'AnalisesDashboard',
        query: {
          processo_id: selectedProcesso.value
        }
      })
    }

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
      cancelarSaida
    }
  }
}