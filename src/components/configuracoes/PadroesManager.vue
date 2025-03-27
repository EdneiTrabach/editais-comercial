<template>
  <div class="patterns-section">
    <h2>Gerenciamento de Padrões</h2>
    
    <div class="form-group">
      <label for="tipo-campo">Tipo de Campo</label>
      <select id="tipo-campo" v-model="padrao.tipo_campo" class="full-width">
        <option value="">Selecione um tipo...</option>
        <option value="numero_processo">Número de Processo</option>
        <option value="orgao">Órgão</option>
        <option value="municipio">Município</option>
        <option value="estado">Estado/UF</option>
        <option value="numero_contrato">Número de Contrato</option>
      </select>
    </div>
    
    <div class="form-group" v-if="padrao.tipo_campo">
      <label for="valor-padrao">Valor do Padrão</label>
      <input 
        type="text" 
        id="valor-padrao" 
        v-model="padrao.valor" 
        class="full-width"
        placeholder="Digite o valor do padrão..."
      >
    </div>
    
    <div class="form-group" v-if="padrao.tipo_campo === 'numero_processo'">
      <label for="regex-pattern">Padrão Regex (opcional)</label>
      <input 
        type="text" 
        id="regex-pattern" 
        v-model="padrao.regex_pattern" 
        class="full-width"
        placeholder="Ex: \\d{5}\\.\\d{6}\\/\\d{4}-\\d{2}"
      >
      <p class="form-help">
        Expressão regular para identificar este padrão no texto. Útil para formatos específicos.
      </p>
    </div>
    
    <div class="actions">
      <button 
        @click="adicionarPadrao" 
        class="btn-primary" 
        :disabled="!padrao.tipo_campo || !padrao.valor || adicionandoPadrao"
      >
        <span v-if="adicionandoPadrao" class="spinner"></span>
        {{ adicionandoPadrao ? 'Adicionando...' : 'Adicionar Padrão' }}
      </button>
    </div>
    
    <div v-if="padroesSelecionados.length > 0" class="padroes-list">
      <h3>{{ formatarNomeCampo(padrao.tipo_campo) }} - Padrões Existentes</h3>
      
      <div class="padroes-header">
        <div>Valor</div>
        <div>Frequência</div>
        <div>Ações</div>
      </div>
      
      <div 
        v-for="padrao in padroesSelecionados" 
        :key="padrao.id" 
        class="padrao-item"
      >
        <div class="padrao-valor">{{ padrao.valor }}</div>
        <div class="padrao-freq">{{ padrao.frequencia }}</div>
        <div class="padrao-actions">
          <button 
            @click="removerPadrao(padrao.id)" 
            class="btn-icon-only danger"
            :disabled="removendoPadrao === padrao.id"
          >
            <span v-if="removendoPadrao === padrao.id" class="spinner"></span>
            <img v-else src="/icons/lixeira.svg" alt="Remover" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue';

export default {
  name: 'PadroesManager',
  
  props: {
    padroes: {
      type: Object,
      default: () => ({})
    },
    adicionandoPadrao: {
      type: Boolean,
      default: false
    },
    removendoPadrao: {
      type: [Number, String, null],
      default: null
    }
  },
  
  emits: ['adicionar-padrao', 'remover-padrao'],
  
  setup(props, { emit }) {
    const padrao = ref({
      tipo_campo: '',
      valor: '',
      regex_pattern: ''
    });
    
    const padroesSelecionados = computed(() => {
      if (!padrao.value.tipo_campo) return [];
      return props.padroes[padrao.value.tipo_campo] || [];
    });
    
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
    
    const adicionarPadrao = () => {
      emit('adicionar-padrao', { ...padrao.value });
      // Reset do valor e regex após adicionar
      padrao.value.valor = '';
      padrao.value.regex_pattern = '';
    };
    
    const removerPadrao = (id) => {
      emit('remover-padrao', id);
    };
    
    return {
      padrao,
      padroesSelecionados,
      formatarNomeCampo,
      adicionarPadrao,
      removerPadrao
    };
  }
}
</script>

<style scoped>
.patterns-section {
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

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-help {
  color: #666;
  font-size: 0.9rem;
  margin-top: 5px;
}

.full-width {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  background-color: #2196f3;
  color: white;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: #1976d2;
}

.btn-primary:disabled {
  background-color: #b3e0ff;
  cursor: not-allowed;
}

.padroes-list {
  margin-top: 30px;
  background-color: #f9f9f9;
  border-radius: 6px;
  overflow: hidden;
}

.padroes-list h3 {
  margin: 0;
  padding: 15px;
  background-color: #f0f0f0;
  color: #333;
  font-size: 1.1rem;
}

.padroes-header {
  display: grid;
  grid-template-columns: 1fr 120px 80px;
  background-color: #f0f0f0;
  padding: 12px 15px;
  font-weight: 500;
  color: #333;
  border-top: 1px solid #ddd;
}

.padrao-item {
  display: grid;
  grid-template-columns: 1fr 120px 80px;
  padding: 12px 15px;
  border-bottom: 1px solid #eee;
  align-items: center;
}

.padrao-item:last-child {
  border-bottom: none;
}

.padrao-valor {
  font-weight: 500;
  word-break: break-word;
}

.padrao-freq {
  text-align: center;
  color: #555;
}

.padrao-actions {
  display: flex;
  justify-content: center;
}

.padrao-actions .btn-icon-only {
  border: none;
  background-color: transparent;
  color: #f44336;
  width: 30px;
  height: 30px;
}

.btn-icon-only {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
}

.btn-icon-only.danger:hover {
  background-color: #ffebee;
}

.spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  margin-right: 8px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

.padrao-actions .spinner {
  margin-right: 0;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-top-color: #333;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .padroes-header, .padrao-item {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .padroes-header > div:not(:first-child) {
    display: none;
  }
}
</style>
