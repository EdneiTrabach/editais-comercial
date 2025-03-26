<template>
  <div class="planilha-container">
    <div class="header-planilha">
      <h2>Preencha os Valores da Proposta</h2>
      <button @click="abrirReadequacao" class="btn-readequar">
        <i class="fas fa-calculator"></i> 
        Readequar Proposta
      </button>
    </div>
    
    <div class="controles-planilha">
      <div class="filtros">
        <select v-model="filtroCategoria" class="select-filtro">
          <option value="">Todas as categorias</option>
          <option v-for="cat in categorias" :key="cat" :value="cat">{{ cat }}</option>
        </select>
        
        <div class="campo-busca">
          <input 
            type="text" 
            v-model="termoBusca" 
            placeholder="Buscar item..." 
            class="input-busca"
          >
        </div>
      </div>
      
      <!-- Novo elemento para exibir o valor estimado -->
      <div class="valor-estimado" v-if="valorEstimado">
        <span class="valor-estimado-label">Valor Estimado:</span>
        <span class="valor-estimado-valor">{{ formatarMoeda(valorEstimado) }}</span>
      </div>
    </div>

    <div class="table-container resizable">
      <table class="planilha-valores">
        <thead>
          <tr>
            <th class="resizable-column">
              Item
              <div class="column-resize-handle"></div>
            </th>
            <th class="resizable-column">
              Descrição
              <div class="column-resize-handle"></div>
            </th>
            <th class="resizable-column">
              Marca/Fabricante
              <div class="column-resize-handle"></div>
            </th>
            <th class="resizable-column">
              Valor Unitário (R$)
              <div class="column-resize-handle"></div>
            </th>
            <th class="resizable-column">
              Quantidade
              <div class="column-resize-handle"></div>
            </th>
            <th class="resizable-column">
              Total
              <div class="column-resize-handle"></div>
            </th>
            <th class="acoes-column">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in itensFiltrados" :key="index">
            <td>{{ item.nome }}</td>
            <td>
              <input 
                v-model="item.descricao" 
                type="text"
                class="input-descricao"
                placeholder="Descreva o item..."
              >
            </td>
            <td>
              <input 
                v-model="item.marca" 
                type="text"
                class="input-marca"
                placeholder="Marca/Fabricante"
                title="Marca própria"
              >
            </td>
            <td>
              <div class="input-valor-container">
                <span class="prefixo-valor">R$</span>
                <input 
                  v-model.number="item.valorUnitario"
                  type="number"
                  step="0.01"
                  min="0"
                  class="input-valor"
                  @input="$emit('calcular-total', item)"
                >
              </div>
            </td>
            <td>
              <input 
                v-model.number="item.quantidade"
                type="number"
                min="1"
                class="input-quantidade"
                @input="$emit('calcular-total', item)"
              >
            </td>
            <td>{{ formatarMoeda(item.total) }}</td>
            <td class="td-acoes">
              <button @click="$emit('remover-item', index)" class="btn-icon delete" title="Remover item">
                <img src="/icons/lixeira.svg" alt="Remover" class="icon">
              </button>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="5" class="total-label">Total Geral:</td>
            <td>{{ formatarMoeda(totalGeral) }}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div class="sem-itens" v-if="itensFiltrados.length === 0">
      <p>Nenhum item encontrado. Tente outra categoria ou termo de busca, ou adicione novos itens.</p>
    </div>

    <div class="acoes-planilha">
      <button @click="$emit('adicionar-item')" class="btn-adicionar">
        <i class="fas fa-plus"></i> Adicionar Item
      </button>
      <button @click="$emit('exportar-pdf')" class="btn-exportar">
        <i class="fas fa-file-pdf"></i> Exportar PDF
      </button>
      <button @click="$emit('exportar-excel')" class="btn-exportar">
        <i class="fas fa-file-excel"></i> Exportar Excel
      </button>
    </div>

    <div class="resumo-proposta">
      <h3>Resumo da Proposta</h3>
      <div class="resumo-categorias">
        <div v-for="categoria in categorias" :key="categoria" class="resumo-categoria">
          <div class="resumo-categoria-titulo">{{ categoria }}:</div>
          <div class="resumo-categoria-valor">{{ formatarMoeda(totalPorCategoria(categoria)) }}</div>
        </div>
      </div>
      <div class="resumo-total">
        <div class="resumo-total-titulo">Total Geral:</div>
        <div class="resumo-total-valor">{{ formatarMoeda(totalGeral) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, computed, onMounted } from 'vue'
import { usePlanilha } from '@/composables/usePlanilha'
import { useRouter } from 'vue-router'

const props = defineProps({
  itensPlanilha: Array,
  totalGeral: Number
})

defineEmits([
  'calcular-total',
  'adicionar-item',
  'remover-item',
  'exportar-pdf',
  'exportar-excel'
])

const { formatarMoeda } = usePlanilha()

const router = useRouter()

// Função para abrir tela de readequação
const abrirReadequacao = () => {
  router.push({
    name: 'PlanilhaReadequada',
    query: {
      itens: encodeURIComponent(JSON.stringify(props.itensPlanilha)),
      totalGeral: props.totalGeral,
      valorEstimado: props.valorEstimado
    }
  })
}

// Filtros
const filtroCategoria = ref('')
const termoBusca = ref('')

// Lógica para redimensionamento de colunas
onMounted(() => {
  const table = document.querySelector('.planilha-valores')
  if (!table) return

  const cols = table.querySelectorAll('th.resizable-column')
  
  cols.forEach(col => {
    const resizer = col.querySelector('.column-resize-handle')
    if (!resizer) return

    let x = 0
    let w = 0

    const mouseDownHandler = function(e) {
      x = e.clientX
      
      const styles = window.getComputedStyle(col)
      w = parseInt(styles.width, 10)
      
      document.addEventListener('mousemove', mouseMoveHandler)
      document.addEventListener('mouseup', mouseUpHandler)
      
      // Adiciona classe para indicar que está redimensionando
      table.classList.add('resizing')
    }
    
    const mouseMoveHandler = function(e) {
      // Calcular a diferença entre a posição atual e inicial do mouse
      const dx = e.clientX - x
      
      // Se dx é positivo (arrastando para direita), aumentamos a largura
      // Se dx é negativo (arrastando para esquerda), diminuímos a largura
      const newWidth = Math.max(80, w + dx) // Mínimo de 80px de largura
      
      // Aplicar a nova largura à coluna
      col.style.width = `${newWidth}px`
    }
    
    const mouseUpHandler = function() {
      document.removeEventListener('mousemove', mouseMoveHandler)
      document.removeEventListener('mouseup', mouseUpHandler)
      
      // Remove classe após terminar o redimensionamento
      table.classList.remove('resizing')
    }
    
    resizer.addEventListener('mousedown', mouseDownHandler)
  })
})

// Filtrar itens com base nos critérios selecionados
const itensFiltrados = computed(() => {
  return props.itensPlanilha.filter(item => {
    const matchesCategoria = filtroCategoria.value ? item.categoria === filtroCategoria.value : true
    const matchesBusca = termoBusca.value ? 
      item.nome.toLowerCase().includes(termoBusca.value.toLowerCase()) || 
      (item.descricao && item.descricao.toLowerCase().includes(termoBusca.value.toLowerCase())) 
      : true
    
    return matchesCategoria && matchesBusca
  })
})

// Extrair categorias únicas da lista de itens
const categorias = computed(() => {
  return [...new Set(props.itensPlanilha.map(item => item.categoria))]
})

// Calcular total por categoria
const totalPorCategoria = (categoria) => {
  return props.itensPlanilha
    .filter(item => item.categoria === categoria)
    .reduce((acc, item) => acc + (item.total || 0), 0)
}
</script>

<style src="@/assets/styles/PlanilhaValores.css"></style>
<style scoped>
.resizable-column {
  position: relative;
  overflow: hidden;
}

.column-resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 5px;
  height: 100%;
  cursor: col-resize;
  user-select: none;
  background-color: transparent;
}

.column-resize-handle:hover {
  background-color: rgba(25, 49, 85, 0.1);
}

.resizing .column-resize-handle {
  background-color: rgba(25, 49, 85, 0.2);
}

.table-container.resizing * {
  cursor: col-resize !important;
  user-select: none !important;
}

.td-acoes {
  text-align: center;
  width: 60px;
}

.btn-icon {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-icon.delete {
  background-color: #fee2e2;
}

.btn-icon.delete:hover {
  background-color: #fecaca;
  transform: translateY(-2px);
}

.icon {
  width: 18px;
  height: 18px;
}

.acoes-column {
  width: 60px;
  text-align: center;
}

/* Envolver a tabela em um container com scroll */
.table-container {
  width: 100%;
  overflow-x: auto;
  margin-bottom: 20px;
}


.controles-planilha {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.valor-estimado {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #f3f4f6;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.valor-estimado-label {
  color: #6b7280;
}

.valor-estimado-valor {
  color: #193155;
  font-weight: 600;
}

.header-planilha {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.btn-readequar {
  background-color: #2563eb;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-readequar:hover {
  background-color: #1d4ed8;
  transform: translateY(-1px);
}

.btn-readequar i {
  font-size: 1.1em;
}
</style>
