<template>
  <div class="relatorio-container">
    <RelatorioHeader 
      :processo="processo" 
      :loading="loading"
      @voltar="voltar"
      @exportar="exportarPDF"
    />
    
    <div class="relatorio-content">
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Carregando dados do processo...</p>
      </div>
      
      <template v-else-if="processo">
        <!-- Conteúdo do Relatório -->
        <RelatorioEditor 
          :processo="processo" 
          :conteudo="conteudoRelatorio"
          @update:conteudo="conteudoRelatorio = $event"
        />
      </template>
      
      <div v-else class="error-container">
        <div class="error-icon">⚠️</div>
        <h3>Erro ao carregar o processo</h3>
        <p>Não foi possível carregar os dados do processo. Por favor, tente novamente.</p>
        <button class="btn btn-primary" @click="recarregar">Tentar novamente</button>
        <button class="btn btn-secondary" @click="voltar">Voltar</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
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
    const erroCarregamento = ref(false);
    
    // Carregar dados do processo
    const carregarProcesso = async () => {
      try {
        loading.value = true;
        erroCarregamento.value = false;
        
        const processoId = route.params.id;
        if (!processoId) {
          throw new Error('ID do processo não fornecido');
        }
        
        // Consulta para obter os dados do processo
        const { data, error } = await supabase
          .from('processos')
          .select(`
            *,
            responsaveis:responsaveis_processos!processos_responsavel_id_fkey(id, nome),
            representante:representantes!processos_representante_id_fkey(id, nome),
            empresa:empresas(id, nome, cnpj)
          `)
          .eq('id', processoId)
          .single();
        
        if (error) {
          console.error('Erro ao carregar dados do processo:', error);
          erroCarregamento.value = true;
          throw error;
        }
        
        processo.value = data;
        
        if (processo.value) {
          // Gerar conteúdo inicial do relatório baseado nos dados do processo
          conteudoRelatorio.value = await gerarModeloRelatorio(processo.value);
        } else {
          throw new Error('Processo não encontrado');
        }
      } catch (error) {
        console.error('Erro ao carregar dados do processo:', error);
        erroCarregamento.value = true;
        alert('Erro ao carregar dados do processo');
      } finally {
        loading.value = false;
      }
    };
    
    // Função para voltar à página anterior
    const voltar = () => {
      router.back();
    };
    
    // Função para tentar recarregar os dados
    const recarregar = () => {
      carregarProcesso();
    };
    
    // Função para exportar o relatório como PDF
    const exportarPDF = async () => {
      try {
        if (!processo.value) {
          alert('Não há processo carregado para exportar');
          return;
        }
        
        await exportToPDF({
          conteudo: conteudoRelatorio.value,
          processo: processo.value,
          nomeArquivo: `Relatorio_${processo.value.numero_processo.replace(/[/\\?%*:|"<>]/g, '-')}.pdf`
        });
        
        alert('Relatório exportado com sucesso!');
      } catch (error) {
        console.error('Erro ao exportar relatório:', error);
        alert('Erro ao exportar o relatório para PDF: ' + error.message);
      }
    };
    
    // Carregar dados ao montar o componente
    onMounted(() => {
      carregarProcesso();
    });
    
    return {
      processo,
      loading,
      conteudoRelatorio,
      erroCarregamento,
      voltar,
      recarregar,
      exportarPDF
    };
  }
};
</script>

<style>
.relatorio-container {
  display: flex;
  flex-direction: column;
  background-color: #f9f9f9;
}

.relatorio-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow-y: auto;
  background-color: #f9f9f9;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.error-container h3 {
  color: #d32f2f;
  margin-bottom: 10px;
}

.error-container button {
  margin-top: 20px;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
  margin-left: 10px;
}

.btn-secondary:hover {
  background-color: #5a6268;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #3498db;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>