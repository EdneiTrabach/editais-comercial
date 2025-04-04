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

<style>
@import '@/assets/styles/components/sistemas-implantacao.css';
</style>