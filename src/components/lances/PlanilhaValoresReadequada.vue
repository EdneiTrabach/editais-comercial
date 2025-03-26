<template>
  <div class="layout">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />
    
    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <div class="planilha-container">
        <div class="header-planilha">
          <h2>Readequação da Proposta</h2>
          <div class="header-actions">
            <button 
              @click="salvarReadequacao" 
              class="btn-salvar"
              :disabled="!alteracoesPendentes"
            >
              <i class="fas fa-save"></i>
              Salvar Readequação
            </button>
            <button @click="voltarPlanilha" class="btn-voltar">
              <i class="fas fa-arrow-left"></i> 
              Voltar
            </button>
          </div>
        </div>

        <div class="ajuste-container">
          <div class="campo-ajuste">
            <label>Percentual de Ajuste (%)</label>
            <div class="input-percentual-container">
              <input 
                type="text" 
                v-model="percentualAjuste"
                placeholder="Ex: -9,8 ou +7,6"
                class="input-percentual"
                @input="handlePercentualChange"
              >
              <span class="percentual-hint">Use - para desconto ou + para aumento</span>
            </div>
          </div>

          <div class="info-valores">
            <div class="valor-info">
              <span>Valor Original:</span>
              <strong>{{ formatarMoeda(totalOriginal) }}</strong>
            </div>
            <div class="valor-info">
              <span>Novo Valor:</span>
              <strong class="valor-readequado">{{ formatarMoeda(totalReadequado) }}</strong>
            </div>
            <!-- Nova div para mostrar a diferença -->
            <div class="valor-info diferenca">
              <span>Diferença:</span>
              <strong :class="['valor-diferenca', diferenca.tipo]">
                {{ diferenca.tipo === 'reducao' ? '-' : '+' }} {{ formatarMoeda(diferenca.valor) }}
                <span class="diferenca-percentual">({{ percentualAjuste }}%)</span>
              </strong>
            </div>
            <div class="valor-info" v-if="valorEstimado">
              <span>Valor Estimado:</span>
              <strong>{{ formatarMoeda(valorEstimado) }}</strong>
            </div>
          </div>
        </div>

        <div class="table-container resizable">
          <table class="planilha-valores">
            <thead>
              <tr>
                <th>
                  <input 
                    type="checkbox" 
                    v-model="selecionarTodos"
                    @change="toggleSelecionarTodos"
                  >
                </th>
                <th>Item</th>
                <th>Descrição</th>
                <th class="hidden">Categoria</th>
                <th>Marca/Fabricante</th>
                <th>Quantidade</th>
                <th>Valor Original</th>
                <th>Valor Readequado</th>
                <th>Total Readequado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in itensReadequados" :key="item.id">
                <td>
                  <input 
                    type="checkbox" 
                    v-model="item.selecionado"
                    @change="calcularReadequacao"
                  >
                </td>
                <td>{{ item.nome }}</td>
                <td>{{ item.descricao }}</td>
                <td class="hidden">{{ item.categoria }}</td>
                <td>{{ item.marca }}</td>
                <td>{{ item.quantidade }}</td>
                <td>{{ formatarMoeda(item.valorUnitarioOriginal) }}</td>
                <td>
                  <div class="valor-readequado-container">
                    {{ formatarMoeda(item.valorUnitario) }} <!-- Exibe o valor readequado formatado -->
                  </div>
                </td>
                <td class="valor-readequado">{{ formatarMoeda(item.total) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="6" class="total-label">Total Geral:</td>
                <td>{{ formatarMoeda(totalOriginal) }}</td>
                <td class="valor-readequado">{{ formatarMoeda(totalReadequado) }}</td>
              </tr>
            </tfoot>
          </table>
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

        <div class="acoes-planilha">

          <button @click="$emit('adicionar-item')" class="btn-adicionar">
            <i class="fas fa-plus"></i> Adicionar Item
          </button>

          <button @click="aplicarReadequacao" class="btn-aplicar" :disabled="!percentualDesconto">
            <i class="fas fa-check"></i> 
            Aplicar Readequação
          </button>

          <button @click="$emit('exportar-pdf')" class="btn-exportar">
            <i class="fas fa-file-pdf"></i> Exportar PDF
          </button>
          
          <button @click="$emit('exportar-excel')" class="btn-exportar">
            <i class="fas fa-file-excel"></i> Exportar Excel
          </button>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePlanilha } from '@/composables/usePlanilha'
import TheSidebar from '@/components/TheSidebar.vue'

// Componentes
const components = {
  TheSidebar
}

const router = useRouter()
const { formatarMoeda } = usePlanilha()
const isSidebarExpanded = ref(true)

// Estados
const percentualAjuste = ref('')
const itensReadequados = ref([])
const totalOriginal = ref(0)
const valorEstimado = ref(0)
const selecionarTodos = ref(false)
const itensSelecionados = computed(() => 
  itensReadequados.value.filter(item => item.selecionado)
)

// Computed para percentual formatado
const percentualFormatado = computed(() => {
  const valor = percentualAjuste.value.replace(/[^0-9,\-+]/g, '')
  return valor ? parseFloat(valor.replace(',', '.')) : 0
})

// Computed para total readequado
const totalReadequado = computed(() => {
  const percentual = percentualFormatado.value
  return totalOriginal.value * (1 + (percentual / 100))
})

// Computed para calcular a diferença
const diferenca = computed(() => {
  const diff = totalReadequado.value - totalOriginal.value
  return {
    valor: Math.abs(diff),
    tipo: diff < 0 ? 'reducao' : 'aumento'
  }
})

// Adicionar computed para controle do botão
const percentualDesconto = computed(() => {
  return !!percentualAjuste.value && percentualFormatado.value !== 0
})

// Handler para o toggle da sidebar
const handleSidebarToggle = (expanded) => {
  isSidebarExpanded.value = expanded
}

// Handler para mudança no percentual
const handlePercentualChange = (event) => {
  let valor = event.target.value
  valor = valor.replace(/[^0-9,\-+]/g, '')
  
  if (valor.length > 0) {
    const temSinal = valor[0] === '+' || valor[0] === '-'
    const numeroLimpo = valor.replace(/[\-+]/g, '')
    valor = (temSinal ? valor[0] : '') + numeroLimpo
  }
  
  percentualAjuste.value = valor
  calcularReadequacao()
}

const calcularReadequacao = () => {
  const percentual = percentualFormatado.value
  const fator = 1 + (percentual / 100)

  itensReadequados.value = itensReadequados.value.map(item => {
    // Removida a condição de selecionado para calcular todos os itens
    const valorUnitarioReadequado = Number((item.valorUnitarioOriginal * fator).toFixed(2))
    const totalReadequado = Number((valorUnitarioReadequado * item.quantidade).toFixed(2))
    
    return {
      ...item,
      valorUnitarioOriginal: item.valorUnitarioOriginal || item.valorUnitario,
      valorUnitario: valorUnitarioReadequado, // Atualiza o valor unitário
      total: totalReadequado // Atualiza o total
    }
  })
  
  recalcularTotal()
}

// Modificar função de aplicar readequação
const aplicarReadequacao = () => {
  try {
    router.push({
      name: 'LancesView',
      query: {
        itensAtualizados: JSON.stringify(itensReadequados.value)
      }
    })
  } catch (error) {
    console.error('Erro ao navegar:', error)
  }
}

// Função para exportar readequação (que estava faltando)
const exportarReadequacao = () => {
  // Implementar lógica de exportação aqui
  console.log('Exportar readequação')
}

const voltarPlanilha = () => {
  router.back()
}

// Função para recalcular total
const recalcularTotal = () => {
  const total = itensReadequados.value.reduce((acc, item) => 
    acc + Number(item.total || 0), 0
  )
  totalReadequado.value = Number(total.toFixed(2))
}

// Função para recalcular total de um item
const recalcularTotalItem = (item) => {
  item.total = Number((item.valorUnitario * item.quantidade).toFixed(2))
  recalcularTotal()
}

// Função para selecionar todos os itens
const toggleSelecionarTodos = () => {
  itensReadequados.value.forEach(item => {
    item.selecionado = selecionarTodos.value
  })
  recalcularTotal()
}

// Carregar dados iniciais
onMounted(() => {
  const query = router.currentRoute.value.query
  if (query.itens) {
    const itensOriginais = JSON.parse(decodeURIComponent(query.itens))
    itensReadequados.value = itensOriginais.map(item => ({
      ...item,
      selecionado: false,
      valorUnitarioOriginal: item.valorUnitario, // Guarda o valor original
      valorUnitario: item.valorUnitario, // Mantém o mesmo valor até recalcular
      totalOriginal: item.total,
      total: item.total // Mantém o mesmo total até recalcular
    }))
    totalOriginal.value = parseFloat(query.totalGeral || 0)
    valorEstimado.value = parseFloat(query.valorEstimado || 0)
    
    // Após carregar os dados, calcula a readequação se houver percentual
    if (percentualFormatado.value !== 0) {
      calcularReadequacao()
    }
  }
  
  // Carregar estado da sidebar
  const savedState = localStorage.getItem('sidebarState')
  if (savedState !== null) {
    isSidebarExpanded.value = savedState === 'true'
  }
})

// Adicione um watch para o percentualFormatado
watch(percentualFormatado, (novoValor) => {
  if (novoValor !== null) {
    calcularReadequacao()
  }
}, { immediate: true })

</script>

<style src="./PlanilhaValoresReadequada.css" scoped></style>