<template>
  <div class="relatorios-participar-container">
    <TheSidebar :is-expanded="isSidebarExpanded" @toggle="handleSidebarToggle" />
    <div class="main-content" :class="{ 'sidebar-expanded': isSidebarExpanded, 'sidebar-collapsed': !isSidebarExpanded }">
      <div class="content-wrapper">
        <RelatoriosHeader 
          @sincronizar="sincronizarTodosProcessos" 
          @exportar-excel="exportarExcel" 
        />
        
        <AnoSelection 
          :anos="anosDisponiveis" 
          :anos-disponiveis="anosDisponiveis" 
          :ano-selecionado="anoSelecionado" 
          :processos="processos"
          @selecionar-ano="selecionarAno"
        />
        
        <RelatoriosFiltros 
          :status="filtros.status"
          :responsavel="filtros.responsavel"
          @update:status="filtros.status = $event"
          @update:responsavel="filtros.responsavel = $event"
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
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/lib/supabase';
import TheSidebar from '@/components/TheSidebar.vue';
import AnoSelection from '@/components/lances/AnoSelection.vue';
import RelatoriosHeader from '@/components/relatorios/RelatoriosHeader/index.vue';
import RelatoriosFiltros from '@/components/relatorios/RelatoriosFiltros/index.vue';
import RelatoriosTabela from '@/components/relatorios/RelatoriosTabela/index.vue';
import RelatoriosDetalhesModal from '@/components/relatorios/RelatoriosDetalhesModal/index.vue';

export default {
  name: 'RelatoriosParticiparView',
  
  components: {
    TheSidebar,
    AnoSelection,
    RelatoriosHeader,
    RelatoriosFiltros,
    RelatoriosTabela,
    RelatoriosDetalhesModal
  },
  
  setup() {
    const router = useRouter();
    const isSidebarExpanded = ref(true);
    const processos = ref([]);
    const loading = ref(false);
    const anoSelecionado = ref(new Date().getFullYear());
    const anosDisponiveis = ref([anoSelecionado.value]); // Inicializar com o ano atual
    const responsaveis = ref([]);
    const sistemas = ref([]);

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
        const anos = [...new Set(data
          .filter(p => p.data_pregao)
          .map(p => new Date(p.data_pregao).getFullYear())
        )];
        
        if (anos.length > 0) {
          anosDisponiveis.value = anos.sort((a, b) => b - a); // Ordenar decrescente
          
          // Se não tiver o ano atual, selecionar o mais recente
          if (!anos.includes(anoSelecionado.value)) {
            anoSelecionado.value = anos[0];
          }
        } else {
          // Se não houver anos, manter apenas o atual
          anosDisponiveis.value = [new Date().getFullYear()];
        }
      } catch (error) {
        console.error('Erro ao carregar processos:', error);
      } finally {
        loading.value = false;
      }
    };
    
    // Carregar responsáveis
    const carregarResponsaveis = async () => {
      try {
        const { data, error } = await supabase
          .from('responsaveis_processos')
          .select('id, nome');

        if (error) throw error;
        responsaveis.value = data || [];
      } catch (error) {
        console.error('Erro ao carregar responsáveis:', error);
      }
    };
    
    // Carregar sistemas
    const carregarSistemas = async () => {
      try {
        const { data, error } = await supabase
          .from('sistemas')
          .select('id, nome');

        if (error) throw error;
        sistemas.value = data || [];
      } catch (error) {
        console.error('Erro ao carregar sistemas:', error);
      }
    };
    
    // Filtrar processos
    const processosFiltrados = computed(() => {
      if (!processos.value) return [];
      
      return processos.value.filter(processo => {
        // Filtrar por ano
        if (processo.data_pregao) {
          const ano = new Date(processo.data_pregao).getFullYear();
          if (ano !== anoSelecionado.value) return false;
        }
        
        // Filtrar por status
        if (filtros.value.status !== 'todos' && processo.status !== filtros.value.status) {
          return false;
        }
        
        // Filtrar por responsável
        if (filtros.value.responsavel && (!processo.responsaveis || 
           (!Array.isArray(processo.responsaveis) ? 
             processo.responsaveis.nome.toLowerCase().indexOf(filtros.value.responsavel.toLowerCase()) === -1 : 
             !processo.responsaveis.some(r => r.nome.toLowerCase().indexOf(filtros.value.responsavel.toLowerCase()) !== -1)))) {
          return false;
        }
        
        return true;
      });
    });
    
    // Selecionar ano
    const selecionarAno = (ano) => {
      anoSelecionado.value = ano;
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
      router.push(`/processos/${processo.id}/relatorio`);
    };
    
    // Sincronizar processos
    const sincronizarTodosProcessos = async () => {
      try {
        loading.value = true;
        await carregarProcessos();
        alert('Processos sincronizados com sucesso!');
      } catch (error) {
        console.error('Erro ao sincronizar processos:', error);
        alert('Erro ao sincronizar processos');
      } finally {
        loading.value = false;
      }
    };
    
    // Exportar para Excel
    const exportarExcel = () => {
      try {
        // Implemente a função de exportação para Excel
        alert('Função de exportação para Excel em implementação');
      } catch (error) {
        console.error('Erro ao exportar para Excel:', error);
        alert('Erro ao exportar para Excel');
      }
    };
    
    // Lidar com sidebar toggle
    const handleSidebarToggle = (expanded) => {
      isSidebarExpanded.value = expanded;
    };
    
    // Inicialização
    onMounted(async () => {
      await Promise.all([
        carregarProcessos(),
        carregarResponsaveis(),
        carregarSistemas()
      ]);
    });

    return {
      isSidebarExpanded,
      processos,
      loading,
      anoSelecionado,
      anosDisponiveis,
      responsaveis,
      sistemas,
      filtros,
      modalDetalhes,
      processosFiltrados,
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

<style src="./RelatoriosParticipar/style.css"></style>