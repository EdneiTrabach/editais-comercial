<template>
  <div class="layout">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />
    
    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <div class="analises-container">
        <div class="header-section">
          <h1>Análise de Sistemas</h1>
          <!-- Move os botões para o header-section -->
          <div class="header-actions">
            <div class="acoes-principais" v-if="step === 2">
              <button 
                @click="salvarAnalises" 
                class="btn btn-primary"
                :disabled="!temAlteracoesPendentes">
                <i class="fas fa-save"></i> Salvar Análises
              </button>
              <!-- Botão de sincronização único com mensagem mais clara -->
              <button 
                v-if="processoAtual"
                @click="sincronizarSistemas" 
                class="btn btn-secondary" 
                title="Atualiza sistemas conforme a tela de processos">
                <i class="fas fa-sync"></i> Sincronizar Sistemas
              </button>
            </div>
            <!-- Botões de navegação -->
            <div class="navigation-actions">
              <button 
                v-if="step > 0" 
                @click="voltarEtapa" 
                class="btn-voltar"
              >
                Voltar
              </button>
              <button 
                v-if="step < 2" 
                @click="avancarEtapa" 
                class="btn-avancar"
                :disabled="!podeAvancar"
              >
                Avançar
              </button>
            </div>
          </div>
        </div>

        <!-- Seleção de Processo similar ao LancesView -->
        <div class="selection-steps" v-if="step === 0">
          <AnoSelection 
            :anos="anosDisponiveis" 
            :processos="processos"
            :selectedAno="anoSelecionado"
            @select-ano="selecionarAno"
          />
        </div>

        <div v-else-if="step === 1">
          <ProcessoSelection
            :processos="processosFiltrados"
            :selectedProcesso="selectedProcesso"
            @select-processo="selectProcesso"
          />
        </div>

        <!-- Tabela de Análise -->
        <div v-else-if="step === 2" class="analise-table-container">
          <div class="table-header">
            <h2>Análise de Atendimento - {{ processoAtual?.numero_processo }}</h2>
            <div class="analise-config">
              <div class="percentual-container">
                <div class="percentual-minimo">
                  <label>% Mínimo Geral:</label>
                  <input 
                    type="number" 
                    v-model="percentualMinimoGeral" 
                    min="0" 
                    max="100"
                    class="percentual-input"
                  />
                </div>
                <div class="percentual-obrigatorios">
                  <label>% Mínimo Obrigatórios:</label>
                  <input 
                    type="number" 
                    v-model="percentualMinimoObrigatorios" 
                    min="0" 
                    max="100"
                    class="percentual-input"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="total-geral">
            <span>Porcentagem Geral de Atendimento: {{ porcentagemGeralAtendimento }}%</span>
          </div>

          <table class="analise-table">
            <thead>
              <tr>
                <th>Sistema</th>
                <th>Total de Itens</th>
                <th>Não Atendidos</th>
                <th>Atendidos</th>
                <th>% Não Atendimento</th>
                <th>% Atendimento</th>
                <th>Obrigatório</th>
                <th>% Mínimo</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sistema in sistemasAnalise" :key="sistema.id" 
                  :class="{ 
                    'sistema-row': true,
                    'sistema-obrigatorio': sistema.obrigatorio,
                    'atende-percentual': getStatusAtendimento(sistema).atende,
                    'nao-atende-percentual': !getStatusAtendimento(sistema).atende 
                  }">
                <td>{{ sistema.nome }}</td>
                <td 
                  class="editable" 
                  @dblclick="editarCelula(sistema, 'totalItens', $event)"
                >
                  <template v-if="editando.id === sistema.id && editando.campo === 'totalItens'">
                    <input 
                      type="text"
                      v-model="editando.valor"
                      @blur="salvarEdicao(sistema)"
                      @keyup.enter="salvarEdicao(sistema)"
                      @keyup.esc="cancelarEdicao"
                      class="edit-input"
                      ref="editInput"
                    />
                  </template>
                  <template v-else>
                    {{ sistema.totalItens }}
                  </template>
                </td>
                <td 
                  class="editable nao-atendidos"
                  @dblclick="editarCelula(sistema, 'naoAtendidos', $event)"
                >
                  <template v-if="editando.id === sistema.id && editando.campo === 'naoAtendidos'">
                    <input 
                      type="text"
                      v-model="editando.valor"
                      @blur="salvarEdicao(sistema)"
                      @keyup.enter="salvarEdicao(sistema)"
                      @keyup.esc="cancelarEdicao"
                      class="edit-input"
                      ref="editInput"
                    />
                  </template>
                  <template v-else>
                    {{ sistema.naoAtendidos }}
                  </template>
                </td>
                <td class="atendidos">{{ sistema.totalItens - sistema.naoAtendidos }}</td>
                <td class="porcentagem-nao-atendimento">
                  {{ calcularPorcentagem(sistema.naoAtendidos, sistema.totalItens) }}%
                </td>
                <td class="porcentagem-atendimento">
                  {{ calcularPorcentagem(sistema.totalItens - sistema.naoAtendidos, sistema.totalItens) }}%
                </td>
                <td>
                  <label class="checkbox-container">
                    <input 
                      type="checkbox" 
                      v-model="sistema.obrigatorio"
                      @change="salvarObrigatoriedade(sistema)"
                    />
                    <span class="checkmark"></span>
                  </label>
                </td>
                <td class="percentual-personalizado">
                  <input 
                    type="number"
                    v-model="sistema.percentualMinimo"
                    @change="salvarPercentualPersonalizado(sistema)"
                    class="percentual-input-small"
                    min="0"
                    max="100"
                  />
                </td>
                <td class="status-column">
                  <span :class="getStatusAtendimento(sistema).class">
                    {{ getStatusAtendimento(sistema).texto }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="analise-resumo">
            <div class="percentual-geral" :class="getStatusGeralClass">
              <span>Atendimento Geral: {{ porcentagemGeralAtendimento }}%</span>
              <span class="status-geral">{{ getStatusGeral }}</span>
            </div>
          </div>
        </div>

        <!-- Modal de Confirmação -->
        <div v-if="showConfirmDialog" class="modal-overlay">
          <div class="modal-content">
            <h3>Alterações não salvas</h3>
            <p>Existem alterações não salvas. O que deseja fazer?</p>
            <div class="modal-actions">
              <button @click="confirmarSaida" class="btn-secondary">
                Sair sem salvar
              </button>
              <button @click="salvarESair" class="btn-primary">
                Salvar e sair
              </button>
              <button @click="cancelarSaida" class="btn-cancel">
                Continuar editando
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <toast-messages :toasts="toasts" />
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import TheSidebar from '@/components/TheSidebar.vue'
import AnoSelection from '@/components/lances/AnoSelection.vue'
import ProcessoSelection from '@/components/lances/ProcessoSelection.vue'
import { useAnalises } from '@/composables/useAnalises'
import * as XLSX from 'xlsx'

export default {
  name: 'AnalisesView',
  
  components: {
    TheSidebar,
    AnoSelection,
    ProcessoSelection
  },

  // Adicionar hook de navegação como propriedade do componente
  beforeRouteLeave(to, from, next) {
    if (this.temAlteracoesPendentes) {
      const confirmar = window.confirm('Existem alterações não salvas. Deseja sair mesmo assim?')
      if (confirmar) {
        next()
      } else {
        next(false)
      }
    } else {
      next()
    }
  },

  setup() {
    const router = useRouter()
    const alteracoesPendentes = ref(false)
    const showConfirmDialog = ref(false)
    const acaoAposSalvar = ref(null)
    const editando = ref({ id: null, campo: null, valor: null })
    const percentualMinimoGeral = ref(60)
    const percentualMinimoObrigatorios = ref(90)

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

    // Computed property para controle de alterações
    const temAlteracoesPendentes = computed(() => {
      return alteracoesPendentes.value && sistemasAnalise.value.length > 0
    })

    // Função para verificar alterações pendentes
    const verificarAlteracoesPendentes = (callback) => {
      if (temAlteracoesPendentes.value) {
        showConfirmDialog.value = true
        acaoAposSalvar.value = callback
        return true
      }
      return false
    }

    // Funções de controle do modal de confirmação
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

    // Event listener para fechar navegador
    onMounted(() => {
      window.addEventListener('beforeunload', handleBeforeUnload)
      loadProcessos()
    })

    onUnmounted(() => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    })

    const handleBeforeUnload = (event) => {
      if (temAlteracoesPendentes.value) {
        event.preventDefault()
        event.returnValue = ''
      }
    }

    // Função para cálculo do status de atendimento
    const getStatusAtendimento = (sistema) => {
      const percentualAtendimento = calcularPorcentagem(
        sistema.totalItens - sistema.naoAtendidos, 
        sistema.totalItens
      )
      
      const percentualMinimo = sistema.percentualMinimo || 
        (sistema.obrigatorio ? percentualMinimoObrigatorios.value : percentualMinimoGeral.value)
      
      const atende = percentualAtendimento >= percentualMinimo
      
      return {
        atende,
        texto: `${atende ? 'Atende' : 'Não Atende'} (Min: ${percentualMinimo}%)`,
        class: atende ? 'status-atende' : 'status-nao-atende'
      }
    }

    // Status geral da análise
    const getStatusGeralClass = computed(() => {
      const obrigatoriosAtendidos = sistemasAnalise.value
        .filter(s => s.obrigatorio)
        .every(s => getStatusAtendimento(s).atende)
      
      const percentualGeral = porcentagemGeralAtendimento.value
      return {
        'status-geral-atende': obrigatoriosAtendidos && percentualGeral >= percentualMinimoGeral.value,
        'status-geral-nao-atende': !obrigatoriosAtendidos || percentualGeral < percentualMinimoGeral.value
      }
    })

    const getStatusGeral = computed(() => {
      const obrigatoriosAtendidos = sistemasAnalise.value
        .filter(s => s.obrigatorio)
        .every(s => getStatusAtendimento(s).atende)
      
      const percentualGeral = porcentagemGeralAtendimento.value
      
      if (obrigatoriosAtendidos && percentualGeral >= percentualMinimoGeral.value) {
        return 'Atende Requisitos'
      }
      return 'Não Atende Requisitos'
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
              totalItens: sistema.totalItens || 0,
              naoAtendidos: sistema.naoAtendidos || 0,
              obrigatorio: sistema.obrigatorio || false,
              percentual_minimo: sistema.percentualMinimo,
              updated_at: new Date().toISOString()
            })
        })

        await Promise.all(promises)
        alteracoesPendentes.value = false
        alert('Análises salvas com sucesso!')

        if (acaoAposSalvar.value) {
          acaoAposSalvar.value()
          acaoAposSalvar.value = null
        }
      } catch (error) {
        console.error('Erro ao salvar análises:', error)
        alert('Erro ao salvar análises')
      }
    }

    // Exportações
    const exportarExcel = () => {
      const dados = sistemasAnalise.value.map(sistema => ({
        'Sistema': sistema.nome,
        'Total de Itens': sistema.totalItens,
        'Não Atendidos': sistema.naoAtendidos,
        'Atendidos': sistema.totalItens - sistema.naoAtendidos,
        '% Não Atendimento': calcularPorcentagem(sistema.naoAtendidos, sistema.totalItens),
        '% Atendimento': calcularPorcentagem(sistema.totalItens - sistema.naoAtendidos, sistema.totalItens),
        'Obrigatório': sistema.obrigatorio ? 'Sim' : 'Não',
        '% Mínimo': sistema.percentualMinimo || '-',
        'Status': getStatusAtendimento(sistema).texto
      }))

      const ws = XLSX.utils.json_to_sheet(dados)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Análise de Sistemas')
      XLSX.writeFile(wb, `analise_sistemas_${processoAtual.value?.numero_processo}.xlsx`)
    }

    return {
      step,
      isSidebarExpanded,
      processos,
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
      alteracoesPendentes,
      temAlteracoesPendentes,
      showConfirmDialog,
      confirmarSaida,
      salvarESair,
      cancelarSaida,
      verificarAlteracoesPendentes,
      percentualMinimoGeral,
      percentualMinimoObrigatorios,
      getStatusAtendimento,
      getStatusGeralClass,
      getStatusGeral,
      salvarAnalises,
      exportarExcel,
      editando
    }
  }
}
</script>
<style src="./AnalisesView.css" scoped></style>