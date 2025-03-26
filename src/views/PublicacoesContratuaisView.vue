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
              @click="identificarProcesso" 
              class="btn-primary" 
              :disabled="!podeIdentificar || identificando"
            >
              <img src="/icons/search-line.svg" alt="Identificar" class="btn-icon" v-if="!identificando" />
              <span v-if="identificando" class="spinner"></span>
              {{ identificando ? 'Identificando...' : 'Identificar Processo' }}
            </button>
            
            <button 
              @click="analisarPublicacao" 
              class="btn-secondary" 
              :disabled="!podeAnalisar || analisando"
            >
              <img src="/icons/search-line.svg" alt="Analisar" class="btn-icon" v-if="!analisando" />
              <span v-if="analisando" class="spinner"></span>
              {{ analisando ? 'Analisando...' : 'Analisar Detalhes' }}
            </button>
            
            <button @click="limparCampos" class="btn-outline">
              <img src="/icons/lixeira.svg" alt="Limpar" class="btn-icon" />
              Limpar
            </button>
          </div>
          
          <!-- Área de resultados da identificação automática -->
          <div v-if="processoSugestoes.length > 0" class="processo-sugestoes">
            <h3>Processos Identificados</h3>
            <p class="sugestao-info">Selecione o processo correto correspondente à publicação:</p>
            
            <div class="sugestoes-list">
              <div 
                v-for="processo in sugestoesExibidas" 
                :key="processo.id" 
                class="sugestao-item"
                :class="{ 'selected': processoSelecionado === processo.id }"
                @click="selecionarProcesso(processo.id)"
              >
                <div class="sugestao-header">
                  <strong>{{ processo.numero_processo }}</strong>
                  <span class="badge" :class="'nivel-' + getNivelClasse(processo.pontuacao)">
                    {{ formatarNivel(processo.pontuacao) }}
                  </span>
                </div>
                <div class="sugestao-details">
                  <div><strong>Órgão:</strong> {{ processo.orgao }}</div>
                  <div><strong>Município:</strong> {{ processo.municipio || 'Não informado' }}</div>
                  <div><strong>Data:</strong> {{ formatarData(processo.data_pregao) }}</div>
                  <div><strong>Modalidade:</strong> {{ formatarModalidade(processo.modalidade) }}</div>
                </div>
              </div>
            </div>
            
            <div v-if="processoSugestoes.length > 3" class="ver-mais">
              <button @click="mostrarTodasSugestoes = !mostrarTodasSugestoes" class="btn-text">
                {{ mostrarTodasSugestoes ? 'Mostrar menos' : `Ver mais ${processoSugestoes.length - 3} sugestões` }}
              </button>
            </div>
          </div>
          
          <div v-else-if="processoBuscaRealizada" class="sem-resultados">
            <p>Nenhum processo correspondente foi encontrado automaticamente.</p>
            <p>Você pode selecionar um processo manualmente:</p>
            
            <div class="form-group mt-3">
              <label for="processo-select">Selecione o Processo Manualmente:</label>
              <select id="processo-select" v-model="processoSelecionado" class="full-width">
                <option value="">Selecione um processo...</option>
                <option v-for="processo in processosFiltrados" :key="processo.id" :value="processo.id">
                  {{ processo.numero_processo }} - {{ processo.orgao }} ({{ formatarData(processo.data_pregao) }})
                </option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="results-section" v-if="resultadoAnalise">
          <h2>Resultados da Análise</h2>
          
          <div class="processo-selecionado" v-if="processoAtual">
            <h3>Processo Relacionado</h3>
            <div class="processo-info">
              <div><strong>Número:</strong> {{ processoAtual.numero_processo }}</div>
              <div><strong>Órgão:</strong> {{ processoAtual.orgao }}</div>
              <div><strong>Data:</strong> {{ formatarData(processoAtual.data_pregao) }}</div>
            </div>
          </div>
          
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
            
            <div class="result-group" v-if="resultadoAnalise.numero_processo || resultadoAnalise.orgao || resultadoAnalise.municipio || resultadoAnalise.estado">
              <h3>Informações Adicionais Extraídas</h3>
              <div class="result-value">
                <div v-if="resultadoAnalise.numero_processo" class="info-item">
                  <strong>Número do Processo:</strong> {{ resultadoAnalise.numero_processo }}
                </div>
                <div v-if="resultadoAnalise.orgao" class="info-item">
                  <strong>Órgão:</strong> {{ resultadoAnalise.orgao }}
                </div>
                <div v-if="resultadoAnalise.municipio" class="info-item">
                  <strong>Município:</strong> {{ resultadoAnalise.municipio }}
                </div>
                <div v-if="resultadoAnalise.estado" class="info-item">
                  <strong>Estado:</strong> {{ resultadoAnalise.estado }}
                </div>
                <div v-if="resultadoAnalise.data_licitacao" class="info-item">
                  <strong>Data da Licitação:</strong> {{ formatarData(resultadoAnalise.data_licitacao) }}
                </div>
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

          <div class="feedback-section" v-if="resultadoAnalise && ultimaAnaliseId">
            <h3>Avaliação da Análise Automática</h3>
            <p>Sua avaliação nos ajuda a melhorar a precisão do sistema.</p>
            
            <div class="feedback-options">
              <button 
                @click="enviarFeedback(true)" 
                class="btn-outline btn-feedback" 
                :class="{ 'active': feedbackCorreto === true }"
                :disabled="enviandoFeedback"
              >
                <img src="/icons/check.svg" alt="Correto" class="btn-icon" />
                A análise está correta
              </button>
              
              <button 
                @click="abrirFormCorrecao" 
                class="btn-outline btn-feedback" 
                :class="{ 'active': feedbackCorreto === false }"
                :disabled="enviandoFeedback"
              >
                <img src="/icons/edicao.svg" alt="Corrigir" class="btn-icon" />
                Precisa de correções
              </button>
            </div>
            
            <div v-if="mostrarFormCorrecao" class="feedback-form">
              <h4>Enviar correções</h4>
              
              <div class="form-group">
                <label>Número do Processo:</label>
                <input 
                  v-model="correcoes.numero_processo" 
                  type="text" 
                  class="full-width"
                  :placeholder="resultadoAnalise.numero_processo || 'Não identificado'"
                />
              </div>
              
              <div class="form-group">
                <label>Órgão:</label>
                <input 
                  v-model="correcoes.orgao" 
                  type="text" 
                  class="full-width"
                  :placeholder="resultadoAnalise.orgao || 'Não identificado'"
                />
              </div>
              
              <div class="form-group">
                <label>Município:</label>
                <input 
                  v-model="correcoes.municipio" 
                  type="text" 
                  class="full-width"
                  :placeholder="resultadoAnalise.municipio || 'Não identificado'"
                />
              </div>
              
              <div class="form-group">
                <label>Estado (UF):</label>
                <input 
                  v-model="correcoes.estado" 
                  type="text" 
                  class="full-width"
                  :placeholder="resultadoAnalise.estado || 'Não identificado'"
                />
              </div>
              
              <div class="form-group">
                <label>Empresa Vencedora:</label>
                <select 
                  v-model="correcoes.empresa_vencedora" 
                  class="full-width"
                >
                  <option value="">Selecione a empresa...</option>
                  <option v-for="empresa in empresas" :key="empresa.id" :value="empresa.id">
                    {{ empresa.nome }}
                  </option>
                </select>
              </div>
              
              <div class="form-group">
                <label>Número do Contrato:</label>
                <input 
                  v-model="correcoes.numero_contrato" 
                  type="text" 
                  class="full-width"
                  :placeholder="resultadoAnalise.numero_contrato || 'Não identificado'"
                />
              </div>
              
              <div class="actions">
                <button 
                  @click="enviarFeedback(false, correcoes)" 
                  class="btn-primary" 
                  :disabled="enviandoFeedback"
                >
                  <span v-if="enviandoFeedback" class="spinner"></span>
                  {{ enviandoFeedback ? 'Enviando...' : 'Enviar correções' }}
                </button>
                <button 
                  @click="cancelarCorrecao" 
                  class="btn-outline"
                  :disabled="enviandoFeedback"
                >
                  Cancelar
                </button>
              </div>
            </div>
            
            <div v-if="feedbackEnviado" class="feedback-success">
              <img src="/icons/check.svg" alt="Sucesso" class="btn-icon" />
              Obrigado pelo feedback! Suas contribuições ajudam a melhorar nosso sistema.
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
import { useIAAnalyzer } from '@/composables/useIAAnalyzer';
import { useIAFeedback } from '@/composables/useIAFeedback'; // Nova importação

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
    const identificando = ref(false);
    const aplicando = ref(false);
    const mostrarMensagem = ref(false);
    const mensagem = ref('');
    const tipoMensagem = ref('');
    const processoSugestoes = ref([]);
    const processoBuscaRealizada = ref(false);
    const mostrarTodasSugestoes = ref(false);
    const feedbackCorreto = ref(null);
    const mostrarFormCorrecao = ref(false);
    const correcoes = ref({
      numero_processo: '',
      orgao: '',
      municipio: '',
      estado: '',
      empresa_vencedora: '',
      numero_contrato: ''
    });
    const feedbackEnviado = ref(false);
    
    const { analisarTexto, extrairNumeroProcesso, extrairOrgao, ultimaAnaliseId } = useIAAnalyzer();
    const { registrarFeedback, enviandoFeedback: envFeedback } = useIAFeedback();
    
    // Usar a ref de enviandoFeedback do composable
    const enviandoFeedback = envFeedback;
    
    // Computed properties
    const processosFiltrados = computed(() => {
      return processos.value.filter(p => 
        !p.empresa_vencedora || 
        !p.numero_contrato || 
        (p.status !== 'ganhamos' && p.status !== 'perdemos')
      );
    });
    
    const processoAtual = computed(() => {
      if (!processoSelecionado.value) return null;
      return processos.value.find(p => p.id === processoSelecionado.value);
    });
    
    const podeIdentificar = computed(() => {
      return textoPublicacao.value.trim().length > 80;
    });
    
    const podeAnalisar = computed(() => {
      return processoSelecionado.value && textoPublicacao.value.trim().length > 50;
    });
    
    const podeAplicar = computed(() => {
      return processoSelecionado.value && resultadoAnalise.value && (
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
    
    const sugestoesExibidas = computed(() => {
      if (mostrarTodasSugestoes.value) {
        return processoSugestoes.value;
      }
      return processoSugestoes.value.slice(0, 3);
    });
    
    // Funções auxiliares
    const formatarData = (dataStr) => {
      if (!dataStr) return 'Data não informada';
      
      try {
        const data = new Date(dataStr);
        return data.toLocaleDateString('pt-BR');
      } catch (error) {
        return dataStr;
      }
    };
    
    const formatarModalidade = (modalidade) => {
      const modalidadesMap = {
        'pregao_eletronico': 'Pregão Eletrônico',
        'pregao_presencial': 'Pregão Presencial',
        'tomada_precos': 'Tomada de Preços',
        'concorrencia': 'Concorrência',
        'convite': 'Convite',
        'dispensa': 'Dispensa',
        'inexigibilidade': 'Inexigibilidade',
        'leilao': 'Leilão',
        'rdc': 'RDC',
        'rdc_eletronico': 'RDC Eletrônico'
      };
      
      return modalidadesMap[modalidade] || modalidade;
    };
    
    const formatarNivel = (pontuacao) => {
      if (pontuacao >= 100) return 'Alta compatibilidade';
      if (pontuacao >= 70) return 'Boa compatibilidade';
      return 'Possível compatibilidade';
    };
    
    const getNivelClasse = (pontuacao) => {
      if (pontuacao >= 100) return 'alto';
      if (pontuacao >= 70) return 'medio';
      return 'baixo';
    };
    
    // Watch processoSelecionado para lidar com mudanças de seleção
    watch(processoSelecionado, async (novoId) => {
      if (novoId) {
        const processo = processos.value.find(p => p.id === novoId);
        if (processo) {
          // Se já temos uma análise e apenas trocamos de processo, mantemos a análise
          if (!resultadoAnalise.value) {
            // Se o processo já tem uma publicação salva e o campo de texto está vazio
            if (!textoPublicacao.value && processo.publicacao_original) {
              textoPublicacao.value = processo.publicacao_original;
            }
          }
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
    
    // Identificar processo automaticamente
    const identificarProcesso = async () => {
      if (!podeIdentificar.value) return;
      
      try {
        identificando.value = true;
        resultadoAnalise.value = null;
        processoSugestoes.value = [];
        processoSelecionado.value = '';
        processoBuscaRealizada.value = false;
        
        // Extrair número e órgão para busca preliminar
        const texto = textoPublicacao.value.toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
          
        const numeroProcesso = extrairNumeroProcesso(texto);
        const orgao = extrairOrgao(texto);
        
        // Realizar busca local ou remota conforme necessário
        let processosEncontrados = [];
        
        if (numeroProcesso || orgao) {
          // Realizar análise completa do texto
          const resultado = await analisarTexto(textoPublicacao.value, sistemas.value, empresas.value, processos.value);
          
          if (resultado) {
            resultadoAnalise.value = resultado;
            
            // Se a análise identificou um processo específico
            if (resultado.processo_identificado) {
              processosEncontrados = [
                { ...resultado.processo_identificado, pontuacao: 100 }
              ];
              
              // Selecionar automaticamente o processo com alta confiança
              if (processosEncontrados.length === 1 && processosEncontrados[0].pontuacao >= 90) {
                processoSelecionado.value = processosEncontrados[0].id;
                exibirMensagem('Processo identificado automaticamente!', 'success');
              }
            } else {
              // Buscar processos que possam corresponder aos dados extraídos
              processosEncontrados = await buscarProcessosComCorrespondencia(
                resultado.numero_processo, 
                resultado.orgao, 
                resultado.municipio, 
                resultado.estado,
                resultado.data_licitacao
              );
            }
          }
        }
        
        if (processosEncontrados.length > 0) {
          processoSugestoes.value = processosEncontrados;
          // Se tivermos apenas uma sugestão com alta pontuação, selecionamos automaticamente
          if (processosEncontrados.length === 1 && processosEncontrados[0].pontuacao >= 90) {
            processoSelecionado.value = processosEncontrados[0].id;
          }
        } else {
          exibirMensagem('Não foi possível identificar automaticamente o processo. Por favor, selecione manualmente.', 'warning');
        }
        
        processoBuscaRealizada.value = true;
        
      } catch (error) {
        console.error('Erro na identificação:', error);
        exibirMensagem('Ocorreu um erro durante a identificação do processo.', 'error');
      } finally {
        identificando.value = false;
      }
    };
    
    // Buscar processos com correspondência usando dados extraídos
    const buscarProcessosComCorrespondencia = async (numeroProcesso, orgao, municipio, estado, dataLicitacao) => {
      try {
        // Se não temos dados suficientes para identificar
        if (!numeroProcesso && !orgao && !municipio) {
          return [];
        }
        
        // Construir uma query para o Supabase
        let query = supabase.from('processos').select('*');
        
        // Aplicar filtros conforme disponibilidade
        if (numeroProcesso) {
          // Remover caracteres especiais para facilitar a correspondência
          const numProc = numeroProcesso.replace(/[\s./-]/g, '');
          query = query.ilike('numero_processo', `%${numProc}%`);
        }
        
        if (orgao && orgao.length > 3) {
          // Usar apenas parte do órgão para aumentar chances de correspondência
          const orgaoParcial = orgao.substring(0, Math.min(orgao.length, 10));
          query = query.ilike('orgao', `%${orgaoParcial}%`);
        }
        
        if (municipio && municipio.length > 3) {
          query = query.ilike('municipio', `%${municipio}%`);
        }
        
        if (estado) {
          query = query.ilike('uf', estado);
        }
        
        if (dataLicitacao) {
          // Comparar apenas por mês e ano para ter mais chances
          const [ano, mes] = dataLicitacao.split('-');
          if (ano && mes) {
            query = query.like('data_pregao', `${ano}-${mes}-%`);
          }
        }
        
        // Limitar resultados e ordenar
        query = query.order('data_pregao', { ascending: false }).limit(10);
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
          return [];
        }
        
        // Pontuar resultados
        return pontuarProcessos(data, numeroProcesso, orgao, municipio, estado, dataLicitacao);
        
      } catch (error) {
        console.error('Erro ao buscar processos com correspondência:', error);
        return [];
      }
    };
    
    // Pontuar processos com base na correspondência
    const pontuarProcessos = (processos, numeroProcesso, orgao, municipio, estado, dataLicitacao) => {
      const processosComPontuacao = processos.map(processo => {
        let pontuacao = 0;
        
        // Correspondência por número do processo
        if (numeroProcesso && processo.numero_processo) {
          const numProc = processo.numero_processo.toLowerCase().replace(/[\s./-]/g, '');
          const numExtraido = numeroProcesso.toLowerCase().replace(/[\s./-]/g, '');
          
          if (numProc === numExtraido) {
            pontuacao += 70;
          } else if (numProc.includes(numExtraido) || numExtraido.includes(numProc)) {
            pontuacao += 40;
          }
        }
        
        // Correspondência por órgão
        if (orgao && processo.orgao) {
          const orgaoProc = processo.orgao.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const orgaoExtraido = orgao.toLowerCase();
          
          if (orgaoProc === orgaoExtraido) {
            pontuacao += 40;
          } else if (orgaoProc.includes(orgaoExtraido) || orgaoExtraido.includes(orgaoProc)) {
            pontuacao += 20;
          }
        }
        
        // Correspondência por município
        if (municipio && processo.municipio) {
          const municipioProc = processo.municipio.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const municipioExtraido = municipio.toLowerCase();
          
          if (municipioProc === municipioExtraido) {
            pontuacao += 20;
          } else if (municipioProc.includes(municipioExtraido) || municipioExtraido.includes(municipioProc)) {
            pontuacao += 10;
          }
        }
        
        // Correspondência por estado
        if (estado && processo.uf) {
          if (processo.uf.toLowerCase() === estado.toLowerCase()) {
            pontuacao += 10;
          }
        }
        
        // Correspondência por data
        if (dataLicitacao && processo.data_pregao) {
          if (processo.data_pregao === dataLicitacao) {
            pontuacao += 30;
          } else {
            // Comparar apenas ano e mês
            const [anoExtraido, mesExtraido] = dataLicitacao.split('-');
            const [anoProc, mesProc] = processo.data_pregao.split('-');
            
            if (anoExtraido === anoProc && mesExtraido === mesProc) {
              pontuacao += 15;
            }
          }
        }
        
        return {
          ...processo,
          pontuacao
        };
      });
      
      // Filtrar apenas resultados relevantes e ordenar por pontuação
      return processosComPontuacao
        .filter(item => item.pontuacao >= 30)
        .sort((a, b) => b.pontuacao - a.pontuacao);
    };
    
    // Selecionar processo
    const selecionarProcesso = (id) => {
      processoSelecionado.value = id;
      
      // Se já temos uma análise prévia, podemos executar a análise automática
      if (resultadoAnalise.value && !resultadoAnalise.value.empresa_vencedora) {
        analisarPublicacao();
      }
    };
    
    // Analisar publicação
    const analisarPublicacao = async () => {
      if (!podeAnalisar.value) return;
      
      try {
        analisando.value = true;
        
        // Se já tivermos feito análise parcial na identificação, use esses resultados
        // e apenas complementa com o resto da análise
        if (resultadoAnalise.value) {
          // Podemos manter os resultados existentes
          exibirMensagem('Análise detalhada concluída com sucesso!', 'success');
        } else {
          // Análise completa
          const resultado = await analisarTexto(textoPublicacao.value, sistemas.value, empresas.value);
          
          if (resultado) {
            resultadoAnalise.value = resultado;
            exibirMensagem('Análise concluída com sucesso!', 'success');
          } else {
            exibirMensagem('Não foi possível extrair informações do texto.', 'warning');
          }
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
        
        // Salvar a publicação original
        if (textoPublicacao.value) {
          atualizacao.publicacao_original = textoPublicacao.value;
        }
        
        atualizacao.dados_analise_automatica = 'Dados extraídos por IA em ' + new Date().toLocaleDateString();
        atualizacao.updated_at = new Date().toISOString();
        
        // Para processos já concluídos, atualizar status
        if (processoAtual.value && (processoAtual.value.status !== 'ganhamos' && processoAtual.value.status !== 'perdemos')) {
          if (resultadoAnalise.value.empresa_vencedora) {
            // Verificar se empresa vencedora é a própria empresa participante
            if (processoAtual.value.empresa_id === resultadoAnalise.value.empresa_vencedora) {
              atualizacao.status = 'ganhamos';
            } else {
              atualizacao.status = 'perdemos';
            }
          }
        }
        
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
      processoSugestoes.value = [];
      processoBuscaRealizada.value = false;
    };
    
    // Função para lidar com toggle da sidebar
    const handleSidebarToggle = (expanded) => {
      isSidebarExpanded.value = expanded;
    };

    // Enviar feedback atualizado para usar o composable
    const enviarFeedback = async (correto, correcoes = null) => {
      if (enviandoFeedback.value || !ultimaAnaliseId.value) return;
      
      try {
        feedbackCorreto.value = correto;
        
        const sucesso = await registrarFeedback(
          ultimaAnaliseId.value,
          correto,
          correcoes
        );
        
        if (sucesso) {
          feedbackEnviado.value = true;
          mostrarFormCorrecao.value = false;
          exibirMensagem('Feedback enviado com sucesso!', 'success');
        } else {
          exibirMensagem('Erro ao enviar feedback.', 'error');
        }
      } catch (error) {
        console.error('Erro ao enviar feedback:', error);
        exibirMensagem('Erro ao enviar feedback.', 'error');
      }
    };
    
    // Abrir formulário de correção
    const abrirFormCorrecao = () => {
      mostrarFormCorrecao.value = true;
    };
    
    // Cancelar correção
    const cancelarCorrecao = () => {
      mostrarFormCorrecao.value = false;
      correcoes.value = {
        numero_processo: '',
        orgao: '',
        municipio: '',
        estado: '',
        empresa_vencedora: '',
        numero_contrato: ''
      };
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
      processoAtual,
      textoPublicacao,
      resultadoAnalise,
      analisando,
      identificando,
      aplicando,
      mostrarMensagem,
      mensagem,
      tipoMensagem,
      processoSugestoes,
      processoBuscaRealizada,
      mostrarTodasSugestoes,
      sugestoesExibidas,
      podeIdentificar,
      podeAnalisar,
      podeAplicar,
      empresaEncontrada,
      sistemasMencionados,
      formatarData,
      formatarModalidade,
      formatarNivel,
      getNivelClasse,
      handleSidebarToggle,
      identificarProcesso,
      selecionarProcesso,
      analisarPublicacao,
      aplicarResultados,
      limparCampos,
      ultimaAnaliseId,
      feedbackCorreto,
      mostrarFormCorrecao,
      correcoes,
      enviandoFeedback,
      feedbackEnviado,
      enviarFeedback,
      abrirFormCorrecao,
      cancelarCorrecao
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

.mt-3 {
  margin-top: 15px;
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
  flex-wrap: wrap;
}

.btn-primary, .btn-secondary, .btn-success, .btn-outline, .btn-text {
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

.btn-outline {
  background-color: transparent;
  color: #666;
  border: 1px solid #ddd;
}

.btn-outline:hover {
  background-color: #f5f5f5;
}

.btn-text {
  background-color: transparent;
  color: #2196f3;
  padding: 5px 10px;
  text-decoration: underline;
}

.btn-text:hover {
  color: #1976d2;
  background-color: #f5f5f5;
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

.info-item {
  margin-bottom: 8px;
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

.processo-sugestoes {
  margin-top: 20px;
  border-top: 1px solid #eee;
  padding-top: 20px;
}

.sugestao-info {
  color: #666;
  margin-bottom: 15px;
}

.sugestoes-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
}

.sugestao-item {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.2s;
}

.sugestao-item:hover {
  border-color: #2196f3;
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.1);
}

.sugestao-item.selected {
  border-color: #4caf50;
  background-color: rgba(76, 175, 80, 0.05);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.1);
}

.sugestao-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.badge {
  font-size: 0.8rem;
  padding: 3px 8px;
  border-radius: 12px;
  background-color: #e0e0e0;
  color: #555;
}

.badge.nivel-alto {
  background-color: #4caf50;
  color: white;
}

.badge.nivel-medio {
  background-color: #ff9800;
  color: white;
}

.badge.nivel-baixo {
  background-color: #9e9e9e;
  color: white;
}

.sugestao-details {
  font-size: 0.9rem;
  color: #555;
}

.sugestao-details div {
  margin-bottom: 5px;
}

.ver-mais {
  text-align: center;
  margin-top: 15px;
}

.processo-selecionado {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 6px;
  border-left: 4px solid #2196f3;
}

.processo-info {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.sem-resultados {
  margin-top: 20px;
  padding: 15px;
  background-color: #fff3e0;
  border-radius: 6px;
  border-left: 4px solid #ff9800;
}

.feedback-section {
  margin-top: 30px;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 8px;
  border: 1px solid #ddd;
}

.feedback-options {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.btn-feedback.active {
  background-color: #2196f3;
  color: white;
}

.feedback-form {
  margin-top: 20px;
}

.feedback-success {
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #4caf50;
  font-weight: 500;
}

.feedback-section {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.feedback-options {
  display: flex;
  gap: 15px;
  margin: 15px 0;
}

.btn-feedback {
  flex: 1;
  justify-content: center;
  padding: 12px;
  border-radius: 6px;
  transition: all 0.2s;
}

.btn-feedback.active {
  border-color: #2196f3;
  background-color: rgba(33, 150, 243, 0.1);
}

.btn-feedback:first-child.active {
  border-color: #4caf50;
  background-color: rgba(76, 175, 80, 0.1);
}

.feedback-form {
  background-color: #f5f5f5;
  padding: 20px;
  border-radius: 6px;
  margin-top: 15px;
  animation: fadeIn 0.3s ease;
}

.feedback-form h4 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
}

.feedback-success {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 15px;
  padding: 15px;
  background-color: #e8f5e9;
  border-radius: 6px;
  color: #2e7d32;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}


</style>