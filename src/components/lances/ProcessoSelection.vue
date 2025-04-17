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
        'not-in-analysis': !isStillInAnalysis(processo),
        'analise-status-atende': getStatusAnalise(processo) === 'atende',
        'analise-status-nao-atende': getStatusAnalise(processo) === 'nao-atende',
        'analise-status-nao-analisado': getStatusAnalise(processo) === 'nao-analisado'
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
            <span>{{ formatarModalidade(processo.modalidade) || 'N/A' }}</span>
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
            <span>{{ getResponsavel(processo) }}</span>
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
            'not-in-analysis': !isStillInAnalysis(processo),
            'analise-status-atende': getStatusAnalise(processo) === 'atende',
            'analise-status-nao-atende': getStatusAnalise(processo) === 'nao-atende',
            'analise-status-nao-analisado': getStatusAnalise(processo) === 'nao-analisado'
          }"
          :data-current-status="formatStatus(processo.status)"
        >
          <td class="numero-processo">{{ processo.numero_processo }}</td>
          <td>{{ processo.orgao }}</td>
          <td>{{ formatarModalidade(processo.modalidade) }}</td>
          <td>{{ processo.estado || 'N/A' }}</td>
          <td>{{ processo.codigo_analise || 'N/A' }}</td>
          <td>
            <span class="status-badge" :class="'status-' + processo.status?.toLowerCase()?.replace(/[_\s]/g, '-')">
              {{ formatStatus(processo.status) }}
            </span>
          </td>
          <td>{{ getResponsavel(processo) }}</td>
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
          <label>Modalidade</label>
          <select v-model="novoProcesso.modalidade">
            <option value="pregao_eletronico">Pregão Eletrônico</option>
            <option value="pregao_presencial">Pregão Presencial</option>
            <option value="concorrencia">Concorrência</option>
            <option value="tomada_preco">Tomada de Preço</option>
            <option value="convite">Convite</option>
            <option value="inexigibilidade">Inexigibilidade</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Estado</label>
          <select v-model="novoProcesso.estado">
            <option value="">Selecione o estado</option>
            <option value="AC">Acre</option>
            <option value="AL">Alagoas</option>
            <option value="AP">Amapá</option>
            <option value="AM">Amazonas</option>
            <option value="BA">Bahia</option>
            <option value="CE">Ceará</option>
            <option value="DF">Distrito Federal</option>
            <option value="ES">Espírito Santo</option>
            <option value="GO">Goiás</option>
            <option value="MA">Maranhão</option>
            <option value="MT">Mato Grosso</option>
            <option value="MS">Mato Grosso do Sul</option>
            <option value="MG">Minas Gerais</option>
            <option value="PA">Pará</option>
            <option value="PB">Paraíba</option>
            <option value="PR">Paraná</option>
            <option value="PE">Pernambuco</option>
            <option value="PI">Piauí</option>
            <option value="RJ">Rio de Janeiro</option>
            <option value="RN">Rio Grande do Norte</option>
            <option value="RS">Rio Grande do Sul</option>
            <option value="RO">Rondônia</option>
            <option value="RR">Roraima</option>
            <option value="SC">Santa Catarina</option>
            <option value="SP">São Paulo</option>
            <option value="SE">Sergipe</option>
            <option value="TO">Tocantins</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Código de Análise</label>
          <input v-model="novoProcesso.codigo_analise" placeholder="Código de análise">
        </div>

        <div class="form-group">
          <label>Responsável</label>
          <input v-model="novoProcesso.responsavel" placeholder="Responsável pelo processo">
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
import { supabase } from '@/lib/supabase'

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
  
  data() {
    return {
      showNovoProcessoModal: false,
      loading: false,
      novoProcesso: {
        orgao: '',
        data_pregao: '',
        hora_pregao: '',
        objeto_resumido: '',
        status: 'em_analise',
        responsavel: '',
        modalidade: 'pregao_eletronico',
        estado: 'ES'
      },
      showOnlyInAnalysis: false,
      analisesCache: {} // Cache para armazenar estados das análises
    }
  },
  
  methods: {
    formatStatus(status) {
      if (!status) return 'Desconhecido';
      
      const statusMap = {
        'em_analise': 'Em Análise',
        'ganhamos': 'Ganhamos',
        'perdemos': 'Perdemos',
        'desistimos': 'Desistimos',
        'cancelado': 'Cancelado',
        'adiado': 'Adiado',
        'aguardando': 'Aguardando'
      };
      
      return statusMap[status.toLowerCase()] || status;
    },
    
    formatarData(dateString) {
      if (!dateString) return '-';
      
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
      } catch (error) {
        return dateString;
      }
    },
    
    formatarModalidade(modalidade) {
      if (!modalidade) return 'N/A';
      
      // Transformar de snake_case para formato legível
      return modalidade
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    },
    
    isStillInAnalysis(processo) {
      return processo.status && processo.status.toLowerCase() === 'em_analise';
    },
    
    abrirModal() {
      // Reiniciar estado do formulário
      this.novoProcesso = {
        orgao: '',
        data_pregao: '',
        hora_pregao: '',
        objeto_resumido: '',
        status: 'em_analise',
        responsavel: '',
        modalidade: 'pregao_eletronico',
        estado: 'ES'
      };
      this.showNovoProcessoModal = true;
    },
    
    fecharModal() {
      this.showNovoProcessoModal = false;
    },
    
    async criarNovoProcesso() {
      try {
        this.loading = true;
        
        const processoData = {
          ...this.novoProcesso,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ano: parseInt(this.novoProcesso.data_pregao.split('-')[0], 10)
        };
        
        // Garantir que o status padrão não seja em_analise
        // Para evitar que novos processos apareçam automaticamente na tela de análises
        if (!processoData.status) {
          processoData.status = 'cadastrado';
        }
        
        const { data, error } = await supabase
          .from('processos')
          .insert(processoData)
          .select()
          .single();
          
        if (error) throw error;
        
        // Fechar modal e emitir evento com o novo processo
        this.showNovoProcessoModal = false;
        this.$emit('select-processo', data);
        
      } catch (error) {
        console.error('Erro ao criar processo:', error);
        alert('Erro ao criar processo. Por favor, tente novamente.');
      } finally {
        this.loading = false;
      }
    },
    
    // Função especial para obter o responsável
    getResponsavel(processo) {
      // Verificação simplificada sem depender do relacionamento com usuarios
      if (processo && processo.responsavel && processo.responsavel.trim()) {
        return processo.responsavel;
      }
      
      // Se não houver valor no campo responsavel, retornar mensagem padrão
      return 'Não atribuído';
    },

    // Método para determinar o status de análise do processo
    async getStatusAnalise(processo) {
      // Se não é um processo em análise, não aplicamos estilo específico
      if (processo.status !== 'em_analise') {
        return null;
      }

      // Verificar se já temos o resultado em cache
      if (this.analisesCache[processo.id]) {
        return this.analisesCache[processo.id];
      }
      
      try {
        // Buscar dados de análise deste processo
        const { data, error } = await supabase
          .from('analises_itens')
          .select('total_itens, nao_atendidos, obrigatorio, percentual_minimo')
          .eq('processo_id', processo.id);
          
        if (error) throw error;
        
        // Se não há registros de análise, considerar como não analisado
        if (!data || data.length === 0) {
          this.analisesCache[processo.id] = 'nao-analisado';
          return 'nao-analisado';
        }
        
        // Verificar se algum item foi analisado (tem valor em total_itens)
        const itensAnalisados = data.filter(item => 
          item.total_itens && item.total_itens > 0 && 
          (item.nao_atendidos !== null && item.nao_atendidos !== undefined)
        );
        
        // Se nenhum item foi analisado, considerar como não analisado
        if (itensAnalisados.length === 0) {
          this.analisesCache[processo.id] = 'nao-analisado';
          return 'nao-analisado';
        }
        
        // Calcular se atende os requisitos
        let atende = true;
        
        for (const item of itensAnalisados) {
          const percentualMinimo = item.obrigatorio ? 90 : 70; // Valores padrão
          const percentualAtendimento = ((item.total_itens - item.nao_atendidos) / item.total_itens) * 100;
          
          if (percentualAtendimento < (item.percentual_minimo || percentualMinimo)) {
            atende = false;
            break;
          }
        }
        
        // Armazenar o resultado em cache
        this.analisesCache[processo.id] = atende ? 'atende' : 'nao-atende';
        return atende ? 'atende' : 'nao-atende';
        
      } catch (error) {
        console.error('Erro ao obter status de análise:', error);
        return 'nao-analisado'; // Em caso de erro, consideramos como não analisado
      }
    }
  },
  
  async mounted() {
    // Para cada processo em análise, pré-carregar status
    if (this.processos && this.processos.length > 0) {
      for (const processo of this.processos) {
        if (processo.status === 'em_analise') {
          await this.getStatusAnalise(processo);
        }
      }
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

/* Status de análise para cards */
.processo-card.analise-status-atende {
  border-left: 4px solid #28a745 !important; /* Verde para atende */
}

.processo-card.analise-status-nao-atende {
  border-left: 4px solid #dc3545 !important; /* Vermelho para não atende */
}

.processo-card.analise-status-nao-analisado {
  border-left: 4px solid #fd7e14 !important; /* Laranja para não analisado */
}

/* Status de análise para linhas da tabela */
.processo-row.analise-status-atende td:first-child {
  border-left: 4px solid #28a745;
}

.processo-row.analise-status-nao-atende td:first-child {
  border-left: 4px solid #dc3545;
}

.processo-row.analise-status-nao-analisado td:first-child {
  border-left: 4px solid #fd7e14;
}

/* Estilos originais de not-in-analysis (modificados para prioridade menor) */
.processo-card.not-in-analysis:not(.analise-status-atende):not(.analise-status-nao-atende):not(.analise-status-nao-analisado) {
  border-left: 4px solid orange;
}

.processo-row.not-in-analysis:not(.analise-status-atende):not(.analise-status-nao-atende):not(.analise-status-nao-analisado) td:first-child {
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