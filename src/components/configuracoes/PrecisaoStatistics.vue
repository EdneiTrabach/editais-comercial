<template>
  <div class="stats-section">
    <h2>Estatísticas de Precisão</h2>
    
    <div v-if="carregandoEstatisticas" class="loading-stats">
      <div class="spinner"></div>
      <p>Carregando estatísticas...</p>
    </div>
    
    <div v-else-if="estatisticas.length > 0" class="stats-container">
      <div class="stats-header">
        <div>Campo</div>
        <div>Precisão</div>
        <div>Total de análises</div>
      </div>
      
      <div 
        v-for="estat in estatisticas" 
        :key="estat.campo" 
        class="stats-row"
      >
        <div class="campo-nome">{{ formatarNomeCampo(estat.campo) }}</div>
        <div class="precisao-valor">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: estat.taxa_precisao + '%' }"
              :class="getClassePrecisao(estat.taxa_precisao)"
            ></div>
          </div>
          <span>{{ estat.taxa_precisao }}%</span>
        </div>
        <div class="total-analises">
          {{ estat.analises_corretas }} / {{ estat.total_analises }}
        </div>
      </div>
      
      <div class="stats-summary">
        <p>
          <strong>Precisão média:</strong> 
          {{ calcularPrecisaoMedia().toFixed(2) }}%
        </p>
        <p>
          <strong>Total de análises:</strong> 
          {{ calcularTotalAnalises() }}
        </p>
      </div>
    </div>
    
    <div v-else class="no-stats">
      <p>Não há estatísticas disponíveis ainda.</p>
      <p>As estatísticas serão geradas à medida que os usuários fornecerem feedback sobre as análises automáticas.</p>
    </div>
    
    <div class="actions">
      <button @click="$emit('atualizar')" class="btn-outline">
        <img src="/icons/refresh.svg" alt="Atualizar" class="btn-icon" />
        Atualizar Estatísticas
      </button>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'PrecisaoStatistics',
  
  props: {
    estatisticas: {
      type: Array,
      default: () => []
    },
    carregandoEstatisticas: {
      type: Boolean,
      default: false
    }
  },
  
  emits: ['atualizar'],
  
  setup(props) {
    // Formatar nome do campo
    const formatarNomeCampo = (campo) => {
      const mapa = {
        'numero_processo': 'Número de Processo',
        'orgao': 'Órgão',
        'municipio': 'Município',
        'estado': 'Estado/UF',
        'empresa_vencedora': 'Empresa Vencedora',
        'numero_contrato': 'Número do Contrato',
        'data_licitacao': 'Data da Licitação'
      };
      
      return mapa[campo] || campo;
    };
    
    // Obter classe CSS para barra de progresso baseada na taxa de precisão
    const getClassePrecisao = (taxa) => {
      if (taxa >= 80) return 'high';
      if (taxa >= 60) return 'medium';
      return 'low';
    };
    
    // Calcular precisão média
    const calcularPrecisaoMedia = () => {
      if (!props.estatisticas.length) return 0;
      
      const soma = props.estatisticas.reduce((acc, estat) => acc + estat.taxa_precisao, 0);
      return soma / props.estatisticas.length;
    };
    
    // Calcular total de análises
    const calcularTotalAnalises = () => {
      if (!props.estatisticas.length) return 0;
      
      // Usar o primeiro campo como referência, já que o total deve ser o mesmo para todos
      return props.estatisticas[0].total_analises;
    };
    
    return {
      formatarNomeCampo,
      getClassePrecisao,
      calcularPrecisaoMedia,
      calcularTotalAnalises
    };
  }
}
</script>

<style scoped>
.stats-section {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 25px;
}

h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
  font-size: 1.3rem;
}

.stats-container {
  background-color: #f9f9f9;
  border-radius: 6px;
  overflow: hidden;
}

.stats-header {
  display: grid;
  grid-template-columns: 1fr 150px 150px;
  background-color: #f0f0f0;
  padding: 12px;
  font-weight: 500;
  color: #333;
}

.stats-row {
  display: grid;
  grid-template-columns: 1fr 150px 150px;
  padding: 12px;
  border-bottom: 1px solid #eee;
}

.stats-row:last-child {
  border-bottom: none;
}

.campo-nome {
  font-weight: 500;
}

.precisao-valor {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-bar {
  flex: 1;
  height: 10px;
  background-color: #e0e0e0;
  border-radius: 5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 5px;
}

.progress-fill.high {
  background-color: #4caf50;
}

.progress-fill.medium {
  background-color: #ff9800;
}

.progress-fill.low {
  background-color: #f44336;
}

.total-analises {
  text-align: center;
}

.stats-summary {
  background-color: #f0f0f0;
  padding: 12px;
  margin-top: 10px;
  border-radius: 6px;
}

.stats-summary p {
  margin: 5px 0;
}

.loading-stats, .no-stats {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px;
  background-color: #f9f9f9;
  border-radius: 6px;
  color: #666;
}

.actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn-outline {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  background-color: transparent;
  color: #666;
  border: 1px solid #ddd;
}

.btn-outline:hover {
  background-color: #f5f5f5;
}

.btn-icon {
  width: 16px;
  height: 16px;
  margin-right: 8px;
}

.spinner {
  display: inline-block;
  width: 24px;
  height: 24px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #2196f3;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .stats-header, .stats-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .stats-header > div:not(:first-child) {
    display: none;
  }
  
  .precisao-valor, .total-analises {
    margin-left: 0;
  }
}
</style>
