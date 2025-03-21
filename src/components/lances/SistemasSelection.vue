<template>
  <div class="sistemas-selection">
    <h2>Selecione os Itens da Proposta</h2>
    
    <div class="filtro-categorias">
      <label class="label-toggle">
        <input type="checkbox" v-model="mostrarTodasCategorias"> Mostrar todas as categorias
      </label>
      
      <div v-if="!mostrarTodasCategorias" class="categorias-selecao">
        <h3>Selecione as categorias:</h3>
        <div class="categorias-botoes">
          <label 
            v-for="categoria in categorias" 
            :key="categoria"
            class="categoria-checkbox"
            :class="{ 'ativo': categoriasSelecionadas.includes(categoria) }"
          >
            <input 
              type="checkbox" 
              v-model="categoriasSelecionadas" 
              :value="categoria"
            >
            {{ categoria }}
          </label>
        </div>
      </div>
    </div>
    
    <!-- Mostrar os itens por categoria, independente de haver sistemas -->
    <div class="itens-container">
      <div class="categoria-wrapper" v-for="categoria in categoriasFiltradas" :key="categoria">
        <div class="categoria-section">
          <h4>{{ categoria }}</h4>
          <div class="itens-list">
            <label 
              v-for="item in itensPorCategoria(categoria)" 
              :key="item.id"
              class="item-checkbox"
            >
              <input 
                type="checkbox"
                v-model="modelValue"
                :value="item.id"
              >
              {{ item.nome }}
            </label>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Mostrar mensagem informativa sobre sistemas, mas não bloquear a seleção -->
    <div v-if="sistemas.length === 0" class="info-sistemas">
      <p>Este processo não possui sistemas cadastrados, mas você pode continuar selecionando itens para a proposta.</p>
    </div>
    
    <div class="items-selecionados-resumo" v-if="itensSelecionadosInfo.length > 0">
      <h3>Itens Selecionados ({{ itensSelecionadosInfo.length }}):</h3>
      <ul>
        <li v-for="item in itensSelecionadosInfo" :key="item.id">
          {{ item.nome }} <span class="categoria-badge">{{ item.categoria }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed, ref, watch, onMounted } from 'vue'

const props = defineProps({
  sistemas: {
    type: Array,
    required: true,
    default: () => []
  },
  itensDisponiveis: {
    type: Array,
    required: true,
    default: () => []
  },
  itensSelecionados: {
    type: Array,
    required: true,
    default: () => []
  }
})

const emit = defineEmits(['update:itensSelecionados'])

// Valor inicial false para mostrar as categorias por padrão
const mostrarTodasCategorias = ref(false)
const categoriasSelecionadas = ref([])

// Quando o componente é montado ou quando os itens disponíveis mudam
onMounted(() => {
  initializeCategorias()
})

watch(() => props.itensDisponiveis, () => {
  initializeCategorias()
}, { immediate: true })

// Inicializa a primeira categoria quando o componente é montado
function initializeCategorias() {
  if (props.itensDisponiveis && props.itensDisponiveis.length > 0 && categoriasSelecionadas.value.length === 0) {
    const categoriasDisponiveis = [...new Set(props.itensDisponiveis.map(item => item.categoria))]
    if (categoriasDisponiveis.length > 0) {
      categoriasSelecionadas.value = [categoriasDisponiveis[0]]
    }
  }
}

const modelValue = computed({
  get: () => props.itensSelecionados,
  set: (value) => emit('update:itensSelecionados', value)
})

// Extrair todas as categorias únicas dos itens disponíveis
const categorias = computed(() => {
  const categoriasUnicas = [...new Set(props.itensDisponiveis.map(item => item.categoria))]
  return categoriasUnicas
})

// Categorias a serem exibidas com base no filtro
const categoriasFiltradas = computed(() => {
  if (mostrarTodasCategorias.value) return categorias.value
  return categoriasSelecionadas.value.length > 0 ? categoriasSelecionadas.value : categorias.value
})

// Obter itens por categoria
const itensPorCategoria = (categoria) => {
  return props.itensDisponiveis.filter(item => item.categoria === categoria)
}

// Informações completas dos itens selecionados
const itensSelecionadosInfo = computed(() => {
  return props.itensSelecionados.map(id => {
    return props.itensDisponiveis.find(item => item.id === id)
  }).filter(Boolean) // Remove undefined values
})
</script>

<style src="@/assets/styles/SistemasSelection.css"></style>
