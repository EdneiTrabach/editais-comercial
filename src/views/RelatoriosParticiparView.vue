<template>
  <div class="relatorios-participar-container">
    <TheSidebar @toggle="handleSidebarToggle" />

    <div class="main-content" :class="{ 'sidebar-expanded': isSidebarExpanded }">
      <div class="content-wrapper">
        <!-- Cabeçalho -->
        <RelatoriosHeader 
          @sincronizar="sincronizarTodosProcessos" 
          @exportar-excel="exportarExcel" 
        />

        <!-- Seleção de Ano -->
        <AnoSelection 
          :anos="anosDisponiveis" 
          :processos="processos" 
          :selectedAno="anoSelecionado"
          @select-ano="selecionarAno" 
        />

        <!-- Filtros -->
        <RelatoriosFiltros
          v-model:status="filtros.status"
          v-model:responsavel="filtros.responsavel"
          @limpar="limparFiltros"
        />
        
        <RelatoriosTabela 
          :processos="processosFiltrados"
          :loading="loading"
          :responsaveis="responsaveis"
          :sistemas="sistemas"
          @ver-detalhes="verDetalhes"
          @ir-para-processo="irParaProcesso"
        />
        
        <RelatoriosDetalhesModal 
          v-if="modalDetalhes.show"
          :processo="modalDetalhes.processo"
          :sistemas="sistemas"
          @fechar="fecharModal"
        />
      </div>
    </div>

    <!-- Toast notifications -->
    <div class="toast-container">
      <div v-for="toast in toasts" :key="toast.id" 
           :class="['toast', `toast-${toast.type}`]">
        {{ toast.message }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/lib/supabase';
import TheSidebar from '@/components/TheSidebar.vue';
import RelatoriosHeader from '@/components/relatorios/RelatoriosHeader/index.vue';
import AnoSelection from '@/components/lances/AnoSelection.vue';
import RelatoriosFiltros from '@/components/relatorios/RelatoriosFiltros/index.vue';
import RelatoriosTabela from '@/components/relatorios/RelatoriosTabela/index.vue';
import RelatoriosDetalhesModal from '@/components/relatorios/RelatoriosDetalhesModal/index.vue';

export default {
  name: 'RelatoriosParticiparView',
  
  components: {
    TheSidebar,
    RelatoriosHeader,
    AnoSelection,
    RelatoriosFiltros,
    RelatoriosTabela,
    RelatoriosDetalhesModal
  },
  
  setup() {
    const router = useRouter();
    const isSidebarExpanded = ref(false);
    const loading = ref(true);
    const processos = ref([]);
    const anoSelecionado = ref(new Date().getFullYear());
    const anosDisponiveis = ref([anoSelecionado.value]); // Inicializar com o ano atual
    const responsaveis = ref([]);
    const sistemas = ref([]);
    const toasts = ref([]);

    // Filtros
    const filtros = ref({
      status: 'todos',
      responsavel: ''
    });

    // Modal de detalhes
    const modalDetalhes = ref({
      show: false,
      processo: null
    });

    // Toast functions
    const showToast = (message, type = 'info') => {
      const id = Date.now();
      toasts.value.push({ id, message, type });
      setTimeout(() => {
        hideToastById(id);
      }, 3000);
      return id;
    };

    const hideToastById = (id) => {
      const index = toasts.value.findIndex(toast => toast.id === id);
      if (index !== -1) {
        toasts.value.splice(index, 1);
      }
    };

    const hideToast = (id) => {
      hideToastById(id);
    };

    // Função para obter nome do responsável
    const getResponsavelNome = (id) => {
      if (!id) return '-';
      const responsavel = responsaveis.value.find(r => r.id === id);
      return responsavel ? responsavel.nome : '-';
    };

    // Carregar processos
    const carregarProcessos = async () => {
      try {
        loading.value = true;
        
        const { data, error } = await supabase
          .from('processos')
          .select(`
            *,
            responsaveis:responsaveis_processos!processos_responsavel_id_fkey(id, nome)
          `)
          .or('status.eq.vamos_participar,status.eq.ganhamos,status.eq.perdemos');
        
        if (error) throw error;
        
        processos.value = data || [];
        
        // Extrair anos disponíveis
        const anos = [...new Set(processos.value.map(p => {
          if (p.data_pregao) {
            return new Date(p.data_pregao).getFullYear();
          }
          return anoSelecionado.value;
        }))].sort().reverse();
        
        anosDisponiveis.value = anos.length ? anos : [anoSelecionado.value];
        
        // Carregar responsáveis e sistemas
        await Promise.all([
          carregarResponsaveis(),
          carregarSistemas()
        ]);
        
        console.log("Processos carregados:", processos.value.length);
        
      } catch (error) {
        console.error('Erro ao carregar processos:', error);
        showToast('Erro ao carregar os processos', 'error');
      } finally {
        loading.value = false;
      }
    };
    
    // Carregar responsáveis
    const carregarResponsaveis = async () => {
      try {
        const { data, error } = await supabase
          .from('responsaveis_processos')
          .select('*');
          
        if (error) throw error;
        responsaveis.value = data || [];
        console.log("Responsáveis carregados:", responsaveis.value.length);
      } catch (error) {
        console.error('Erro ao carregar responsáveis:', error);
        showToast('Erro ao carregar responsáveis', 'error');
      }
    };
    
    // Carregar sistemas
    const carregarSistemas = async () => {
      try {
        const { data, error } = await supabase
          .from('sistemas')
          .select('*');
          
        if (error) throw error;
        sistemas.value = data || [];
        console.log("Sistemas carregados:", sistemas.value.length);
      } catch (error) {
        console.error('Erro ao carregar sistemas:', error);
        showToast('Erro ao carregar sistemas', 'error');
      }
    };
    
    // Processos filtrados com base no ano e filtros
    const processosFiltrados = computed(() => {
      console.log("Calculando processos filtrados. Total:", processos.value.length);
      return processos.value.filter(processo => {
        // Filtrar pelo ano
        if (processo.data_pregao) {
          const ano = new Date(processo.data_pregao).getFullYear();
          if (ano !== anoSelecionado.value) return false;
        }
        
        // Filtrar por status
        if (filtros.value.status !== 'todos' && processo.status !== filtros.value.status) {
          return false;
        }
        
        // Filtrar por responsável
        if (filtros.value.responsavel && processo.responsavel_id !== filtros.value.responsavel) {
          return false;
        }
        
        return true;
      });
    });
    
    // Selecionar ano
    const selecionarAno = (ano) => {
      anoSelecionado.value = ano;
      console.log("Ano selecionado:", ano);
    };
    
    // Limpar filtros
    const limparFiltros = () => {
      filtros.value = {
        status: 'todos',
        responsavel: ''
      };
    };
    
    // Abrir modal de detalhes
    const verDetalhes = (processo) => {
      modalDetalhes.value = {
        show: true,
        processo
      };
    };
    
    // Fechar modal de detalhes
    const fecharModal = () => {
      modalDetalhes.value.show = false;
    };
    
    // Ir para tela de relatório de processo
    const irParaProcesso = (processo) => {
      console.log("Navegando para relatório do processo:", processo.id);
      router.push(`/processos/${processo.id}/relatorio`);
    };
    
    // Sincronizar processos
    const sincronizarTodosProcessos = async () => {
      try {
        loading.value = true;
        const toastId = showToast('Sincronizando processos...', 'info');
        await carregarProcessos();
        hideToast(toastId);
        showToast('Processos sincronizados com sucesso!', 'success');
      } catch (error) {
        console.error('Erro ao sincronizar processos:', error);
        showToast('Erro ao sincronizar processos', 'error');
      } finally {
        loading.value = false;
      }
    };
    
    // Exportar para Excel
    const exportarExcel = () => {
      // Implementar usando bibliotecas como xlsx ou exceljs
      const dadosExportacao = processosFiltrados.value.map(p => ({
        NumeroProcesso: p.numero_processo,
        Orgao: p.orgao,
        DataPregao: p.data_pregao ? new Date(p.data_pregao).toLocaleDateString('pt-BR') : '-',
        Status: p.status,
        Responsavel: getResponsavelNome(p.responsavel_id)
      }));
      
      console.log("Dados para exportação:", dadosExportacao.length);
      showToast('Funcionalidade de exportação para Excel em desenvolvimento', 'info');
      // Código de exportação aqui...
    };
    
    // Tratar toggle da sidebar
    const handleSidebarToggle = (expanded) => {
      isSidebarExpanded.value = expanded;
    };
    
    // Carregar dados inicialmente
    onMounted(() => {
      console.log("Componente RelatoriosParticiparView montado");
      carregarProcessos();
    });
    
    return {
      isSidebarExpanded,
      loading,
      processos,
      processosFiltrados,
      anoSelecionado,
      anosDisponiveis,
      filtros,
      responsaveis,
      sistemas,
      modalDetalhes,
      toasts,
      getResponsavelNome,
      selecionarAno,
      limparFiltros,
      verDetalhes,
      fecharModal,
      irParaProcesso,
      sincronizarTodosProcessos,
      exportarExcel,
      handleSidebarToggle
    };
  }
}
</script>

<style scoped>
.relatorios-participar-container {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.main-content {
  flex: 1;
  transition: margin-left 0.3s;
  height: 100%;
  overflow-y: auto;
  padding: 0;
}

.main-content.sidebar-expanded {
  margin-left: 0;
}

.content-wrapper {
  padding: 1rem;
}

.toast-container {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  z-index: 1000;
}

.toast {
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  border-radius: 4px;
  color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  animation: fadeIn 0.3s;
}

.toast-success {
  background-color: #4caf50;
}

.toast-error {
  background-color: #f44336;
}

.toast-info {
  background-color: #2196f3;
}

.toast-warning {
  background-color: #ff9800;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>