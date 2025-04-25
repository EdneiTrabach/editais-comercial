<template>
  <div class="modal-overlay" @click.self="$emit('fechar')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Detalhes do Processo</h3>
        <button class="btn-close" @click="$emit('fechar')">&times;</button>
      </div>
      <div class="modal-body">
        <div v-if="processo">
          <h4>{{ processo.numero_processo }}</h4>
          <div class="detalhes-grid">
            <div class="detalhe-item">
              <strong>Órgão:</strong> {{ processo.orgao }}
            </div>
            <div class="detalhe-item">
              <strong>Data Pregão:</strong> {{ formatarData(processo.data_pregao) }}
            </div>
            <div class="detalhe-item">
              <strong>Valor Estimado:</strong> {{ formatarMoeda(processo.valor_estimado) }}
            </div>
            <div class="detalhe-item">
              <strong>Status:</strong> {{ formatarStatus(processo.status) }}
            </div>
            <div class="detalhe-item full-width">
              <strong>Objeto:</strong> {{ processo.objeto_resumido }}
            </div>
            <div class="detalhe-item full-width">
              <strong>Sistemas:</strong> {{ getSistemasNomes(processo.sistemas_ativos) }}
            </div>
          </div>
          
          <div class="secao">
            <h5>Informações Adicionais</h5>
            <div class="info-adicional">
              <div class="info-item">
                <strong>Edital:</strong> {{ processo.edital || 'Não informado' }}
              </div>
              <div class="info-item">
                <strong>Local Pregão:</strong> {{ processo.local_pregao || 'Não informado' }}
              </div>
              <div class="info-item">
                <strong>Objeto Completo:</strong> {{ processo.objeto_completo || 'Não informado' }}
              </div>
            </div>
          </div>
          
          <div class="secao">
            <h5>Observações</h5>
            <p v-if="processo.campo_adicional1">{{ processo.campo_adicional1 }}</p>
            <p v-else>Nenhuma observação registrada.</p>
          </div>
          
          <div class="acoes">
            <button class="btn btn-primary" @click="irParaRelatorio">
              <i class="fas fa-file-alt"></i> Acessar Relatório
            </button>
          </div>
        </div>
        <div v-else class="sem-dados">
          Nenhum dado disponível para este processo.
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RelatoriosDetalhesModal',
  
  props: {
    processo: {
      type: Object,
      required: true
    },
    sistemas: {
      type: Array,
      default: () => []
    }
  },
  
  emits: ['fechar'],
  
  setup(props, { emit }) {
    // Formatação de data
    const formatarData = (date) => {
      if (!date) return 'Não informado';
      return new Date(date).toLocaleDateString('pt-BR');
    };
    
    // Formatação de valor monetário
    const formatarMoeda = (valor) => {
      if (valor === null || valor === undefined) return 'Não informado';
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(valor);
    };
    
    // Formatação de status
    const formatarStatus = (status) => {
      if (!status) return 'Não definido';
      
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
    
    // Obter nomes dos sistemas
    const getSistemasNomes = (sistemasIds) => {
      if (!sistemasIds || !Array.isArray(sistemasIds) || sistemasIds.length === 0) 
        return 'Nenhum sistema';
      
      const nomes = sistemasIds.map(id => {
        const sistema = props.sistemas.find(s => s.id === id);
        return sistema ? sistema.nome : 'Sistema Desconhecido';
      });
      
      return nomes.join(', ');
    };
    
    // Navegar para o relatório
    const irParaRelatorio = () => {
      window.location.href = `/processos/${props.processo.id}/relatorio`;
    };
    
    return {
      formatarData,
      formatarMoeda,
      formatarStatus,
      getSistemasNomes,
      irParaRelatorio
    };
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 90%;
  max-width: 800px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.3rem;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  line-height: 1;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
}

h4 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #193155;
  font-size: 1.2rem;
}

.detalhes-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.detalhe-item {
  font-size: 0.95rem;
}

.detalhe-item strong {
  color: #555;
}

.full-width {
  grid-column: 1 / -1;
}

.secao {
  margin-bottom: 20px;
  border-top: 1px solid #eee;
  padding-top: 15px;
}

.secao h5 {
  color: #193155;
  font-size: 1.1rem;
  margin-top: 0;
  margin-bottom: 10px;
}

.info-adicional {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.info-item {
  font-size: 0.95rem;
}

.info-item strong {
  color: #555;
  display: block;
  margin-bottom: 3px;
}

.acoes {
  margin-top: 30px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #193155;
  color: white;
}

.btn-primary:hover {
  background-color: #12233e;
}

.sem-dados {
  text-align: center;
  padding: 30px;
  color: #666;
}
</style>