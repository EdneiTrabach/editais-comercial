import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/lib/supabase';
import { writeFileXLSX, utils } from 'xlsx';

// Componentes
import TheSidebar from '@/components/TheSidebar.vue';
import AnoSelection from '@/components/lances/AnoSelection.vue';
import RelatoriosHeader from '@/components/relatorios/RelatoriosHeader';
import RelatoriosFiltros from '@/components/relatorios/RelatoriosFiltros';
import RelatoriosTabela from '@/components/relatorios/RelatoriosTabela';
import RelatoriosDetalhesModal from '@/components/relatorios/RelatoriosDetalhesModal';

// Funções de formatação
import { formatadores } from './formatadores';

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
    const anosDisponiveis = ref([]);
    const responsaveis = ref([]);
    const sistemas = ref([]);

    // Filtros
    const filtros = ref({
      status: 'vamos_participar',
      responsavel: ''
    });

    // Modal de detalhes
    const modalDetalhes = ref({
      show: false,
      processo: null
    });

    // Carrega os processos com status relevantes
    const carregarProcessos = async () => {
      try {
        loading.value = true;
        
        const { data, error } = await supabase
          .from('processos')
          .select(`
            *,
            responsaveis:responsaveis_processos!processos_responsavel_id_fkey(id, nome)
          `)
          .or('status.eq.vamos_participar,status.eq.ganhamos,status.eq.perdemos')
          .order('data_pregao', { ascending: false });
        
        if (error) {
          console.error('Erro na consulta principal:', error);
          
          // Tentativa alternativa sem relacionamentos
          const { data: dataSimples, error: errorSimples } = await supabase
            .from('processos')
            .select('*')
            .or('status.eq.vamos_participar,status.eq.ganhamos,status.eq.perdemos')
            .order('data_pregao', { ascending: false });
          
          if (errorSimples) {
            console.error('Erro na consulta alternativa:', errorSimples);
            throw errorSimples;
          }
          
          processos.value = dataSimples || [];
        } else {
          processos.value = data || [];
        }
        
        // Extrair anos disponíveis
        const anos = [...new Set(processos.value
          .filter(p => p.data_pregao)
          .map(p => new Date(p.data_pregao).getFullYear()))];
        
        anosDisponiveis.value = anos.sort((a, b) => b - a);
        
        // Se não tem o ano atual nos dados, usar o ano mais recente
        if (anosDisponiveis.value.length > 0 && !anosDisponiveis.value.includes(anoSelecionado.value)) {
          anoSelecionado.value = anosDisponiveis.value[0];
        }
        
      } catch (error) {
        console.error('Erro ao carregar processos:', error.message || 'Erro desconhecido');
        alert(`Erro ao carregar processos: ${error.message || 'Verifique o console para mais detalhes'}`);
      } finally {
        loading.value = false;
      }
    };

    // Carrega os responsáveis e sistemas
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

    // Monitoramento automático
    const intervalRef = ref(null);

    const iniciarMonitoramentoStatus = () => {
      if (intervalRef.value) clearInterval(intervalRef.value);
      
      intervalRef.value = setInterval(async () => {
        await carregarProcessos();
      }, 30000); // 30 segundos
    };

    onUnmounted(() => {
      if (intervalRef.value) {
        clearInterval(intervalRef.value);
        intervalRef.value = null;
      }
    });

    // Inicialização
    onMounted(async () => {
      await Promise.all([
        carregarProcessos(),
        carregarResponsaveis(),
        carregarSistemas()
      ]);
      
      iniciarMonitoramentoStatus();
    });

    // Processos filtrados por ano e filtros
    const processosFiltrados = computed(() => {
      if (!processos.value) return [];

      return processos.value.filter(processo => {
        // Filtrar por ano
        if (processo.data_pregao) {
          const ano = new Date(processo.data_pregao).getFullYear();
          if (ano !== anoSelecionado.value) return false;
        }

        // Filtrar por status
        if (filtros.value.status && processo.status !== filtros.value.status) {
          return false;
        }

        // Filtrar por responsável
        if (filtros.value.responsavel && filtros.value.responsavel.trim() !== '') {
          const responsavel = responsaveis.value.find(r => r.id === processo.responsavel_id);
          const responsavelNome = responsavel ? responsavel.nome.toLowerCase() : '';
          if (!responsavelNome.includes(filtros.value.responsavel.toLowerCase())) {
            return false;
          }
        }

        return true;
      });
    });

    // Funções de manipulação
    const handleSidebarToggle = (expanded) => {
      isSidebarExpanded.value = expanded;
    };

    const selecionarAno = (ano) => {
      anoSelecionado.value = ano;
    };

    const limparFiltros = () => {
      filtros.value.status = 'vamos_participar';
      filtros.value.responsavel = '';
    };

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

    const exportarExcel = () => {
      // Formatar dados para exportação
      const dataToExport = processosFiltrados.value.map(processo => {
        // Obter nome do responsável
        const responsavel = responsaveis.value.find(r => r.id === processo.responsavel_id);
        const responsavelNome = responsavel ? responsavel.nome : '-';
        
        // Obter nomes dos sistemas
        const sistemasNomes = processo.sistemas_ativos?.map(id => {
          const sistema = sistemas.value.find(s => s.id === id);
          return sistema ? sistema.nome : 'Sistema Desconhecido';
        }).join(', ') || '-';
        
        return {
          'Número do Processo': processo.numero_processo || '-',
          'Órgão': processo.orgao || '-',
          'Data Pregão': formatadores.formatarData(processo.data_pregao),
          'Status': formatadores.formatarStatus(processo.status),
          'Valor Estimado': formatadores.formatarMoeda(processo.valor_estimado),
          'Responsável': responsavelNome,
          'Sistemas': sistemasNomes
        };
      });

      // Gerar o arquivo Excel
      const ws = utils.json_to_sheet(dataToExport);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Processos com Participação');
      writeFileXLSX(wb, `relatorio_participacao_${anoSelecionado.value}.xlsx`);
    };

    const verDetalhes = (processo) => {
      modalDetalhes.value = {
        show: true,
        processo: processo
      };
    };

    const fecharModal = () => {
      modalDetalhes.value.show = false;
    };

    const irParaProcesso = (processo) => {
      router.push(`/processos/${processo.id}`);
    };

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
      handleSidebarToggle,
      selecionarAno,
      limparFiltros,
      sincronizarTodosProcessos,
      exportarExcel,
      verDetalhes,
      fecharModal,
      irParaProcesso
    };
  }
}