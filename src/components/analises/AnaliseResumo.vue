````vue
<template>
  <div class="analise-resumo">
    <div v-if="todosItensAnalisados" 
         class="percentual-geral"
         :class="getStatusGeralClass">
      <div class="percentual-info">
        <span class="percentual-valor">
          <i class="fas fa-chart-pie"></i> Atendimento Geral: {{ formatarPercentual(porcentagemGeralAtendimento) }}%
        </span>
        <span class="percentual-status" :class="{'status-geral-atende': getStatusGeral === 'Atende Requisitos', 'status-geral-nao-atende': getStatusGeral !== 'Atende Requisitos'}">
          {{ getStatusGeral }}
        </span>
      </div>
      <div class="detalhes-analise">
        <span>Total itens analisados: {{ totalItensAnalisados }}</span>
        <span>Total de sistemas: {{ totalSistemas }}</span>
      </div>
    </div>
    
    <div v-else class="analise-incompleta">
      <div class="alerta-analise">
        <i class="fas fa-exclamation-triangle"></i>
        <h4>Análise Incompleta</h4>
      </div>
      <p>É necessário analisar todos os itens para calcular o percentual geral de atendimento.</p>
      <div class="progresso-analise">
        <div class="barra-progresso">
          <div class="progresso" :style="{ width: `${percentualItensAnalisados}%` }"></div>
        </div>
        <span>{{ itensAnalisados }} de {{ totalSistemas }} itens analisados ({{ percentualItensAnalisados }}%)</span>
      </div>
      <div class="pendentes-lista" v-if="itensPendentes.length > 0">
        <p class="pendentes-titulo">Itens pendentes de análise:</p>
        <ul>
          <li v-for="(item, index) in itensPendentes.slice(0, 3)" :key="index">
            {{ item }}
          </li>
          <li v-if="itensPendentes.length > 3">
            E mais {{ itensPendentes.length - 3 }} item(ns)...
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AnaliseResumo',
  
  props: {
    sistemasAnalise: {
      type: Array,
      required: true
    },
    porcentagemGeralAtendimento: {
      type: Number,
      required: true
    },
    getStatusGeral: {
      type: String,
      required: true
    },
    percentualMinimoGeral: {
      type: Number,
      required: true
    },
    formatarPercentual: {
      type: Function,
      required: true
    }
  },
  
  computed: {
    totalSistemas() {
      return this.sistemasAnalise.length;
    },
    
    itensAnalisados() {
      return this.sistemasAnalise.filter(sistema => 
        sistema.naoAtendidos !== undefined && 
        sistema.naoAtendidos !== null && 
        sistema.naoAtendidos !== '' && 
        sistema.totalItens > 0
      ).length;
    },
    
    itensPendentes() {
      return this.sistemasAnalise
        .filter(sistema => 
          (sistema.naoAtendidos === undefined || 
           sistema.naoAtendidos === null || 
           sistema.naoAtendidos === '') && 
          sistema.totalItens > 0
        )
        .map(sistema => sistema.nome || 'Sistema sem nome');
    },
    
    todosItensAnalisados() {
      return this.itensAnalisados === this.totalSistemas && this.totalSistemas > 0;
    },
    
    percentualItensAnalisados() {
      if (this.totalSistemas === 0) return 0;
      return Math.round((this.itensAnalisados / this.totalSistemas) * 100);
    },
    
    totalItensAnalisados() {
      return this.sistemasAnalise.reduce((acc, sistema) => acc + (sistema.totalItens || 0), 0);
    },
    
    getStatusGeralClass() {
      return {
        'status-geral-atende': this.getStatusGeral === 'Atende Requisitos',
        'status-geral-nao-atende': this.getStatusGeral !== 'Atende Requisitos'
      };
    }
  }
}
</script>

<style scoped>
.analise-resumo {
  margin-top: 1.5rem;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

/* Estilo quando todos os itens foram analisados */
.percentual-geral {
  padding: 1.25rem;
  background-color: var(--bg-card, white);
  border-left: 5px solid;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.status-geral-atende {
  border-left-color: var(--color-success, #28a745);
}

.status-geral-nao-atende {
  border-left-color: var(--color-danger, #dc3545);
}

.percentual-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.percentual-valor {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary, #333);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.percentual-valor i {
  color: var(--text-accent, #2563eb);
}

.percentual-status {
  font-weight: 700;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.9rem;
}

.status-geral-atende {
  background-color: var(--color-success-bg, #e6f7ed);
  color: var(--color-success-text, #1d4731);
}

.status-geral-nao-atende {
  background-color: var(--color-danger-bg, #fdedef);
  color: var(--color-danger-text, #581b23);
}

.detalhes-analise {
  display: flex;
  gap: 1.5rem;
  font-size: 0.9rem;
  color: var(--text-muted, #64748b);
}

/* Estilo quando a análise está incompleta */
.analise-incompleta {
  padding: 1.25rem;
  background-color: var(--bg-warning, #fff8e1);
  border-left: 5px solid var(--color-warning, #fd7e14);
}

.alerta-analise {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.alerta-analise i {
  font-size: 1.5rem;
  color: var(--color-warning, #fd7e14);
}

.alerta-analise h4 {
  font-size: 1.1rem;
  margin: 0;
  color: var(--text-warning, #33291a);
}

.analise-incompleta p {
  margin: 0.5rem 0 1rem;
  color: var(--text-warning-secondary, #5f4d33);
}

.progresso-analise {
  margin: 1rem 0;
}

.barra-progresso {
  height: 8px;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progresso {
  height: 100%;
  background-color: var(--color-warning, #fd7e14);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progresso-analise span {
  font-size: 0.9rem;
  color: var(--text-warning-secondary, #5f4d33);
}

.pendentes-lista {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 6px;
}

.pendentes-titulo {
  margin: 0 0 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-warning, #33291a);
}

.pendentes-lista ul {
  margin: 0;
  padding-left: 1.5rem;
  font-size: 0.85rem;
  color: var(--text-warning-secondary, #5f4d33);
}

.pendentes-lista li {
  margin-bottom: 0.25rem;
}

/* Responsividade */
@media (max-width: 768px) {
  .percentual-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .detalhes-analise {
    flex-direction: column;
    gap: 0.25rem;
  }
}

/* Suporte a tema escuro */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) .analise-incompleta {
    background-color: var(--bg-warning-dark, #422006);
  }
  
  :root:not([data-theme='light']) .pendentes-lista {
    background-color: rgba(0, 0, 0, 0.2);
  }
  
  :root:not([data-theme='light']) .alerta-analise h4,
  :root:not([data-theme='light']) .analise-incompleta p,
  :root:not([data-theme='light']) .progresso-analise span,
  :root:not([data-theme='light']) .pendentes-titulo,
  :root:not([data-theme='light']) .pendentes-lista ul {
    color: var(--text-warning-dark, #fdba74);
  }
}
</style>