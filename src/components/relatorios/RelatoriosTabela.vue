<template>
  <div class="table-container">
    <div v-if="loading" class="loading-indicator">
      <i class="fas fa-spinner fa-spin"></i> Carregando dados...
    </div>

    <div v-else-if="processos.length === 0" class="no-data">
      <i class="fas fa-info-circle"></i>
      Nenhum processo encontrado com os filtros selecionados.
    </div>

    <table v-else class="table table-striped">
      <thead>
        <tr>
          <th>Número do Processo</th>
          <th>Órgão</th>
          <th>Data Pregão</th>
          <th>Status</th>
          <th>Valor Estimado</th>
          <th>Responsável</th>
          <th>Sistemas</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="processo in processos" :key="processo.id" :class="{
          'row-ganhamos': processo.status === 'ganhamos',
          'row-perdemos': processo.status === 'perdemos'
        }">
          <td>{{ processo.numero_processo }}</td>
          <td>{{ processo.orgao }}</td>
          <td>{{ formatarData(processo.data_pregao) }}</td>
          <td>
            <span class="status-badge" :class="`status-${processo.status?.replaceAll('_', '-')}`">
              {{ formatarStatus(processo.status) }}
            </span>
          </td>
          <td>{{ formatarMoeda(processo.valor_estimado) }}</td>
          <td>{{ getResponsavelNome(processo.responsavel_id) }}</td>
          <td>{{ getSistemasNomes(processo.sistemas_ativos) }}</td>
          <td>
            <div class="btn-group">
              <button class="btn btn-sm btn-info" @click="$emit('ver-detalhes', processo)">
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn btn-sm btn-primary" @click="$emit('ir-para-processo', processo)">
                <i class="fas fa-edit"></i>
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: 'RelatoriosTabela',
  
  props: {
    processos: {
      type: Array,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    },
    responsaveis: {
      type: Array,
      default: () => []
    },
    sistemas: {
      type: Array,
      default: () => []
    }
  },
  
  emits: ['ver-detalhes', 'ir-para-processo'],
  
  setup(props) {
    // Formatação de data
    const formatarData = (date) => {
      if (!date) return '-';
      return new Date(date).toLocaleDateString('pt-BR');
    };
    
    // Formatação de valor monetário
    const formatarMoeda = (valor) => {
      if (valor === null || valor === undefined) return '-';
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(valor);
    };
    
    // Formatação de status
    const formatarStatus = (status) => {
      if (!status) return '-';
      
      const statusMap = {
        'vamos_participar': 'Vamos Participar',
        'ganhamos': 'Ganhamos',
        'perdemos': 'Perdemos',
        'em_analise': 'Em Análise',
        'adiado': 'Adiado',
        'cancelado': 'Cancelado',
        'demonstracao': 'Demonstração'
      };
      
      return statusMap[status] || status.replace(/_/g, ' ');
    };
    
    // Obter nome do responsável
    const getResponsavelNome = (responsavelId) => {
      if (!responsavelId) return '-';
      
      const responsavel = props.responsaveis.find(r => r.id === responsavelId);
      return responsavel ? responsavel.nome : '-';
    };
    
    // Obter nomes dos sistemas
    const getSistemasNomes = (sistemasIds) => {
      if (!sistemasIds || !Array.isArray(sistemasIds) || sistemasIds.length === 0) return '-';
      
      const nomes = sistemasIds.map(id => {
        const sistema = props.sistemas.find(s => s.id === id);
        return sistema ? sistema.nome : 'Sistema Desconhecido';
      });
      
      return nomes.join(', ');
    };
    
    return {
      formatarData,
      formatarMoeda,
      formatarStatus,
      getResponsavelNome,
      getSistemasNomes
    };
  }
}
</script>

<style scoped>
.table-container {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 20px;
}

.loading-indicator,
.no-data {
  padding: 30px;
  text-align: center;
  color: #666;
}

.loading-indicator i,
.no-data i {
  margin-right: 8px;
  color: #193155;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
  font-size: 0.95rem;
}

.table th {
  font-weight: 600;
  color: #193155;
  background-color: #f8f9fa;
  white-space: nowrap;
}

.table tbody tr:hover {
  background-color: #f8f9fa;
}

.row-ganhamos {
  background-color: rgba(40, 167, 69, 0.05);
}

.row-perdemos {
  background-color: rgba(220, 53, 69, 0.05);
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
}

.status-vamos-participar {
  background-color: #cce5ff;
  color: #004085;
}

.status-ganhamos {
  background-color: #d4edda;
  color: #155724;
}

.status-perdemos {
  background-color: #f8d7da;
  color: #721c24;
}

.status-em-analise {
  background-color: #fff3cd;
  color: #856404;
}

.status-adiado {
  background-color: #e2e3e5;
  color: #383d41;
}

.status-cancelado {
  background-color: #f5c6cb;
  color: #721c24;
}

.btn-group {
  display: flex;
  gap: 5px;
}

.btn-sm {
  padding: 5px 10px;
  font-size: 0.875rem;
  line-height: 1.5;
  border-radius: 3px;
}

.btn-info {
  background-color: #17a2b8;
  border-color: #17a2b8;
  color: #fff;
}

.btn-primary {
  background-color: #193155;
  border-color: #193155;
  color: #fff;
}

.btn-info:hover {
  background-color: #138496;
  border-color: #117a8b;
}

.btn-primary:hover {
  background-color: #12233e;
  border-color: #0e1c32;
}
</style>