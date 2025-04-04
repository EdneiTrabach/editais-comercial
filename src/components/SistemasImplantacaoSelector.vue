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
      
      <div class="sistemas-list">
        <div 
          v-for="sistema in sistemasDisponiveisFiltrados" 
          :key="sistema.id"
          class="sistema-item"
          :class="{ 'selected': isSistemaSelected(sistema.id) }"
          @click="toggleSistema(sistema.id)"
        >
          <div class="sistema-checkbox">
            <input 
              type="checkbox" 
              :checked="isSistemaSelected(sistema.id)" 
              @click.stop
              @change="toggleSistema(sistema.id)"
            />
          </div>
          <div class="sistema-info">
            <div class="sistema-nome">{{ sistema.nome }}</div>
            <div class="sistema-desc" v-if="sistema.descricao">{{ sistema.descricao }}</div>
          </div>
        </div>
      </div>
      
      <div class="sistemas-summary">
        <span class="sistemas-count">{{ selectedCount }} sistema(s) selecionado(s)</span>
        <button 
          class="btn btn-primary save-sistemas" 
          @click="salvarSistemas"
        >
          Salvar
        </button>
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
        this.processarSistemasAtivos();
      },
      immediate: true
    },
    
    value: {
      handler(newVal) {
        this.inicializarValor();
      },
      immediate: true
    }
  },
  
  methods: {
    processarSistemasAtivos() {
      try {
        if (!this.sistemasAtivos) {
          this.sistemasAtivosIds = [];
          return;
        }
        
        // Se já for array de ids
        if (Array.isArray(this.sistemasAtivos)) {
          this.sistemasAtivosIds = [...this.sistemasAtivos];
          return;
        }
        
        // Se for string, tentar converter para JSON
        if (typeof this.sistemasAtivos === 'string') {
          try {
            const parsed = JSON.parse(this.sistemasAtivos);
            if (Array.isArray(parsed)) {
              this.sistemasAtivosIds = [...parsed];
            } else {
              this.sistemasAtivosIds = [];
            }
          } catch (e) {
            console.error('Erro ao parsear sistemasAtivos:', e);
            this.sistemasAtivosIds = [];
          }
          return;
        }
        
        // Caso não seja array nem string válida
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
        // Se for uma string JSON, tentar converter
        if (typeof this.value === 'string') {
          try {
            const parsed = JSON.parse(this.value);
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
      } catch (e) {
        console.error('Erro ao processar valor dos sistemas:', e);
        this.sistemasIdsValue = [];
      }
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
    
    selecionarTodos() {
      this.sistemasIdsValue = this.sistemasDisponiveisFiltrados.map(s => s.id);
    },
    
    limparSelecao() {
      this.sistemasIdsValue = [];
    },
    
    async carregarSistemas() {
      try {
        this.loading = true;
        
        const { data, error } = await supabase
          .from('sistemas')
          .select('id, nome, descricao, ativo')
          .eq('ativo', true)
          .order('nome');
          
        if (error) throw error;
        
        this.sistemas = data || [];
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
  gap: 0.75rem;
  padding: 1rem;
  background-color: #fff;
  border-radius: 4px;
  min-width: 400px;
  max-width: 600px;
}

.selector-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #333;
}

.sistemas-implantacao-description {
  margin-bottom: 1rem;
}

.sistemas-implantacao-description p {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  color: #666;
}

.aviso-sem-sistemas {
  color: #e74c3c;
  font-style: italic;
  margin-top: 1rem;
}

.sistema-search-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.sistema-search {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.sistemas-list {
  border: 1px solid #ddd;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
}

.sistema-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background-color 0.2s;
}

.sistema-item:hover {
  background-color: #f9f9f9;
}

.sistema-item.selected {
  background-color: #f0f7ff;
}

.sistema-checkbox {
  margin-top: 0.25rem;
}

.sistema-info {
  flex: 1;
}

.sistema-nome {
  font-weight: 500;
  color: #333;
}

.sistema-desc {
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.25rem;
}

.sistemas-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.75rem;
}

.sistemas-count {
  font-size: 0.9rem;
  color: #666;
}

.save-sistemas {
  padding: 0.5rem 1rem;
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.save-sistemas:hover {
  background-color: #1d4ed8;
}

.save-sistemas:disabled {
  background-color: #93c5fd;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #2563eb;
  color: white;
}

.btn-primary:hover {
  background-color: #1d4ed8;
}
</style>