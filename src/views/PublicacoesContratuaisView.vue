<template>
  <div class="layout">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />
    
    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <div class="header">
        <h1>Análise de Publicações Contratuais</h1>
        <p class="subtitle">Extraia automaticamente informações de contratos usando IA</p>
      </div>
      
      <div class="content-container">
        <div class="input-section">
          <h2>Texto da Publicação</h2>
          <div class="form-group">
            <label for="processo-select">Selecione o Processo:</label>
            <select id="processo-select" v-model="processoSelecionado" class="full-width">
              <option value="">Selecione um processo...</option>
              <option v-for="processo in processosFiltrados" :key="processo.id" :value="processo.id">
                {{ processo.numero_processo }} - {{ processo.orgao }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="publicacao-textarea">Cole o texto da publicação:</label>
            <textarea 
              id="publicacao-textarea" 
              v-model="textoPublicacao" 
              placeholder="Cole aqui o texto da publicação do Diário Oficial ou portal de compras..." 
              rows="12" 
              class="full-width"
            ></textarea>
          </div>
          
          <div class="actions">
            <button 
              @click="analisarPublicacao" 
              class="btn-primary" 
              :disabled="!podeAnalisar || analisando"
            >
              <img src="/icons/search-line.svg" alt="Analisar" class="btn-icon" v-if="!analisando" />
              <span v-if="analisando" class="spinner"></span>
              {{ analisando ? 'Analisando...' : 'Analisar Publicação' }}
            </button>
            <button @click="limparCampos" class="btn-secondary">
              <img src="/icons/lixeira.svg" alt="Limpar" class="btn-icon" />
              Limpar
            </button>
          </div>
        </div>
        
        <div class="results-section" v-if="resultadoAnalise">
          <h2>Resultados da Análise</h2>
          
          <div class="result-container">
            <div class="result-group">
              <h3>Empresa Vencedora</h3>
              <div class="result-value">
                <p v-if="empresaEncontrada">{{ empresaEncontrada.nome }}</p>
                <p v-else class="not-found">Não identificada</p>
              </div>
            </div>
            
            <div class="result-group">
              <h3>Número do Contrato</h3>
              <div class="result-value">
                <p v-if="resultadoAnalise.numero_contrato">{{ resultadoAnalise.numero_contrato }}</p>
                <p v-else class="not-found">Não identificado</p>
              </div>
            </div>
            
            <div class="result-group">
              <h3>Sistemas Mencionados</h3>
              <div class="result-value">
                <div v-if="sistemasMencionados.length > 0">
                  <div v-for="sistema in sistemasMencionados" :key="sistema.id" class="sistema-item">
                    {{ sistema.nome }}
                  </div>
                </div>
                <p v-else class="not-found">Nenhum sistema identificado</p>
              </div>
            </div>
          </div>
          
          <div class="actions">
            <button 
              @click="aplicarResultados" 
              class="btn-success" 
              :disabled="!podeAplicar || aplicando"
            >
              <img src="/icons/check.svg" alt="Aplicar" class="btn-icon" v-if="!aplicando" />
              <span v-if="aplicando" class="spinner"></span>
              {{ aplicando ? 'Aplicando...' : 'Aplicar ao Processo' }}
            </button>
          </div>
        </div>
      </div>
      
      <div v-if="mostrarMensagem" class="toast-message" :class="tipoMensagem">
        {{ mensagem }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue';
import { supabase } from '@/lib/supabase';
import TheSidebar from '@/components/TheSidebar.vue';
import { useIAAnalyzer } from '@/composables/useIAAnalyzer';

export default {
  name: 'PublicacoesContratuaisView',
  
  components: {
    TheSidebar
  },
  
  setup() {
    const isSidebarExpanded = ref(true);
    const processos = ref([]);
    const empresas = ref([]);
    const sistemas = ref([]);
    const processoSelecionado = ref('');
    const textoPublicacao = ref('');
    const resultadoAnalise = ref(null);
    const analisando = ref(false);
    const aplicando = ref(false);
    const mostrarMensagem = ref(false);
    const mensagem = ref('');
    const tipoMensagem = ref('');
    
    const { analisarTexto } = useIAAnalyzer();
    
    // Computed properties
    const processosFiltrados = computed(() => {
      return processos.value.filter(p => 
        !p.empresa_vencedora || 
        !p.numero_contrato || 
        (p.status !== 'ganhamos' && p.status !== 'perdemos')
      );
    });
    
    const podeAnalisar = computed(() => {
      return processoSelecionado.value && textoPublicacao.value.trim().length > 50;
    });
    
    const podeAplicar = computed(() => {
      return resultadoAnalise.value && (
        resultadoAnalise.value.empresa_vencedora || 
        resultadoAnalise.value.numero_contrato || 
        (resultadoAnalise.value.sistemas_ids && resultadoAnalise.value.sistemas_ids.length > 0)
      );
    });
    
    const empresaEncontrada = computed(() => {
      if (!resultadoAnalise.value?.empresa_vencedora) return null;
      return empresas.value.find(e => e.id === resultadoAnalise.value.empresa_vencedora);
    });
    
    const sistemasMencionados = computed(() => {
      if (!resultadoAnalise.value?.sistemas_ids) return [];
      
      return resultadoAnalise.value.sistemas_ids.map(id => {
        return sistemas.value.find(s => s.id === id) || { id, nome: `Sistema (${id})` };
      });
    });
    
    // Watch processoSelecionado para carregar informações específicas
    watch(processoSelecionado, async (novoId) => {
      if (novoId) {
        const processo = processos.value.find(p => p.id === novoId);
        if (processo && processo.publicacao_original) {
          textoPublicacao.value = processo.publicacao_original;
        }
      }
    });
    
    // Função para exibir mensagem
    const exibirMensagem = (msg, tipo = 'info') => {
      mensagem.value = msg;
      tipoMensagem.value = tipo;
      mostrarMensagem.value = true;
      
      setTimeout(() => {
        mostrarMensagem.value = false;
      }, 5000);
    };
    
    // Carregar dados necessários
    const carregarDados = async () => {
      try {
        // Carregar processos
        const { data: processosData, error: processosError } = await supabase
          .from('processos')
          .select('*')
          .order('data_pregao', { ascending: false });
        
        if (processosError) throw processosError;
        processos.value = processosData || [];
        
        // Carregar empresas
        const { data: empresasData, error: empresasError } = await supabase
          .from('empresas')
          .select('id, nome, cnpj');
        
        if (empresasError) throw empresasError;
        empresas.value = empresasData || [];
        
        // Carregar sistemas
        const { data: sistemasData, error: sistemasError } = await supabase
          .from('sistemas')
          .select('id, nome')
          .eq('status', 'ACTIVE');
        
        if (sistemasError) throw sistemasError;
        sistemas.value = sistemasData || [];
        
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        exibirMensagem('Erro ao carregar dados. Tente novamente mais tarde.', 'error');
      }
    };
    
    // Analisar publicação
    const analisarPublicacao = async () => {
      if (!podeAnalisar.value) return;
      
      try {
        analisando.value = true;
        resultadoAnalise.value = null;
        
        const resultado = await analisarTexto(textoPublicacao.value, sistemas.value, empresas.value);
        
        if (resultado) {
          resultadoAnalise.value = resultado;
          exibirMensagem('Análise concluída com sucesso!', 'success');
        } else {
          exibirMensagem('Não foi possível extrair informações do texto.', 'warning');
        }
      } catch (error) {
        console.error('Erro na análise:', error);
        exibirMensagem('Ocorreu um erro durante a análise.', 'error');
      } finally {
        analisando.value = false;
      }
    };
    
    // Aplicar resultados ao processo
    const aplicarResultados = async () => {
      if (!podeAplicar.value) return;
      
      try {
        aplicando.value = true;
        
        const atualizacao = {};
        
        if (resultadoAnalise.value.empresa_vencedora) {
          atualizacao.empresa_vencedora = resultadoAnalise.value.empresa_vencedora;
        }
        
        if (resultadoAnalise.value.numero_contrato) {
          atualizacao.numero_contrato = resultadoAnalise.value.numero_contrato;
        }
        
        if (resultadoAnalise.value.sistemas_ids && resultadoAnalise.value.sistemas_ids.length > 0) {
          atualizacao.sistemas_implantacao = {
            sistemas_ids: resultadoAnalise.value.sistemas_ids,
            informacoes_adicionais: 'Identificado automaticamente via análise de publicação.'
          };
        }
        
        atualizacao.dados_analise_automatica = 'Dados extraídos por IA em ' + new Date().toLocaleDateString();
        atualizacao.updated_at = new Date().toISOString();
        
        // Registrar usuário que fez a alteração
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          atualizacao.updated_by = user.id;
        }
        
        // Atualizar o processo
        const { error } = await supabase
          .from('processos')
          .update(atualizacao)
          .eq('id', processoSelecionado.value);
        
        if (error) throw error;
        
        exibirMensagem('Dados aplicados com sucesso ao processo!', 'success');
        limparCampos();
        await carregarDados();
        
      } catch (error) {
        console.error('Erro ao aplicar resultados:', error);
        exibirMensagem('Erro ao aplicar resultados ao processo.', 'error');
      } finally {
        aplicando.value = false;
      }
    };
    
    // Limpar campos
    const limparCampos = () => {
      processoSelecionado.value = '';
      textoPublicacao.value = '';
      resultadoAnalise.value = null;
    };
    
    // Função para lidar com toggle da sidebar
    const handleSidebarToggle = (expanded) => {
      isSidebarExpanded.value = expanded;
    };
    
    // Ao montar o componente
    onMounted(() => {
      carregarDados();
    });
    
    return {
      isSidebarExpanded,
      processos,
      processosFiltrados,
      processoSelecionado,
      textoPublicacao,
      resultadoAnalise,
      analisando,
      aplicando,
      mostrarMensagem,
      mensagem,
      tipoMensagem,
      podeAnalisar,
      podeAplicar,
      empresaEncontrada,
      sistemasMencionados,
      handleSidebarToggle,
      analisarPublicacao,
      aplicarResultados,
      limparCampos
    };
  }
}
</script>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
}

.main-content {
  flex: 1;
  padding: 20px;
  transition: margin-left 0.3s;
  overflow-y: auto;
}

.main-content.expanded {
  margin-left: 0;
}

.header {
  margin-bottom: 20px;
}

.subtitle {
  color: #666;
  font-size: 1.1rem;
  margin-top: 5px;
}

.content-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

@media (max-width: 1200px) {
  .content-container {
    grid-template-columns: 1fr;
  }
}

.input-section, .results-section {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 25px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.full-width {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

textarea.full-width {
  resize: vertical;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn-primary, .btn-secondary, .btn-success {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: #2196f3;
  color: white;
}

.btn-primary:hover {
  background-color: #1976d2;
}

.btn-primary:disabled {
  background-color: #b3e0ff;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
}

.btn-success {
  background-color: #4caf50;
  color: white;
}

.btn-success:hover {
  background-color: #388e3c;
}

.btn-success:disabled {
  background-color: #a5d6a7;
  cursor: not-allowed;
}

.btn-icon {
  width: 18px;
  height: 18px;
  margin-right: 8px;
}

.spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  margin-right: 8px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.result-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.result-group {
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 15px;
}

.result-group h3 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #333;
  font-size: 1rem;
}

.result-value {
  background-color: #f9f9f9;
  padding: 12px;
  border-radius: 4px;
  min-height: 50px;
}

.result-value p {
  margin: 0;
}

.not-found {
  color: #999;
  font-style: italic;
}

.sistema-item {
  background-color: #e3f2fd;
  padding: 5px 10px;
  border-radius: 4px;
  margin-bottom: 5px;
  display: inline-block;
  margin-right: 5px;
}

.toast-message {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 4px;
  color: white;
  font-weight: 500;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.toast-message.info {
  background-color: #2196f3;
}

.toast-message.success {
  background-color: #4caf50;
}

.toast-message.warning {
  background-color: #ff9800;
}

.toast-message.error {
  background-color: #f44336;
}
</style>