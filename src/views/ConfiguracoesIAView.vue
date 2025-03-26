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
        <div class="config-section">
          <h2>Configurações do Modelo</h2>
          
          <div class="form-group switch-group">
            <label>
              <span>Ativar modelo avançado de IA</span>
              <div class="toggle-switch">
                <input 
                  type="checkbox" 
                  id="modelo-avancado" 
                  v-model="configuracoes.ia_avancada_ativa"
                >
                <span class="slider round"></span>
              </div>
            </label>
            <p class="form-help">
              Quando ativado, o sistema utilizará um modelo avançado de IA para análise de publicações.
              É necessário configurar uma chave API válida.
            </p>
          </div>
          
          <div class="form-group" v-if="configuracoes.ia_avancada_ativa">
            <label for="modelo-ia">Modelo de IA</label>
            <select 
              id="modelo-ia" 
              v-model="configuracoes.modelo_ia" 
              class="full-width"
            >
              <option value="openai">OpenAI (GPT-4/GPT-3.5)</option>
              <option value="local">Modelo Local (Ollama)</option>
              <option value="mistral">Mistral AI</option>
              <option value="together">Together.ai</option>
            </select>
            <p class="form-help">
              Selecione o modelo de IA a ser utilizado. Modelos locais não têm custo por token.
            </p>
          </div>

          <div v-if="configuracoes.ia_avancada_ativa && configuracoes.modelo_ia === 'openai'">
            <div class="form-group">
              <label for="api-key">Chave API OpenAI</label>
              <div class="input-with-buttons">
                <input 
                  :type="mostrarChave ? 'text' : 'password'" 
                  id="api-key" 
                  v-model="configuracoes.openai_api_key"
                  placeholder="sk-..." 
                  class="full-width"
                >
                <button class="btn-icon-only" @click="mostrarChave = !mostrarChave">
                  <img :src="mostrarChave ? '/icons/eye-off.svg' : '/icons/eye.svg'" alt="Mostrar/Ocultar">
                </button>
              </div>
              <p class="form-help">
                Obtenha uma chave API em <a href="https://platform.openai.com/api-keys" target="_blank">platform.openai.com</a>
              </p>
            </div>
          </div>

          <div v-if="configuracoes.ia_avancada_ativa && configuracoes.modelo_ia === 'local'">
            <div class="form-group">
              <label>URL do Servidor Ollama</label>
              <input 
                type="text" 
                v-model="configuracoes.ollama_url" 
                class="full-width"
                placeholder="http://localhost:11434"
              >
              <p class="form-help">
                Endereço do servidor Ollama local ou remoto (padrão: http://localhost:11434)
              </p>
            </div>
            
            <div class="form-group">
              <label>Modelo</label>
              <select v-model="configuracoes.ollama_modelo" class="full-width">
                <option value="mistral">Mistral (recomendado)</option>
                <option value="llama2">Llama 2</option>
                <option value="orca-mini">Orca Mini</option>
              </select>
              <p class="form-help">
                Modelo a ser usado no Ollama. Certifique-se de tê-lo baixado usando o comando: ollama pull [modelo]
              </p>
            </div>
            
            <div class="form-group">
              <button @click="testarConexaoLocal" class="btn-secondary">
                <span v-if="testando" class="spinner"></span>
                {{ testando ? 'Testando...' : 'Verificar Disponibilidade' }}
              </button>
            </div>
          </div>
          
          <div class="form-group" v-if="configuracoes.ia_avancada_ativa">
            <label for="historico-limite">Limite de histórico para contexto</label>
            <input 
              type="number" 
              id="historico-limite" 
              v-model.number="configuracoes.limite_historico_analises"
              min="1" 
              max="20" 
              class="full-width"
            >
            <p class="form-help">
              Número de análises históricas que serão usadas como contexto para melhorar a precisão.
            </p>
          </div>
          
          <div class="actions">
            <button 
              @click="salvarConfiguracoes" 
              class="btn-primary" 
              :disabled="salvando"
            >
              <span v-if="salvando" class="spinner"></span>
              {{ salvando ? 'Salvando...' : 'Salvar Configurações' }}
            </button>
            
            <button 
              @click="testarConexao" 
              class="btn-secondary" 
              :disabled="testando || !configuracoes.ia_avancada_ativa || !configuracoes.openai_api_key"
            >
              <span v-if="testando" class="spinner"></span>
              {{ testando ? 'Testando...' : 'Testar Conexão' }}
            </button>

            <button @click="testarConexaoOllama" class="btn-secondary">
              <span v-if="testando" class="spinner"></span>
              {{ testando ? 'Testando...' : 'Verificar Disponibilidade do Ollama' }}
            </button>
          </div>
        </div>
        
        <!-- Estatísticas de Precisão -->
        <div class="stats-section">
          <h2>Estatísticas de Precisão</h2>
          
          <div v-if="carregandoEstatisticas" class="loading-stats">
            <div class="spinner"></div>
            <p>Carregando estatísticas...</p>
          </div>
          
          <div v-else-if="estatisticas.length > 0" class="stats-container">
            <div class="stats-header">
              <div>Campo</div>
              <div>Precisão</div>
              <div>Total de análises</div>
            </div>
            
            <div 
              v-for="estat in estatisticas" 
              :key="estat.campo" 
              class="stats-row"
            >
              <div class="campo-nome">{{ formatarNomeCampo(estat.campo) }}</div>
              <div class="precisao-valor">
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :style="{ width: estat.taxa_precisao + '%' }"
                    :class="getClassePrecisao(estat.taxa_precisao)"
                  ></div>
                </div>
                <span>{{ estat.taxa_precisao }}%</span>
              </div>
              <div class="total-analises">
                {{ estat.analises_corretas }} / {{ estat.total_analises }}
              </div>
            </div>
            
            <div class="stats-summary">
              <p>
                <strong>Precisão média:</strong> 
                {{ calcularPrecisaoMedia().toFixed(2) }}%
              </p>
              <p>
                <strong>Total de análises:</strong> 
                {{ calcularTotalAnalises() }}
              </p>
            </div>
          </div>
          
          <div v-else class="no-stats">
            <p>Não há estatísticas disponíveis ainda.</p>
            <p>As estatísticas serão geradas à medida que os usuários fornecerem feedback sobre as análises automáticas.</p>
          </div>
          
          <div class="actions">
            <button @click="carregarEstatisticas" class="btn-outline">
              <img src="/icons/refresh.svg" alt="Atualizar" class="btn-icon" />
              Atualizar Estatísticas
            </button>
          </div>
        </div>
        
        <!-- Gerenciamento de Padrões -->
        <div class="patterns-section">
          <h2>Gerenciamento de Padrões</h2>
          
          <div class="form-group">
            <label for="tipo-campo">Tipo de Campo</label>
            <select id="tipo-campo" v-model="novoPadrao.tipo_campo" class="full-width">
              <option value="">Selecione um tipo...</option>
              <option value="numero_processo">Número de Processo</option>
              <option value="orgao">Órgão</option>
              <option value="municipio">Município</option>
              <option value="estado">Estado/UF</option>
              <option value="numero_contrato">Número de Contrato</option>
            </select>
          </div>
          
          <div class="form-group" v-if="novoPadrao.tipo_campo">
            <label for="valor-padrao">Valor do Padrão</label>
            <input 
              type="text" 
              id="valor-padrao" 
              v-model="novoPadrao.valor" 
              class="full-width"
              placeholder="Digite o valor do padrão..."
            >
          </div>
          
          <div class="form-group" v-if="novoPadrao.tipo_campo === 'numero_processo'">
            <label for="regex-pattern">Padrão Regex (opcional)</label>
            <input 
              type="text" 
              id="regex-pattern" 
              v-model="novoPadrao.regex_pattern" 
              class="full-width"
              placeholder="Ex: \\d{5}\\.\\d{6}\\/\\d{4}-\\d{2}"
            >
            <p class="form-help">
              Expressão regular para identificar este padrão no texto. Útil para formatos específicos.
            </p>
          </div>
          
          <div class="actions">
            <button 
              @click="adicionarNovoPadrao" 
              class="btn-primary" 
              :disabled="!novoPadrao.tipo_campo || !novoPadrao.valor || adicionandoPadrao"
            >
              <span v-if="adicionandoPadrao" class="spinner"></span>
              {{ adicionandoPadrao ? 'Adicionando...' : 'Adicionar Padrão' }}
            </button>
          </div>
          
          <div v-if="padroesSelecionados.length > 0" class="padroes-list">
            <h3>{{ formatarNomeCampo(novoPadrao.tipo_campo) }} - Padrões Existentes</h3>
            
            <div class="padroes-header">
              <div>Valor</div>
              <div>Frequência</div>
              <div>Ações</div>
            </div>
            
            <div 
              v-for="padrao in padroesSelecionados" 
              :key="padrao.id" 
              class="padrao-item"
            >
              <div class="padrao-valor">{{ padrao.valor }}</div>
              <div class="padrao-freq">{{ padrao.frequencia }}</div>
              <div class="padrao-actions">
                <button 
                  @click="removerPadrao(padrao.id)" 
                  class="btn-icon-only danger"
                  :disabled="removendoPadrao === padrao.id"
                >
                  <span v-if="removendoPadrao === padrao.id" class="spinner"></span>
                  <img v-else src="/icons/lixeira.svg" alt="Remover" />
                </button>
              </div>
            </div>
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
import { useIAFeedback } from '@/composables/useIAFeedback';
import { usePadroesCampos } from '@/composables/usePadroesCampos';
import axios from 'axios';

export default {
  name: 'ConfiguracoesIAView',
  
  components: {
    TheSidebar
  },
  
  setup() {
    const isSidebarExpanded = ref(true);
    const configuracoes = ref({
      ia_avancada_ativa: false,
      modelo_ia: 'openai',  // Modelo padrão
      openai_api_key: '',
      ollama_url: 'http://localhost:11434',
      ollama_modelo: 'mistral',
      limite_historico_analises: 5
    });
    const mostrarChave = ref(false);
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
          data.forEach(config => {
            if (config.chave === 'ia_avancada_ativa') {
              configuracoes.value.ia_avancada_ativa = config.valor === 'true';
            } else if (config.chave === 'modelo_ia') {
              configuracoes.value.modelo_ia = config.valor;
            } else if (config.chave === 'openai_api_key') {
              configuracoes.value.openai_api_key = config.valor;
            } else if (config.chave === 'ollama_url') {
              configuracoes.value.ollama_url = config.valor;
            } else if (config.chave === 'ollama_modelo') {
              configuracoes.value.ollama_modelo = config.valor;
            } else if (config.chave === 'limite_historico_analises') {
              configuracoes.value.limite_historico_analises = parseInt(config.valor, 10) || 5;
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
        
        // Atualizar o array de updates para incluir os novos campos
        const updates = [
          { 
            chave: 'ia_avancada_ativa', 
            valor: configuracoes.value.ia_avancada_ativa.toString()
          },
          {
            chave: 'modelo_ia',
            valor: configuracoes.value.modelo_ia
          },
          {
            chave: 'limite_historico_analises',
            valor: configuracoes.value.limite_historico_analises.toString()
          },
          {
            chave: 'ollama_url',
            valor: configuracoes.value.ollama_url
          },
          {
            chave: 'ollama_modelo',
            valor: configuracoes.value.ollama_modelo
          }
        ];
        
        // Apenas atualizar a chave API se ela foi modificada (não está vazia)
        if (configuracoes.value.openai_api_key) {
          updates.push({
            chave: 'openai_api_key',
            valor: configuracoes.value.openai_api_key,
            ultima_atualizacao: new Date().toISOString()
          });
        }
        
        // Atualizar cada configuração
        for (const update of updates) {
          const { error } = await supabase
            .from('configuracoes')
            .update({ valor: update.valor, ultima_atualizacao: update.ultima_atualizacao })
            .eq('chave', update.chave);
          
          if (error) throw error;
        }
        
        exibirMensagem('Configurações salvas com sucesso!', 'success');
      } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        exibirMensagem('Erro ao salvar configurações.', 'error');
      } finally {
        salvando.value = false;
      }
    };
    
    // Função modificada para chamar diretamente a API OpenAI
    const testarConexao = async () => {
      if (!configuracoes.value.openai_api_key) {
        exibirMensagem('Informe uma chave API para testar a conexão.', 'warning');
        return;
      }
      
      try {
        testando.value = true;
        
        // Chamar diretamente a API da OpenAI
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-3.5-turbo', // Um modelo mais barato para simples teste
            messages: [
              { role: 'system', content: 'Você é um assistente útil.' },
              { role: 'user', content: 'Olá, este é um teste de conexão.' }
            ],
            max_tokens: 5 // Limitar tokens para economizar créditos
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${configuracoes.value.openai_api_key}`
            }
          }
        );
        
        // Se chegou aqui, a conexão funcionou
        exibirMensagem('Conexão com a API OpenAI estabelecida com sucesso!', 'success');
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
          exibirMensagem('Sem resposta do servidor OpenAI. Verifique sua conexão.', 'error');
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
        
        const url = configuracoes.value.ollama_url || 'http://localhost:11434';
        const response = await axios.get(`${url}/api/tags`);
        
        if (response.status === 200) {
          // Verificar se o modelo selecionado está disponível
          const modelos = response.data.models || [];
          const modeloSelecionado = configuracoes.value.ollama_modelo || 'mistral';
          
          const modeloDisponivel = modelos.some(m => m.name === modeloSelecionado);
          
          if (modeloDisponivel) {
            exibirMensagem(`Conexão com Ollama estabelecida e modelo ${modeloSelecionado} está disponível!`, 'success');
          } else {
            exibirMensagem(`Conexão com Ollama estabelecida, mas o modelo ${modeloSelecionado} não está instalado. Execute 'ollama pull ${modeloSelecionado}' para baixá-lo.`, 'warning');
          }
        } else {
          exibirMensagem('Servidor Ollama está respondendo, mas com status inesperado.', 'warning');
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
        
        const url = configuracoes.value.ollama_url || 'http://localhost:11434';
        const response = await axios.get(`${url}/api/tags`);
        
        if (response.status === 200) {
          const modelos = response.data.models || [];
          const modeloSelecionado = configuracoes.value.ollama_modelo || 'mistral';
          
          if (modelos.some(m => m.name === modeloSelecionado)) {
            exibirMensagem(`Conexão com Ollama estabelecida e modelo ${modeloSelecionado} está disponível!`, 'success');
          } else {
            exibirMensagem(`Conexão com Ollama estabelecida, mas o modelo ${modeloSelecionado} não está instalado. Execute 'ollama pull ${modeloSelecionado}' para baixá-lo.`, 'warning');
          }
        } else {
          exibirMensagem('Servidor Ollama está respondendo, mas com status inesperado.', 'warning');
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
    
    // Observar mudanças no tipo de campo selecionado para carregar padrões
    watch(() => novoPadrao.value.tipo_campo, (novoTipo) => {
      if (novoTipo) {
        padroesSelecionados.value = padroes.value[novoTipo] || [];
      } else {
        padroesSelecionados.value = [];
      }
    });
    
    // Adicionar novo padrão
    const adicionarNovoPadrao = async () => {
      if (!novoPadrao.value.tipo_campo || !novoPadrao.value.valor) {
        exibirMensagem('Informe o tipo e valor do padrão.', 'warning');
        return;
      }
      
      try {
        adicionandoPadrao.value = true;
        
        await padroesHelper.adicionarPadrao(
          novoPadrao.value.tipo_campo, 
          novoPadrao.value.valor
        );
        
        // Se tem regex, atualizar o padrão
        if (novoPadrao.value.tipo_campo === 'numero_processo' && novoPadrao.value.regex_pattern) {
          // Buscar o padrão recém-adicionado
          const { data } = await supabase
            .from('padroes_campos')
            .select('id')
            .eq('tipo_campo', novoPadrao.value.tipo_campo)
            .eq('valor', novoPadrao.value.valor)
            .single();
          
          if (data) {
            await supabase
              .from('padroes_campos')
              .update({ regex_pattern: novoPadrao.value.regex_pattern })
              .eq('id', data.id);
          }
        }
        
        // Recarregar padrões e limpar formulário
        await carregarPadroes();
        novoPadrao.value.valor = '';
        novoPadrao.value.regex_pattern = '';
        
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
    
    // Formatar nome do campo
    const formatarNomeCampo = (campo) => {
      const mapa = {
        'numero_processo': 'Número de Processo',
        'orgao': 'Órgão',
        'municipio': 'Município',
        'estado': 'Estado/UF',
        'empresa_vencedora': 'Empresa Vencedora',
        'numero_contrato': 'Número do Contrato',
        'data_licitacao': 'Data da Licitação'
      };
      
      return mapa[campo] || campo;
    };
    
    // Obter classe CSS para barra de progresso baseada na taxa de precisão
    const getClassePrecisao = (taxa) => {
      if (taxa >= 80) return 'high';
      if (taxa >= 60) return 'medium';
      return 'low';
    };
    
    // Calcular precisão média
    const calcularPrecisaoMedia = () => {
      if (!estatisticas.value.length) return 0;
      
      const soma = estatisticas.value.reduce((acc, estat) => acc + estat.taxa_precisao, 0);
      return soma / estatisticas.value.length;
    };
    
    // Calcular total de análises
    const calcularTotalAnalises = () => {
      if (!estatisticas.value.length) return 0;
      
      // Usar o primeiro campo como referência, já que o total deve ser o mesmo para todos
      return estatisticas.value[0].total_analises;
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
      mostrarChave,
      salvando,
      testando,
      estatisticas,
      carregandoEstatisticas,
      padroes,
      padroesSelecionados,
      novoPadrao,
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
      formatarNomeCampo,
      getClassePrecisao,
      calcularPrecisaoMedia,
      calcularTotalAnalises,
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

.config-section, .stats-section, .patterns-section {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 25px;
}

h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
  font-size: 1.3rem;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-help {
  color: #666;
  font-size: 0.9rem;
  margin-top: 5px;
}

.full-width {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.switch-group {
  display: flex;
  flex-direction: column;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
  margin-left: 10px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
}

input:checked + .slider {
  background-color: #2196F3;
}

input:focus + .slider {
  box-shadow: 0 0 1px #2196F3;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.slider.round {
  border-radius: 24px;
}

.slider.round:before {
  border-radius: 50%;
}

.input-with-buttons {
  display: flex;
  align-items: center;
}

.input-with-buttons input {
  flex: 1;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.btn-icon-only {
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-left: none;
  height: 42px;
  width: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
}

.btn-icon-only:hover {
  background-color: #e0e0e0;
}

.btn-icon-only img {
  width: 18px;
  height: 18px;
}

.btn-icon-only.danger:hover {
  background-color: #ffebee;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn-primary, .btn-secondary, .btn-outline {
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

.btn-outline {
  background-color: transparent;
  color: #666;
  border: 1px solid #ddd;
}

.btn-outline:hover {
  background-color: #f5f5f5;
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

.btn-secondary .spinner,
.btn-outline .spinner {
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-top-color: #333;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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

/* Estatísticas */
.stats-container {
  background-color: #f9f9f9;
  border-radius: 6px;
  overflow: hidden;
}

.stats-header {
  display: grid;
  grid-template-columns: 1fr 150px 150px;
  background-color: #f0f0f0;
  padding: 12px;
  font-weight: 500;
  color: #333;
}

.stats-row {
  display: grid;
  grid-template-columns: 1fr 150px 150px;
  padding: 12px;
  border-bottom: 1px solid #eee;
}

.stats-row:last-child {
  border-bottom: none;
}

.campo-nome {
  font-weight: 500;
}

.precisao-valor {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-bar {
  flex: 1;
  height: 10px;
  background-color: #e0e0e0;
  border-radius: 5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 5px;
}

.progress-fill.high {
  background-color: #4caf50;
}

.progress-fill.medium {
  background-color: #ff9800;
}

.progress-fill.low {
  background-color: #f44336;
}

.total-analises {
  text-align: center;
}

.stats-summary {
  background-color: #f0f0f0;
  padding: 12px;
  margin-top: 10px;
  border-radius: 6px;
}

.stats-summary p {
  margin: 5px 0;
}

.loading-stats, .no-stats {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px;
  background-color: #f9f9f9;
  border-radius: 6px;
  color: #666;
}

/* Padrões */
.padroes-list {
  margin-top: 30px;
  background-color: #f9f9f9;
  border-radius: 6px;
  overflow: hidden;
}

.padroes-list h3 {
  margin: 0;
  padding: 15px;
  background-color: #f0f0f0;
  color: #333;
  font-size: 1.1rem;
}

.padroes-header {
  display: grid;
  grid-template-columns: 1fr 120px 80px;
  background-color: #f0f0f0;
  padding: 12px 15px;
  font-weight: 500;
  color: #333;
  border-top: 1px solid #ddd;
}

.padrao-item {
  display: grid;
  grid-template-columns: 1fr 120px 80px;
  padding: 12px 15px;
  border-bottom: 1px solid #eee;
  align-items: center;
}

.padrao-item:last-child {
  border-bottom: none;
}

.padrao-valor {
  font-weight: 500;
  word-break: break-word;
}

.padrao-freq {
  text-align: center;
  color: #555;
}

.padrao-actions {
  display: flex;
  justify-content: center;
}

.padrao-actions .btn-icon-only {
  border: none;
  background-color: transparent;
  color: #f44336;
  width: 30px;
  height: 30px;
}

.padrao-actions .btn-icon-only:hover {
  background-color: #ffebee;
}

.padrao-actions .spinner {
  margin-right: 0;
}

@media (max-width: 768px) {
  .stats-header, .stats-row, .padroes-header, .padrao-item {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .stats-header > div:not(:first-child),
  .padroes-header > div:not(:first-child) {
    display: none;
  }
  
  .precisao-valor, .total-analises {
    margin-left: 0;
  }
}
</style>