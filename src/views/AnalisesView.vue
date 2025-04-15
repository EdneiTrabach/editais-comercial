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
              <!-- Novo botão para adicionar anotação -->
              <button 
                @click="adicionarAnotacao" 
                class="btn btn-adicionar-anotacao"
                title="Adicionar uma linha para anotações">
                <i class="fas fa-plus"></i> Adicionar Anotação
              </button>
              <!-- Botão de sincronização único com mensagem clara -->
              <button 
                v-if="processoAtual"
                @click="sincronizarSistemas" 
                class="btn btn-sincronizar" 
                title="Atualiza sistemas conforme a tela de processos">
                <i class="fas fa-sync"></i> Sincronizar Sistemas
              </button>
              <AnaliseExportMenu 
                :data="analiseItems"
                :processo="processoAtual"  
                :percentualMinimoGeral="percentualMinimoGeral"
                :percentualMinimoObrigatorio="percentualMinimoObrigatorios"
              />
            </div>
            <!-- Botões de navegação -->
            <div class="navigation-actions">
              <simple-nav-button 
                v-if="step > 0" 
                direction="prev"
                text="Anterior"
                @click="voltarEtapa"
              />
              <simple-nav-button
                v-if="step < 2" 
                direction="next"
                text="Próximo"
                :disabled="!podeAvancar"
                @click="avancarEtapa"
              />
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
            <div class="ordering-tip">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
              </svg>
              <span>Você pode arrastar as linhas para reordenar e excluir qualquer sistema</span>
            </div>
            <div class="analise-config">
              <div class="percentual-container">
                <div class="percentual-minimo" title="Valor mínimo de percentual de atendimento para sistemas normais">
                  <label class="custom-cursor-default-hover">% Mínimo Geral:</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    class="percentual-input"
                    v-model.number="percentualMinimoGeral"
                    @change="aplicarPercentualGeralTodasLinhas"
                  />
                </div>
                <div class="percentual-obrigatorios" title="Valor mínimo de percentual de atendimento para sistemas marcados como obrigatórios">
                  <label>% Mínimo Obrigatórios:</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    class="percentual-input"
                    v-model.number="percentualMinimoObrigatorios"
                    @change="aplicarPercentualObrigatoriosTodasLinhas"
                  />
                </div>
                <!-- Novo botão para redefinir todos os percentuais -->
                <div class="percentual-reset">
                  <button 
                    @click="redefinirTodosPercentuais" 
                    class="btn-reset-percentuais" 
                    title="Redefinir todas as porcentagens individuais para os valores padrão definidos acima">
                    <i class="fas fa-sync-alt"></i> Redefinir Todos Percentuais
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="copy-hint">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
              <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
            </svg>
            <span>Dica: você pode selecionar e copiar qualquer texto desta tabela 
              (segure SHIFT e arraste o mouse em cima do que queira copiar)
            </span>
          </div>

          <table class="analise-table">
            <thead>
              <tr>
                <th class="drag-column"></th>
                <th>Sistema</th>
                <th>Total de Itens</th>
                <th title="Insira 0 para sistemas que atendem 100%, ou deixe vazio para 'Não analisado'">Não Atendidos</th>                <th>Atendidos</th>
                <th>% Não Atendimento</th>
                <th>% Atendimento</th>
                <th>Obrigatório</th>
                <th>% Mínimo</th>
                <th>Status</th>
                <th class="text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(sistema, index) in sistemasAnalise" :key="sistema.id" 
                  :class="[calcularClasseEstilo(sistema), { 'custom-line': sistema.isCustomLine, 'dragging': isDragging === sistema.id }]"
                  :data-id="sistema.id"
                  draggable="true"
                  @dragstart="startDrag($event, sistema, index)"
                  @dragover.prevent
                  @dragenter.prevent="onDragEnter($event, index)"
                  @dragleave.prevent="onDragLeave($event)"
                  @drop.prevent="onDrop($event, index)"
                  class="user-select-text">
                <td class="drag-handle-column">
                  <div class="drag-handle" title="Arrastar para ordenar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                    </svg>
                  </div>
                </td>
                <td @click="sistema.isCustomLine && editarCelula(sistema, 'nome')" 
                    :class="{ 'editable-cell': sistema.isCustomLine }">
                  <div v-if="editando.id === sistema.id && editando.campo === 'nome'">
                    <input class="edit-input form-control form-control-sm" 
                           v-model="editando.valor" 
                           @blur="salvarEdicao(sistema)"
                           @keyup.enter="salvarEdicao(sistema)"
                           @keyup.esc="cancelarEdicao" />
                  </div>
                  <div v-else>
                    {{ sistema.nome }}
                    <span v-if="sistema.isCustomLine" class="edit-indicator"><i class="fas fa-pencil-alt"></i></span>
                  </div>
                </td>
                <td @click="editarCelula(sistema, 'totalItens')">
                  <div v-if="editando.id === sistema.id && editando.campo === 'totalItens'">
                    <input 
                      class="edit-input" 
                      v-model="editando.valor" 
                      type="number"
                      min="0"
                      @blur="salvarEdicao(sistema)"
                      @keyup.enter="salvarEdicao(sistema)"
                      @keyup.tab="handleTabNavigation($event, sistema, 'totalItens', 'naoAtendidos')"
                      @keyup.escape="cancelarEdicao"
                      autofocus
                    />
                  </div>
                  <div v-else class="editable-cell">
                    {{ sistema.totalItens || '' }}
                  </div>
                </td>
                <td :class="{ 'nao-atendidos': sistema.naoAtendidos > 0 }">
                  <div v-if="editando.id === sistema.id && editando.campo === 'naoAtendidos'">
                    <input 
                      class="edit-input" 
                      v-model="editando.valor" 
                      type="number"
                      min="0"
                      :max="sistema.totalItens"
                      @blur="salvarEdicao(sistema)"
                      @keyup.enter="salvarEdicao(sistema)"
                      @keyup.escape="cancelarEdicao"
                      autofocus
                    />
                  </div>
                  <div v-else class="editable-cell" @click="editarCelula(sistema, 'naoAtendidos')">
                    {{ sistema.naoAtendidos || '' }}
                  </div>
                </td>
                <td>
                  <span v-if="sistema.naoAtendidos > 0">
                    {{ sistema.totalItens - sistema.naoAtendidos }} (calculado)
                  </span>
                </td>
                <td>
                  <span v-if="sistema.naoAtendidos > 0" class="porcentagem-nao-atendimento">
                    {{ formatarPercentual(calcularPorcentagem(sistema.naoAtendidos, sistema.totalItens)) }}%
                  </span>
                </td>
                <td>
                  <span v-if="sistema.naoAtendidos > 0" class="porcentagem-atendimento">
                    {{ formatarPercentual(calcularPorcentagem(sistema.totalItens - sistema.naoAtendidos, sistema.totalItens)) }}%
                  </span>
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
                    :value="sistema.percentualMinimoPersonalizado ? sistema.percentualMinimo : ''"
                    @input="e => { 
                      sistema.percentualMinimo = e.target.value ? Number(e.target.value) : ''; 
                      salvarPercentualPersonalizado(sistema);
                    }"
                    class="percentual-input-small"
                    min="0"
                    max="100"
                    placeholder="Mínimo"
                  />
                </td>
                <td>
                  <span v-if="sistema.naoAtendidos > 0" :class="getStatusAtendimento(sistema).class">
                    {{ getStatusAtendimento(sistema).texto }}
                  </span>
                  <span v-else class="status-nao-analisado">
                    Não analisado
                  </span>
                </td>
                <!-- Botão de ações -->
                <td class="text-center">
                  <button @click="removerSistema(sistema)" class="btn btn-sm btn-outline-danger">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                      <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Adicione esta classe para a div com a porcentagem geral -->
          <div class="analise-resumo">
            <div class="percentual-geral" :class="getStatusGeralClass">
              <span>
                <template v-if="getStatusGeral !== 'Não Analisado'">
                  Atendimento Geral: {{ formatarPercentual(porcentagemGeralAtendimento) }}%
                </template>
                <template v-else>
                  Nenhum sistema analisado
                </template>
              </span>
              <span class="status-geral" :class="{'status-nao-analisado': getStatusGeral === 'Não Analisado'}">
                {{ getStatusGeral }}
              </span>
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
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import TheSidebar from '@/components/TheSidebar.vue'
import AnoSelection from '@/components/lances/AnoSelection.vue'
import ProcessoSelection from '@/components/lances/ProcessoSelection.vue'
import { useAnalises } from '@/composables/useAnalises'
import * as XLSX from 'xlsx'
import ToastMessages from '@/components/ToastMessages.vue'
import { useToast } from '@/composables/useToast'
import AnaliseExportMenu from '@/components/analises/AnaliseExportMenu.vue'
import SimpleNavButton from '@/components/navigation/SimpleNavButton.vue'


export default {
  name: 'AnalisesView',
  
  components: {
    TheSidebar,
    AnoSelection,
    ProcessoSelection,
    ToastMessages,
    AnaliseExportMenu,
    SimpleNavButton,
    
  },
  
  // Adicione esta declaração de emits
  emits: ['sidebarToggle', 'vnodeUnmounted'],

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
    const percentualMinimoGeral = ref(''); // Antes era ref(60)
    const percentualMinimoObrigatorios = ref(''); // Antes era ref(90)
    
    // Adicione o Toast
    const { toasts, showToast } = useToast();

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
      voltarEtapa,
      avancarEtapa,
      calcularPorcentagem,
      loadProcessos,
      carregarAnalisesSistemas,
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

    // Adicione a função que está faltando:
    const carregarAnalisesSistemasExtended = async () => {
      try {
        console.log('🔄 Carregando análise de sistemas com recursos estendidos');
        
        // Primeiro, carregar os sistemas básicos
        const resultado = await carregarAnalisesSistemas();
        
        // Verificar se os percentuais mínimos estão definidos
        if (!percentualMinimoGeral.value || !percentualMinimoObrigatorios.value) {
          console.log('📊 Definindo percentuais padrão pois estão vazios');
          await preencherPercentuaisMinimosDefault();
        }
        
        // Sincronizar as cores após o carregamento
        setTimeout(sincronizarCores, 100);
        
        return resultado;
      } catch (error) {
        console.error('❌ Erro ao carregar análises com recursos estendidos:', error);
        showToast('Erro ao carregar sistemas de análise', 'error');
        throw error;
      }
    };
    
    // Função para cálculo do status de atendimento corrigida
    const getStatusAtendimento = (sistema) => {
      if (!sistema.totalItens) {
        return {
          texto: `Não Atende (Min: ${sistema.percentualMinimo}%)`,
          class: 'status-nao-atende',
          classeEstilo: 'nao-atende-status-forte'
        };
      }
    
      // Calcular porcentagem de atendimento corretamente
      const percentualNaoAtendimento = calcularPorcentagemPrecisa(sistema.naoAtendidos, sistema.totalItens);
      const percentualAtendimento = 100 - percentualNaoAtendimento;
      
      // Determinar o percentual mínimo com base na obrigatoriedade
      const percentualMinimo = sistema.obrigatorio 
        ? percentualMinimoObrigatorios.value 
        : percentualMinimoGeral.value;
      
      // Determinar se atende ao percentual mínimo
      if (percentualAtendimento >= percentualMinimo) {
        return {
          texto: `Atende (${formatarPercentual(percentualAtendimento)}%)`,
          class: 'status-atende',
          classeEstilo: 'atende-status-forte'
        };
      } else {
        return {
          texto: `Não Atende (Min: ${percentualMinimo}%)`,
          class: 'status-nao-atende',
          classeEstilo: 'nao-atende-status-forte'
        };
      }
    };

    // Adicione esta função para cálculo de porcentagem mais precisa
    const calcularPorcentagemPrecisa = (valor, total) => {
      if (!total) return 0;
      
      // Use precisão de ponto flutuante de alta precisão
      const percentual = (Number(valor) / Number(total)) * 100;
      
      // Garantir que o valor seja representado com alta precisão
      // mas evitando erros de arredondamento de ponto flutuante
      return Math.round(percentual * 1000000) / 1000000;
    };

    // Substitua a função formatarPercentual existente por esta versão melhorada:
    const formatarPercentual = (valor) => {
      if (valor === 0) return "0";
      if (valor === 100) return "100";
      
      // Para valores extremamente pequenos (menor que 0.00001%)
      if (valor < 0.00001) {
        return valor.toExponential(5); // Notação científica para valores extremamente pequenos
      }
      
      // Para valores muito pequenos, use até 5 casas decimais
      if (valor < 0.001) {
        // Remover zeros à direita desnecessários
        return valor.toFixed(5).replace(/\.?0+$/, '');
      }
      
      // Para valores pequenos mas significativos
      if (valor < 0.01) {
        return valor.toFixed(4).replace(/\.?0+$/, '');
      }
      
      // Para valores entre 0.01% e 0.1%
      if (valor < 0.1) {
        return valor.toFixed(3).replace(/\.?0+$/, '');
      }
      
      // Para valores entre 0.1% e 1%
      if (valor < 1) {
        return valor.toFixed(2).replace(/\.?0+$/, '');
      }
      
      // Para valores próximos de 100%, use mais precisão
      if (valor > 99 && valor < 100) {
        return valor.toFixed(4).replace(/\.?0+$/, '');
      }
      
      // Para outros valores, use 2 casas decimais padrão
      return valor.toFixed(2).replace(/\.?0+$/, '');
    };

    // Status geral da análise
    const getStatusGeralClass = computed(() => {
      // Calcular percentual geral
      const percentualGeral = porcentagemGeralAtendimento.value;
      
      // Status baseado apenas no percentual geral comparado ao mínimo geral
      return {
        'status-geral-atende': percentualGeral >= percentualMinimoGeral.value,
        'status-geral-nao-atende': percentualGeral < percentualMinimoGeral.value
      }
    })

    const getStatusGeral = computed(() => {
      // Filtrar apenas sistemas que foram analisados (têm valor em naoAtendidos, incluindo 0)
      const sistemasAnalisados = sistemasAnalise.value.filter(s => 
        s.naoAtendidos !== undefined && s.naoAtendidos !== null && 
        s.naoAtendidos !== '' && s.totalItens > 0
      );
      
      // Se não temos sistemas analisados, retornar mensagem específica
      if (sistemasAnalisados.length === 0) {
        return 'Não Analisado';
      }
      
      // Calcular totais apenas para os sistemas analisados
      const totalItens = sistemasAnalisados.reduce((acc, s) => acc + s.totalItens, 0);
      const totalNaoAtendidos = sistemasAnalisados.reduce((acc, s) => acc + s.naoAtendidos, 0);
      
      // Calcular percentual geral de forma precisa
      const percentualGeralNaoAtendimento = totalItens ? (totalNaoAtendidos / totalItens) * 100 : 0;
      const percentualGeralAtendimento = 100 - percentualGeralNaoAtendimento;
      
      // Determinar o status baseado APENAS no percentual geral
      const atendeGeral = percentualGeralAtendimento >= percentualMinimoGeral.value;
    
      if (atendeGeral) {
        return 'Atende Requisitos';
      } 
      return 'Não Atende Requisitos';
    });
    
    // Adicione esta computed property para verificar sistemas obrigatórios separadamente
    const temSistemasObrigatoriosNaoAtendidos = computed(() => {
      return sistemasAnalise.value
        .filter(s => s.obrigatorio)
        .some(s => {
          if (!s.totalItens) return false;
          
          const percentualNaoAtendimento = calcularPorcentagemPrecisa(s.naoAtendidos, s.totalItens);
          const percentualAtendimento = 100 - percentualNaoAtendimento;
          // Verificar se não atende ao percentual mínimo de obrigatórios
          return percentualAtendimento < percentualMinimoObrigatorios.value;
        });
    });

    // Substitua completamente a função salvarAnalises
    const salvarAnalises = async () => {
      try {
        const promises = sistemasAnalise.value.map(sistema => {
          // Para anotações personalizadas
          if (sistema.isCustomLine) {
            return supabase
              .from('analises_itens')
              .update({
                sistema_nome_personalizado: sistema.nome,
                total_itens: sistema.totalItens || 0,
                nao_atendidos: sistema.naoAtendidos || 0,
                obrigatorio: sistema.obrigatorio || false,
                percentual_minimo: sistema.percentualMinimo || 70,
                updated_at: new Date().toISOString()
              })
              .eq('id', sistema.id);
          } else {
            // Para sistemas normais
            return supabase
              .from('analises_itens')
              .update({
                total_itens: sistema.totalItens || 0,
                nao_atendidos: sistema.naoAtendidos || 0,
                obrigatorio: sistema.obrigatorio || false,
                percentual_minimo: sistema.percentualMinimo || 70,
                updated_at: new Date().toISOString()
              })
              .eq('id', sistema.id);
          }
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
        showToast('Erro ao salvar análises: ' + (error.message || 'Erro desconhecido'), 'error');
      }
    };

    // Exportações
    const exportarExcel = () => {
      const dados = sistemasAnalise.value.map(sistema => {
        const percentualNaoAtendimento = calcularPorcentagemPrecisa(sistema.naoAtendidos, sistema.totalItens);
        const percentualAtendimento = 100 - percentualNaoAtendimento;
        
        return {
          'Sistema': sistema.nome,
          'Total de Itens': sistema.totalItens,
          'Não Atendidos': sistema.naoAtendidos,
          'Atendidos': sistema.atendidos,
          '% Não Atendimento': formatarPercentual(percentualNaoAtendimento) + '%',
          '% Atendimento': formatarPercentual(percentualAtendimento) + '%',
          'Obrigatório': sistema.obrigatorio ? 'Sim' : 'Não',
          '% Mínimo': sistema.percentualMinimo || '-',
          'Status': getStatusAtendimento(sistema).texto
        };
      });
    
      // Resto do código de exportação
      const ws = XLSX.utils.json_to_sheet(dados);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Análise de Sistemas');
      XLSX.writeFile(wb, `analise_sistemas_${processoAtual.value?.numero_processo}.xlsx`);
    };

    // Adicione esta função ao setup
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

    // Função para editar células
    const editarCelula = (sistema, campo) => {
      // Se já está editando esta célula, não fazer nada
      if (editando.value.id === sistema.id && editando.value.campo === campo) {
        return;
      }
      
      // Cancelar edição anterior, se houver
      if (editando.value.id) {
        cancelarEdicao();
      }
      
      // Permitir edição do nome apenas para linhas personalizadas
      if (campo === 'nome' && !sistema.isCustomLine) {
        return;
      }
      
      editando.value = {
        id: sistema.id,
        campo: campo,
        valor: sistema[campo]?.toString() || ''
      };
      
      nextTick(() => {
        const input = document.querySelector('.edit-input');
        if (input) {
          input.focus();
          input.select();
        }
      });
    }

    // Substitua a função salvarEdicao pelo código abaixo:
    const salvarEdicao = async (sistema) => {
      try {
        let valor;
        
        // Tratar o campo "nome" de forma diferente (como texto)
        if (editando.value.campo === 'nome') {
          if (!editando.value.valor || !editando.value.valor.trim()) {
            throw new Error('Nome da anotação não pode estar vazio');
          }
          valor = editando.value.valor.trim();
        } else {
          // Para campos numéricos, validar e converter
          try {
            // Remover caracteres não numéricos e converter para inteiro
            valor = parseInt(editando.value.valor.toString().replace(/[^\d]/g, '') || '0');
            
            if (isNaN(valor) || valor < 0) {
              throw new Error('Por favor, insira um número válido maior ou igual a zero');
            }
          } catch (e) {
            // Se ocorrer um erro na conversão, definir como zero
            console.warn('Erro ao converter valor numérico:', e);
            valor = 0;
          }
          
          // Validações específicas para campos numéricos
          if (editando.value.campo === 'totalItens') {
            if (sistema.naoAtendidos > valor) {
              sistema.naoAtendidos = valor;
              // Atualizar também o valor de não atendidos no banco para manter consistência
              await supabase
                .from('analises_itens')
                .update({
                  nao_atendidos: valor,
                  updated_at: new Date().toISOString()
                })
                .eq('id', sistema.id);
            }
          } else if (editando.value.campo === 'naoAtendidos') {
            if (valor > sistema.totalItens) {
              throw new Error('O número de itens não atendidos não pode ser maior que o total');
            }
          }
        }
    
        // Mapear campos da UI para campos do banco
        const camposBanco = {
          'nome': 'sistema_nome_personalizado',
          'totalItens': 'total_itens',
          'naoAtendidos': 'nao_atendidos'
        };
    
        // Preparar objeto de atualização
        const atualizacao = {
          [camposBanco[editando.value.campo] || editando.value.campo]: valor,
          updated_at: new Date().toISOString()
        };
    
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
          
          // Importante: Atualizar a classe de estilo imediatamente após recalcular valores
          atualizarClasseEstilo(sistema);
        }
        
        // Marcar que há alterações pendentes
        alteracoesPendentes.value = true;
        showToast('Alteração salva com sucesso', 'success');
    
      } catch (error) {
        console.error('Erro ao salvar:', error);
        showToast(error.message || 'Erro ao salvar alterações', 'error');
      } finally {
        cancelarEdicao();
      }
    };
    
    // Adicione esta função para recalcular e atualizar a classe de estilo
    const atualizarClasseEstilo = (sistema) => {
      if (!sistema.totalItens) {
        sistema.classeEstilo = 'neutro';
        return;
      }
    
      // Calcular percentual de atendimento
      const percentualNaoAtendimento = calcularPorcentagemPrecisa(sistema.naoAtendidos, sistema.totalItens);
      const percentualAtendimento = 100 - percentualNaoAtendimento;
      
      // Determinar o percentual mínimo com base na obrigatoriedade
      const percentualMinimo = sistema.obrigatorio 
        ? percentualMinimoObrigatorios.value 
        : percentualMinimoGeral.value;
      
      // Definir classe com base no atendimento
      if (percentualAtendimento >= percentualMinimo) {
        sistema.classeEstilo = 'atende-status-forte';
      } else {
        sistema.classeEstilo = 'nao-atende-status-forte';
      }
    };

    // Adicione estas duas funções auxiliares:
    const ajustarNaoAtendidos = async (sistemaId, novoTotalItens) => {
      try {
        // Busca o sistema no array local
        const sistemaLocal = sistemasAnalise.value.find(s => s.id === sistemaId);
        if (!sistemaLocal) return;
        
        // Ajusta o valor de naoAtendidos para ser igual ao novo totalItens (pior cenário)
        const novoNaoAtendidos = novoTotalItens;
        
        // Atualiza no banco de dados
        await supabase
          .from('analises_itens')
          .update({
            nao_atendidos: novoNaoAtendidos,
            updated_at: new Date().toISOString()
          })
          .eq('id', sistemaId);
        
        // Atualiza localmente  
        sistemaLocal.naoAtendidos = novoNaoAtendidos;
        sistemaLocal.atendidos = sistemaLocal.totalItens - sistemaLocal.naoAtendidos;
        
        showToast('Dados não atendidos foram ajustados automaticamente', 'info');
      } catch (error) {
        console.error('Erro ao ajustar não atendidos:', error);
      }
    };
    
    const ajustarTotalItens = async (sistemaId, novoNaoAtendidos) => {
      try {
        // Busca o sistema no array local
        const sistemaLocal = sistemasAnalise.value.find(s => s.id === sistemaId);
        if (!sistemaLocal) return;
        
        // Ajusta o valor de totalItens para ser maior que o novo naoAtendidos
        const novoTotalItens = novoNaoAtendidos;
        
        // Atualiza no banco de dados
        await supabase
          .from('analises_itens')
          .update({
            total_itens: novoTotalItens,
            updated_at: new Date().toISOString()
          })
          .eq('id', sistemaId);
        
        // Atualiza localmente  
        sistemaLocal.totalItens = novoTotalItens;
        sistemaLocal.atendidos = sistemaLocal.totalItens - sistemaLocal.naoAtendidos;
        
        showToast('Total de itens foi ajustado automaticamente', 'info');
      } catch (error) {
        console.error('Erro ao ajustar total de itens:', error);
      }
    };

    const cancelarEdicao = () => {
      editando.value = {
        id: null,
        campo: null,
        valor: null
      }
    }

    // Adicione esta função para adicionar anotação
    const adicionarAnotacao = async () => {
      try {
        // Inserir nova linha no banco de dados
        const { data, error } = await supabase
          .from('analises_itens')
          .insert({
            processo_id: selectedProcesso.value,
            sistema_nome_personalizado: 'Nova Anotação',
            is_custom_line: true,
            total_itens: 0,
            nao_atendidos: 0,
            obrigatorio: false,
            percentual_minimo: percentualMinimoGeral.value,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (error) throw error;
        
        // Criar objeto para adicionar à lista
        const novaAnotacao = {
          id: data.id,
          nome: data.sistema_nome_personalizado || 'Nova Anotação',
          isCustomLine: true,
          sistema_id: null,
          totalItens: 0,
          naoAtendidos: 0,
          atendidos: 0,
          obrigatorio: false,
          percentualMinimo: percentualMinimoGeral.value,
          classeEstilo: 'neutro' // Define classe neutra inicial
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

    // Implementar função para salvar obrigatoriedade
    const salvarPercentualPersonalizado = async (sistema) => {
      try {
        // Armazenar o valor anterior para restaurar em caso de erro
        const valorAnterior = sistema.percentualMinimoAnterior;
        
        // Validar valor entre 0 e 100
        if (sistema.percentualMinimo < 0) sistema.percentualMinimo = 0;
        if (sistema.percentualMinimo > 100) sistema.percentualMinimo = 100;
        
        const { error } = await supabase
          .from('analises_itens')
          .update({
            percentual_minimo: sistema.percentualMinimo,
            percentual_minimo_personalizado: true, // Marcar como personalizado
            updated_at: new Date().toISOString()
          })
          .eq('id', sistema.id);
    
        if (error) throw error;
        
        // Marcar localmente como personalizado
        sistema.percentualMinimoPersonalizado = true;
        
        // Atualizar a classe de estilo
        atualizarClasseEstilo(sistema);
        
        alteracoesPendentes.value = true;
        showToast('Percentual mínimo personalizado salvo', 'success');
      } catch (error) {
        console.error('Erro ao salvar percentual personalizado:', error);
        // Reverter para o valor anterior em caso de erro
        sistema.percentualMinimo = sistema.percentualMinimoAnterior;
        showToast('Erro ao atualizar percentual mínimo', 'error');
      }
    };

    // Modifique a função salvarObrigatoriedade para atualizar a classe de estilo imediatamente após alternar:
    const salvarObrigatoriedade = async (sistema) => {
      try {
        // Verificar se o status mudou para obrigatório
        const tornadoObrigatorio = sistema.obrigatorio;
        
        // Se acabou de ser marcado como obrigatório, verificar se deve atualizar o percentual mínimo
        let atualizaPercentual = false;
        
        if (tornadoObrigatorio) {
          // Perguntar se deseja atualizar o percentual mínimo para o valor padrão de obrigatórios
          atualizaPercentual = confirm(
            `Atualizar o percentual mínimo deste sistema para ${percentualMinimoObrigatorios.value}% (padrão para sistemas obrigatórios)?`
          );
        }
        
        // Preparar objeto de atualização
        const atualizacao = {
          obrigatorio: sistema.obrigatorio,
          updated_at: new Date().toISOString()
        };
        
        // Se precisar atualizar o percentual também
        if (atualizaPercentual) {
          atualizacao.percentual_minimo = percentualMinimoObrigatorios.value;
          atualizacao.percentual_minimo_personalizado = true; // Marcar como personalizado
          sistema.percentualMinimo = percentualMinimoObrigatorios.value;
          sistema.percentualMinimoPersonalizado = true;
        } else if (!sistema.percentualMinimoPersonalizado) {
          // Se não é personalizado, atualizar para o padrão correto conforme obrigatoriedade
          const percentualPadrao = sistema.obrigatorio 
            ? percentualMinimoObrigatorios.value 
            : percentualMinimoGeral.value;
            
          atualizacao.percentual_minimo = percentualPadrao;
          sistema.percentualMinimo = percentualPadrao;
        }
        
        // Enviar para o banco de dados
        const { error } = await supabase
          .from('analises_itens')
          .update(atualizacao)
          .eq('id', sistema.id);
    
        if (error) throw error;
        
        // Atualizar a classe de estilo imediatamente após salvar
        // Mesmo que não atualize o percentual, o status de obrigatoriedade mudou
        atualizarClasseEstilo(sistema);
        
        alteracoesPendentes.value = true;
        
        if (atualizaPercentual) {
          showToast('Obrigatoriedade e percentual mínimo atualizados', 'success');
        } else {
          showToast('Obrigatoriedade atualizada', 'success');
        }
      } catch (error) {
        console.error('Erro ao salvar obrigatoriedade:', error);
        sistema.obrigatorio = !sistema.obrigatorio; // Reverte a mudança em caso de erro
        showToast('Erro ao salvar obrigatoriedade', 'error');
      }
    };

    // Função de sincronização de sistemas
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

    // Funções de arraste e ordenação
    const isDragging = ref(null);
    const draggedItem = ref(null);
    const dragOverIndex = ref(null);

    const startDrag = (event, sistema, index) => {
      isDragging.value = sistema.id;
      draggedItem.value = sistema;
      event.dataTransfer.effectAllowed = 'move';
      // Armazenar o ID do sistema para identificação durante o drop
      event.dataTransfer.setData('text/plain', sistema.id);
    };

    const onDragEnter = (event, index) => {
      const tr = event.currentTarget;
      tr.classList.add('drag-over');
      dragOverIndex.value = index;
    };

    const onDragLeave = (event) => {
      event.currentTarget.classList.remove('drag-over');
    };

    const onDrop = async (event, targetIndex) => {
      event.currentTarget.classList.remove('drag-over');
      const sistemaId = event.dataTransfer.getData('text/plain');
      
      // Encontrar os índices do item arrastado e do alvo
      const sourceIndex = sistemasAnalise.value.findIndex(s => s.id === sistemaId);
      
      if (sourceIndex === -1 || sourceIndex === targetIndex) return;
      
      try {
        // Criar uma cópia da ordem atual
        const reorderedSistemas = [...sistemasAnalise.value];
        
        // Remover o elemento da posição original
        const [movedItem] = reorderedSistemas.splice(sourceIndex, 1);
        
        // Inserir o elemento na nova posição
        reorderedSistemas.splice(targetIndex, 0, movedItem);
        
        // Atualizar a ordem no estado local
        sistemasAnalise.value = reorderedSistemas;
        
        // Atualizar a ordem no banco de dados
        await salvarOrdemSistemas(reorderedSistemas);
        
        showToast('Ordem atualizada com sucesso', 'success');
      } catch (error) {
        console.error('Erro ao reordenar sistemas:', error);
        showToast('Erro ao reordenar sistemas: ' + error.message, 'error');
      } finally {
        isDragging.value = null;
        draggedItem.value = null;
        dragOverIndex.value = null;
      }
    };

    // Função para salvar a nova ordem no banco de dados
    const salvarOrdemSistemas = async (sistemas) => {
      try {
        // Adicionar índice a cada sistema
        const promises = sistemas.map((sistema, index) => {
          return supabase
            .from('analises_itens')
            .update({
              ordem_exibicao: index,
              updated_at: new Date().toISOString()
            })
            .eq('id', sistema.id);
        });
        
        await Promise.all(promises);
        alteracoesPendentes.value = true;
      } catch (error) {
        console.error('Erro ao salvar ordem dos sistemas:', error);
        throw error;
      }
    };

    // Substituir a função removerAnotacao por removerSistema (mais genérica)
    const removerSistema = async (sistema) => {
      try {
        let mensagemConfirmacao;
        
        if (sistema.isCustomLine) {
          mensagemConfirmacao = 'Tem certeza que deseja remover esta anotação?';
        } else {
          mensagemConfirmacao = `Tem certeza que deseja remover o sistema "${sistema.nome}" da análise?\n\nIsso não afetará o vínculo com o processo na tela de processos.`;
        }
        
        // Confirmar antes de remover
        if (!confirm(mensagemConfirmacao)) return;
        
        // Remover do banco de dados
        const { error } = await supabase
          .from('analises_itens')
          .delete()
          .eq('id', sistema.id);
          
        if (error) throw error;
        
        // Remover da lista local
        sistemasAnalise.value = sistemasAnalise.value.filter(s => s.id !== sistema.id);
        
        showToast(`${sistema.isCustomLine ? 'Anotação' : 'Sistema'} removido com sucesso`, 'success');
        alteracoesPendentes.value = true;
        
      } catch (error) {
        console.error('Erro ao remover item:', error);
        showToast('Erro ao remover: ' + error.message, 'error');
      }
    };

    // Adicione essas funções dentro do setup()
    const atualizarPercentuaisMinimos = async (general, obrigatorios) => {
      try {
        console.log('🔄 Atualizando percentuais mínimos:', general, obrigatorios);
        
        // Atualizar valores locais
        if (general !== undefined) {
          percentualMinimoGeral.value = general;
          console.log('📊 Percentual geral atualizado para:', percentualMinimoGeral.value);
        }
        
        if (obrigatorios !== undefined) {
          percentualMinimoObrigatorios.value = obrigatorios;
          console.log('📊 Percentual obrigatórios atualizado para:', percentualMinimoObrigatorios.value);
        }
        
        // Se temos um processo selecionado, salvar no banco
        if (selectedProcesso.value) {
          await salvarPercentuaisMinimos();
        }
      } catch (error) {
        console.error('❌ Erro ao atualizar percentuais mínimos:', error);
        showToast('Erro ao atualizar percentuais mínimos', 'error');
      }
    };

    const atualizarPercentuaisObrigatorios = async () => {
      try {
        // Validar o valor para garantir que esteja entre 0 e 100
        if (percentualMinimoObrigatorios.value < 0) percentualMinimoObrigatorios.value = 0;
        if (percentualMinimoObrigatorios.value > 100) percentualMinimoObrigatorios.value = 100;
        
        // Salvar primeiro os novos valores no banco
        await salvarPercentuaisMinimos();
        
        // Perguntar se o usuário deseja aplicar esse percentual para todos os sistemas obrigatórios
        if (confirm(`Deseja aplicar o percentual mínimo de ${percentualMinimoObrigatorios.value}% para todos os sistemas marcados como obrigatórios?`)) {
          // Atualizar apenas sistemas obrigatórios
          const promessas = sistemasAnalise.value
            .filter(sistema => sistema.obrigatorio)
            .map(async (sistema) => {
              // Atualizar localmente
              sistema.percentualMinimo = percentualMinimoObrigatorios.value;
              
              // Atualizar no banco de dados
              return supabase
                .from('analises_itens')
                .update({
                  percentual_minimo: percentualMinimoObrigatorios.value,
                  updated_at: new Date().toISOString()
                })
                .eq('id', sistema.id);
            });
          
          await Promise.all(promessas);
          alteracoesPendentes.value = true;
          
          // Atualizar cores
          sincronizarCores();
          
          showToast('Percentual mínimo atualizado para todos os sistemas obrigatórios', 'success');
        }
      } catch (error) {
        console.error('Erro ao atualizar percentuais mínimos para obrigatórios:', error);
        showToast('Erro ao atualizar percentuais mínimos para obrigatórios', 'error');
      }
    };

    // Função para sincronizar todas as cores da tabela (opcional: para resolver problemas existentes)
    const sincronizarCores = () => {
      console.group('🔄 Sincronizando cores');
      console.log('📊 Usando percentuais - Geral:', percentualMinimoGeral.value, 'Obrigatórios:', percentualMinimoObrigatorios.value);
      console.log('📋 Aplicando em', sistemasAnalise.value.length, 'sistemas');
      
      sistemasAnalise.value.forEach(sistema => {
        const classeAnterior = sistema.classeEstilo;
        
        if (!sistema.totalItens) {
          sistema.classeEstilo = 'neutro';
          return;
        }
        
        // Calcular percentual de atendimento
        const percentualNaoAtendimento = calcularPorcentagemPrecisa(sistema.naoAtendidos, sistema.totalItens);
        const percentualAtendimento = 100 - percentualNaoAtendimento;
        
        // Determinar o percentual mínimo com base na obrigatoriedade
        const percentualMinimo = sistema.obrigatorio 
          ? percentualMinimoObrigatorios.value 
          : percentualMinimoGeral.value;
        
        // Definir classe com base no atendimento
        if (percentualAtendimento >= percentualMinimo) {
          sistema.classeEstilo = 'atende-status-forte';
        } else {
          sistema.classeEstilo = 'nao-atende-status-forte';
        }
        
        if (classeAnterior !== sistema.classeEstilo) {
          console.log(`🎨 Sistema "${sistema.nome}": ${classeAnterior || 'sem classe'} -> ${sistema.classeEstilo} (${percentualAtendimento.toFixed(1)}% >= ${percentualMinimo}%: ${percentualAtendimento >= percentualMinimo})`);
        }
      });
      
      console.groupEnd();
    };

    // Chame esta função após carregar os dados ou após adicionar uma anotação
    // Adicione ao mounted ou onde carregar dados iniciais
    onMounted(() => {
      window.addEventListener('beforeunload', handleBeforeUnload);
      loadProcessos().then(() => {
        // Se já tem um processo selecionado, carregar seus percentuais
        if (selectedProcesso.value) {
          carregarPercentuaisMinimos(selectedProcesso.value);
        }
        
        // Sincronizar cores após carregar tudo
        setTimeout(sincronizarCores, 100);
      });
    });

    // Substitua a função carregarPercentuaisMinimos por esta versão aprimorada:
    const carregarPercentuaisMinimos = async (processoId) => {
      try {
        console.log('🔄 Iniciando carregamento de percentuais mínimos para processo:', processoId);
        
        if (!processoId) {
          console.error('❌ ID de processo não fornecido para carregar percentuais');
          return;
        }
        
        // Criar a chave de configuração
        const chaveConfig = `percentual_minimo_processo_${processoId}`;
        console.log('🔍 Buscando configuração com chave:', chaveConfig);
        
        const { data, error } = await supabase
          .from('configuracoes')
          .select('*')
          .eq('chave', chaveConfig)
          .single();
          
        if (error) {
          if (error.code === 'PGRST116') { // Registro não encontrado
            console.warn('⚠️ Nenhuma configuração encontrada para chave', chaveConfig, 'usando valores padrão');
            return;
          }
          console.error('❌ Erro ao buscar configurações:', error);
          throw error;
        }
        
        console.log('📊 Dados carregados do banco:', data);
        
        if (data && data.valor) {
          try {
            const valores = JSON.parse(data.valor);
            console.log('📈 Valores JSON parseados:', valores);
            
            // Garantir que os valores sejam números válidos antes de atribuir
            if (typeof valores.geral === 'number' && !isNaN(valores.geral)) {
              percentualMinimoGeral.value = valores.geral;
              console.log('✅ Percentual mínimo geral atualizado para:', percentualMinimoGeral.value);
            } else {
              console.warn('⚠️ Valor geral inválido no banco:', valores.geral);
            }
            
            if (typeof valores.obrigatorios === 'number' && !isNaN(valores.obrigatorios)) {
              percentualMinimoObrigatorios.value = valores.obrigatorios;
              console.log('✅ Percentual mínimo obrigatórios atualizado para:', percentualMinimoObrigatorios.value);
            } else {
              console.warn('⚠️ Valor obrigatórios inválido no banco:', valores.obrigatorios);
            }
            
            // Forçar uma atualização sincronizada
            nextTick(() => {
              sincronizarCores();
            });
          } catch (e) {
            console.error('❌ Erro ao processar valores de percentuais:', e);
          }
        } else {
          console.warn('⚠️ Nenhum valor encontrado no registro da configuração');
        }
      } catch (error) {
        console.error('❌ Erro ao carregar percentuais mínimos:', error);
        // Em caso de erro, manter os valores padrão
      }
    };

    // Substitua a função salvarPercentuaisMinimos por esta versão aprimorada:
    const salvarPercentuaisMinimos = async () => {
      try {
        if (!selectedProcesso.value) {
          console.error('❌ Nenhum processo selecionado ao salvar percentuais');
          return;
        }
        
        console.log('🔄 Iniciando salvamento de percentuais mínimos para processo:', selectedProcesso.value);
        
        // Validar valores entre 0 e 100
        percentualMinimoGeral.value = Math.min(100, Math.max(0, percentualMinimoGeral.value));
        percentualMinimoObrigatorios.value = Math.min(100, Math.max(0, percentualMinimoObrigatorios.value));
        
        console.log('📊 Valores a serem salvos - Geral:', percentualMinimoGeral.value, 'Obrigatórios:', percentualMinimoObrigatorios.value);
        
        const valores = {
          geral: percentualMinimoGeral.value,
          obrigatorios: percentualMinimoObrigatorios.value
        };
        
        // Criar a chave para uso em todos os locais da função
        const chave = `percentual_minimo_processo_${selectedProcesso.value}`;
        console.log('🔑 Usando chave de configuração:', chave);
        
        // Verificar se o registro já existe
        const { data: existingData, error: queryError } = await supabase
          .from('configuracoes')
          .select('id')
          .eq('chave', chave)
          .single();
          
        if (queryError && queryError.code !== 'PGRST116') {
          console.error('❌ Erro ao consultar configuração existente:', queryError);
          throw queryError;
        }
        
        if (existingData) {
          console.log('🔄 Atualizando registro existente com ID:', existingData.id);
          // Atualizar registro existente
          const { error: updateError } = await supabase
            .from('configuracoes')
            .update({
              valor: JSON.stringify(valores),
              ultima_atualizacao: new Date().toISOString()
            })
            .eq('id', existingData.id);
            
          if (updateError) {
            console.error('❌ Erro ao atualizar configuração:', updateError);
            throw updateError;
          }
        } else {
          console.log('➕ Criando novo registro de configuração');
          // Criar novo registro
          const { error: insertError } = await supabase
            .from('configuracoes')
            .insert({
              chave: chave,
              valor: JSON.stringify(valores),
              descricao: `Percentuais mínimos para o processo ${selectedProcesso.value}`,
              tipo: 'json',
              ultima_atualizacao: new Date().toISOString()
            });
            
          if (insertError) {
            console.error('❌ Erro ao inserir configuração:', insertError);
            throw insertError;
          }
        }
        
        console.log('✅ Percentuais mínimos salvos com sucesso:', valores);
        
        // Verificar se os valores foram salvos corretamente relendo do banco
        await verificarDadosSalvos(chave, valores);
        
        showToast('Percentuais mínimos salvos com sucesso', 'success');
        
        // Atualizar a visualização
        sincronizarCores();
        return true;
      } catch (error) {
        console.error('❌ Erro ao salvar percentuais mínimos:', error);
        showToast('Erro ao salvar percentuais mínimos: ' + (error.message || 'Erro desconhecido'), 'error');
        return false;
      }
    };

    // Adicione esta função auxiliar para verificar se os dados foram salvos corretamente
    const verificarDadosSalvos = async (chave, valoresEsperados) => {
      try {
        console.log('🔍 Verificando se os dados foram salvos corretamente');
        const { data, error } = await supabase
          .from('configuracoes')
          .select('*')
          .eq('chave', chave)
          .single();
        
        if (error) {
          console.error('❌ Erro ao verificar dados salvos:', error);
          return;
        }
        
        if (data && data.valor) {
          const valoresSalvos = JSON.parse(data.valor);
          console.log('📊 Valores salvos no banco:', valoresSalvos);
          console.log('📊 Valores esperados:', valoresEsperados);
          
          const geralOk = valoresSalvos.geral === valoresEsperados.geral;
          const obrigatoriosOk = valoresSalvos.obrigatorios === valoresEsperados.obrigatorios;
          
          if (geralOk && obrigatoriosOk) {
            console.log('✅ Dados salvos corretamente!');
          } else {
            console.warn('⚠️ Dados salvos não correspondem aos esperados!');
            console.log('Geral:', geralOk ? 'OK' : 'Diferente', 
                      'Obrigatórios:', obrigatoriosOk ? 'OK' : 'Diferente');
          }
        } else {
          console.warn('⚠️ Nenhum dado encontrado após salvar!');
        }
      } catch (err) {
        console.error('❌ Erro ao verificar dados salvos:', err);
      }
    };

    // Modifique a função selectProcesso para garantir que carregue os percentuais corretamente
    const selectProcesso = async (processo) => {
      try {
        console.log('🔄 Selecionando processo:', processo);
        // Garantir que estamos salvando o ID, não o objeto inteiro
        selectedProcesso.value = processo.id || processo;
        
        // Primeiro carregar os percentuais mínimos específicos do processo
        console.log('📊 Carregando percentuais mínimos para o processo');
        await carregarPercentuaisMinimos(selectedProcesso.value);
        
        console.log('📋 Carregando análises de sistemas');
        const resultadoSinc = await carregarAnalisesSistemasExtended();
        
        // Se houve sincronização de sistemas, mostrar feedback
        if (resultadoSinc && (resultadoSinc.adicionados > 0 || resultadoSinc.removidos > 0)) {
          console.log(`🔄 Sincronização automática: ${resultadoSinc.adicionados} sistemas adicionados, ${resultadoSinc.removidos} sistemas removidos`);
          showToast(`Sistemas sincronizados automaticamente: ${resultadoSinc.adicionados, resultadoSinc.removidos} removidos`, 'info');
        }
        
        // Sincronizar cores após carregar tudo
        console.log('🎨 Sincronizando cores dos sistemas');
        setTimeout(sincronizarCores, 100);
        
        step.value = 2;
      } catch (error) {
        console.error('❌ Erro ao selecionar processo:', error);
        showToast('Erro ao carregar dados do processo selecionado', 'error');
      }
    };

    // Adicione a função que está faltando
    const salvarPercentuaisMinimosLocal = async () => {
      try {
        // Validar valores entre 0 e 100
        percentualMinimoGeral.value = Math.min(100, Math.max(0, percentualMinimoGeral.value));
        percentualMinimoObrigatorios.value = Math.min(100, Math.max(0, percentualMinimoObrigatorios.value));
        
        console.log('📊 Percentuais validados localmente - Geral:', percentualMinimoGeral.value, 'Obrigatórios:', percentualMinimoObrigatorios.value);
        
        // Se temos um processo selecionado, salvar no banco
        if (selectedProcesso.value) {
          return await salvarPercentuaisMinimos();
        } else {
          console.warn('⚠️ Nenhum processo selecionado para salvar percentuais');
          showToast('Selecione um processo antes de salvar os percentuais', 'warning');
        }
        return false;
      } catch (error) {
        console.error('❌ Erro ao salvar percentuais mínimos localmente:', error);
        showToast('Erro ao salvar configurações de percentuais', 'error');
        return false;
      }
    };

    // Modifique o hook onMounted para garantir o carregamento correto dos percentuais
    onMounted(async () => {
      console.log('🚀 Componente montado');
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      // Verificar conexão com o banco
      const conexaoOk = await verificarConexaoBanco();
      if (!conexaoOk) {
        showToast('Problemas de conexão com o banco de dados. Algumas funcionalidades podem não funcionar corretamente.', 'warning', 8000);
      }
      
      try {
        await loadProcessos();
        console.log('📋 Processos carregados');
        
        // Se já tem um processo selecionado, carregar seus percentuais
        if (selectedProcesso.value) {
          console.log('🔍 Processo já selecionado:', selectedProcesso.value);
          await carregarPercentuaisMinimos(selectedProcesso.value);
          
          // Garantir que os valores foram carregados corretamente
          console.log('📊 Valores após carregamento - Geral:', percentualMinimoGeral.value, 'Obrigatórios:', percentualMinimoObrigatorios.value);
          
          // Sincronizar cores após o carregamento inicial com pequeno delay
          setTimeout(() => {
            sincronizarCores();
            console.log('🎨 Cores sincronizadas');
          }, 100);
        } else {
          console.log('⚠️ Nenhum processo selecionado inicialmente');
        }
      } catch (error) {
        console.error('❌ Erro no carregamento inicial:', error);
      }
    });

    // Adicione esta função para depuração do estado atual
    const debugEstadoPercentuais = () => {
      console.group('🔍 Estado Atual dos Percentuais Mínimos');
      console.log('📊 Percentual Mínimo Geral:', percentualMinimoGeral.value);
      console.log('📊 Percentual Mínimo Obrigatórios:', percentualMinimoObrigatorios.value);
      console.log('🆔 Processo Selecionado:', selectedProcesso.value || 'nenhum');
      console.groupEnd();
    };

    // Adicione chamadas para esta função em pontos estratégicos
    // Por exemplo, ao montar o componente, selecionar processo, salvar percentuais

    // Adicione-a ao objeto retornado para poder ser chamada manualmente se necessário
    const analiseItems = computed(() => {
      // Se não há sistemas para analisar, retornar array vazio
      if (!sistemasAnalise.value || sistemasAnalise.value.length === 0) {
        return [];
      }
      
      // Mapear sistemas para o formato esperado pelo componente de exportação
      return sistemasAnalise.value.map(sistema => ({
        id: sistema.id,
        sistema_id: sistema.sistema_id,
        sistema_nome_personalizado: sistema.isCustomLine ? sistema.nome : null,
        sistemas: { nome: sistema.nome },
        total_itens: sistema.totalItens || 0,
        nao_atendidos: sistema.naoAtendidos || 0,
        atendidos: sistema.atendidos || 0,
        obrigatorio: sistema.obrigatorio || false,
        percentual_minimo: sistema.percentualMinimo || percentualMinimoGeral.value,
        percentual_atendimento: sistema.totalItens ? 
          ((sistema.totalItens - sistema.naoAtendidos) / sistema.totalItens * 100) : 0
      }));
    });

    // Adicione esta função dentro do setup()

    // Função para calcular a classe de estilo com validação pendente
    const calcularClasseEstilo = (sistema) => {
      // Verificar se tem Total de Itens mas Não Atendidos está em branco
      if (sistema.totalItens > 0 && (!sistema.naoAtendidos && sistema.naoAtendidos !== 0)) {
        return 'validacao-pendente';
      }
      
      // Se não tem Total de Itens, é neutro
      if (!sistema.totalItens) {
        return 'neutro';
      }
      
      // Calcular percentual de atendimento
      const percentualAtendimento = calcularPorcentagem(sistema.totalItens - sistema.naoAtendidos, sistema.totalItens);
      
      // Determinar percentual mínimo baseado na obrigatoriedade
      const percentualMinimo = sistema.obrigatorio 
        ? percentualMinimoObrigatorios.value 
        : percentualMinimoGeral.value;
      
      // Retornar classe com base no atendimento
      return percentualAtendimento >= percentualMinimo ? 'atende-status-forte' : 'nao-atende-status-forte';
    };

    // Substitua a função redefinirTodosPercentuais existente
    const redefinirTodosPercentuais = async () => {
      try {
        // Confirmar antes de redefinir
        if (!confirm('Tem certeza que deseja redefinir todas as porcentagens individuais para os valores padrão definidos acima?')) return;
        
        if (!percentualMinimoGeral.value) {
          showToast('Por favor, defina o valor do percentual mínimo geral antes de redefinir', 'warning');
          return;
        }
        
        // Atualizar localmente e no banco de dados
        const promessas = sistemasAnalise.value.map(async (sistema) => {
          // Determinar qual percentual padrão aplicar com base na obrigatoriedade
          const percentualPadrao = sistema.obrigatorio 
            ? percentualMinimoObrigatorios.value 
            : percentualMinimoGeral.value;
            
          // Atualizar valores locais
          sistema.percentualMinimo = percentualPadrao;
          sistema.percentualMinimoPersonalizado = false; // Marcar como não personalizado
          
          // Atualizar no banco
          return supabase
            .from('analises_itens')
            .update({
              percentual_minimo: percentualPadrao,
              percentual_minimo_personalizado: false, // Marcar como não personalizado
              updated_at: new Date().toISOString()
            })
            .eq('id', sistema.id);
        });
        
        await Promise.all(promessas);
        alteracoesPendentes.value = true;
        
        // Atualizar as classes de estilo
        sincronizarCores();
        
        showToast('Todos os percentuais foram redefinidos para os valores padrão', 'success');
      } catch (error) {
        console.error('Erro ao redefinir percentuais:', error);
        showToast('Erro ao redefinir percentuais: ' + error.message, 'error');
      }
    };

    const handleTabNavigation = (event, sistema, campoAtual, proximoCampo) => {
      event.preventDefault(); // Prevenir o comportamento padrão do tab
      
      // Salvar o valor atual
      salvarEdicao(sistema);
      
      // Depois de salvar, editar o próximo campo
      nextTick(() => {
        editarCelula(sistema, proximoCampo);
      });
    };

    // Adicione esta função dentro do setup()
    const aplicarPercentualGeralTodasLinhas = async () => {
      try {
        // Primeiro, salvar o percentual geral atualizado
        await salvarPercentuaisMinimosLocal();
        
        // Em seguida, aplicar a todas as linhas não obrigatórias
        if (percentualMinimoGeral.value) {
          const promessas = sistemasAnalise.value
            .filter(sistema => !sistema.obrigatorio) // Aplica apenas aos sistemas não obrigatórios
            .map(async (sistema) => {
              // Atualizar o valor local
              sistema.percentualMinimo = percentualMinimoGeral.value;
              sistema.percentualMinimoPersonalizado = false; // Desmarcar como personalizado
              
              // Atualizar no banco de dados
              return supabase
                .from('analises_itens')
                .update({
                  percentual_minimo: percentualMinimoGeral.value,
                  percentual_minimo_personalizado: false,
                  updated_at: new Date().toISOString()
                })
                .eq('id', sistema.id);
            });
          
          await Promise.all(promessas);
          
          // Atualizar as cores e estados visuais
          alteracoesPendentes.value = true;
          sincronizarCores();
          showToast('Percentual mínimo aplicado a todos os sistemas não obrigatórios', 'success');
        }
      } catch (error) {
        console.error('Erro ao aplicar percentual geral:', error);
        showToast('Erro ao aplicar percentual geral a todos os sistemas', 'error');
      }
    };

    // Adicione esta função dentro do setup()
const aplicarPercentualObrigatoriosTodasLinhas = async () => {
  try {
    // Primeiro, salvar o percentual obrigatórios atualizado
    await salvarPercentuaisMinimosLocal();
    
    // Em seguida, aplicar a todas as linhas obrigatórias
    if (percentualMinimoObrigatorios.value) {
      const promessas = sistemasAnalise.value
        .filter(sistema => sistema.obrigatorio) // Aplica apenas aos sistemas obrigatórios
        .map(async (sistema) => {
          // Atualizar o valor local
          sistema.percentualMinimo = percentualMinimoObrigatorios.value;
          sistema.percentualMinimoPersonalizado = false; // Desmarcar como personalizado
          
          // Atualizar no banco de dados
          return supabase
            .from('analises_itens')
            .update({
              percentual_minimo: percentualMinimoObrigatorios.value,
              percentual_minimo_personalizado: false,
              updated_at: new Date().toISOString()
            })
            .eq('id', sistema.id);
        });
      
      await Promise.all(promessas);
      
      // Atualizar as cores e estados visuais
      alteracoesPendentes.value = true;
      sincronizarCores();
      showToast('Percentual mínimo aplicado a todos os sistemas obrigatórios', 'success');
    }
  } catch (error) {
    console.error('Erro ao aplicar percentual para obrigatórios:', error);
    showToast('Erro ao aplicar percentual a todos os sistemas obrigatórios', 'error');
  }
};

    // Adicione esta função para preencher valores padrão para os percentuais
    const preencherPercentuaisMinimosDefault = () => {
      console.log('🔄 Preenchendo percentuais mínimos com valores padrão');
      
      // Definir valores padrão se estiverem vazios
      if (!percentualMinimoGeral.value) percentualMinimoGeral.value = 60;
      if (!percentualMinimoObrigatorios.value) percentualMinimoObrigatorios.value = 90;
      
      console.log('📊 Percentuais padrão definidos - Geral:', percentualMinimoGeral.value, 'Obrigatórios:', percentualMinimoObrigatorios.value);
      
      // Se houver um processo selecionado, podemos salvar esses valores padrão
      if (selectedProcesso.value) {
        return salvarPercentuaisMinimos();
      }
      
      return Promise.resolve(true);
    };

    return {
      // Outras propriedades e métodos...
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
      editando,
      editarCelula,
      salvarEdicao,
      cancelarEdicao,
      adicionarAnotacao,
      salvarPercentualPersonalizado,
      salvarObrigatoriedade,
      sincronizarSistemas,
      removerAnotacao,
      toasts,
      isDragging,
      draggedItem,
      dragOverIndex,
      startDrag,
      onDragEnter,
      onDragLeave,
      onDrop,
      removerSistema,
      calcularPorcentagemPrecisa,
      formatarPercentual,
      atualizarPercentuaisMinimos,
      atualizarPercentuaisObrigatorios,
      atualizarClasseEstilo,
      sincronizarCores,
      carregarPercentuaisMinimos,
      salvarPercentuaisMinimos,
      salvarPercentuaisMinimosLocal,
      debugEstadoPercentuais,
      analiseItems,
      preencherPercentuaisMinimosDefault,
      carregarAnalisesSistemasExtended,
      redefinirTodosPercentuais,
      handleTabNavigation,
      calcularClasseEstilo,
      aplicarPercentualGeralTodasLinhas,
    }
  }
}

// Adicione esta função para verificar a conexão com o Supabase
const verificarConexaoBanco = async () => {
  try {
    console.log('🔍 Verificando conexão com o banco de dados...');
    const inicio = performance.now();
    
    // Fazer uma consulta simples para testar a conexão
    const { data, error } = await supabase
      .from('configuracoes')
      .select('count(*)', { count: 'exact', head: true });
    
    const tempo = (performance.now() - inicio).toFixed(2);
    
    if (error) {
      console.error('❌ Erro na conexão com o banco:', error);
      return false;
    }
    
    console.log(`✅ Conexão com o banco OK (${tempo}ms)`);
    return true;
  } catch (error) {
    console.error('❌ Exceção ao verificar conexão:', error);
    return false;
  }
};
</script>
<style src="./AnalisesView.css" scoped></style>
<style src="../assets/styles/analises/buttons.css"></style>
