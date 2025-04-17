<template>
  <!-- Grid view (original) -->
  <div v-if="modoVisualizacao === 'grid'" class="processos-grid">
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

  <!-- List view (new) -->
  <div v-else class="processos-lista">
    <table class="table-processos">
      <thead>
        <tr>
          <th>Número</th>
          <th>Órgão</th>
          <th>Data</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr 
          v-for="processo in processos" 
          :key="processo.id"
          @click="$emit('select-processo', processo)"
          class="processo-row"
          :class="{ 
            'selected': selectedProcesso === processo.id,
            'not-in-analysis': !isStillInAnalysis(processo)
          }"
          :data-current-status="formatStatus(processo.status)"
        >
          <td>{{ processo.numero_processo }}</td>
          <td>{{ processo.orgao }}</td>
          <td>{{ formatarData(processo.data_pregao) }}</td>
          <td>
            <span class="status-badge" :class="'status-' + processo.status?.toLowerCase()?.replace(/[_\s]/g, '-')">
              {{ formatStatus(processo.status) }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
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
    selectedProcesso: [Number, String, Object],
    modoVisualizacao: {
      type: String,
      default: 'grid',
      validator: (value) => ['grid', 'lista'].includes(value)
    }
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

    // Função para formatar data
    const formatarData = (dateString) => {
      if (!dateString) return '-';
      
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
      } catch (error) {
        return dateString;
      }
    };
    
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
      showOnlyInAnalysis: ref(false),
      formatarData
    }
  }
}
</script>

<style>
/* Estilos para visualização em grade (existente) */
.processos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
  margin-top: 20px;
}

.processo-item {
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  list-style: none;
}

.processo-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-color: #aaa;
}

.processo-item.selected {
  background-color: #e0f0ff;
  border-color: #4285f4;
  box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
}

.processo-item.not-in-analysis {
  border-left: 4px solid orange;
}

/* Estilos para visualização em lista (novo) */
.processos-lista {
  margin-top: 20px;
  width: 100%;
  overflow-x: auto;
}

.table-processos {
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
  background-color: #fff;
}

.table-processos thead th {
  background-color: #f8f9fa;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid #ddd;
}

.processo-row {
  cursor: pointer;
  transition: all 0.2s;
}

.processo-row td {
  padding: 12px;
  border-bottom: 1px solid #eee;
}

.processo-row:hover {
  background-color: #f5f9ff;
}

.processo-row.selected {
  background-color: #e0f0ff;
}

.processo-row.not-in-analysis td:first-child {
  border-left: 4px solid orange;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  background-color: #eee;
}

.status-em-analise {
  background-color: #ffecb3;
  color: #856404;
}

.status-ganhamos {
  background-color: #c8e6c9;
  color: #1b5e20;
}

.status-perdemos {
  background-color: #ffcdd2;
  color: #b71c1c;
}

.status-cancelado {
  background-color: #e0e0e0;
  color: #616161;
}
</style>