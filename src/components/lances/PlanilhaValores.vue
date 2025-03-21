<template>
  <div class="planilha-container">
    <h2>Preencha os Valores da Proposta</h2>
    
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
    </div>

    <table class="planilha-valores">
      <thead>
        <tr>
          <th>Item</th>
          <th>Categoria</th>
          <th>Descrição</th>
          <th>Marca/Fabricante</th>
          <th>Valor Unitário (R$)</th>
          <th>Quantidade</th>
          <th>Total</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in itensFiltrados" :key="index">
          <td>{{ item.nome }}</td>
          <td>
            <span class="categoria-badge">{{ item.categoria }}</span>
          </td>
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
            <button @click="$emit('remover-item', index)" class="btn-remover">
              <i class="fas fa-trash"></i> Remover
            </button>
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td colspan="6" class="total-label">Total Geral:</td>
          <td>{{ formatarMoeda(totalGeral) }}</td>
          <td></td>
        </tr>
      </tfoot>
    </table>

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
import { defineProps, defineEmits, ref, computed } from 'vue'
import { usePlanilha } from '@/composables/usePlanilha'

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

// Filtros
const filtroCategoria = ref('')
const termoBusca = ref('')

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
