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
                <th class="text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sistema in sistemasAnalise" :key="sistema.id" 
                  :class="{ 'custom-line': sistema.isCustomLine }">
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
                <td @click="editarCelula(sistema, 'naoAtendidos')" class="editable-cell">
                  <div v-if="editando.id === sistema.id && editando.campo === 'naoAtendidos'">
                    <input type="number" class="edit-input form-control form-control-sm" 
                           v-model="editando.valor" 
                           @blur="salvarEdicao(sistema)"
                           @keyup.enter="salvarEdicao(sistema)"
                           @keyup.esc="cancelarEdicao" />
                  </div>
                  <div v-else>
                    {{ sistema.naoAtendidos }}
                    <span class="edit-indicator"><i class="fas fa-pencil-alt"></i></span>
                  </div>
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
                <!-- Botão de ações -->
                <td class="text-center">
                  <button v-if="sistema.isCustomLine" @click="removerAnotacao(sistema)" class="btn btn-sm btn-outline-danger">
                    <i class="fas fa-trash"></i>
                  </button>
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

    // Substitua completamente a função salvarEdicao
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
            valor = parseInt(editando.value.valor.toString().replace(/[^\d]/g, ''));
            
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
              throw new Error('O total de itens deve ser maior que os itens não atendidos');
            }
          } else if (editando.value.campo === 'naoAtendidos') {
            if (valor > sistema.totalItens) {
              throw new Error('O número de itens não atendidos não pode ser maior que o total');
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

    // Implementar função para salvar obrigatoriedade
    const salvarPercentualPersonalizado = async (sistema) => {
      try {
        // Guardar valor anterior para caso dê erro
        sistema.percentualMinimoAnterior = sistema.percentualMinimo;
        
        // Garantir que o valor esteja dentro dos limites
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
        alteracoesPendentes.value = true;
        showToast('Percentual mínimo atualizado', 'success');
      } catch (error) {
        console.error('Erro ao salvar percentual personalizado:', error);
        sistema.percentualMinimo = sistema.percentualMinimoAnterior || 70;
        showToast('Erro ao salvar percentual', 'error');
      }
    };

    const salvarObrigatoriedade = async (sistema) => {
      try {
        const { error } = await supabase
          .from('analises_itens')
          .update({
            obrigatorio: sistema.obrigatorio,
            updated_at: new Date().toISOString()
          })
          .eq('id', sistema.id);
    
        if (error) throw error;
        alteracoesPendentes.value = true;
        showToast('Obrigatoriedade atualizada', 'success');
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

    // Restante do setup...
    
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
      toasts
    }
  }
}
</script>
<style src="./AnalisesView.css" scoped></style>
<!-- Adicione este CSS ao componente dentro da tag style -->
<style scoped>
.custom-line {
  background-color: rgba(255, 255, 200, 0.3);
  font-style: italic;
}

.custom-line td:first-child {
  text-align: left;
  font-weight: normal;
  color: #666;
  cursor: pointer;
}

.editable-cell {
  cursor: pointer;
  position: relative;
}

.editable-cell:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.custom-line .editable-cell:hover {
  background-color: rgba(0, 0, 0, 0.08);
}

.edit-indicator {
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 10px;
  color: #007bff;
  opacity: 0;
}

.editable-cell:hover .edit-indicator {
  opacity: 0.7;
}

.edit-input {
  width: 100%;
  padding: 4px 8px;
  border: 1px solid #4a90e2;
  border-radius: 4px;
  font-size: 14px;
  background: #f0f8ff;
}

.editable-cell {
  cursor: pointer;
  transition: background-color 0.2s;
}

.editable-cell:hover {
  background-color: rgba(74, 144, 226, 0.1);
}

.custom-line {
  background-color: #fff8e1;
}

.custom-line td:first-child {
  font-style: italic;
  color: #1976d2;
  cursor: pointer;
}

.custom-line:hover {
  background-color: #fff3cd;
}

.percentual-input-small {
  width: 50px;
  text-align: center;
  border: 1px solid #ced4da;
  border-radius: 4px;
  padding: 2px;
}

.btn-sm {
  padding: 2px 6px;
  font-size: 12px;
}

.text-center {
  text-align: center;
}

.btn-outline-danger {
  color: #dc3545;
  border-color: #dc3545;
  background-color: transparent;
}

.btn-outline-danger:hover {
  color: white;
  background-color: #dc3545;
}

/* Status styles */
.status-atende {
  color: #28a745;
  font-weight: 500;
}

.status-nao-atende {
  color: #dc3545;
  font-weight: 500;
}

/* Para garantir que o campo de nome seja editável nos campos personalizados */
.custom-line td:first-child:hover {
  background-color: rgba(25, 118, 210, 0.1);
}
</style>