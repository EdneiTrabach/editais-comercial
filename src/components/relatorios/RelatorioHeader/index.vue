<template>
  <header class="relatorio-header">
    <div class="header-container">
      <div class="header-left">
        <button @click="$emit('voltar')" class="btn btn-light btn-back">
          <i class="fas fa-arrow-left"></i> Voltar
        </button>
        <h1 v-if="processo">
          Relatório: {{ processo.numero_processo }}
        </h1>
        <h1 v-else>Novo Relatório</h1>
      </div>
      
      <div class="header-actions">
        <button class="btn btn-primary" @click="$emit('exportar')" :disabled="loading">
          <i class="fas fa-file-pdf"></i> Exportar PDF
        </button>
        <button class="btn btn-success" @click="salvarRascunho" :disabled="loading">
          <i class="fas fa-save"></i> Salvar Rascunho
        </button>
      </div>
    </div>
    
    <div v-if="processo" class="processo-info">
      <div class="info-item"><strong>Órgão:</strong> {{ processo.orgao }}</div>
      <div class="info-item"><strong>Data:</strong> {{ formatarData(processo.data_pregao) }}</div>
      <div class="info-item"><strong>Responsável:</strong> {{ getResponsavelNome(processo.responsavel_id) }}</div>
      <div class="info-item"><strong>Status:</strong> <span class="status-badge" :class="`status-${processo.status?.replaceAll('_', '-')}`">{{ formatarStatus(processo.status) }}</span></div>
    </div>
  </header>
</template>

<script>
import { formatarData, formatarStatus } from '@/utils/formatadores';

export default {
  name: 'RelatorioHeader',
  
  props: {
    processo: {
      type: Object,
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  
  emits: ['voltar', 'exportar'],
  
  setup(props) {
    // Obter nome do responsável
    const getResponsavelNome = (id) => {
      if (!id || !props.processo || !props.processo.responsaveis) return 'Não definido';
      
      const responsavel = Array.isArray(props.processo.responsaveis)
        ? props.processo.responsaveis.find(r => r.id === id)
        : props.processo.responsaveis;
        
      return responsavel ? responsavel.nome : 'Não definido';
    };
    
    // Salvar rascunho
    const salvarRascunho = async () => {
      try {
        // Implementar lógica para salvar rascunho
        console.log('Salvando rascunho...');
        alert('Rascunho salvo com sucesso!');
      } catch (error) {
        console.error('Erro ao salvar rascunho:', error);
        alert('Erro ao salvar rascunho');
      }
    };
    
    return {
      formatarData,
      formatarStatus,
      getResponsavelNome,
      salvarRascunho
    };
  }
};
</script>

<style scoped>
.relatorio-header {
  background-color: white;
  border-bottom: 1px solid #e1e1e1;
  padding: 15px 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.btn-back {
  padding: 6px 12px;
  font-size: 0.9rem;
}

.header-actions {
  display: flex;
  gap: 10px;
}

h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.processo-info {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px solid #eee;
  font-size: 0.9rem;
}

.info-item {
  color: #555;
}

.info-item strong {
  font-weight: 600;
  color: #333;
}

.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  background-color: #e2e8f0;
  color: #2d3748;
  font-size: 0.8rem;
  font-weight: 500;
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

.btn {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  gap: 8px;
}

.btn-light {
  background-color: #f8f9fa;
  color: #212529;
  border: 1px solid #ddd;
}

.btn-light:hover {
  background-color: #e2e6ea;
}

.btn-primary {
  background-color: #193155;
  color: white;
}

.btn-primary:hover {
  background-color: #12233e;
}

.btn-success {
  background-color: #28a745;
  color: white;
}

.btn-success:hover {
  background-color: #218838;
}

.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
</style>