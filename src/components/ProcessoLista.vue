<template>
  <div class="processos-lista">
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
          class="processo-row"
          :class="{
            'selected': selectedProcesso && selectedProcesso.id === processo.id,
            'not-in-analysis': processo.status !== 'em_analise'
          }"
          :data-current-status="formatStatus(processo.status)"
          @click="$emit('select-processo', processo)"
        >
          <td class="numero-processo">{{ processo.numero_processo }}</td>
          <td class="custom-cursor-on-hover">{{ processo.orgao }}</td>
          <td class="custom-cursor-on-hover">{{ formatarModalidade(processo.modalidade) }}</td>
          <td>{{ processo.estado || 'N/A' }}</td>
          <td>{{ processo.codigo_analise || 'N/A' }}</td>
          <td class="custom-cursor-on-hover">
            <span class="status-badge" :class="'status-' + (processo.status?.toLowerCase()?.replace(/[_\s]/g, '-') || 'desconhecido')">
              {{ formatStatus(processo.status) }}
            </span>
          </td>
          <td>{{ getResponsavel(processo) }}</td>
        </tr>
        
        <tr v-if="processos.length === 0">
          <td colspan="7" class="empty-message">
            <div class="no-data-message">
              <i class="fas fa-info-circle"></i>
              <span>Nenhum processo encontrado com os filtros atuais</span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Opções de filtro -->
  <div class="filter-options mt-3">
    <label class="custom-checkbox">
      <input 
        type="checkbox" 
        v-model="showOnlyInAnalysis"
        @change="$emit('filter-change', { onlyInAnalysis: showOnlyInAnalysis })"
      />
      <span class="checkmark"></span>
      Mostrar apenas processos com status atual "Em Análise"
    </label>
  </div>
</template>

<script>
export default {
  name: 'ProcessoLista',
  props: {
    processos: {
      type: Array,
      default: () => []
    },
    selectedProcesso: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      showOnlyInAnalysis: false
    };
  },
  methods: {
    formatarModalidade(modalidade) {
      const modalidadesMap = {
        'pregao_eletronico': 'Pregão Eletrônico',
        'pregao_presencial': 'Pregão Presencial',
        'credenciamento': 'Credenciamento',
        'concorrencia': 'Concorrência',
        'concurso': 'Concurso',
        'leilao': 'Leilão',
        'dialogo_competitivo': 'Diálogo Competitivo',
        'tomada_precos': 'Tomada de Preços',
        'chamamento_publico': 'Chamamento Público'
      };
      
      return modalidadesMap[modalidade] || modalidade;
    },
    formatStatus(status) {
      const statusMap = {
        'vamos_participar': 'Vamos Participar',
        'em_analise': 'Em Análise',
        'em_andamento': 'Em Andamento',
        'ganhamos': 'Ganhamos',
        'perdemos': 'Perdemos',
        'suspenso': 'Suspenso',
        'revogado': 'Revogado',
        'adiado': 'Adiado',
        'demonstracao': 'Demonstração',
        'cancelado': 'Cancelado',
        'nao_participar': 'Não Participar'
      };
      
      return statusMap[status] || status;
    },
    getResponsavel(processo) {
      return processo.responsavel || 'Não atribuído';
    }
  }
};
</script>

<style>
/* Os estilos foram movidos para o arquivo externo processo-lista.css */
.empty-message {
  text-align: center;
  padding: 2rem 0 !important;
}

.no-data-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--text-secondary, #64748b);
  font-style: italic;
}

.no-data-message i {
  color: var(--text-accent, #3b82f6);
  font-size: 1.2rem;
}
</style>