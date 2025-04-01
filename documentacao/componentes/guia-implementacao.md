# Guia de Implementação do Componente de Filtro Avançado

Este guia fornece instruções passo a passo sobre como implementar e integrar o componente AdvancedFilterComponent na sua aplicação Vue.js.

## Pré-requisitos

- Vue.js 3.x
- Composables: useFormatters.js, useFiltros.js (opcional)
- Estilos de filtro em assets/styles/components/filters.css

## Passo 1: Importar o Componente

Primeiro, importe o componente AdvancedFilterComponent na sua view ou componente:

```javascript
import AdvancedFilterComponent from '@/components/filters/AdvancedFilterComponent.vue';

export default {
  components: {
    AdvancedFilterComponent
    // outros componentes...
  }
  // ...
}
```

## Passo 2: Preparar os Dados para Filtros

Defina os dados que serão usados nas opções de filtro:

```javascript
// No setup() da sua view
const statusOptions = [
  { value: 'em_analise', label: 'Em Análise' },
  { value: 'vamos_participar', label: 'Vamos Participar' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'ganhamos', label: 'Ganhamos' },
  { value: 'perdemos', label: 'Perdemos' },
  { value: 'suspenso', label: 'Suspenso' },
  { value: 'revogado', label: 'Revogado' },
  { value: 'adiado', label: 'Adiado' },
  { value: 'demonstracao', label: 'Demonstração' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'nao_participar', label: 'Decidido Não Participar' }
];

const modalidadeOptions = [
  { valor: 'pregao_eletronico', texto: 'Pregão Eletrônico' },
  { valor: 'pregao_presencial', texto: 'Pregão Presencial' },
  { valor: 'credenciamento', texto: 'Credenciamento' },
  { valor: 'concorrencia', texto: 'Concorrência' },
  { valor: 'concurso', texto: 'Concurso' },
  { valor: 'leilao', texto: 'Leilão' },
  { valor: 'dialogo_competitivo', texto: 'Diálogo Competitivo' },
  { valor: 'tomada_precos', texto: 'Tomada de Preços' },
  { valor: 'chamamento_publico', texto: 'Chamamento Público' },
  { valor: 'rdc', texto: 'RDC' },
  { valor: 'rdc_eletronico', texto: 'RDC Eletrônico' },
  { valor: 'srp', texto: 'SRP' },
  { valor: 'srp_eletronico', texto: 'SRP Eletrônico' },
  { valor: 'srp_internacional', texto: 'SRP Internacional' }
];

// Obter responsáveis (exemplo)
const responsaveis = ref([]);
const obterResponsaveis = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, nome')
      .eq('ativo', true);
      
    if (error) throw error;
    responsaveis.value = data;
  } catch (error) {
    console.error('Erro ao carregar responsáveis:', error);
  }
};

// Obter lista de estados (exemplo)
const estados = [
  { uf: 'AC', nome: 'Acre' },
  { uf: 'AL', nome: 'Alagoas' },
  { uf: 'AP', nome: 'Amapá' },
  { uf: 'AM', nome: 'Amazonas' },
  // ... demais estados
];

// Estado dos filtros
const filtrosAtuais = ref({});
const mostrarFiltro = ref(false);
```

## Passo 3: Adicionar o Componente no Template

Adicione o componente no seu template:

```html
<template>
  <div class="controls-section">
    <!-- Botão para mostrar/esconder o filtro -->
    <button 
      class="btn-filter" 
      @click="mostrarFiltro = !mostrarFiltro"
      :class="{'active': mostrarFiltro || temFiltrosAtivos}"
    >
      <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path d="M10,18H14V16H10V18M3,6V8H21V6H3M6,13H18V11H6V13Z" />
      </svg>
      Filtro Avançado
      <span v-if="contadorFiltrosAtivos > 0" class="filter-badge">
        {{ contadorFiltrosAtivos }}
      </span>
    </button>
    
    <!-- Container do filtro avançado -->
    <div 
      class="advanced-filter-container-wrapper"
      :class="{'is-visible': mostrarFiltro}"
    >
      <AdvancedFilterComponent
        :is-active="mostrarFiltro"
        :status-options="statusOptions"
        :modalidade-options="modalidadeOptions"
        :responsaveis="responsaveis"
        :estados="estados"
        :initial-filters="filtrosAtuais"
        @close="mostrarFiltro = false"
        @update-filters="handleFilterUpdate"
        @apply-filters="aplicarFiltros"
        @clear-filters="limparFiltros"
      />
    </div>
  </div>
  
  <!-- Exibir filtros ativos como feedback para o usuário -->
  <div class="filtros-ativos" v-if="temFiltrosAtivos">
    <span>{{ contadorFiltrosAtivos }} filtros aplicados</span>
    <button class="btn-limpar-filtros" @click="limparFiltros">
      Limpar todos
    </button>
  </div>
  
  <!-- Tabela ou listagem de resultados -->
  <div class="resultados">
    <!-- Seus dados filtrados aqui -->
  </div>
</template>
```

## Passo 4: Implementar Handlers de Eventos

Implemente as funções que tratarão os eventos emitidos pelo componente:

```javascript
// Computed para verificar se há filtros ativos
const temFiltrosAtivos = computed(() => {
  return Object.values(filtrosAtuais.value).some(valor => {
    if (Array.isArray(valor)) return valor.length > 0;
    return valor !== '' && valor !== null && valor !== undefined;
  });
});

// Computed para contar os filtros ativos
const contadorFiltrosAtivos = computed(() => {
  let contador = 0;
  
  if (filtrosAtuais.value.dataInicio) contador++;
  if (filtrosAtuais.value.dataFim) contador++;
  if (filtrosAtuais.value.estados?.length) contador += filtrosAtuais.value.estados.length;
  if (filtrosAtuais.value.status?.length) contador += filtrosAtuais.value.status.length;
  if (filtrosAtuais.value.modalidade?.length) contador += filtrosAtuais.value.modalidade.length;
  if (filtrosAtuais.value.responsavel?.length) contador += filtrosAtuais.value.responsavel.length;
  if (filtrosAtuais.value.valorMin) contador++;
  if (filtrosAtuais.value.valorMax) contador++;
  
  return contador;
});

// Função para atualizar filtros quando o usuário faz alterações
const handleFilterUpdate = (filters) => {
  filtrosAtuais.value = { ...filters };
};

// Função para aplicar os filtros e buscar dados
const aplicarFiltros = async (filters) => {
  filtrosAtuais.value = { ...filters };
  mostrarFiltro.value = false;
  
  // Resetar paginação (se aplicável)
  pagina.value = 1;
  
  // Buscar dados com filtros aplicados
  await carregarDados();
};

// Função para limpar todos os filtros
const limparFiltros = async () => {
  filtrosAtuais.value = {};
  mostrarFiltro.value = false;
  
  // Resetar paginação (se aplicável)
  pagina.value = 1;
  
  // Buscar todos os dados sem filtros
  await carregarDados();
};

// Função para carregar dados (exemplo)
const carregarDados = async () => {
  carregando.value = true;
  
  try {
    let query = supabase.from('processos').select('*');
    
    // Aplicar filtros
    if (filtrosAtuais.value.status?.length) {
      query = query.in('status', filtrosAtuais.value.status);
    }
    
    if (filtrosAtuais.value.modalidade?.length) {
      query = query.in('modalidade', filtrosAtuais.value.modalidade);
    }
    
    if (filtrosAtuais.value.responsavel?.length) {
      query = query.in('responsavel_id', filtrosAtuais.value.responsavel);
    }
    
    if (filtrosAtuais.value.estados?.length) {
      query = query.in('estado', filtrosAtuais.value.estados);
    }
    
    if (filtrosAtuais.value.dataInicio) {
      query = query.gte('data_pregao', filtrosAtuais.value.dataInicio);
    }
    
    if (filtrosAtuais.value.dataFim) {
      query = query.lte('data_pregao', filtrosAtuais.value.dataFim);
    }
    
    if (filtrosAtuais.value.valorMin) {
      const valorMin = parseFloat(filtrosAtuais.value.valorMin.replace('.', '').replace(',', '.'));
      if (!isNaN(valorMin)) {
        query = query.gte('valor_estimado', valorMin);
      }
    }
    
    if (filtrosAtuais.value.valorMax) {
      const valorMax = parseFloat(filtrosAtuais.value.valorMax.replace('.', '').replace(',', '.'));
      if (!isNaN(valorMax)) {
        query = query.lte('valor_estimado', valorMax);
      }
    }
    
    // Aplicar ordenação e paginação
    query = query.order('data_pregao', { ascending: false })
                .range((pagina.value - 1) * itensPorPagina, pagina.value * itensPorPagina - 1);
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    processos.value = data;
    totalRegistros.value = count || 0;
  } catch (error) {
    console.error('Erro ao carregar processos:', error);
  } finally {
    carregando.value = false;
  }
};
```

## Passo 5: Inicializar dados no mounted()

```javascript
onMounted(async () => {
  await Promise.all([
    obterResponsaveis(),
    carregarDados()
  ]);
});
```

## Passo 6: Incluir CSS Necessário

Certifique-se de importar os estilos necessários:

```javascript
// No seu componente principal
import '@/assets/styles/components/filters.css';
```

## Passo 7: Integração com useFiltros (opcional)

Se estiver usando o composable useFiltros, você pode integrá-lo assim:

```javascript
import { useFiltros } from '@/composables/useFiltros';

// No setup()
const { 
  filtros,
  processosFiltrados,
  limparFiltros: resetarFiltros,
  updateFilters
} = useFiltros(processos, anoSelecionado);

// Adaptador entre o AdvancedFilterComponent e useFiltros
const aplicarFiltros = (advancedFilters) => {
  // Mapear filtros do componente avançado para o formato do useFiltros
  updateFilters({
    status: advancedFilters.status,
    modalidade: advancedFilters.modalidade,
    // etc.
  });
  
  mostrarFiltro.value = false;
};
```

## Passo 8: Salvando Preferências do Usuário (opcional)

Para uma experiência melhor, você pode salvar e recuperar as preferências de filtro do usuário:

```javascript
import { useStorage } from '@vueuse/core';

// No setup()
const userId = useUserStore().userId;
const filtroStorageKey = computed(() => `userFilters_${userId}_${routeName.value}`);

// Carregar filtros salvos
const carregarFiltrosSalvos = () => {
  const filtrosSalvos = localStorage.getItem(filtroStorageKey.value);
  if (filtrosSalvos) {
    try {
      filtrosAtuais.value = JSON.parse(filtrosSalvos);
    } catch (err) {
      console.error('Erro ao carregar filtros salvos:', err);
    }
  }
};

// Salvar filtros atuais
const salvarFiltrosAtuais = () => {
  localStorage.setItem(filtroStorageKey.value, JSON.stringify(filtrosAtuais.value));
};

// Modificar a função aplicarFiltros
const aplicarFiltros = async (filters) => {
  filtrosAtuais.value = { ...filters };
  salvarFiltrosAtuais();
  mostrarFiltro.value = false;
  
  pagina.value = 1;
  await carregarDados();
};

// Chamar no onMounted
onMounted(() => {
  carregarFiltrosSalvos();
  // ...
});
```

## Dicas de Desempenho

1. **Filtragem no lado do servidor:** Para grandes conjuntos de dados, sempre prefira filtrar no servidor em vez de no cliente.

2. **Debounce para inputs de texto:**

   ```javascript
   import { debounce } from 'lodash-es';
   
   const debouncedSearch = debounce(valor => {
     // Lógica de busca
   }, 300);
   ```

3. **Lazy loading para opções de filtro:** Para dropdowns com muitas opções, considere carregar apenas quando necessário:

   ```javascript
   const carregarOpcoes = async () => {
     if (opcoes.value.length === 0) {
       // Carregar opções do servidor
     }
   };
   ```

## Solução de Problemas Comuns

### O componente de filtro não aparece

Verifique se:

- `mostrarFiltro` está corretamente vinculado
- CSS necessários estão importados
- Não há conflitos de z-index

### Filtros não estão afetando os dados

Verifique se:

- Os nomes dos campos correspondem ao que a API espera
- Os formatos de data/valores estão corretos
- O mapeamento de tipos de dados está correto

### Desempenho lento em grandes conjuntos de dados

Considere:

- Implementar paginação do lado do servidor
- Usar virtualização para listas longas
- Cachear resultados de filtros comuns

### Filtros não são persistentes entre navegações

Implemente o armazenamento de estado usando:

- localStorage/sessionStorage
- Vuex/Pinia
- Query parameters na URL
