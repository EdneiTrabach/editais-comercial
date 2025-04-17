<template>
  <!-- Grid view (cartões) -->
  <div v-if="modoVisualizacao === 'grid'" class="processos-grid">
    <div 
      v-for="processo in processos" 
      :key="processo.id"
      @click="$emit('select-processo', processo)"
      class="processo-card"
      :class="{ 
        'selected': selectedProcesso === processo.id,
        'not-in-analysis': !isStillInAnalysis(processo)
      }"
      :data-current-status="formatStatus(processo.status)"
    >
      <div class="card-header">
        <span class="card-numero">{{ processo.numero_processo }}</span>
        <span class="card-status" :class="'status-' + processo.status?.toLowerCase()?.replace(/[_\s]/g, '-')">
          {{ formatStatus(processo.status) }}
        </span>
      </div>
      <div class="card-body">
        <div class="card-orgao">{{ processo.orgao }}</div>
        <div class="card-info">
          <div class="info-item">
            <i class="fas fa-building"></i>
            <span>{{ processo.modalidade || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-map-marker-alt"></i>
            <span>{{ processo.estado || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-hashtag"></i>
            <span>Código: {{ processo.codigo_analise || 'N/A' }}</span>
          </div>
        </div>
        <div class="card-footer">
          <div class="info-item">
            <i class="fas fa-user"></i>
            <span>{{ processo.responsavel || 'Não atribuído' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- List view (tabela) -->
  <div v-else class="processos-lista">
    <table class="table-processos">
      <thead>
        <tr>
          <th>Número</th>
          <th>Órgão</th>
          <th>Modalidade</th>
          <th>Estado</th>
          <th>Código</th>
          <th>Status</th>
          <th>Responsável</th>
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
          <td class="numero-processo">{{ processo.numero_processo }}</td>
          <td>{{ processo.orgao }}</td>
          <td>{{ processo.modalidade || 'N/A' }}</td>
          <td>{{ processo.estado || 'N/A' }}</td>
          <td>{{ processo.codigo_analise || 'N/A' }}</td>
          <td>
            <span class="status-badge" :class="'status-' + processo.status?.toLowerCase()?.replace(/[_\s]/g, '-')">
              {{ formatStatus(processo.status) }}
            </span>
          </td>
          <td>{{ processo.responsavel || 'Não atribuído' }}</td>
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
/* Estilos para visualização em grade (cartões) */
.processos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.processo-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease-in-out;
  cursor: pointer;
  border-left: 4px solid #4285f4;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.processo-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.processo-card.selected {
  box-shadow: 0 0 0 2px #4285f4, 0 4px 8px rgba(0, 0, 0, 0.15);
}

.processo-card.not-in-analysis {
  border-left: 4px solid orange;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.card-numero {
  font-weight: 600;
  color: #333;
  font-size: 1.1rem;
}

.card-status {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
}

.card-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-grow: 1;
}

.card-orgao {
  font-weight: 600;
  font-size: 1.1rem;
  color: #333;
  line-height: 1.3;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #555;
  font-size: 0.9rem;
}

.info-item i {
  width: 16px;
  color: #666;
  text-align: center;
}

.card-footer {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px dashed #eee;
}

/* Estilos para visualização em lista (tabela) */
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
  white-space: nowrap;
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

.numero-processo {
  font-weight: 600;
}

/* Estilos para os badges de status */
.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  color: white;
}

.status-em-analise {
  background-color: #ffb74d;
  color: #33291a;
}

.status-ganhamos {
  background-color: #66bb6a;
  color: white;
}

.status-perdemos {
  background-color: #ef5350;
  color: white;
}

.status-cancelado {
  background-color: #9e9e9e;
  color: white;
}

.status-aguardando {
  background-color: #42a5f5;
  color: white;
}

/* Responsividade */
@media (max-width: 768px) {
  .processos-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
  
  .table-processos {
    font-size: 0.9rem;
  }
}

@media (max-width: 576px) {
  .processos-grid {
    grid-template-columns: 1fr;
  }
}
</style>