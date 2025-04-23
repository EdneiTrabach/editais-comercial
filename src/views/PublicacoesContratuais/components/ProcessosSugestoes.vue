<template>
  <div>
    <div v-if="sugestoes.length > 0" class="processo-sugestoes">
      <h3>Processos Identificados</h3>
      <p class="sugestao-info">Selecione o processo correto correspondente à publicação:</p>
      
      <div class="sugestoes-list">
        <div 
          v-for="processo in sugestoes" 
          :key="processo.id" 
          class="sugestao-item"
          :class="{ 'selected': processoSelecionado === processo.id }"
          @click="$emit('selecionar', processo.id)"
        >
          <div class="sugestao-header">
            <strong>{{ processo.numero_processo }}</strong>
            <span class="badge" :class="'nivel-' + getNivelClasse(processo.pontuacao)">
              {{ formatarNivel(processo.pontuacao) }}
            </span>
          </div>
          <div class="sugestao-details">
            <div><strong>Órgão:</strong> {{ processo.orgao }}</div>
            <div><strong>Município:</strong> {{ processo.municipio || 'Não informado' }}</div>
            <div><strong>Data:</strong> {{ formatarData(processo.data_pregao) }}</div>
            <div><strong>Modalidade:</strong> {{ formatarModalidade(processo.modalidade) }}</div>
          </div>
        </div>
      </div>
      
      <div v-if="totalSugestoes > 3" class="ver-mais">
        <button @click="$emit('toggle-mostrar')" class="btn-text">
          {{ mostrarTodas ? 'Mostrar menos' : `Ver mais ${totalSugestoes - 3} sugestões` }}
        </button>
      </div>
    </div>
    
    <div v-else-if="buscaRealizada" class="sem-resultados">
      <p>Nenhum processo correspondente foi encontrado automaticamente.</p>
      <p>Você pode selecionar um processo manualmente:</p>
      
      <div class="form-group mt-3">
        <label for="processo-select">Selecione o Processo Manualmente:</label>
        <select 
          id="processo-select" 
          :value="processoSelecionado" 
          @change="$emit('update-selecao', $event.target.value)"
          class="full-width"
        >
          <option value="">Selecione um processo...</option>
          <option v-for="processo in processosFiltrados" :key="processo.id" :value="processo.id">
            {{ processo.numero_processo }} - {{ processo.orgao }} ({{ formatarData(processo.data_pregao) }})
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<script>
import { formatarData, formatarModalidade, formatarNivel, getNivelClasse } from '../functions/formatadores';

export default {
  name: 'ProcessosSugestoes',
  
  props: {
    sugestoes: {
      type: Array,
      default: () => []
    },
    totalSugestoes: {
      type: Number,
      default: 0
    },
    mostrarTodas: {
      type: Boolean,
      default: false
    },
    buscaRealizada: {
      type: Boolean,
      default: false
    },
    processoSelecionado: {
      type: String,
      default: ''
    },
    processosFiltrados: {
      type: Array,
      default: () => []
    }
  },
  
  emits: ['selecionar', 'toggle-mostrar', 'update-selecao'],
  
  setup() {
    return {
      formatarData,
      formatarModalidade,
      formatarNivel,
      getNivelClasse
    }
  }
}
</script>

<style scoped>
.processo-sugestoes {
  margin-top: 20px;
  border-top: 1px solid #eee;
  padding-top: 20px;
}

.sugestao-info {
  color: #666;
  margin-bottom: 15px;
}

.sugestoes-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
}

.sugestao-item {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.2s;
}

.sugestao-item:hover {
  border-color: #2196f3;
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.1);
}

.sugestao-item.selected {
  border-color: #4caf50;
  background-color: rgba(76, 175, 80, 0.05);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.1);
}

.sugestao-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.badge {
  font-size: 0.8rem;
  padding: 3px 8px;
  border-radius: 12px;
  background-color: #e0e0e0;
  color: #555;
}

.badge.nivel-alto {
  background-color: #4caf50;
  color: white;
}

.badge.nivel-medio {
  background-color: #ff9800;
  color: white;
}

.badge.nivel-baixo {
  background-color: #9e9e9e;
  color: white;
}

.sugestao-details {
  font-size: 0.9rem;
  color: #555;
}

.sugestao-details div {
  margin-bottom: 5px;
}

.ver-mais {
  text-align: center;
  margin-top: 15px;
}

.btn-text {
  background-color: transparent;
  color: #2196f3;
  padding: 5px 10px;
  text-decoration: underline;
  border: none;
  cursor: pointer;
}

.btn-text:hover {
  color: #1976d2;
  background-color: #f5f5f5;
}

.sem-resultados {
  margin-top: 20px;
  padding: 15px;
  background-color: #fff3e0;
  border-radius: 6px;
  border-left: 4px solid #ff9800;
}

.form-group {
  margin-bottom: 20px;
}

.mt-3 {
  margin-top: 15px;
}

.full-width {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}
</style>