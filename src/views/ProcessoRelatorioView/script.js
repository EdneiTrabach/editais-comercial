import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { supabase } from '@/lib/supabase';
import { exportToPDF } from '@/utils/exportRelatorioUtils';
import RelatorioHeader from '@/components/relatorios/RelatorioHeader/index.vue';
import RelatorioEditor from '@/components/relatorios/RelatorioEditor/index.vue';
import { gerarModeloRelatorio } from '@/utils/relatorioTemplates';

export default {
  name: 'ProcessoRelatorioView',
  
  components: {
    RelatorioHeader,
    RelatorioEditor
  },
  
  setup() {
    const router = useRouter();
    const route = useRoute();
    
    const processo = ref(null);
    const loading = ref(true);
    const conteudoRelatorio = ref('');
    
    // Carregar dados do processo
    const carregarProcesso = async () => {
      try {
        const processoId = route.params.id;
        loading.value = true;
        
        const { data, error } = await supabase
          .from('processos')
          .select(`
            *,
            responsaveis:responsaveis_processos!processos_responsavel_id_fkey(id, nome),
            representante:representantes(id, nome),
            empresa:empresas(id, nome, cnpj)
          `)
          .eq('id', processoId)
          .single();
          
        if (error) throw error;
        
        processo.value = data;
        
        // Gerar conteúdo inicial do relatório baseado nos dados do processo
        conteudoRelatorio.value = await gerarModeloRelatorio(processo.value);
      } catch (error) {
        console.error('Erro ao carregar dados do processo:', error);
        alert('Erro ao carregar dados do processo');
      } finally {
        loading.value = false;
      }
    };
    
    // Função para voltar à página anterior
    const voltar = () => {
      router.back();
    };
    
    // Função para exportar o relatório como PDF
    const exportarPDF = async () => {
      try {
        if (!processo.value) return;
        
        await exportToPDF({
          conteudo: conteudoRelatorio.value,
          processo: processo.value,
          nomeArquivo: `Relatorio_${processo.value.numero_processo.replace(/[/\\?%*:|"<>]/g, '-')}.pdf`
        });
      } catch (error) {
        console.error('Erro ao exportar relatório:', error);
        alert('Erro ao exportar relatório para PDF');
      }
    };
    
    // Carregar dados do processo ao montar o componente
    onMounted(async () => {
      await carregarProcesso();
    });
    
    return {
      processo,
      loading,
      conteudoRelatorio,
      voltar,
      exportarPDF
    };
  }
};