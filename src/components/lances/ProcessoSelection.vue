<template>
    <div class="processos-grid">
      <li 
        v-for="processo in processos" 
        :key="processo.id"
        @click="$emit('select-processo', processo)"
        class="processo-item"
        :class="{ 
          'selected': selectedProcesso === processo.id,
          'not-in-analysis': !isStillInAnalysis(processo)
        }"
        :data-current-status="formatStatus(processo.status)"
      >
        {{ processo.numero_processo }} - {{ processo.orgao }}
      </li>
    </div>

    <!-- Modal de Novo Processo -->
    <div v-if="showNovoProcessoModal" class="modal-overlay" @click.self="fecharModal">
      <div class="modal-content">
        <h3>Novo Processo</h3>
        <form @submit.prevent="criarNovoProcesso">
          <div class="form-group">
            <label>Órgão*</label>
            <input v-model="novoProcesso.orgao" required placeholder="Nome do órgão">
          </div>

          <div class="form-group">
            <label>Data do Pregão*</label>
            <input v-model="novoProcesso.data_pregao" type="date" required>
          </div>

          <div class="form-group">
            <label>Hora do Pregão*</label>
            <input v-model="novoProcesso.hora_pregao" type="time" required>
          </div>

          <div class="form-group">
            <label>Objeto Resumido*</label>
            <textarea 
              v-model="novoProcesso.objeto_resumido" 
              required 
              rows="3"
              placeholder="Breve descrição do objeto"
            ></textarea>
          </div>

          <div class="form-buttons">
            <button type="button" class="btn-cancelar" @click="fecharModal">
              Cancelar
            </button>
            <button type="submit" class="btn-criar" :disabled="loading">
              {{ loading ? 'Criando...' : 'Criar Processo' }}
            </button>
          </div>
        </form>
      </div>
    </div>

  <!-- Adicione este trecho na parte de filtragem da AnalisesView.vue -->
  <div class="filter-options mt-3">
    <div class="form-check">
      <input 
        class="form-check-input" 
        type="checkbox" 
        id="showOnlyInAnalysis" 
        v-model="showOnlyInAnalysis"
      >
      <label class="form-check-label" for="showOnlyInAnalysis">
        Mostrar apenas processos com status atual "Em Análise"
      </label>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useProcessos } from '@/composables/useProcessos'
import { useAnalises } from '@/composables/useAnalises'

export default {
  name: 'ProcessoSelection',
  
  props: {
    processos: Array,
    selectedProcesso: [Number, String, Object]
  },
  
  emits: ['select-processo'],
  
  setup(props, { emit }) {
    const { formatStatus } = useProcessos()
    const { isStillInAnalysis } = useAnalises()
    
    // Estado do modal
    const showNovoProcessoModal = ref(false)
    const loading = ref(false)
    const novoProcesso = ref({
      orgao: '',
      data_pregao: '',
      hora_pregao: '',
      objeto_resumido: '',
      status: 'em_analise'
    })
    
    // Função para abrir modal
    const abrirModal = () => {
      // Reiniciar estado do formulário
      novoProcesso.value = {
        orgao: '',
        data_pregao: '',
        hora_pregao: '',
        objeto_resumido: '',
        status: 'em_analise'
      }
      showNovoProcessoModal.value = true
    }
    
    // Função para fechar modal
    const fecharModal = () => {
      showNovoProcessoModal.value = false
    }
    
    // Função para criar novo processo
    const criarNovoProcesso = async () => {
      try {
        loading.value = true
        
        const processoData = {
          ...novoProcesso.value,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ano: parseInt(novoProcesso.value.data_pregao.split('-')[0], 10) // Extrair o ano da data
        }

        const { data, error } = await supabase
          .from('processos')
          .insert(processoData)
          .select()
          .single()

        if (error) throw error

        // Fechar modal e emitir evento com o novo processo
        showNovoProcessoModal.value = false
        emit('select-processo', data)

      } catch (error) {
        console.error('Erro ao criar processo:', error)
        alert('Erro ao criar processo. Por favor, tente novamente.')
      } finally {
        loading.value = false
      }
    }
    
    // Função para aplicar filtros
    const aplicarFiltros = (filtros) => {
      emit('filtrar', filtros);
    }
    
    return {
      formatStatus,
      isStillInAnalysis,
      showNovoProcessoModal,
      loading,
      novoProcesso,
      abrirModal,
      fecharModal,
      criarNovoProcesso,
      aplicarFiltros,
      showOnlyInAnalysis: ref(false)
    }
  }
}
</script>

<style src="./ProcessoSelection.css" scoped></style>