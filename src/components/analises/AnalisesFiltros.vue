<template>
  <div class="filtros-container">
    <div class="filtros-header">
      <h3>Filtrar Processos</h3>
      <button class="btn-toggle-filtros" @click="toggleFiltros">
        {{ filtrosVisivel ? 'Ocultar Filtros' : 'Exibir Filtros' }}
        <i class="fas" :class="filtrosVisivel ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
      </button>
    </div>
    
    <div class="filtros-content" v-show="filtrosVisivel">
      <div class="filtros-grid">
        <div class="filtro-item">
          <label for="orgao">Órgão</label>
          <input 
            type="text" 
            id="orgao" 
            v-model="filtros.orgao" 
            placeholder="Nome do órgão"
            @input="buscarPorOrgao"
          />
        </div>
        
        <div class="filtro-item">
          <label for="data">Data</label>
          <input 
            type="date" 
            id="data" 
            v-model="filtros.data" 
            @change="buscarPorData"
          />
        </div>
        
        <div class="filtro-item">
          <label for="numero">Número do Processo</label>
          <input 
            type="text" 
            id="numero" 
            v-model="filtros.numeroProcesso" 
            placeholder="Ex: 001/2024"
            @input="buscarPorNumeroProcesso"
          />
        </div>
        
        <div class="filtro-item">
          <label for="codigo-gpi">Código GPI</label>
          <input 
            type="text" 
            id="codigo-gpi" 
            v-model="filtros.codigoGpi" 
            placeholder="Código GPI"
            @input="buscarPorCodigoGpi"
          />
        </div>
        
        <div class="filtro-item">
          <label for="sistema">Sistema</label>
          <select 
            id="sistema" 
            v-model="filtros.sistema" 
            @change="buscarPorSistema"
          >
            <option value="">Todos os sistemas</option>
            <option v-for="sistema in sistemasList" :key="sistema.id" :value="sistema.id">
              {{ sistema.nome }}
            </option>
          </select>
        </div>
        
        <div class="filtro-item filtro-acoes">
          <button class="btn-limpar" @click="limparFiltros">
            <i class="fas fa-eraser"></i> Limpar
          </button>
          <button class="btn-aplicar" @click="aplicarFiltrosCompletos">
            <i class="fas fa-search"></i> Filtrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { supabase } from '@/lib/supabase';

export default {
  name: 'AnalisesFiltros',
  props: {
    sistemasDisponiveis: {
      type: Array,
      default: () => []
    }
  },
  emits: ['filtrar', 'carregando'],
  data() {
    return {
      filtrosVisivel: false,
      filtros: {
        orgao: '',
        data: '',
        numeroProcesso: '',
        codigoGpi: '',
        sistema: ''
      },
      timeout: null
    }
  },
  computed: {
    sistemasList() {
      return this.sistemasDisponiveis;
    }
  },
  methods: {
    toggleFiltros() {
      this.filtrosVisivel = !this.filtrosVisivel;
    },
    
    // Método para buscar por órgão com debounce
    buscarPorOrgao() {
      // Limpar timeout anterior para implementar debounce
      if (this.timeout) clearTimeout(this.timeout);
      
      // Definir novo timeout (aguardar 300ms após o usuário parar de digitar)
      this.timeout = setTimeout(async () => {
        if (this.filtros.orgao.length < 2 && this.filtros.orgao.length > 0) return;
        
        this.$emit('carregando', true);
        
        try {
          // Buscar processos no banco que correspondem ao termo de busca
          const { data, error } = await supabase
            .from('processos')
            .select('id, orgao')
            .ilike('orgao', `%${this.filtros.orgao}%`)
            .limit(50);
            
          if (error) throw error;
          
          // Emitir IDs dos processos encontrados para o componente pai
          this.$emit('filtrar', { 
            ...this.filtros,
            resultadosBusca: data ? data.map(item => item.id) : []
          });
          
        } catch (err) {
          console.error('Erro ao buscar órgãos:', err);
        } finally {
          this.$emit('carregando', false);
        }
      }, 300); // 300ms de debounce
    },
    
    // Método para buscar por data
    buscarPorData() {
      if (this.timeout) clearTimeout(this.timeout);
      
      this.timeout = setTimeout(async () => {
        if (!this.filtros.data) {
          // Se não houver data, limpar o filtro
          this.$emit('filtrar', { 
            ...this.filtros,
            resultadosBusca: null
          });
          return;
        }
        
        this.$emit('carregando', true);
        
        try {
          // Formatar a data para o formato do banco (YYYY-MM-DD)
          const dataFiltro = this.filtros.data;
          
          // Buscar processos no banco com a data selecionada
          const { data, error } = await supabase
            .from('processos')
            .select('id, data_pregao')
            .eq('data_pregao', dataFiltro + 'T00:00:00')
            .limit(50);
            
          if (error) throw error;
          
          // Emitir IDs dos processos encontrados para o componente pai
          this.$emit('filtrar', { 
            ...this.filtros,
            resultadosBusca: data ? data.map(item => item.id) : []
          });
          
        } catch (err) {
          console.error('Erro ao buscar por data:', err);
        } finally {
          this.$emit('carregando', false);
        }
      }, 300);
    },
    
    // Método para buscar por número de processo
    buscarPorNumeroProcesso() {
      if (this.timeout) clearTimeout(this.timeout);
      
      this.timeout = setTimeout(async () => {
        if (this.filtros.numeroProcesso.length < 2 && this.filtros.numeroProcesso.length > 0) return;
        
        this.$emit('carregando', true);
        
        try {
          const { data, error } = await supabase
            .from('processos')
            .select('id, numero_processo')
            .ilike('numero_processo', `%${this.filtros.numeroProcesso}%`)
            .limit(50);
            
          if (error) throw error;
          
          this.$emit('filtrar', { 
            ...this.filtros,
            resultadosBusca: data ? data.map(item => item.id) : []
          });
          
        } catch (err) {
          console.error('Erro ao buscar processos:', err);
        } finally {
          this.$emit('carregando', false);
        }
      }, 300);
    },
    
    // Método para buscar por código GPI (versão corrigida)
    buscarPorCodigoGpi() {
      if (this.timeout) clearTimeout(this.timeout);
      
      this.timeout = setTimeout(async () => {
        if (this.filtros.codigoGpi.length < 2 && this.filtros.codigoGpi.length > 0) return;
        
        this.$emit('carregando', true);
        
        try {
          const { data, error } = await supabase
            .from('processos')
            .select('id, codigo_analise')
            .ilike('codigo_analise', `%${this.filtros.codigoGpi}%`)
            .limit(50);
            
          if (error) throw error;
          
          // Emitir IDs dos processos encontrados para o componente pai
          this.$emit('filtrar', { 
            ...this.filtros,
            resultadosBusca: data ? data.map(item => item.id) : []
          });
          
        } catch (err) {
          console.error('Erro ao buscar códigos GPI:', err);
        } finally {
          this.$emit('carregando', false);
        }
      }, 300);
    },
    
    // Método para buscar por sistema
    buscarPorSistema() {
      if (this.timeout) clearTimeout(this.timeout);
      
      this.timeout = setTimeout(async () => {
        if (!this.filtros.sistema) {
          // Se não houver sistema selecionado, limpar o filtro
          this.$emit('filtrar', { 
            ...this.filtros,
            resultadosBusca: null
          });
          return;
        }
        
        this.$emit('carregando', true);
        
        try {
          // Buscar itens de análise que usam este sistema
          const { data: analiseItens, error: analiseErro } = await supabase
            .from('analises_itens')
            .select('processo_id')
            .eq('sistema_id', this.filtros.sistema);
            
          if (analiseErro) throw analiseErro;
          
          // Se não houver itens, retornar lista vazia
          if (!analiseItens || analiseItens.length === 0) {
            this.$emit('filtrar', { 
              ...this.filtros,
              resultadosBusca: []
            });
            return;
          }
          
          // Extrair IDs dos processos únicos
          const processosIds = [...new Set(analiseItens.map(item => item.processo_id))];
          
          this.$emit('filtrar', { 
            ...this.filtros,
            resultadosBusca: processosIds
          });
          
        } catch (err) {
          console.error('Erro ao buscar por sistema:', err);
        } finally {
          this.$emit('carregando', false);
        }
      }, 300);
    },
    
    // Aplicar todos os filtros de uma vez
    aplicarFiltrosCompletos() {
      // Se houver algum filtro preenchido, realizar busca combinada
      if (this.temAlgumFiltroPreenchido()) {
        this.buscarCombinado();
      } else {
        // Se não houver filtros, limpar resultados
        this.$emit('filtrar', { 
          ...this.filtros,
          resultadosBusca: null
        });
      }
    },
    
    // Verificar se há algum filtro preenchido
    temAlgumFiltroPreenchido() {
      return this.filtros.orgao ||
             this.filtros.data ||
             this.filtros.numeroProcesso ||
             this.filtros.codigoGpi ||
             this.filtros.sistema;
    },
    
    // Busca combinada com todos os filtros
    async buscarCombinado() {
      this.$emit('carregando', true);
      
      try {
        // Iniciar a consulta
        let query = supabase.from('processos').select('id');
        
        // Adicionar filtros se existirem
        if (this.filtros.orgao) {
          query = query.ilike('orgao', `%${this.filtros.orgao}%`);
        }
        
        if (this.filtros.data) {
          query = query.eq('data_pregao', this.filtros.data + 'T00:00:00');
        }
        
        if (this.filtros.numeroProcesso) {
          query = query.ilike('numero_processo', `%${this.filtros.numeroProcesso}%`);
        }
        
        if (this.filtros.codigoGpi) {
          query = query.ilike('codigo_analise', `%${this.filtros.codigoGpi}%`);
        }
        
        // Executar a consulta
        const { data, error } = await query.limit(50);
        
        if (error) throw error;
        
        // Se temos o filtro de sistema, precisamos filtrar os resultados por sistema
        if (this.filtros.sistema && data && data.length > 0) {
          // Obter IDs de processos que correspondem ao filtro de sistema
          const { data: sistemaData, error: sistemaError } = await supabase
            .from('analises_itens')
            .select('processo_id')
            .eq('sistema_id', this.filtros.sistema)
            .in('processo_id', data.map(p => p.id));
            
          if (sistemaError) throw sistemaError;
          
          const processosIdsFiltradosPorSistema = sistemaData.map(item => item.processo_id);
          
          // Emitir IDs dos processos que passaram por todos os filtros
          this.$emit('filtrar', { 
            ...this.filtros,
            resultadosBusca: processosIdsFiltradosPorSistema
          });
        } else {
          // Emitir IDs dos processos encontrados para o componente pai
          this.$emit('filtrar', { 
            ...this.filtros,
            resultadosBusca: data ? data.map(item => item.id) : []
          });
        }
        
      } catch (err) {
        console.error('Erro ao aplicar filtros combinados:', err);
      } finally {
        this.$emit('carregando', false);
      }
    },
    
    // Método para limpar todos os filtros
    limparFiltros() {
      this.filtros = {
        orgao: '',
        data: '',
        numeroProcesso: '',
        codigoGpi: '',
        sistema: ''
      };
      
      // Emitir evento para limpar filtros
      this.$emit('filtrar', { ...this.filtros, resultadosBusca: null });
    }
  }
}
</script>

<style scoped>
.filtros-container {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  border: 1px solid #e9ecef;
}

.filtros-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.filtros-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #495057;
  margin: 0;
}

.btn-toggle-filtros {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  color: #193155;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.btn-toggle-filtros:hover {
  background-color: rgba(25, 49, 85, 0.05);
}

.filtros-content {
  margin-top: 1rem;
  border-top: 1px solid #e9ecef;
  padding-top: 1rem;
}

.filtros-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.filtro-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filtro-item label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #495057;
}

.filtro-item input,
.filtro-item select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.filtro-item input:focus,
.filtro-item select:focus {
  outline: none;
  border-color: #193155;
  box-shadow: 0 0 0 3px rgba(25, 49, 85, 0.1);
}

.filtro-acoes {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
}

.btn-limpar,
.btn-aplicar {
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s;
}

.btn-limpar {
  background-color: #e9ecef;
  color: #495057;
}

.btn-limpar:hover {
  background-color: #dee2e6;
}

.btn-aplicar {
  background-color: #193155;
  color: white;
}

.btn-aplicar:hover {
  background-color: #254677;
}

@media (max-width: 768px) {
  .filtros-grid {
    grid-template-columns: 1fr;
  }
  
  .filtro-acoes {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
