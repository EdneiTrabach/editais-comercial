<!-- filepath: d:\PROJETOS-EL\editais-comercial\src\components\relatorios\RelatoriosTabela\index.vue -->
<template>
  <div class="table-responsive">
    <table class="table-relatorios">
      <thead>
        <tr>
          <th>Número</th>
          <th>Órgão</th>
          <th>Data</th>
          <th>Status</th>
          <th>Valor Estimado</th>
          <th>Responsável</th>
          <th>Sistemas</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading" class="loading-row">
          <td colspan="8">Carregando processos...</td>
        </tr>
        <tr v-else-if="processos.length === 0" class="empty-row">
          <td colspan="8">Nenhum processo encontrado</td>
        </tr>
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
      };
      
      return statusMap[status] || status.replace(/_/g, ' ');
    };
    
    // Buscar nome do responsável
    const getResponsavelNome = (id) => {
      if (!id) return '-';
      const responsavel = props.responsaveis.find(r => r.id === id);
      return responsavel ? responsavel.nome : '-';
    };
    
    // Buscar nomes dos sistemas
    const getSistemasNomes = (ids) => {
      if (!ids || !Array.isArray(ids) || ids.length === 0) return '-';
      const nomes = ids
        .map(id => {
          const sistema = props.sistemas.find(s => s.id === id);
          return sistema ? sistema.nome : null;
        })
        .filter(Boolean);
      
      return nomes.length ? nomes.join(', ') : '-';
    };
    
    return {
      formatarData,
      formatarMoeda,
      formatarStatus,
      getResponsavelNome,
      getSistemasNomes
    };
  }
};
</script>

<style scoped src="./style.css"></style>