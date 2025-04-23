<template>
  <div class="resultados-analise">
    <h2>Resultados da Análise</h2>
    
    <div class="resultados-container">
      <div class="resultado-item">
        <h3>Processo</h3>
        <div class="resultado-conteudo">
          <p v-if="processoAtual">
            <strong>Número:</strong> {{ processoAtual.numero_processo }}<br>
            <strong>Descrição:</strong> {{ processoAtual.descricao || 'Não informada' }}
          </p>
          <p v-else class="info-atencao">
            Selecione um processo para aplicar os resultados da análise
          </p>
        </div>
      </div>
      
      <div class="resultado-item">
        <h3>Empresa Contratada</h3>
        <div class="resultado-conteudo">
          <div v-if="resultado && resultado.empresa" class="empresa-info">
            <div class="empresa-nome">
              {{ resultado.empresa.nome || 'Nome não identificado' }}
            </div>
            <div class="empresa-detalhes">
              <div v-if="resultado.empresa.cnpj">
                <strong>CNPJ:</strong> {{ formatarCNPJ(resultado.empresa.cnpj) }}
              </div>
              <div v-if="empresaEncontrada">
                <strong>Já cadastrada no sistema</strong>
              </div>
              <div v-else class="empresa-nova">
                <span class="badge badge-nova">Nova</span> 
                Esta empresa será criada automaticamente ao aplicar os resultados
              </div>
            </div>
          </div>
          <p v-else class="info-negativa">
            Nenhuma empresa identificada no contrato.
          </p>
        </div>
      </div>
      
      <div class="resultado-item">
        <h3>Sistemas Mencionados</h3>
        <div class="resultado-conteudo">
          <div v-if="sistemasMencionados && sistemasMencionados.length > 0" class="sistemas-lista">
            <div v-for="sistema in sistemasMencionados" :key="sistema.id" class="sistema-item">
              <div class="sistema-nome">{{ sistema.nome }}</div>
            </div>
          </div>
          <p v-else class="info-negativa">
            Nenhum sistema identificado no contrato.
          </p>
        </div>
      </div>
      
      <div class="resultado-item">
        <h3>Valor do Contrato</h3>
        <div class="resultado-conteudo">
          <p v-if="resultado && resultado.valor_contrato">
            <strong>{{ formatarMoeda(resultado.valor_contrato) }}</strong>
          </p>
          <p v-else class="info-negativa">
            Valor não identificado no contrato.
          </p>
        </div>
      </div>
      
      <div class="resultado-acoes">
        <button 
          class="btn-aplicar"
          @click="$emit('aplicar')"
          :disabled="!podeAplicar || aplicando"
        >
          <span v-if="aplicando">Aplicando...</span>
          <span v-else>Aplicar Resultados ao Processo</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { formatarData } from '../functions/formatadores';

export default {
  name: 'ResultadosAnalise',
  
  props: {
    resultado: {
      type: Object,
      default: null
    },
    processoAtual: {
      type: Object,
      default: null
    },
    empresaEncontrada: {
      type: Object,
      default: null
    },
    sistemasMencionados: {
      type: Array,
      default: () => []
    },
    podeAplicar: {
      type: Boolean,
      default: false
    },
    aplicando: {
      type: Boolean,
      default: false
    }
  },
  
  emits: ['aplicar'],
  
  setup(props) {
    const temInformacoesAdicionais = computed(() => {
      return Boolean(
        props.resultado.numero_processo || 
        props.resultado.orgao || 
        props.resultado.municipio || 
        props.resultado.estado
      );
    });
    
    const formatarCNPJ = (cnpj) => {
      if (!cnpj) return '';
      
      // Remove caracteres não numéricos
      const numeros = cnpj.replace(/\D/g, '');
      
      // Aplica a formatação XX.XXX.XXX/XXXX-XX
      return numeros.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        '$1.$2.$3/$4-$5'
      );
    };
    
    const formatarMoeda = (valor) => {
      if (!valor) return 'R$ 0,00';
      
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(valor);
    };
    
    return {
      formatarData,
      temInformacoesAdicionais,
      formatarCNPJ,
      formatarMoeda
    };
  }
}
</script>

<style scoped>
.resultados-analise {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
}

h2 {
  margin-top: 0;
  color: #193155;
  font-size: 1.4rem;
  margin-bottom: 20px;
}

.resultados-container {
  display: grid;
  gap: 20px;
}

.resultado-item {
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 6px;
}

.resultado-item h3 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #193155;
  font-size: 1.1rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}

.resultado-conteudo {
  color: #333;
}

.info-atencao {
  color: #ff9800;
  font-style: italic;
}

.info-negativa {
  color: #aaa;
  font-style: italic;
}

.empresa-info {
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.empresa-nome {
  font-size: 1.1rem;
  font-weight: 500;
  margin-bottom: 5px;
}

.empresa-detalhes {
  font-size: 0.9rem;
  color: #666;
}

.empresa-nova {
  margin-top: 8px;
  font-size: 0.9rem;
  color: #4caf50;
}

.badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  margin-right: 5px;
}

.badge-nova {
  background-color: #e8f5e9;
  color: #4caf50;
}

.sistemas-lista {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.sistema-item {
  background-color: #e3f2fd;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  color: #2196f3;
}

.resultado-acoes {
  margin-top: 30px;
  display: flex;
  justify-content: flex-end;
}

.btn-aplicar {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.btn-aplicar:hover:not(:disabled) {
  background-color: #45a049;
}

.btn-aplicar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>