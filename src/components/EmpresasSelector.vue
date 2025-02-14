<template>
  <div class="empresas-selector">
    <div class="empresas-header">
      <h3>Empresas Cadastradas</h3>
    </div>
    <div class="empresas-list">
      <button
        v-for="empresa in empresas"
        :key="empresa.id"
        class="empresa-btn"
        :class="{ active: selectedEmpresa === empresa.id }"
        @click="selectEmpresa(empresa)"
      >
        {{ empresa.nome }}
        <span class="empresa-cnpj">{{ formatCNPJ(empresa.cnpj) }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'

const empresas = ref([])
const selectedEmpresa = ref(null)
const emit = defineEmits(['empresa-selected'])

const loadEmpresas = async () => {
  try {
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .order('nome')
    
    if (error) throw error
    empresas.value = data
  } catch (error) {
    console.error('Erro ao carregar empresas:', error)
  }
}

const selectEmpresa = (empresa) => {
  selectedEmpresa.value = empresa.id
  emit('empresa-selected', empresa)
}

const formatCNPJ = (cnpj) => {
  if (!cnpj) return ''
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
}

onMounted(() => {
  loadEmpresas()
})
</script>

<style scoped>
.empresas-selector {
  margin-bottom: 2rem;
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.empresas-header {
  margin-bottom: 1rem;
}

.empresas-header h3 {
  color: #193155;
  font-size: 1.2rem;
  font-weight: 600;
}

.empresas-list {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.empresa-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  background: #f8f9fa;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 200px;
}

.empresa-btn:hover {
  border-color: #193155;
  transform: translateY(-2px);
}

.empresa-btn.active {
  background: #193155;
  color: white;
  border-color: #193155;
}

.empresa-cnpj {
  font-size: 0.8rem;
  color: inherit;
  opacity: 0.8;
  margin-top: 0.5rem;
}

@media (max-width: 768px) {
  .empresas-list {
    flex-direction: column;
  }
  
  .empresa-btn {
    width: 100%;
  }
}
</style>