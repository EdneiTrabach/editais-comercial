<template>
  <div class="analise-table-container">
    <div class="table-header">
      <h2>Análise de Atendimento - {{ processoAtual?.numero_processo }}</h2>
      <div class="analise-config">
        <div class="percentual-container">
          <div class="percentual-minimo">
            <label>% Mínimo Geral:</label>
            <input 
              type="number" 
              v-model="percentualMinimoGeralLocal" 
              min="0" 
              max="100"
              class="percentual-input"
            />
          </div>
          <div class="percentual-obrigatorios">
            <label>% Mínimo Obrigatórios:</label>
            <input 
              type="number" 
              v-model="percentualMinimoObrigatoriosLocal" 
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
      <button @click="$emit('adicionar-sistema')" class="btn-adicionar-sistema">
        <i class="fas fa-plus"></i> Adicionar Sistema
      </button>
    </div>

    <div v-if="loading" class="loading-indicator">
      <span>Carregando análises...</span>
    </div>
    
    <div v-if="error" class="error-message">
      <span>{{ error }}</span>
    </div>

    <table v-if="!loading && !error" class="analise-table">
      <colgroup>
        <col v-for="(width, index) in colWidths" :key="index" :style="{ width: width }">
      </colgroup>
      <thead>
        <tr>
          <th v-for="(coluna, index) in colunas" :key="index">
            {{ coluna.titulo }}
            <div class="resize-handle" 
                 v-if="index < colunas.length - 1"
                 @mousedown="startResize($event, index)"></div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="sistema in sistemasAnalise" :key="sistema.id" 
            :class="{ 
              'sistema-row': true,
              'sistema-novo': sistema.id.toString().startsWith('temp-'),
              'sistema-obrigatorio': sistema.obrigatorio,
              'atende-percentual': getStatusAtendimento(sistema).atende,
              'nao-atende-percentual': !getStatusAtendimento(sistema).atende 
            }">
          <td 
            class="editable" 
            @click="handleEditCelula(sistema, 'nome', $event)"
          >
            <template v-if="isEditing(sistema.id, 'nome')">
              <input 
                type="text"
                v-model="editando.valor"
                @blur="handleSalvarEdicao(sistema)"
                @keyup.enter="handleSalvarEdicao(sistema)"
                @keyup.esc="handleCancelarEdicao"
                class="edit-input"
                ref="editInput"
                v-focus
              />
            </template>
            <template v-else>
              {{ sistema.nome }}
            </template>
          </td>
          <td 
            class="editable" 
            @click="handleEditCelula(sistema, 'totalItens', $event)"
          >
            <template v-if="isEditing(sistema.id, 'totalItens')">
              <input 
                type="text"
                v-model="editando.valor"
                @blur="handleSalvarEdicao(sistema)"
                @keyup.enter="handleSalvarEdicao(sistema)"
                @keyup.esc="handleCancelarEdicao"
                class="edit-input"
                ref="editInput"
                v-focus
              />
            </template>
            <template v-else>
              {{ sistema.totalItens }}
            </template>
          </td>
          <td 
            class="editable nao-atendidos"
            @click="handleEditCelula(sistema, 'naoAtendidos', $event)"
          >
            <template v-if="isEditing(sistema.id, 'naoAtendidos')">
              <input 
                type="text"
                v-model="editando.valor"
                @blur="handleSalvarEdicao(sistema)"
                @keyup.enter="handleSalvarEdicao(sistema)"
                @keyup.esc="handleCancelarEdicao"
                class="edit-input"
                ref="editInput"
                v-focus
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
                @change="$emit('salvar-obrigatoriedade', sistema)"
              />
              <span class="checkmark"></span>
            </label>
          </td>
          <td class="percentual-personalizado">
            <input 
              type="number"
              v-model="sistema.percentualMinimo"
              @change="$emit('salvar-percentual', sistema)"
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
          <td class="acoes-coluna">
            <button @click="$emit('remover-sistema', sistema)" class="btn-remover" title="Remover sistema">
              <img src="/icons/lixeira.svg" alt="Remover" class="icon-lixeira" />
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
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'

export default {
  name: 'AnaliseTable',
  props: {
    processoAtual: {
      type: Object,
      default: null
    },
    sistemasAnalise: {
      type: Array,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: null
    },
    editando: {
      type: Object,
      required: true
    },
    percentualMinimoGeral: {
      type: Number,
      required: true
    },
    percentualMinimoObrigatorios: {
      type: Number,
      required: true
    },
    porcentagemGeralAtendimento: {
      type: Number,
      required: true
    },
    getStatusAtendimento: {
      type: Function,
      required: true
    },
    getStatusGeralClass: {
      type: Object,
      required: true
    },
    getStatusGeral: {
      type: String,
      required: true
    }
  },
  emits: [
    'editar-celula', 
    'salvar-edicao', 
    'cancelar-edicao', 
    'salvar-percentual', 
    'salvar-obrigatoriedade',
    'adicionar-sistema',
    'remover-sistema'
  ],
  setup(props, { emit }) {
    // Cria refs locais para os valores de porcentagem
    const percentualMinimoGeralLocal = ref(props.percentualMinimoGeral);
    const percentualMinimoObrigatoriosLocal = ref(props.percentualMinimoObrigatorios);

    // Verifica se uma célula está sendo editada
    const isEditing = (id, campo) => {
      return props.editando.id === id && props.editando.campo === campo;
    };

    // Funções para manipular eventos
    const handleEditCelula = (sistema, campo, event) => {
      emit('editar-celula', sistema, campo, event);
    };

    const handleSalvarEdicao = (sistema) => {
      emit('salvar-edicao', sistema);
    };

    const handleCancelarEdicao = () => {
      emit('cancelar-edicao');
    };

    // Função de cálculo de porcentagem (duplicando aqui para não depender de prop)
    const calcularPorcentagem = (valor, total) => {
      if (!total) return 0;
      return Number(((valor / total) * 100).toFixed(2));
    };

    // Efeitos colaterais para sincronizar valores de porcentagem
    onMounted(() => {
      percentualMinimoGeralLocal.value = props.percentualMinimoGeral;
      percentualMinimoObrigatoriosLocal.value = props.percentualMinimoObrigatorios;
    });

    // Configuração das colunas
    const colunas = [
      { titulo: 'Sistema', larguraPadrao: '20%' },
      { titulo: 'Total de Itens', larguraPadrao: '10%' },
      { titulo: 'Não Atendidos', larguraPadrao: '10%' },
      { titulo: 'Atendidos', larguraPadrao: '10%' },
      { titulo: '% Não Atendimento', larguraPadrao: '10%' },
      { titulo: '% Atendimento', larguraPadrao: '10%' },
      { titulo: 'Obrigatório', larguraPadrao: '8%' },
      { titulo: '% Mínimo', larguraPadrao: '8%' },
      { titulo: 'Status', larguraPadrao: '12%' },
      { titulo: 'Ações', larguraPadrao: '5%' }
    ];

    // Larguras das colunas (inicialmente definidas como padrão)
    const colWidths = ref(colunas.map(col => col.larguraPadrao));
    
    // Variáveis para controlar o redimensionamento
    const isResizing = ref(false);
    const currentColumn = ref(null);
    const startX = ref(0);
    const startWidth = ref(0);
    
    // Iniciar redimensionamento
    const startResize = (event, index) => {
      isResizing.value = true;
      currentColumn.value = index;
      startX.value = event.pageX;
      
      // Obter a largura atual da coluna (convertendo % para px se necessário)
      const thElm = event.target.parentNode;
      startWidth.value = thElm.offsetWidth;
      
      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResize);
      
      // Adicionar classe ao body para mudar o cursor durante o redimensionamento
      document.body.classList.add('resizing');
      
      // Prevenir seleção de texto durante redimensionamento
      event.preventDefault();
    };
    
    // Fazer o redimensionamento
    const resize = (event) => {
      if (!isResizing.value) return;
      
      const table = document.querySelector('.analise-table');
      const tableWidth = table.offsetWidth;
      
      // Calcular a nova largura
      const diff = event.pageX - startX.value;
      let newWidth = Math.max(50, startWidth.value + diff); // Mínimo de 50px
      
      // Converter para porcentagem
      const newWidthPercent = (newWidth / tableWidth * 100).toFixed(2) + '%';
      
      // Atualizar a largura da coluna
      colWidths.value[currentColumn.value] = newWidthPercent;
    };
    
    // Parar redimensionamento
    const stopResize = () => {
      isResizing.value = false;
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResize);
      document.body.classList.remove('resizing');
      
      // Salvar as preferências de largura no localStorage
      localStorage.setItem('tableColWidths', JSON.stringify(colWidths.value));
    };
    
    // Carregar larguras salvas anteriormente
    onMounted(() => {
      const savedWidths = localStorage.getItem('tableColWidths');
      if (savedWidths) {
        try {
          const parsed = JSON.parse(savedWidths);
          // Verificar se o número de colunas corresponde
          if (parsed.length === colunas.length) {
            colWidths.value = parsed;
          }
        } catch (e) {
          console.error('Erro ao carregar larguras das colunas:', e);
        }
      }
    });
    
    // Limpar event listeners ao desmontar o componente
    onUnmounted(() => {
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResize);
    });

    return {
      percentualMinimoGeralLocal,
      percentualMinimoObrigatoriosLocal,
      isEditing,
      handleEditCelula,
      handleSalvarEdicao,
      handleCancelarEdicao,
      calcularPorcentagem,
      colunas,
      colWidths,
      startResize
    };
  },
  directives: {
    focus: {
      mounted(el) {
        el.focus();
        el.select && el.select();
      }
    }
  }
}
</script>

<style scoped>
.analise-table-container {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.table-header h2 {
  font-size: 1.2rem;
  color: #334155;
}

.total-geral {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  margin-bottom: 1rem;
}

.btn-adicionar-sistema {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-adicionar-sistema:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
}

.btn-adicionar-sistema i {
  font-size: 0.875rem;
}

.analise-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.analise-table th,
.analise-table td {
  text-align: center;
  border-bottom: 1px solid #e2e8f0;
}

.analise-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  padding: 0;
}

/* Definindo larguras específicas para algumas colunas */
.analise-table th:first-child,
.analise-table td:first-child {
  width: 20%;
}

.analise-table th:nth-child(2),
.analise-table td:nth-child(2),
.analise-table th:nth-child(3),
.analise-table td:nth-child(3),
.analise-table th:nth-child(4),
.analise-table td:nth-child(4) {
  width: 10%;
}

.analise-table th:last-child,
.analise-table td:last-child {
  width: 5%;
}

.atendidos {
  color: #059669;
  font-weight: 500;
}

.nao-atendidos {
  color: #dc2626;
  font-weight: 500;
}

.porcentagem-atendimento {
  color: #059669;
  font-weight: 600;
}

.porcentagem-nao-atendimento {
  color: #dc2626;
  font-weight: 600;
}

.analise-config {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.percentual-minimo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.percentual-input {
  width: 80px;
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  text-align: center;
}

.sistema-row {
  transition: all 0.2s ease;
}

.sistema-obrigatorio {
  background-color: #fff8e6;
}

.atende-percentual td {
  background-color: #f0fdf4;
}

.nao-atende-percentual td {
  background-color: #fef2f2;
}

.checkbox-container {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.status-column span {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-atende {
  background-color: #dcfce7;
  color: #166534;
}

.status-nao-atende {
  background-color: #fee2e2;
  color: #991b1b;
}

.analise-resumo {
  margin-top: 2rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
}

.percentual-geral {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.status-geral {
  padding: 0.25rem 1rem;
  border-radius: 999px;
}

.status-geral-atende {
  color: #166534;
  background-color: #dcfce7;
}

.status-geral-nao-atende {
  color: #991b1b;
  background-color: #fee2e2;
}

.percentual-container {
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.percentual-input-small {
  width: 60px;
  padding: 0.25rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  text-align: center;
  font-size: 0.875rem;
}

.percentual-personalizado {
  text-align: center;
}

.atende-personalizado {
  background-color: #dcfce7;
}

.nao-atende-personalizado {
  background-color: #fee2e2;
}

.editable {
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
}

.editable:hover {
  background-color: rgba(59, 130, 246, 0.1);
}

.editable.atendidos:hover {
  background-color: #f0fdf4;
}

.editable.nao-atendidos:hover {
  background-color: #fef2f2;
}

.edit-input {
  width: 80%;
  height: calc(100% - 4px);
  min-height: 30px;
  padding: 0.25rem 0.5rem;
  border: 2px solid #3b82f6;
  border-radius: 4px;
  font-size: 0.875rem;
  font-family: inherit;
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.acoes-coluna {
  width: 60px;
  text-align: center;
}

.btn-remover {
  padding: 0.25rem 0.5rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-remover:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

.icon-lixeira {
  width: 16px;
  height: 16px;
  filter: brightness(0) invert(1); /* Torna o SVG branco */
}

/* Estilo para novas linhas */
.sistema-novo {
  animation: highlight-new-row 1s ease;
}

@keyframes highlight-new-row {
  0% {
    background-color: rgba(59, 130, 246, 0.2);
  }
  100% {
    background-color: transparent;
  }
}

.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 10px;
  height: 100%;
  cursor: col-resize;
  user-select: none;
}

.resize-handle:hover,
.resize-handle:active {
  background-color: rgba(0, 0, 0, 0.1);
}

/* Estilo para o cursor durante redimensionamento em todo o documento */
:global(body.resizing) {
  cursor: col-resize !important;
  user-select: none;
}

/* Impedir que o texto seja selecionado durante o redimensionamento */
:global(body.resizing *) {
  user-select: none !important;
}
</style>
