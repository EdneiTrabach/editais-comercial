<template>
  <div class="layout">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />
    
    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <div class="header">
        <h1>Configurações de IA</h1>
        <p class="subtitle">Configure os modelos de inteligência artificial para análise automática</p>
      </div>
      
      <div class="content-container">
        <!-- Configurações do Modelo -->
        <ModeloIAConfig 
          :configuracoes="configuracoes"
          @salvar="salvarConfiguracoes"
          @testar-conexao="testarConexao"
          @testar-conexao-local="testarConexaoLocal"
          @testar-conexao-ollama="testarConexaoOllama"
          :salvando="salvando"
          :testando="testando"
        />
        
        <!-- Estatísticas de Precisão -->
        <PrecisaoStatistics
          :estatisticas="estatisticas"
          :carregandoEstatisticas="carregandoEstatisticas"
          @atualizar="carregarEstatisticas"
        />
        
        <!-- Gerenciamento de Padrões -->
        <PadroesManager
          :padroes="padroes"
          @adicionar-padrao="adicionarNovoPadrao"
          @remover-padrao="removerPadrao"
          :adicionandoPadrao="adicionandoPadrao"
          :removendoPadrao="removendoPadrao"
        />
      </div>
      
      <div v-if="mostrarMensagem" class="toast-message" :class="tipoMensagem">
        {{ mensagem }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { supabase } from '@/lib/supabase';
import TheSidebar from '@/components/TheSidebar.vue';
import ModeloIAConfig from '@/components/configuracoes/ModeloIAConfig.vue';
import PrecisaoStatistics from '@/components/configuracoes/PrecisaoStatistics.vue';
import PadroesManager from '@/components/configuracoes/PadroesManager.vue';
import { useIAFeedback } from '@/composables/useIAFeedback';
import { usePadroesCampos } from '@/composables/usePadroesCampos';
import axios from 'axios';
import { ollamaService } from '@/services/ollamaService';
import { iaService } from '@/services/iaService';

export default {
  name: 'ConfiguracoesIAView',
  
  components: {
    TheSidebar,
    ModeloIAConfig,
    PrecisaoStatistics,
    PadroesManager
  },
  
  setup() {
    const isSidebarExpanded = ref(true);
    const configuracoes = ref({
      ia_avancada_ativa: false,
      modelo_ia: 'openai',
      openai_api_key: '',
      ollama_url: 'http://localhost:11434',
      ollama_modelo: 'gemma3:1b', // Alterado para gemma3:1b como padrão
      limite_historico_analises: 5,
      // Novos modelos adicionados
      claude_api_key: '',
      claude_modelo: 'claude-3-sonnet-20240229',
      gemini_api_key: '',
      gemini_modelo: 'gemini-1.5-pro',
      deepseek_api_key: '',
      deepseek_modelo: 'deepseek-chat',
      copilot_api_key: '',
      mistral_api_key: '',
      mistral_modelo: 'mistral-medium'
    });
    const salvando = ref(false);
    const testando = ref(false);
    const estatisticas = ref([]);
    const carregandoEstatisticas = ref(false);
    const padroes = ref({});
    const padroesSelecionados = ref([]);
    const novoPadrao = ref({
      tipo_campo: '',
      valor: '',
      regex_pattern: ''
    });
    const adicionandoPadrao = ref(false);
    const removendoPadrao = ref(null);
    const mostrarMensagem = ref(false);
    const mensagem = ref('');
    const tipoMensagem = ref('info');
    
    const { obterEstatisticasPrecisao } = useIAFeedback();
    const padroesHelper = usePadroesCampos();
    
    // Carregar configurações
    const carregarConfiguracoes = async () => {
      try {
        const { data, error } = await supabase
          .from('configuracoes')
          .select('chave, valor');
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          // Mapear entre as chaves do banco de dados e as propriedades do objeto de configuração
          const mapeamento = {
            'ia_avancada_ativa': (valor) => configuracoes.value.ia_avancada_ativa = valor === 'true',
            'modelo_ia': (valor) => configuracoes.value.modelo_ia = valor,
            'openai_api_key': (valor) => configuracoes.value.openai_api_key = valor,
            'ollama_url': (valor) => configuracoes.value.ollama_url = valor,
            'ollama_modelo': (valor) => configuracoes.value.ollama_modelo = valor,
            'limite_historico_analises': (valor) => configuracoes.value.limite_historico_analises = parseInt(valor, 10) || 5,
            'claude_api_key': (valor) => configuracoes.value.claude_api_key = valor,
            'claude_modelo': (valor) => configuracoes.value.claude_modelo = valor,
            'gemini_api_key': (valor) => configuracoes.value.gemini_api_key = valor,
            'gemini_modelo': (valor) => configuracoes.value.gemini_modelo = valor,
            'deepseek_api_key': (valor) => configuracoes.value.deepseek_api_key = valor,
            'deepseek_modelo': (valor) => configuracoes.value.deepseek_modelo = valor,
            'copilot_api_key': (valor) => configuracoes.value.copilot_api_key = valor,
            'mistral_api_key': (valor) => configuracoes.value.mistral_api_key = valor,
            'mistral_modelo': (valor) => configuracoes.value.mistral_modelo = valor
          };
          
          data.forEach(config => {
            if (mapeamento[config.chave]) {
              mapeamento[config.chave](config.valor);
            }
          });
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        exibirMensagem('Erro ao carregar configurações.', 'error');
      }
    };
    
    // Salvar configurações
    const salvarConfiguracoes = async () => {
      try {
        salvando.value = true;
        
        // Criar um array com todas as configurações para salvar
        const todasConfiguracoes = [
          { chave: 'ia_avancada_ativa', valor: configuracoes.value.ia_avancada_ativa.toString() },
          { chave: 'modelo_ia', valor: configuracoes.value.modelo_ia },
          { chave: 'limite_historico_analises', valor: configuracoes.value.limite_historico_analises.toString() },
          { chave: 'ollama_url', valor: configuracoes.value.ollama_url },
          { chave: 'ollama_modelo', valor: configuracoes.value.ollama_modelo },
          { chave: 'claude_modelo', valor: configuracoes.value.claude_modelo },
          { chave: 'gemini_modelo', valor: configuracoes.value.gemini_modelo },
          { chave: 'deepseek_modelo', valor: configuracoes.value.deepseek_modelo },
          { chave: 'mistral_modelo', valor: configuracoes.value.mistral_modelo }
        ];
        
        // Adicionar chaves de API apenas se estiverem presentes
        const apiKeys = [
          { chave: 'openai_api_key', valor: configuracoes.value.openai_api_key },
          { chave: 'claude_api_key', valor: configuracoes.value.claude_api_key },
          { chave: 'gemini_api_key', valor: configuracoes.value.gemini_api_key },
          { chave: 'deepseek_api_key', valor: configuracoes.value.deepseek_api_key },
          { chave: 'copilot_api_key', valor: configuracoes.value.copilot_api_key },
          { chave: 'mistral_api_key', valor: configuracoes.value.mistral_api_key }
        ];
        
        for (const apiKey of apiKeys) {
          if (apiKey.valor) {
            todasConfiguracoes.push({
              ...apiKey,
              ultima_atualizacao: new Date().toISOString()
            });
          }
        }
        
        // Atualizar cada configuração no banco de dados
        for (const config of todasConfiguracoes) {
          const { error } = await supabase
            .from('configuracoes')
            .update({ 
              valor: config.valor, 
              ultima_atualizacao: config.ultima_atualizacao 
            })
            .eq('chave', config.chave);
          
          // Se a entrada não existir, insira uma nova
          if (error && error.code === 'PGRST116') {
            const { error: insertError } = await supabase
              .from('configuracoes')
              .insert({
                chave: config.chave,
                valor: config.valor,
                ultima_atualizacao: config.ultima_atualizacao || new Date().toISOString()
              });
            
            if (insertError) throw insertError;
          } else if (error) {
            throw error;
          }
        }
        
        exibirMensagem('Configurações salvas com sucesso!', 'success');
      } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        exibirMensagem('Erro ao salvar configurações.', 'error');
      } finally {
        salvando.value = false;
      }
    };
    
    // Função para testar conexão com o provedor selecionado
    const testarConexao = async () => {
      try {
        testando.value = true;
        
        let mensagemSucesso = 'Conexão estabelecida com sucesso!';
        let provedor = configuracoes.value.modelo_ia;
        
        if (provedor === 'local') {
          // Para Ollama, usamos o testarConexaoOllama
          await testarConexaoOllama();
          return;
        }
        
        // Verificar se a chave API está configurada
        const chavesAPI = {
          'openai': configuracoes.value.openai_api_key,
          'claude': configuracoes.value.claude_api_key,
          'mistral': configuracoes.value.mistral_api_key,
          'gemini': configuracoes.value.gemini_api_key,
          'deepseek': configuracoes.value.deepseek_api_key,
          'copilot': configuracoes.value.copilot_api_key
        };
        
        if (!chavesAPI[provedor]) {
          exibirMensagem(`Informe uma chave API para o provedor ${provedor}.`, 'warning');
          return;
        }
        
        // Obter o cliente do provedor selecionado
        const cliente = iaService.getProvedor(provedor, configuracoes.value);
        await cliente.testarConexao();
        
        exibirMensagem(`Conexão com ${provedor.toUpperCase()} estabelecida com sucesso!`, 'success');
      } catch (error) {
        console.error('Erro ao testar conexão:', error);
        
        if (error.response) {
          if (error.response.status === 401) {
            exibirMensagem('Chave API inválida. Verifique e tente novamente.', 'error');
          } else if (error.response.data && error.response.data.error) {
            exibirMensagem(`Erro da API: ${error.response.data.error.message}`, 'error');
          } else {
            exibirMensagem(`Erro ${error.response.status}: ${error.response.statusText}`, 'error');
          }
        } else if (error.request) {
          exibirMensagem('Sem resposta do servidor. Verifique sua conexão.', 'error');
        } else {
          exibirMensagem('Erro na requisição: ' + error.message, 'error');
        }
      } finally {
        testando.value = false;
      }
    };

    const testarConexaoLocal = async () => {
      try {
        testando.value = true;
        
        // Usar ollamaService que já está configurado para usar o proxy
        const modelos = await ollamaService.getModelos();
        const modeloSelecionado = configuracoes.value.ollama_modelo || 'gemma3:1b';
        
        const modeloDisponivel = modelos.some(m => m.name === modeloSelecionado);
        
        if (modeloDisponivel) {
          exibirMensagem(`Conexão com Ollama estabelecida e modelo ${modeloSelecionado} está disponível!`, 'success');
        } else {
          exibirMensagem(`Conexão com Ollama estabelecida, mas o modelo ${modeloSelecionado} não está instalado. Execute 'ollama pull ${modeloSelecionado}' para baixá-lo.`, 'warning');
        }
      } catch (error) {
        console.error('Erro ao testar conexão com Ollama:', error);
        exibirMensagem('Não foi possível conectar ao servidor Ollama. Verifique se ele está instalado e rodando.', 'error');
      } finally {
        testando.value = false;
      }
    };

    const testarConexaoOllama = async () => {
      try {
        testando.value = true;
        
        // Usar ollamaService que já está configurado para usar o proxy
        const modelos = await ollamaService.getModelos();
        const modeloSelecionado = configuracoes.value.ollama_modelo || 'gemma3:1b';
        
        if (modelos.some(m => m.name === modeloSelecionado)) {
          exibirMensagem(`Conexão com Ollama estabelecida e modelo ${modeloSelecionado} está disponível!`, 'success');
        } else {
          exibirMensagem(`Conexão com Ollama estabelecida, mas o modelo ${modeloSelecionado} não está instalado. Execute 'ollama pull ${modeloSelecionado}' para baixá-lo.`, 'warning');
        }
      } catch (error) {
        console.error('Erro ao testar conexão com Ollama:', error);
        exibirMensagem('Não foi possível conectar ao servidor Ollama. Verifique se está rodando com o comando "ollama serve".', 'error');
      } finally {
        testando.value = false;
      }
    };
    
    // Carregar estatísticas de precisão
    const carregarEstatisticas = async () => {
      try {
        carregandoEstatisticas.value = true;
        const data = await obterEstatisticasPrecisao();
        estatisticas.value = data;
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        exibirMensagem('Erro ao carregar estatísticas de precisão.', 'error');
      } finally {
        carregandoEstatisticas.value = false;
      }
    };
    
    // Carregar padrões
    const carregarPadroes = async () => {
      try {
        await padroesHelper.carregarPadroes(100);
        padroes.value = padroesHelper.padroes.value;
      } catch (error) {
        console.error('Erro ao carregar padrões:', error);
        exibirMensagem('Erro ao carregar padrões.', 'error');
      }
    };
    
    // Adicionar novo padrão
    const adicionarNovoPadrao = async (novoPadrao) => {
      if (!novoPadrao.tipo_campo || !novoPadrao.valor) {
        exibirMensagem('Informe o tipo e valor do padrão.', 'warning');
        return;
      }
      
      try {
        adicionandoPadrao.value = true;
        
        await padroesHelper.adicionarPadrao(
          novoPadrao.tipo_campo, 
          novoPadrao.valor
        );
        
        // Se tem regex, atualizar o padrão
        if (novoPadrao.tipo_campo === 'numero_processo' && novoPadrao.regex_pattern) {
          // Buscar o padrão recém-adicionado
          const { data } = await supabase
            .from('padroes_campos')
            .select('id')
            .eq('tipo_campo', novoPadrao.tipo_campo)
            .eq('valor', novoPadrao.valor)
            .single();
          
          if (data) {
            await supabase
              .from('padroes_campos')
              .update({ regex_pattern: novoPadrao.regex_pattern })
              .eq('id', data.id);
          }
        }
        
        // Recarregar padrões
        await carregarPadroes();
        
        exibirMensagem('Padrão adicionado com sucesso!', 'success');
      } catch (error) {
        console.error('Erro ao adicionar padrão:', error);
        exibirMensagem('Erro ao adicionar padrão.', 'error');
      } finally {
        adicionandoPadrao.value = false;
      }
    };
    
    // Remover padrão
    const removerPadrao = async (id) => {
      try {
        removendoPadrao.value = id;
        
        const { error } = await supabase
          .from('padroes_campos')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        
        // Recarregar padrões
        await carregarPadroes();
        
        exibirMensagem('Padrão removido com sucesso!', 'success');
      } catch (error) {
        console.error('Erro ao remover padrão:', error);
        exibirMensagem('Erro ao remover padrão.', 'error');
      } finally {
        removendoPadrao.value = null;
      }
    };
    
    // Exibir mensagem
    const exibirMensagem = (msg, tipo = 'info') => {
      mensagem.value = msg;
      tipoMensagem.value = tipo;
      mostrarMensagem.value = true;
      
      setTimeout(() => {
        mostrarMensagem.value = false;
      }, 5000);
    };
    
    // Função para lidar com toggle da sidebar
    const handleSidebarToggle = (expanded) => {
      isSidebarExpanded.value = expanded;
    };
    
    // Ao montar o componente
    onMounted(() => {
      carregarConfiguracoes();
      carregarEstatisticas();
      carregarPadroes();
    });
    
    return {
      isSidebarExpanded,
      configuracoes,
      salvando,
      testando,
      estatisticas,
      carregandoEstatisticas,
      padroes,
      adicionandoPadrao,
      removendoPadrao,
      mostrarMensagem,
      mensagem,
      tipoMensagem,
      salvarConfiguracoes,
      testarConexao,
      testarConexaoLocal,
      testarConexaoOllama,
      carregarEstatisticas,
      adicionarNovoPadrao,
      removerPadrao,
      handleSidebarToggle
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
  grid-template-columns: 1fr;
  gap: 30px;
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