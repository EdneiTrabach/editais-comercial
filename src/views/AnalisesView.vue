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
                class="btn btn-secondary"
                title="Adicionar uma linha para anotações">
                <i class="fas fa-plus"></i> Adicionar Anotação
              </button>
              <!-- Botão de sincronização único com mensagem clara -->
              <button 
                v-if="processoAtual"
                @click="sincronizarSistemas" 
                class="btn btn-secondary" 
                title="Atualiza sistemas conforme a tela de processos">
                <i class="fas fa-sync"></i> Sincronizar Sistemas
              </button>
              <button 
                @click="exportarExcel" 
                class="btn btn-info"
                title="Exportar análise para Excel">
                <i class="fas fa-file-export"></i> Exportar
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
            <div class="ordering-tip">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
              </svg>
              <span>Você pode arrastar as linhas para reordenar e excluir qualquer sistema</span>
            </div>
            <div class="analise-config">
              <div class="percentual-container">
                <div class="percentual-minimo" title="Valor mínimo de percentual de atendimento para sistemas normais">
                  <label>% Mínimo Geral:</label>
                  <input 
                    type="number" 
                    v-model="percentualMinimoGeral" 
                    min="0" 
                    max="100"
                    class="percentual-input"
                    @change="atualizarPercentuaisMinimos" 
                  />
                </div>
                <div class="percentual-obrigatorios" title="Valor mínimo de percentual de atendimento para sistemas marcados como obrigatórios">
                  <label>% Mínimo Obrigatórios:</label>
                  <input 
                    type="number" 
                    v-model="percentualMinimoObrigatorios" 
                    min="0" 
                    max="100"
                    class="percentual-input"
                    @change="atualizarPercentuaisObrigatorios" 
                  />
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
              (segure shift e arraste o mouse em cima do que queira copiar)
            </span>
          </div>

          <table class="analise-table">
            <thead>
              <tr>
                <th class="drag-column"></th>
                <th>Sistema</th>
                <th>Total de Itens</th>
                <th>Não Atendidos</th>
                <th>Atendidos</th>
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
                  :class="[sistema.classeEstilo, { 'custom-line': sistema.isCustomLine, 'dragging': isDragging === sistema.id }]"
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
                      <path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
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
                <td @click="editarCelula(sistema, 'totalItens')" class="editable-cell">
                  <div v-if="editando.id === sistema.id && editando.campo === 'totalItens'">
                    <input type="number" class="edit-input form-control form-control-sm" 
                           v-model="editando.valor" 
                           @blur="salvarEdicao(sistema)"
                           @keyup.enter="salvarEdicao(sistema)"
                           @keyup.esc="cancelarEdicao" />
                  </div>
                  <div v-else>
                    {{ sistema.totalItens }}
                    <span class="edit-indicator"><i class="fas fa-pencil-alt"></i></span>
                  </div>
                </td>
                <td :class="{ 'nao-atendidos': sistema.naoAtendidos > 0 }">
                  <!-- Se estiver editando esta célula -->
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
                  <!-- Visualização normal -->
                  <div v-else class="editable-cell" @click="editarCelula(sistema, 'naoAtendidos')">
                    {{ sistema.naoAtendidos }}
                  </div>
                </td>
                <td :class="{ 'atendidos': sistema.atendidos > 0 }">
                  <div v-if="editando.id === sistema.id && editando.campo === 'atendidos'">
                    <input class="edit-input" v-model="editando.valor" @blur="salvarEdicao(sistema)" />
                  </div>
                  <div v-else class="calculated-field user-select-text">
                    {{ sistema.atendidos }}
                    <span class="calculated-indicator">(calculado)</span>
                  </div>
                </td>
                <td class="porcentagem-nao-atendimento">
                  {{ formatarPercentual(calcularPorcentagemPrecisa(sistema.naoAtendidos, sistema.totalItens)) }}%
                </td>
                <td class="porcentagem-atendimento">
                  {{ formatarPercentual(100 - calcularPorcentagemPrecisa(sistema.naoAtendidos, sistema.totalItens)) }}%
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
              <span>Atendimento Geral: {{ formatarPercentual(porcentagemGeralAtendimento) }}%</span>
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

export default {
  name: 'AnalisesView',
  
  components: {
    TheSidebar,
    AnoSelection,
    ProcessoSelection,
    ToastMessages
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
    const percentualMinimoGeral = ref(60)
    const percentualMinimoObrigatorios = ref(90)
    
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
      
      // Determinar se atende ao percentual mínimo
      if (percentualAtendimento >= Number(sistema.percentualMinimo)) {
        return {
          texto: `Atende (${formatarPercentual(percentualAtendimento)}%)`,
          class: 'status-atende',
          classeEstilo: 'atende-status-forte'
        };
      } else {
        return {
          texto: `Não Atende (Min: ${sistema.percentualMinimo}%)`,
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
      // Verificar sistemas obrigatórios
      const obrigatoriosAtendidos = sistemasAnalise.value
        .filter(s => s.obrigatorio)
        .every(s => {
          if (!s.totalItens) return false;
          
          const percentualNaoAtendimento = calcularPorcentagemPrecisa(s.naoAtendidos, s.totalItens);
          const percentualAtendimento = 100 - percentualNaoAtendimento;
          return percentualAtendimento >= (s.percentualMinimo || percentualMinimoObrigatorios.value);
        });
      
      // Calcular totais gerais para todos os sistemas
      const totalItens = sistemasAnalise.value.reduce((acc, s) => acc + s.totalItens, 0);
      const totalNaoAtendidos = sistemasAnalise.value.reduce((acc, s) => acc + s.naoAtendidos, 0);
      
      // Calcular percentual geral de forma precisa
      const percentualGeralNaoAtendimento = totalItens ? (totalNaoAtendidos / totalItens) * 100 : 0;
      const percentualGeralAtendimento = 100 - percentualGeralNaoAtendimento;
      
      const atendeGeral = percentualGeralAtendimento >= percentualMinimoGeral.value;
    
      if (obrigatoriosAtendidos && atendeGeral) {
        return 'Atende Requisitos';
      } 
      return 'Não Atende Requisitos';
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
      
      // Definir classe com base no atendimento
      if (percentualAtendimento >= Number(sistema.percentualMinimo)) {
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
            updated_at: new Date().toISOString()
          })
          .eq('id', sistema.id);
    
        if (error) throw error;
        
        // Atualizar a classe de estilo imediatamente após salvar o percentual mínimo
        atualizarClasseEstilo(sistema);
        
        alteracoesPendentes.value = true;
        showToast('Percentual mínimo atualizado com sucesso', 'success');
      } catch (error) {
        console.error('Erro ao salvar percentual personalizado:', error);
        // Reverter para o valor anterior em caso de erro
        sistema.percentualMinimo = sistema.percentualMinimoAnterior;
        showToast('Erro ao atualizar percentual mínimo', 'error');
      }
    };

    // Substitua a função salvarObrigatoriedade por esta versão melhorada
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
          sistema.percentualMinimo = percentualMinimoObrigatorios.value;
        }
        
        // Enviar para o banco de dados
        const { error } = await supabase
          .from('analises_itens')
          .update(atualizacao)
          .eq('id', sistema.id);
    
        if (error) throw error;
        
        // Atualizar a classe de estilo imediatamente após salvar
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
    const atualizarPercentuaisMinimos = async () => {
      try {
        // Validar o valor para garantir que esteja entre 0 e 100
        if (percentualMinimoGeral.value < 0) percentualMinimoGeral.value = 0;
        if (percentualMinimoGeral.value > 100) percentualMinimoGeral.value = 100;
        
        // Perguntar se o usuário deseja aplicar esse percentual para todos os sistemas não obrigatórios
        if (confirm(`Deseja aplicar o percentual mínimo de ${percentualMinimoGeral.value}% para todos os sistemas não obrigatórios?`)) {
          // Atualizar apenas sistemas não obrigatórios
          const promessas = sistemasAnalise.value
            .filter(sistema => !sistema.obrigatorio)
            .map(async (sistema) => {
              // Atualizar localmente
              sistema.percentualMinimo = percentualMinimoGeral.value;
              
              // Atualizar no banco de dados
              return supabase
                .from('analises_itens')
                .update({
                  percentual_minimo: percentualMinimoGeral.value,
                  updated_at: new Date().toISOString()
                })
                .eq('id', sistema.id);
            });
          
          await Promise.all(promessas);
          alteracoesPendentes.value = true;
          showToast('Percentual mínimo atualizado para todos os sistemas não obrigatórios', 'success');
        }
      } catch (error) {
        console.error('Erro ao atualizar percentuais mínimos:', error);
        showToast('Erro ao atualizar percentuais mínimos', 'error');
      }
    };
    
    const atualizarPercentuaisObrigatorios = async () => {
      try {
        // Validar o valor para garantir que esteja entre 0 e 100
        if (percentualMinimoObrigatorios.value < 0) percentualMinimoObrigatorios.value = 0;
        if (percentualMinimoObrigatorios.value > 100) percentualMinimoObrigatorios.value = 100;
        
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
          showToast('Percentual mínimo atualizado para todos os sistemas obrigatórios', 'success');
        }
      } catch (error) {
        console.error('Erro ao atualizar percentuais mínimos para obrigatórios:', error);
        showToast('Erro ao atualizar percentuais mínimos para obrigatórios', 'error');
      }
    };

    // Função para sincronizar todas as cores da tabela (opcional: para resolver problemas existentes)
    const sincronizarCores = () => {
      sistemasAnalise.value.forEach(sistema => {
        atualizarClasseEstilo(sistema);
      });
    };

    // Chame esta função após carregar os dados ou após adicionar uma anotação
    // Adicione ao mounted ou onde carregar dados iniciais
    onMounted(() => {
      window.addEventListener('beforeunload', handleBeforeUnload);
      loadProcessos().then(() => {
        // Sincronizar cores após o carregamento inicial
        setTimeout(sincronizarCores, 100);
      });
    });

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
      sincronizarCores
    }
  }
}
</script>
<style src="./AnalisesView.css" scoped></style>