<template>
  <div class="sistemas-implantacao-selector">    
    <h3 class="selector-title">Sistemas a Implantar</h3>
    
    <div class="sistemas-implantacao-description">
      <p>Selecione os sistemas que serão implantados neste processo.</p>
      <p v-if="sistemasDisponiveis.length === 0" class="aviso-sem-sistemas">
        Nenhum sistema disponível para implantação.
        <br>
        <small>É necessário primeiro selecionar os sistemas envolvidos no processo.</small>
      </p>
    </div>
    
    <div v-if="sistemasDisponiveis.length > 0" class="sistemas-implantacao-container">
      <div class="sistema-search-container">
        <input 
          type="text" 
          v-model="search" 
          placeholder="Buscar sistemas" 
          class="sistema-search"
        />
      </div>
      
      <!-- Sistemas selecionados -->
      <div class="sistemas-selected">
        <div 
          v-for="sistemaId in sistemasIdsValue" 
          :key="sistemaId" 
          class="sistema-chip"
        >
          {{ getSistemaNome(sistemaId) }}
          <span @click="toggleSistema(sistemaId)" class="sistema-remove">×</span>
        </div>
      </div>
      
      <!-- Lista de sistemas disponíveis -->
      <select 
        multiple 
        class="sistemas-select" 
        @change="handleMultiSelect($event)"
      >
        <option 
          v-for="sistema in sistemasDisponiveisFiltrados" 
          :key="sistema.id" 
          :value="sistema.id"
          :selected="sistemasIdsValue.includes(sistema.id)"
        >
          {{ sistema.nome }}
        </option>
      </select>
      
      <div class="sistemas-summary">
        <span class="sistemas-count">{{ selectedCount }} sistema(s) selecionado(s)</span>
        <div class="sistemas-actions">
          <button 
            v-if="sistemasDisponiveisFiltrados.length > 0 && sistemasDisponiveisFiltrados.length !== selectedCount"
            class="btn-secondary select-all" 
            @click="selecionarTodos"
          >
            Selecionar Todos
          </button>
          <button 
            v-if="selectedCount > 0" 
            class="btn-secondary clear" 
            @click="limparSelecao"
          >
            Limpar
          </button>
          <button 
            class="btn-primary save-sistemas" 
            @click="salvarSistemas"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { supabase } from '@/lib/supabase';

export default {
  name: 'SistemasImplantacaoSelector',
  props: {
    processoId: {
      type: [String, Number],
      required: true
    },
    sistemasAtivos: {
      type: Array,
      default: () => []
    },
    value: {
      type: [Object, Array, String],
      default: null
    }
  },
  
  emits: ['save', 'cancel'],
  
  data() {
    return {
      sistemas: [],
      sistemasIdsValue: [],
      search: '',
      loading: false,
      sistemasAtivosIds: []
    };
  },
  
  computed: {
    sistemasDisponiveis() {
      // Se não houver sistemas ativos, não há nada disponível
      if (!this.sistemasAtivosIds || this.sistemasAtivosIds.length === 0) {
        console.log('Nenhum sistema ativo para o processo');
        return [];
      }
      
      // Filtrar os sistemas disponíveis baseado nos IDs de sistemas ativos
      const filtrados = this.sistemas.filter(sistema => 
        this.sistemasAtivosIds.includes(sistema.id)
      );
      
      console.log('Sistemas disponíveis:', filtrados.length);
      return filtrados;
    },
    
    sistemasDisponiveisFiltrados() {
      if (!this.search.trim()) return this.sistemasDisponiveis;
      
      const searchLower = this.search.toLowerCase().trim();
      return this.sistemasDisponiveis.filter(sistema =>
        sistema.nome.toLowerCase().includes(searchLower) ||
        (sistema.descricao && sistema.descricao.toLowerCase().includes(searchLower))
      );
    },
    
    selectedCount() {
      return this.sistemasIdsValue ? this.sistemasIdsValue.length : 0;
    }
  },
  
  watch: {
    sistemasAtivos: {
      handler(newVal) {
        console.log('sistemasAtivos alterado:', newVal);
        this.processarSistemasAtivos();
      },
      immediate: true,
      deep: true
    },
    
    value: {
      handler(newVal) {
        console.log('value alterado:', newVal);
        this.inicializarValor();
      },
      immediate: true,
      deep: true
    }
  },
  
  methods: {
    processarSistemasAtivos() {
      try {
        console.log('Processando sistemasAtivos:', this.sistemasAtivos);
        
        if (!this.sistemasAtivos) {
          console.log('sistemasAtivos é nulo ou indefinido');
          this.sistemasAtivosIds = [];
          return;
        }
        
        // Se já for array de ids
        if (Array.isArray(this.sistemasAtivos)) {
          console.log('sistemasAtivos é um array', this.sistemasAtivos);
          this.sistemasAtivosIds = [...this.sistemasAtivos];
          return;
        }
        
        // Se for string, tentar converter para JSON
        if (typeof this.sistemasAtivos === 'string') {
          console.log('sistemasAtivos é uma string:', this.sistemasAtivos);
          
          // Verificar se a string parece ser um formato PostgreSQL específico como "{id1,id2,id3}"
          if (this.sistemasAtivos.startsWith('{') && this.sistemasAtivos.endsWith('}')) {
            try {
              // Remover as chaves e dividir por vírgulas
              const idsString = this.sistemasAtivos.substring(1, this.sistemasAtivos.length - 1);
              // Tratar caso especial para string JSON dentro de string PostgreSQL
              if (idsString.includes('"')) {
                // É provavelmente uma representação de array PostgreSQL com UUIDs entre aspas
                const matches = idsString.match(/"[^"]+"/g) || [];
                this.sistemasAtivosIds = matches.map(id => id.replace(/"/g, ''));
              } else {
                // Array simples sem aspas
                this.sistemasAtivosIds = idsString.split(',').filter(id => id.trim());
              }
              console.log('IDs extraídos do formato PostgreSQL:', this.sistemasAtivosIds);
              return;
            } catch (e) {
              console.error('Erro ao processar formato PostgreSQL:', e);
            }
          }
          
          // Tentar como JSON padrão
          try {
            const parsed = JSON.parse(this.sistemasAtivos);
            console.log('sistemasAtivos parseado como JSON:', parsed);
            
            if (Array.isArray(parsed)) {
              this.sistemasAtivosIds = [...parsed];
            } else {
              this.sistemasAtivosIds = [];
            }
          } catch (e) {
            console.error('Erro ao parsear sistemasAtivos como JSON:', e);
            this.sistemasAtivosIds = [];
          }
          return;
        }
        
        // Caso não seja array nem string válida
        console.log('sistemasAtivos não é nem array nem string válida');
        this.sistemasAtivosIds = [];
      } catch (e) {
        console.error('Erro ao processar sistemasAtivos:', e);
        this.sistemasAtivosIds = [];
      }
    },
    
    inicializarValor() {
      if (!this.value) {
        this.sistemasIdsValue = [];
        return;
      }
      
      try {
        console.log('Inicializando valor:', this.value);
        
        // Se for uma string JSON, tentar converter
        if (typeof this.value === 'string') {
          try {
            const parsed = JSON.parse(this.value);
            console.log('Valor parseado:', parsed);
            
            if (parsed && parsed.sistemas_ids) {
              this.sistemasIdsValue = [...parsed.sistemas_ids];
            } else if (Array.isArray(parsed)) {
              this.sistemasIdsValue = [...parsed];
            } else {
              this.sistemasIdsValue = [];
            }
          } catch (e) {
            console.log('Erro ao parsear value:', e);
            this.sistemasIdsValue = [];
          }
        } 
        // Se já for um objeto
        else if (typeof this.value === 'object') {
          if (Array.isArray(this.value)) {
            this.sistemasIdsValue = [...this.value];
          } else if (this.value && this.value.sistemas_ids) {
            this.sistemasIdsValue = [...this.value.sistemas_ids];
          } else {
            this.sistemasIdsValue = [];
          }
        } else {
          this.sistemasIdsValue = [];
        }
        
        console.log('sistemasIdsValue inicializado:', this.sistemasIdsValue);
      } catch (e) {
        console.error('Erro ao processar valor dos sistemas:', e);
        this.sistemasIdsValue = [];
      }
    },
    
    getSistemaNome(id) {
      const sistema = this.sistemas.find(s => s.id === id);
      return sistema ? sistema.nome : 'Sistema desconhecido';
    },
    
    isSistemaSelected(id) {
      return this.sistemasIdsValue && this.sistemasIdsValue.includes(id);
    },
    
    toggleSistema(id) {
      if (!this.sistemasIdsValue) {
        this.sistemasIdsValue = [id];
        return;
      }
      
      if (this.isSistemaSelected(id)) {
        this.sistemasIdsValue = this.sistemasIdsValue.filter(i => i !== id);
      } else {
        this.sistemasIdsValue = [...this.sistemasIdsValue, id];
      }
    },
    
    handleMultiSelect(event) {
      const selectedOptions = Array.from(event.target.selectedOptions);
      const selectedIds = selectedOptions.map(option => option.value);
      
      // Para cada ID selecionado, adicioná-lo se ainda não estiver na lista
      selectedIds.forEach(id => {
        if (!this.sistemasIdsValue.includes(id)) {
          this.sistemasIdsValue.push(id);
        }
      });
      
      // Para cada ID na lista atual, removê-lo se não estiver na seleção
      this.sistemasIdsValue = this.sistemasIdsValue.filter(id => 
        selectedIds.includes(id) || !this.sistemasDisponiveis.some(s => s.id === id)
      );
    },
    
    selecionarTodos() {
      this.sistemasIdsValue = this.sistemasDisponiveisFiltrados.map(s => s.id);
    },
    
    limparSelecao() {
      this.sistemasIdsValue = [];
    },
    
    async carregarSistemas() {
      try {
        this.loading = true;
        console.log('Carregando sistemas do banco...');
        
        // Removendo o filtro por ativo que estava causando o erro
        const { data, error } = await supabase
          .from('sistemas')
          .select('id, nome, descricao')
          .order('nome');
          
        if (error) throw error;
        
        this.sistemas = data || [];
        console.log(`${this.sistemas.length} sistemas carregados do banco`);
      } catch (e) {
        console.error('Erro ao carregar sistemas:', e);
      } finally {
        this.loading = false;
      }
    },
    
    salvarSistemas() {
      try {
        // Criar objeto de dados para salvar
        const dadosSistemas = {
          sistemas_ids: this.sistemasIdsValue,
          ultima_atualizacao: new Date().toISOString()
        };
        
        console.log('Salvando sistemas:', dadosSistemas);
        
        // Emitir evento de conclusão
        this.$emit('save', dadosSistemas);
      } catch (e) {
        console.error('Erro ao preparar dados para salvar:', e);
      }
    },

    fecharDialogo() {
      this.$emit('cancel');
    }
  },
  
  async mounted() {
    console.log('Componente SistemasImplantacaoSelector montado');
    
    // Carregar sistemas do banco
    await this.carregarSistemas();
    
    // Processar sistemas ativos
    this.processarSistemasAtivos();
    
    // Inicializar valor
    this.inicializarValor();
  }
};
</script>

<style scoped>
.sistemas-implantacao-selector {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background-color: #fff;
  border-radius: 8px;
  width: 100%;
  max-width: 100%;
}

.selector-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #333;
  display: none; /* Esconder o título duplicado, pois já está no header do modal */
}

.sistemas-implantacao-description {
  margin-bottom: 1.5rem;
}

.sistemas-implantacao-description p {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #666;
}

.aviso-sem-sistemas {
  color: #e74c3c;
  font-style: italic;
  margin-top: 1rem;
  padding: 1rem;
  background-color: #fef2f2;
  border-radius: 6px;
  border-left: 4px solid #e74c3c;
}

/* Estilos para o container principal */
.sistemas-implantacao-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

/* Barra de pesquisa */
.sistema-search-container {
  margin-bottom: 0.5rem;
}

.sistema-search {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.sistema-search:focus {
  border-color: #193155;
  outline: none;
  box-shadow: 0 0 0 2px rgba(25, 49, 85, 0.1);
}

/* Área de chips de sistemas selecionados */
.sistemas-selected {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid #e6e6e6;
  border-radius: 6px;
  min-height: 3.5rem;
  max-height: 120px;
  overflow-y: auto;
  background-color: #f8f9fa;
}

.sistema-chip {
  display: flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  background-color: #193155;
  color: white;
  border-radius: 16px;
  font-size: 0.875rem;
  white-space: nowrap;
}

.sistema-remove {
  margin-left: 0.5rem;
  cursor: pointer;
  font-size: 1.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  line-height: 1;
}

.sistema-remove:hover {
  opacity: 0.8;
}

/* Select múltiplo de sistemas */
.sistemas-select {
  width: 100%;
  min-height: 200px;
  max-height: 300px;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.sistemas-select option {
  padding: 0.5rem;
  cursor: pointer;
}

.sistemas-select option:hover {
  background-color: #f0f7ff;
}

.sistemas-select option:checked {
  background-color: #193155;
  color: white;
}

/* Resumo e ações */
.sistemas-summary {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.sistemas-count {
  font-size: 0.95rem;
  color: #666;
  font-weight: 500;
}

.sistemas-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

/* Botões */
.btn-primary, .btn-secondary {
  padding: 0.6rem 1.25rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background-color: #193155;
  color: white;
}

.btn-primary:hover {
  background-color: #254677;
  transform: translateY(-2px);
}

.btn-secondary {
  background-color: #e2e8f0;
  color: #4a5568;
}

.btn-secondary:hover {
  background-color: #cbd5e0;
}

.save-sistemas {
  min-width: 120px;
}

/* Estilos responsivos */
@media (min-width: 768px) {
  .sistemas-summary {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background-color: #193155;
  color: white;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.75rem;
  color: white;
  cursor: pointer;
  line-height: 1;
}

/* Estilo para quando não há sistemas disponíveis */
.sem-sistemas {
  color: #718096;
  font-style: italic;
  text-align: center;
  padding: 2rem;
}
</style>