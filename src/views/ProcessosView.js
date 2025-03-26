import { ref, onMounted, computed, nextTick, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import TheSidebar from '@/components/TheSidebar.vue'
import * as XLSX from 'xlsx'
import { writeFileXLSX, utils } from 'xlsx'
import { buildUrl } from '@/utils/url'
import BaseImage from '@/components/BaseImage.vue'
import '../assets/styles/themes/dark-mode.css'
import { useConnectionManager } from '@/composables/useConnectionManager'
import { SupabaseManager } from '@/lib/supabaseManager'
import { useResponsaveis } from '@/composables/useResponsaveis'
import { useProcessoUpdate } from '@/composables/useProcessoUpdate';
import { processScheduledNotifications } from '@/api/notificationsApi';
import { createUpdate } from '@/services/systemUpdatesService';
import SystemUpdateModal from '@/components/SystemUpdateModal.vue';
import SistemasImplantacaoSelector from '@/components/SistemasImplantacaoSelector.vue';

export default {
  name: 'ProcessosView',

  components: {
    TheSidebar,
    BaseImage,
    SystemUpdateModal,
    SistemasImplantacaoSelector, // Adicione esta linha
  },

  setup() {
    // Router and basic component state
    const router = useRouter()
    const isSidebarExpanded = ref(true)
    const processos = ref([])
    const loading = ref(false)
    const isLoading = ref(false)
    const loadingTimeout = ref(null)
    const filtroModalidadeSearch = ref('');
    const filtroSearch = ref({})

    // System cache
    const sistemasNomesCache = ref({})

    // UI state
    const confirmDialog = ref({
      show: false,
      position: {},
      callback: null
    })

    const deleteConfirmDialog = ref({
      show: false,
      processo: null
    })

    const sistemasDialog = ref({
      show: false,
      position: {},
      processo: null
    })

    const editingCell = ref({
      id: null,
      field: null,
      value: null
    })

    const sortConfig = ref({
      field: 'data_pregao',
      direction: 'asc'
    })

    const selectedRow = ref(null)
    const anoSelecionado = ref(new Date().getFullYear())
    const mostrarFiltro = ref({})
    const filtros = ref({})
    const estadoSearch = ref('')
    const refreshInterval = ref(null)

    // Reference Data
    const representantes = ref([])
    const empresas = ref([])
    const sistemasAtivos = ref([])
    const plataformas = ref([])

    // UI Configuration
    const colunasWidth = ref({})
    const rowsHeight = ref({})

    // Adicionar após a definição de colunasWidth e rowsHeight
    const colunasOrder = ref([])

    // Função para carregar a ordem das colunas do localStorage
    const loadColumnsOrder = () => {
      try {
        const savedOrder = localStorage.getItem('table-columns-order');
        if (savedOrder) {
          // Carrega a ordem salva
          const savedColumns = JSON.parse(savedOrder);
          
          // Verifica se todas as colunas atuais estão na ordem salva
          const currentColumns = colunas.map(coluna => coluna.campo);
          const missingColumns = currentColumns.filter(campo => !savedColumns.includes(campo));
          
          // Se existem novas colunas, adiciona ao final da ordem
          if (missingColumns.length > 0) {
            colunasOrder.value = [...savedColumns, ...missingColumns];
            // Salva a nova ordem atualizada
            saveColumnsOrder();
          } else {
            colunasOrder.value = savedColumns;
          }
        } else {
          // Define a ordem padrão (todas as colunas)
          colunasOrder.value = colunas.map(coluna => coluna.campo);
        }
      } catch (error) {
        console.error('Erro ao carregar ordem das colunas:', error);
        // Fallback para ordem padrão se ocorrer erro
        colunasOrder.value = colunas.map(coluna => coluna.campo);
      }
    }

    // Função para salvar a ordem das colunas no localStorage
    const saveColumnsOrder = () => {
      try {
        localStorage.setItem('table-columns-order', JSON.stringify(colunasOrder.value))
      } catch (error) {
        console.error('Erro ao salvar ordem das colunas:', error)
      }
    }

    // Função para iniciar o arrastar de colunas
    const startColumnDrag = (event, index) => {
      event.dataTransfer.setData('text/plain', index)
      event.currentTarget.classList.add('dragging')
    }

    // Função para permitir o soltar
    const allowColumnDrop = (event) => {
      event.preventDefault()
    }

    // Função para processar o soltar da coluna
    const handleColumnDrop = (event, targetIndex) => {
      event.preventDefault()
      const draggedIndex = parseInt(event.dataTransfer.getData('text/plain'))

      // Remove a classe de arrasto de todos os elementos
      document.querySelectorAll('th').forEach(th => th.classList.remove('dragging'))

      // Evita reordenar se for o mesmo índice
      if (draggedIndex === targetIndex) return

      // Reordena as colunas
      const columnOrder = [...colunasOrder.value]
      const draggedColumn = columnOrder[draggedIndex]

      // Remove a coluna arrastada
      columnOrder.splice(draggedIndex, 1)

      // Insere no novo local
      columnOrder.splice(targetIndex, 0, draggedColumn)

      // Atualiza a ordem
      colunasOrder.value = columnOrder

      // Salva a nova ordem
      saveColumnsOrder()
    }

    // Modificar a função ordenarColunas para excluir explicitamente a coluna de ações
    const ordenarColunas = computed(() => {
      if (colunasOrder.value.length === 0) {
        // Retorna todas as colunas exceto a de ações (que será adicionada separadamente)
        return colunas.filter(coluna => coluna.campo !== 'acoes');
      }

      return colunasOrder.value
        .map(campo => colunas.find(coluna => coluna.campo === campo))
        .filter(Boolean) // Filtra valores undefined/null
        .filter(coluna => coluna.campo !== 'acoes'); // Exclui a coluna de ações da ordem
    })

    // Modificar/adicionar esta função computada 
    const colunasOrdenadas = computed(() => {
      // Usa as colunas na ordem armazenada ou na ordem original
      if (colunasOrder.value.length > 0) {
        return colunasOrder.value
          .map(campo => colunas.find(coluna => coluna.campo === campo))
          .filter(Boolean); // Remove valores undefined
      }
      
      // Ordem padrão (todas as colunas)
      return colunas;
    });

    // Table columns definition
    const colunas = [
      { titulo: 'Data', campo: 'data_pregao' },
      { titulo: 'Hora', campo: 'hora_pregao' },
      { titulo: 'Modalidade', campo: 'modalidade' },
      { titulo: 'Estado', campo: 'estado' },
      { titulo: 'Nº Processo', campo: 'numero_processo' },
      { titulo: 'Objeto Resumido', campo: 'objeto_resumido' },
      {
        titulo: 'Sistemas',
        campo: 'sistemas_ativos',
        tabela: 'processo',
        tipo: 'array'
      },
      { titulo: 'Código Análise', campo: 'codigo_analise' },
      { titulo: 'Órgão', campo: 'orgao' },
      { titulo: 'Objeto Completo', campo: 'objeto_completo' },
      { titulo: 'Valor Estimado', campo: 'valor_estimado' }, // Nova coluna
      { titulo: 'Status', campo: 'status' },

      // Nova coluna Responsáveis
      {
        titulo: 'Responsáveis',
        campo: 'responsavel_id',
        tabelaRelacionada: 'responsaveis_processos',
        campoExibicao: 'nome',
        tipoEdicao: 'select'
      },

      // Continuar com as outras colunas
      {
        titulo: 'Distâncias',
        campo: 'distancia_km',
        tipoExibicao: 'distancia',
        camposDisplay: ['distancia_km', 'ponto_referencia_cidade', 'ponto_referencia_uf']
      },
      { titulo: 'Portal', campo: 'site_pregao' },
      {
        titulo: 'Representante',
        campo: 'representante_id',
        tabelaRelacionada: 'representantes',
        campoExibicao: 'nome',
        tipoEdicao: 'select'
      },
      { titulo: 'Observações', campo: 'campo_adicional1' },
      { titulo: 'Impugnações', campo: 'impugnacoes' },
      {
        titulo: 'Empresa Participante',
        campo: 'empresa_id',
        tabelaRelacionada: 'empresas',
        campoExibicao: 'nome',
        tipoEdicao: 'select'
      },
      {
        titulo: 'Empresa Vencedora',
        campo: 'empresa_vencedora',
        tipoExibicao: 'componente',
        componente: 'EmpresaVencedoraColuna'
      },
      {
        titulo: 'Sistemas a Implantar',
        campo: 'sistemas_implantacao',
        tabela: 'processo',
        tipo: 'objeto'
      },
    ]

    // Brazilian states
    const estados = ref([
      { uf: 'AC', nome: 'Acre' },
      { uf: 'AL', nome: 'Alagoas' },
      { uf: 'AP', nome: 'Amapá' },
      { uf: 'AM', nome: 'Amazonas' },
      { uf: 'BA', nome: 'Bahia' },
      { uf: 'CE', nome: 'Ceará' },
      { uf: 'DF', nome: 'Distrito Federal' },
      { uf: 'ES', nome: 'Espírito Santo' },
      { uf: 'GO', nome: 'Goiás' },
      { uf: 'MA', nome: 'Maranhão' },
      { uf: 'MT', nome: 'Mato Grosso' },
      { uf: 'MS', nome: 'Mato Grosso do Sul' },
      { uf: 'MG', nome: 'Minas Gerais' },
      { uf: 'PA', nome: 'Pará' },
      { uf: 'PB', nome: 'Paraíba' },
      { uf: 'PR', nome: 'Paraná' },
      { uf: 'PE', nome: 'Pernambuco' },
      { uf: 'PI', nome: 'Piauí' },
      { uf: 'RJ', nome: 'Rio de Janeiro' },
      { uf: 'RN', nome: 'Rio Grande do Norte' },
      { uf: 'RS', nome: 'Rio Grande do Sul' },
      { uf: 'RO', nome: 'Rondônia' },
      { uf: 'RR', nome: 'Roraima' },
      { uf: 'SC', nome: 'Santa Catarina' },
      { uf: 'SP', nome: 'São Paulo' },
      { uf: 'SE', nome: 'Sergipe' },
      { uf: 'TO', nome: 'Tocantins' }
    ])

    // Form data
    const formData = ref({
      status: null
    })

    // Computed properties
    const anosDisponiveis = computed(() => {
      // Pegar todos os anos únicos das datas dos processos
      const anos = new Set();
      
      processos.value.forEach(processo => {
        // Pegar o ano da data do pregão
        if (processo.data_pregao) {
          const ano = new Date(processo.data_pregao).getFullYear();
          anos.add(ano);
        }
        // Também considerar o campo ano do processo
        if (processo.ano) {
          anos.add(parseInt(processo.ano));
        }
      });
    
      return Array.from(anos).sort((a, b) => b - a); // Ordem decrescente
    })

    const estadosFiltrados = computed(() => {
      if (!estadoSearch.value) return estados.value

      const busca = estadoSearch.value.toLowerCase()
      return estados.value.filter(estado =>
        estado.nome.toLowerCase().includes(busca) ||
        estado.uf.toLowerCase().includes(busca)
      )
    })

    // Substitua a implementação de processosFiltrados por esta versão melhorada:

    const processosFiltrados = computed(() => {
      if (!processos.value) return [];

      return processos.value
        .filter(processo => {
          // Verificar tanto o campo ano quanto a data_pregao
          const anoPregao = processo.data_pregao ? new Date(processo.data_pregao).getFullYear() : null;
          const anoProcesso = processo.ano ? parseInt(processo.ano) : null;
          
          return anoPregao === anoSelecionado.value || anoProcesso === anoSelecionado.value;
        })
        .filter(processo => {
          return colunas.every(coluna => {
            // Se não há filtros ativos para esta coluna, incluir o processo
            if (!filtros.value[coluna.campo] || filtros.value[coluna.campo].length === 0) {
              return true;
            }

            // Obter o valor do processo para esta coluna
            let valorProcesso = processo[coluna.campo];

            // Se o valor não existe, não incluir no resultado do filtro
            if (valorProcesso === null || valorProcesso === undefined) {
              return false;
            }

            // Tratamento especial para diferentes tipos de colunas
            switch (coluna.campo) {
              case 'data_pregao':
                // Comparar o valor formatado
                return filtros.value[coluna.campo].includes(formatDate(valorProcesso));

              case 'hora_pregao':
                // Comparar o valor formatado
                return filtros.value[coluna.campo].includes(formatTime(valorProcesso));

              case 'modalidade':
                // Para modalidade, o filtro armazena o valor interno (ex: pregao_eletronico)
                // mas precisa comparar com o valor do processo diretamente
                return filtros.value[coluna.campo].includes(valorProcesso);

              case 'status':
                // Comparar o status diretamente
                return filtros.value[coluna.campo].includes(valorProcesso);

              case 'representante_id':
              case 'responsavel_id':
              case 'empresa_id':
                // Para chaves estrangeiras, o filtro armazena o ID
                return filtros.value[coluna.campo].includes(valorProcesso);

              default:
                // Para outros campos, fazer uma comparação simples
                if (typeof valorProcesso === 'string') {
                  return filtros.value[coluna.campo].some(filtro =>
                    valorProcesso.toLowerCase().includes(filtro.toLowerCase())
                  );
                } else {
                  return filtros.value[coluna.campo].includes(valorProcesso);
                }
            }
          });
        });
    });

    const temFiltrosAtivos = computed(() => {
      return Object.values(filtros.value).some(f => f.length > 0)
    })

    const empresasCadastradas = computed(() => {
      return empresas.value.filter(empresa => empresa.id) // Filter only valid companies
    })

    const showPlataformaField = computed(() => {
      return formData.value.modalidade === 'pregao_eletronico';
    });

    // Adicione este computed para filtrar as opções de modalidade

    const opcoesFiltradasModalidade = computed(() => {
      if (!filtroModalidadeSearch.value) {
        return opcoesModalidade;
      }

      const busca = filtroModalidadeSearch.value.toLowerCase();
      return opcoesModalidade.filter(opcao =>
        opcao.texto.toLowerCase().includes(busca)
      );
    });

    // Adicione esta função para filtrar as opções genéricas
    const filtrarOpcoes = (coluna) => {
      // Esta função pode ser expandida para outros tipos de colunas
      console.log('Filtrando opções para coluna:', coluna);
    };

    // Helper functions
    const getSistemasNomesFromCache = async (sistemasIds) => {
      if (!sistemasIds || !sistemasIds.length) return '-';

      // Create a unique key for this set of IDs
      const cacheKey = sistemasIds.sort().join(',');

      // Check if we already have this result in cache
      if (sistemasNomesCache.value[cacheKey]) {
        return sistemasNomesCache.value[cacheKey];
      }

      // If not in cache, fetch and store
      const resultado = await getSistemasNomes(sistemasIds);
      sistemasNomesCache.value[cacheKey] = resultado;

      return resultado;
    }

    const formatDate = (dateString) => {
      if (!dateString) return '-';
      try {
        // Ensure we're only dealing with the date part
        const [date] = dateString.split('T');
        const [year, month, day] = date.split('-');

        // Return the formatted date without timezone manipulation
        return `${day}/${month}/${year}`;
      } catch (error) {
        console.error('Error formatting date:', error);
        return '-';
      }
    }

    const formatTime = (time) => {
      if (!time) return '-';
      try {
        const cleanTime = time.split(':').slice(0, 2).join(':');
        return cleanTime;
      } catch (error) {
        console.error('Error formatting time:', error);
        return '-';
      }
    }

    const formatModalidade = (modalidade, tipo_pregao) => {
      const modalidades = {
        'pregao': {
          'presencial': 'PP',
          'eletronico': 'PE'
        },
        'concorrencia': 'CONC',
        'concurso': 'CNC',
        'leilao': 'LEI',
        'dialogo_competitivo': 'DC',
        'credenciamento': 'CR',
        'pre_qualificacao': 'PQ',
        'manifestacao_interesse': 'PMI',
        'licitacao_internacional': 'LI'
      }

      if (modalidade === 'pregao' && tipo_pregao) {
        return modalidades[modalidade][tipo_pregao]
      }

      return modalidades[modalidade] || modalidade
    }

    const formatModalidadeCompleta = (modalidade) => {
      const modalidades = {
        'pregao_eletronico': 'Pregão Eletrônico',
        'pregao_presencial': 'Pregão Presencial',
        'credenciamento': 'Credenciamento',
        'concorrencia': 'Concorrência',
        'concurso': 'Concurso',
        'leilao': 'Leilão',
        'dialogo_competitivo': 'Diálogo Competitivo',
        'tomada_precos': 'Tomada de Preços',
        'chamamento_publico': 'Chamamento Público',
        'rdc': 'Regime Diferenciado de Contratações',
        'rdc_eletronico': 'RDC Eletrônico',
        'srp': 'Sistema de Registro de Preços',
        'srp_eletronico': 'SRP Eletrônico',
        'srp_internacional': 'SRP Internacional'
      }

      return modalidades[modalidade] || modalidade
    }

    const formatStatus = (status) => {
      const statusMap = {
        'vamos_participar': 'Vamos Participar',
        'em_analise': 'Em Análise',
        'em_andamento': 'Em Andamento',
        'ganhamos': 'Ganhamos',
        'perdemos': 'Perdemos',
        'suspenso': 'Suspenso',
        'revogado': 'Revogado',
        'adiado': 'Adiado',
        'demonstracao': 'Demonstração',
        'cancelado': 'Cancelado',
        'nao_participar': 'Decidido Não Participar'
      }
      return statusMap[status] || status
    }

    const getModalidadeSigla = (modalidade) => {
      const modalidades = {
        'pregao_eletronico': 'PE',
        'pregao_presencial': 'PP',
        'credenciamento': 'CR',
        'concorrencia': 'CC',
        'concurso': 'CS',
        'leilao': 'LL',
        'dialogo_competitivo': 'DC',
        'tomada_precos': 'TP',
        'chamamento_publico': 'CP',
        'rdc': 'RDC',
        'rdc_eletronico': 'RDC-E',
        'srp': 'SRP',
        'srp_eletronico': 'SRP-E',
        'srp_internacional': 'SRP-I'
      }

      return modalidades[modalidade] || modalidade
    }

    const getPlataformaNome = (url) => {
      if (!url) return '-'
      const plataforma = plataformas.value.find(p => p.url === url)
      return plataforma ? plataforma.nome : url
    }

    const getPortalName = (url) => {
      if (!url) return '-'
      try {
        const hostname = new URL(url).hostname
        return hostname
          .replace('www.', '')
          .split('.')
          .slice(0, -1)
          .join('.')
          .toUpperCase()
      } catch (e) {
        return url
      }
    }

    const getEmpresaNome = (empresaId) => {
      const empresa = empresas.value.find(e => e.id === empresaId)
      return empresa ? empresa.nome : '-'
    }

    const getRepresentanteNome = (id) => {
      if (!id) return 'Sem representante';

      const representante = representantes.value.find(r => r.id === id);
      return representante ? representante.nome : 'Carregando...';
    };

    const getSistemaNome = (id) => {
      return sistemasNomesCache.value[id] || 'Sistema não encontrado'
    }

    const getSistemasNomesString = (ids) => {
      if (!ids || !ids.length) return '-'
      return ids.map(id => getSistemaNome(id)).join(', ')
    }

    const formatarDistancia = (processo) => {
      if (!processo) return '-';
      
      // Se tiver distâncias múltiplas
      if (processo._distancias && processo._distancias.length > 0) {
        return processo._distancias.map(d => 
          `${d.distancia_km} km (${d.ponto_referencia_cidade}/${d.ponto_referencia_uf})`
        ).join('; ');
      }
    
      // Se tiver distância única
      if (processo.distancia_km) {
        return `${processo.distancia_km} km${processo.ponto_referencia_cidade ? 
          ` (${processo.ponto_referencia_cidade}/${processo.ponto_referencia_uf})` : ''}`;
      }
    
      return '-';
    };

    // API and data loading functions
    const handleLoading = async (loadingFunction) => {
      try {
        isLoading.value = true
        await loadingFunction()
      } catch (error) {
        console.error('Error:', error)
      } finally {
        isLoading.value = false
      }
    }

    const loadProcessos = async () => {
      if (isLoading.value) return;

      try {
        isLoading.value = true;

        const { data, error } = await supabase
          .from('processos')
          .select('*')
          .order('data_pregao', { ascending: true }) // Ordem crescente por padrão

        if (error) throw error;

        processos.value = data;

        // Se o ano atual não existe nas abas, selecionar o ano mais recente
        const anos = anosDisponiveis.value;
        if (!anos.includes(anoSelecionado.value) && anos.length > 0) {
          anoSelecionado.value = anos[0];
          showToast(`Visualização alterada para o ano ${anos[0]}`, 'info');
        }

      } catch (error) {
        console.error('Error:', error);
      } finally {
        isLoading.value = false;
      }
    };

    const getSistemasNomes = async (sistemasIds) => {
      if (!sistemasIds || !sistemasIds.length) return '-'

      try {
        console.log('Fetching system names for IDs:', sistemasIds)

        const { data, error } = await supabase
          .from('sistemas')
          .select('nome')
          .in('id', sistemasIds)

        if (error) throw error

        const nomes = data?.map(s => s.nome) || []
        console.log('Names found:', nomes)

        return nomes.join(', ') || '-'
      } catch (error) {
        console.error('Error fetching system names:', error)
        return '-'
      }
    }

    const loadRepresentantes = async () => {
      try {
        console.log('Starting representatives loading...');

        const { data, error } = await supabase
          .from('representantes')
          .select('*')
          .order('nome');

        if (error) {
          console.error('Error in representatives query:', error);
          throw error;
        }

        console.log(`Loaded ${data?.length || 0} representatives:`, data);
        representantes.value = data || [];

        return data;
      } catch (error) {
        console.error('Error loading representatives:', error);
        representantes.value = [];
        return [];
      }
    }

    const loadEmpresas = async () => {
      try {
        const { data, error } = await supabase
          .from('empresas')
          .select('id, nome, cnpj')
          .order('nome')

        if (error) throw error
        empresas.value = data || []
      } catch (error) {
        console.error('Error loading companies:', error)
        empresas.value = []
      }
    }

    const loadPlataformas = async () => {
      try {
        const { data, error } = await supabase
          .from('plataformas')
          .select('*')

        if (error) throw error
        plataformas.value = data
      } catch (error) {
        console.error('Error loading platforms:', error)
      }
    }

    const loadSistemas = async () => {
      try {
        const { data, error } = await supabase
          .from('sistemas')
          .select('id, nome')
          .eq('status', 'ACTIVE')
          .order('nome')

        if (error) throw error
        sistemasAtivos.value = data || []

        // Update names cache
        data.forEach(sistema => {
          sistemasNomesCache.value[sistema.id] = sistema.nome
        })
      } catch (error) {
        console.error('Error loading systems:', error)
      }
    }

    const getDistancias = async (processoId) => {
      const { data } = await supabase
        .from('processo_distancias')
        .select('*')
        .eq('processo_id', processoId)
        .order('created_at', { ascending: true })

      return data || []
    }

    // Event handlers
    const handleSidebarToggle = (expanded) => {
      isSidebarExpanded.value = expanded
    }

    const handleNewProcess = () => {
      router.push('/editais')
    }

    const hideDeleteDialog = () => {
      deleteConfirmDialog.value = {
        show: false,
        processo: null
      }
    }

    const confirmDelete = async () => {
      try {
        const processo = deleteConfirmDialog.value.processo

        await logSystemAction({
          tipo: 'exclusao',
          tabela: 'processos',
          registro_id: processo.id,
          dados_anteriores: processo
        })

        const { error } = await supabase
          .from('processos')
          .delete()
          .eq('id', processo.id)

        if (error) throw error

        processos.value = processos.value.filter(p => p.id !== processo.id)

        hideDeleteDialog()
      } catch (error) {
        console.error('Error deleting:', error)
        alert('Error deleting process')
      }
    }

    // Versão corrigida da função logSystemAction
    const logSystemAction = async (dados) => {
      try {
        // Verificar se dados essenciais foram fornecidos
        if (!dados || !dados.registro_id) {
          console.warn('Dados de log incompletos');
          return; // Encerra suavemente sem lançar erro
        }
    
        // Obter usuário atual
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.warn('Usuário não autenticado para logging');
          return; // Encerra sem afetar o fluxo principal
        }
    
        // Preparar dados com valores padrão para evitar undefined
        const logData = {
          usuario_id: user.id,
          usuario_email: user.email,
          tipo: dados.tipo || 'atualizacao',
          tabela: dados.tabela || 'processos',
          registro_id: dados.registro_id,
          campo_alterado: dados.campo_alterado || 'status',
          dados_anteriores: dados.dados_anteriores || null,
          dados_novos: dados.dados_novos || null,
          data_hora: new Date().toISOString()
        };
    
        // CORRIGIDO: Verificação segura do erro para evitar problemas com propriedades undefined
        try {
          // Tenta inserir os dados - se a tabela não existir, o erro será capturado no catch
          const { error } = await supabase
            .from('system_logs')
            .insert(logData);
            
          // CORRIGIDO: Verificação segura de error e error.message
          if (error && error.message && error.message.includes('does not exist')) {
            console.warn('Tabela system_logs não encontrada. Logging desativado.');
            return; // Sai sem afetar o fluxo principal
          } else if (error) {
            console.warn('Erro ao inserir log (não crítico):', error.message || 'Erro desconhecido');
          }
        } catch (error) {
          // Captura qualquer erro e apenas registra, sem interromper o fluxo
          console.warn('Erro no sistema de logging (não crítico):', error && error.message ? error.message : 'Erro desconhecido');
        }
      } catch (error) {
        // Não propaga o erro, apenas registra
        console.warn('Erro no processo de logging (não crítico):', error && error.message ? error.message : 'Erro desconhecido');
      }
    };

    const exportToExcel = () => {
      const dataToExport = processos.value.map(processo => ({
        'Data': formatDate(processo.data_pregao),
        'Hora': formatTime(processo.hora_pregao),
        'Número do Processo': processo.numero_processo,
        'Código Análise': processo.codigo_analise || '-',
        'Ano': processo.ano,
        'Órgão': processo.orgao,
        'Modalidade': formatModalidade(processo.modalidade),
        'Tipo': processo.tipo_pregao || '-',
        'Site': processo.site_pregao || '-',
        'Objeto Resumido': processo.objeto_resumido,
        'Status': formatStatus(processo.status)
      }))

      const ws = utils.json_to_sheet(dataToExport)
      const wb = utils.book_new()
      utils.book_append_sheet(wb, ws, 'Processos')
      writeFileXLSX(wb, 'processos_licitatorios.xlsx')
    }

    // Substitua a função toggleFiltro existente por esta versão melhorada

    const toggleFiltro = (coluna) => {
      // Fecha todos os outros filtros primeiro
      Object.keys(mostrarFiltro.value).forEach(key => {
        if (key !== coluna) {
          mostrarFiltro.value[key] = false;
        }
      });

      // Inverte o estado do filtro atual
      mostrarFiltro.value[coluna] = !mostrarFiltro.value[coluna];

      // Se estiver abrindo o filtro, certifique-se de posicioná-lo corretamente
      if (mostrarFiltro.value[coluna]) {
        // Reset search input when opening
        filtroModalidadeSearch.value = '';

        nextTick(() => {
          // Find the dropdown
          const dropdown = document.querySelector(`.filtro-dropdown[data-campo="${coluna}"]`);

          if (dropdown) {
            // Get the container dimensions to ensure the dropdown stays visible
            const container = dropdown.closest('.filtro-container');
            if (container) {
              const rect = container.getBoundingClientRect();

              // Position based on available space
              if (window.innerWidth - rect.right < 250) {
                dropdown.style.right = '0';
                dropdown.style.left = 'auto';
              } else {
                dropdown.style.left = '0';
                dropdown.style.right = 'auto';
              }

              // Ensure dropdown doesn't go off-screen bottom
              const dropdownHeight = dropdown.offsetHeight;
              if (rect.bottom + dropdownHeight > window.innerHeight) {
                dropdown.style.bottom = '100%';
                dropdown.style.top = 'auto';
                dropdown.style.marginBottom = '5px';
                dropdown.style.marginTop = '0';
              } else {
                dropdown.style.top = '100%';
                dropdown.style.bottom = 'auto';
                dropdown.style.marginTop = '50px';
                dropdown.style.marginBottom = '0';
              }
            }

            // Focus the search input
            const searchInput = dropdown.querySelector('input[type="search"]');
            if (searchInput) {
              searchInput.focus();
            }
          }
        });
      }
    };

    const limparFiltros = () => {
      Object.keys(filtros.value).forEach(key => {
        filtros.value[key] = []
      })
    }

    const handleSort = async (field, direction) => {
      try {
        sortConfig.value = { field, direction };

        // Ordenação local 
        processos.value.sort((a, b) => {
          if (field === 'data_pregao') {
            const dateA = new Date(a[field] || '1900-01-01');
            const dateB = new Date(b[field] || '1900-01-01');
            
            const comparison = dateA - dateB; // Ordem crescente por padrão
            
            // Se for descendente, inverte a ordem
            return direction === 'desc' ? -comparison : comparison;
          }
          return 0;
        });

        // Indica visualmente a coluna ordenada
        const thElements = document.querySelectorAll('th');
        thElements.forEach(th => {
          th.classList.remove('sorted-asc', 'sorted-desc');
          const thField = th.getAttribute('data-field');
          if (thField === field) {
            th.classList.add(direction === 'asc' ? 'sorted-asc' : 'sorted-desc');
          }
        });
      } catch (error) {
        console.error('Erro ao ordenar dados:', error);
      }
    };

    const selecionarAno = (ano) => {
      anoSelecionado.value = ano
    }

    const selectRow = (id) => {
      selectedRow.value = id
    }

    const handleModalidadeChange = () => {
      if (formData.value.modalidade !== 'pregao_eletronico') {
        formData.value.site_pregao = '';
      }
    };

    // Table editing functions
    const startColumnResize = (event, campo) => {
      event.preventDefault()
      const th = event.target.closest('th')
      const startWidth = th.offsetWidth
      const startX = event.pageX

      const handleMouseMove = (e) => {
        const dx = e.pageX - startX
        const newWidth = Math.max(80, startWidth + dx)
        colunasWidth.value[campo] = `${newWidth}px`
        th.style.width = `${newWidth}px`
        document.body.style.cursor = 'col-resize'
      }

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        saveColumnWidths()
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    const startRowResize = (event, id) => {
      event.preventDefault()
      const tr = event.target.closest('tr')
      const startHeight = tr.offsetHeight
      const startY = event.pageY

      const handleMouseMove = (e) => {
        const dy = e.pageY - startY
        const newHeight = Math.max(40, startHeight + dy)
        rowsHeight.value[id] = `${newHeight}px`
        tr.style.height = `${newHeight}px`
        document.body.style.cursor = 'row-resize'
      }

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    const loadColumnWidths = () => {
      try {
        const savedWidths = localStorage.getItem('table-columns-width')
        if (savedWidths) {
          colunasWidth.value = JSON.parse(savedWidths)
        } else {
          colunas.forEach(coluna => {
            colunasWidth.value[coluna.campo] = '150px'
          })
        }
      } catch (error) {
        console.error('Error loading column widths:', error)
      }
    }

    const saveColumnWidths = () => {
      try {
        localStorage.setItem('table-columns-width', JSON.stringify(colunasWidth.value))
      } catch (error) {
        console.error('Error saving column widths:', error)
      }
    }

    // Cell editing functions
    const handleDblClick = async (field, processo, event) => {
      if (editingCell.value.id === processo.id && editingCell.value.field === field) {
        return;
      }

      const cell = event.target.closest('td');
      const rect = cell.getBoundingClientRect();

      // Special handling for sistemas_ativos field
      if (field === 'sistemas_ativos') {
        editingCell.value = {
          id: processo.id,
          field,
          value: Array.isArray(processo[field]) ? [...processo[field]] : []
        };

        sistemasDialog.value = {
          show: true,
          position: {
            top: `${rect.bottom + 10}px`,
            left: `${rect.left}px`
          },
          processo
        };
        return;
      }

      // Check if field is representante_id
      if (field === 'representante_id') {
        console.log('Clicked on representative field');
        debugRepresentantes(); // Add this log

        // Check if we have representatives loaded
        if (representantes.value.length === 0) {
          console.log('Loading representatives on demand...');
          await loadRepresentantes();

          debugRepresentantes(); // Log after loading

          // Check again after loading
          if (representantes.value.length === 0) {
            console.error('Could not load representatives.');
            alert('Could not load the list of representatives.');
            return;
          }
        }
      }

      // Dentro da função handleDblClick

      // Verifique se o campo é responsavel_id
      if (field === 'responsavel_id') {
        console.log('Clicked on responsável field');

        // Verificar se os responsáveis foram carregados
        if (responsaveisProcessos.value.length === 0) {
          console.log('Loading responsáveis on demand...');
          await loadResponsaveisProcessos();

          // Verificar novamente após carregar
          if (responsaveisProcessos.value.length === 0) {
            console.error('Could not load responsáveis.');
            alert('Não foi possível carregar a lista de responsáveis.');
            return;
          }
        }
      }

      // Default behavior for other fields
      confirmDialog.value = {
        show: true,
        position: {
          top: `${rect.bottom + 2}px`,
          left: `${rect.left}px`
        },
        callback: () => {
          editingCell.value = {
            id: processo.id,
            field,
            value: processo[field]
          };
        }
      };
    };

    const handleConfirmEdit = () => {
      // Execute callback to start editing
      confirmDialog.value.callback?.()
      hideConfirmDialog()

      // Focus on input field after rendering
      nextTick(() => {
        const input = document.querySelector('.editing-cell input, .editing-cell textarea, .editing-cell select')
        if (input) {
          input.focus()
          if (input.type === 'text') {
            input.selectionStart = input.selectionEnd = input.value.length
          }
        }
      })
    }

    const hideConfirmDialog = () => {
      confirmDialog.value = {
        show: false,
        position: {},
        callback: null
      }
    }

    const cancelEdit = () => {
      editingCell.value = {
        id: null,
        field: null,
        value: null
      }
    }

    // Modificação na função handleUpdate
    const handleUpdate = async (processo) => {
      try {
        // Verifica se é uma mudança de data que afeta o ano
        if (editingCell.value.field === 'data_pregao') {
          const anoAntigo = new Date(processo.data_pregao).getFullYear();
          const anoNovo = new Date(editingCell.value.value).getFullYear();
          
          if (anoAntigo !== anoNovo) {
            console.log(`Mudança de ano detectada: ${anoAntigo} -> ${anoNovo}`);
            
            // Atualiza o registro no banco
            const updateData = {
              data_pregao: editingCell.value.value,
              ano: anoNovo, // Atualiza também o campo ano
              updated_at: new Date().toISOString(),
              updated_by: (await supabase.auth.getUser()).data.user?.id
            };

            const { error } = await supabase
              .from('processos')
              .update(updateData)
              .eq('id', processo.id);

            if (error) throw error;

            // Recarrega os processos
            await loadProcessos();

            // Se estiver visualizando o ano antigo, muda para o novo ano
            if (anoSelecionado.value === anoAntigo) {
              anoSelecionado.value = anoNovo;
            }

            // Mostra mensagem de confirmação
            showToast(`Processo movido para o ano ${anoNovo}`, 'success');
            
            // Cancela o modo de edição
            cancelEdit();
            return;
          }
        }

        // Continua com a lógica normal de atualização para outros campos
        // Verifica se o campo está em edição
        if (editingCell.value.id !== processo.id) return;

        // Importante: Permitir valores vazios (string vazia)
        // O valor atual e anterior devem ser diferentes para prosseguir
        if (editingCell.value.value === processo[editingCell.value.field]) {
          console.log('Value did not change, canceling update')
          cancelEdit()
          return
        }

        let updateValue = editingCell.value.value

        // Specific formatting by field type
        switch (editingCell.value.field) {
          case 'data_pregao':
            // Ensure date is in the correct format for the database
            if (typeof updateValue === 'string') {
              if (updateValue.includes('/')) {
                // Convert from DD/MM/YYYY to YYYY-MM-DD
                const [day, month, year] = updateValue.split('/')
                updateValue = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
              } else if (updateValue.includes('-')) {
                // Already in YYYY-MM-DD format, just ensure
                const [year, month, day] = updateValue.split('-')
                updateValue = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
              }
            }
            break

          case 'hora_pregao':
            // Ensure HH:mm format
            if (typeof updateValue === 'string') {
              const [hours, minutes] = updateValue.split(':')
              updateValue = `${hours.padStart(2, '0')}:${minutes ? minutes.padStart(2, '0') : '00'}`
            }
            break

          case 'sistemas_ativos':
            // Ensure it's an array
            updateValue = Array.isArray(updateValue) ? updateValue : []
            break

          case 'representante_id':
            // Ensure it's UUID or null
            updateValue = updateValue || null;
            console.log('Updating representative to:', updateValue);

            if (updateValue) {
              // Check if the representative exists in the loaded list
              const representante = representantes.value.find(r => r.id === updateValue);
              if (representante) {
                console.log(`Selected representative name: ${representante.nome}`);
              } else {
                console.warn('Selected representative ID not found in list!');
                // Reload the list if not found
                await loadRepresentantes();
              }
            }
            break;

          case 'responsavel_id':
            // Usar o helper para garantir ID válido
            updateValue = ensureValidResponsavelId(updateValue)

            // Se mesmo após a conversão não temos um UUID válido, cancelar a atualização
            if (!updateValue) {
              console.error('Valor inválido para responsável:', editingCell.value.value)
              alert('Responsável inválido. Por favor, selecione um responsável válido da lista.')
              cancelEdit()
              return
            }

            console.log(`Atualizando responsável para: ${updateValue} (validado)`)
            break

          case 'empresa_id':
            // Usar o helper para garantir ID válido
            updateValue = ensureValidEmpresaId(updateValue);

            // Removendo a validação que impede valores nulos
            // O código abaixo será substituído
            /*
            if (!updateValue) {
              console.error('Valor inválido para empresa:', editingCell.value.value);
              alert('Empresa inválida. Por favor, selecione uma empresa válida da lista.');
              cancelEdit();
              return;
            }
            */

            // Permitimos explicitamente valores null (campo em branco)
            console.log(`Atualizando empresa para: ${updateValue === null ? 'vazio' : updateValue} (validado)`);
            break;

          case 'distancia_km':
            // Validar se é um número válido
            const distanciaNum = parseFloat(editingCell.value.value.replace(/[^\d.,]/g, '').replace(',', '.'));
            
            if (isNaN(distanciaNum)) {
              alert('A distância deve ser um número válido');
              cancelEdit();
              return;
            }
            
            // Verificar se já existe uma distância
            const { data: existingDistancia } = await supabase
              .from('processo_distancias')
              .select('*')
              .eq('processo_id', processo.id)
              .single();
          
            if (existingDistancia) {
              // Atualiza a distância existente
              const { error } = await supabase
                .from('processo_distancias')
                .update({
                  distancia_km: distanciaNum,
                  updated_at: new Date().toISOString()
                })
                .eq('id', existingDistancia.id);
          
              if (error) throw error;
            } else {
              // Cria uma nova distância
              const { error } = await supabase
                .from('processo_distancias')
                .insert({
                  processo_id: processo.id,
                  distancia_km: distanciaNum,
                  created_at: new Date().toISOString()
                });
          
              if (error) throw error;
            }
          
            // Atualizar o valor para o formato numérico validado
            updateValue = distanciaNum;
            break;
        }

        // Check if value actually changed to avoid unnecessary updates
        if (updateValue === processo[editingCell.value.field]) {
          console.log('Value did not change, canceling update')
          cancelEdit()
          return
        }

        console.log(`Updating ${editingCell.value.field} to:`, updateValue)

        // Prepare data for update
        const updateData = {
          [editingCell.value.field]: updateValue,
          updated_at: new Date().toISOString()
        }

        // Add user who is making the change if available
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.id) {
          updateData.updated_by = user.id
        }

        // Antes da chamada ao supabase
        console.log('Dados para atualização:', {
          campo: editingCell.value.field,
          valor: updateValue,
          tipo: typeof updateValue
        });

        // Registrar no histórico de desfazer
        undoHistory.value.push({
          id: processo.id,
          field: editingCell.value.field,
          oldValue: processo[editingCell.value.field],
          newValue: updateValue
        });

        // Limitar o tamanho do histórico
        if (undoHistory.value.length > MAX_HISTORY_SIZE) {
          undoHistory.value.shift(); // Remove o item mais antigo
        }

        // Limpar o histórico de refazer sempre que uma nova alteração é feita
        redoHistory.value = [];

        // Adicione esta verificação antes da atualização final:
        // Verificar se é uma alteração de status para SUSPENSO, ADIADO ou DEMONSTRACAO
        if (editingCell.value.field === 'status' && 
            ['suspenso', 'adiado', 'demonstracao'].includes(updateValue) && 
            processo.status !== updateValue) {
          
          // Cancelar a edição normal e abrir o diálogo de reagendamento
          cancelEdit();
          abrirReagendamentoDialog(processo, updateValue);
          return; // Interromper o fluxo normal de atualização
        }

        // Dentro da função handleUpdate, antes das outras verificações específicas
        if (editingCell.value.field === 'codigo_analise' && editingCell.value.value) {
          // Cancelar a edição normal e abrir o diálogo de análise
          cancelEdit();
          showAnaliseDialog(processo, editingCell.value.value);
          return; // Interromper o fluxo normal de atualização
        }

        // Update in database
        console.log('Update data:', updateData)

        const { error } = await supabase
          .from('processos')
          .update(updateData)
          .eq('id', processo.id)

        if (error) {
          console.error('Error updating:', error)
          throw error
        }

        // Log the change
        try {
          await logSystemAction({
            tipo: 'atualizacao',
            tabela: 'processos',
            registro_id: processo.id,
            campo_alterado: editingCell.value.field,
            dados_anteriores: processo[editingCell.value.field],
            dados_novos: updateValue
          })
        } catch (logError) {
          // If log fails, just report the error but continue
          console.warn('Error in change log:', logError)
        }

        // Reload processes after successful update
        await loadProcessos()
        console.log('Update completed successfully')

      } catch (error) {
        console.error('Error updating:', error)
        // Display error message to the user
        alert(`Error updating field: ${error.message || 'Check the data and try again'}`)
      } finally {
        cancelEdit()
      }
    }

    // Systems handling
    const handleSistemasChange = (event) => {
      // Get selected values from the multiple select
      const selectedOptions = Array.from(event.target.selectedOptions).map(option => option.value)
      editingCell.value.value = selectedOptions
    }

    const removerSistema = (id) => {
      if (!editingCell.value.value) return

      const index = editingCell.value.value.indexOf(id)
      if (index !== -1) {
        const newSistemas = [...editingCell.value.value]
        newSistemas.splice(index, 1)
        editingCell.value.value = newSistemas
      }
    }

    const saveSistemas = async () => {
      try {
        if (!editingCell.value.id || !sistemasDialog.value.processo) {
          hideSistemasDialog();
          return;
        }

        const processo = sistemasDialog.value.processo;
        const updateData = {
          sistemas_ativos: editingCell.value.value,
          updated_at: new Date().toISOString()
        };

        // Add user who is making the change if available
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          updateData.updated_by = user.id;
        }

        const { error } = await supabase
          .from('processos')
          .update(updateData)
          .eq('id', processo.id);

        if (error) throw error;

        // Log the change
        await logSystemAction({
          tipo: 'atualizacao',
          tabela: 'processos',
          registro_id: processo.id,
          campo_alterado: 'sistemas_ativos',
          dados_anteriores: processo.sistemas_ativos,
          dados_novos: editingCell.value.value
        });

        // Reload processes
        await loadProcessos();

        hideSistemasDialog();
      } catch (error) {
        console.error('Error saving systems:', error);
        alert('Error saving systems');
      }
    };

    const hideSistemasDialog = () => {
      sistemasDialog.value = {
        show: false,
        position: {},
        processo: null
      };

      // Clear editing state
      editingCell.value = {
        id: null,
        field: null,
        value: null
      };
    };

    // Page visibility and auto-refresh
    const pageVisibilityHandler = () => {
      if (!document.hidden) {
        loadProcessos().catch(console.error) // Load in background
      }
    }

    const startVisibilityMonitoring = () => {
      document.addEventListener('visibilitychange', pageVisibilityHandler)
      window.addEventListener('focus', pageVisibilityHandler)
      window.addEventListener('online', pageVisibilityHandler)
    }

    const stopVisibilityMonitoring = () => {
      document.removeEventListener('visibilitychange', pageVisibilityHandler)
      window.removeEventListener('focus', pageVisibilityHandler)
      window.removeEventListener('online', pageVisibilityHandler)
    }

    const startAutoRefresh = () => {
      stopAutoRefresh() // To avoid multiple intervals
      refreshInterval.value = setInterval(() => {
        loadProcessos()
      }, 30000) // Update every 30 seconds
    }

    const stopAutoRefresh = () => {
      if (refreshInterval.value) {
        clearInterval(refreshInterval.value)
        refreshInterval.value = null
      }
    }

    // Debugging function
    const debugRepresentantes = () => {
      console.log(`Status of representatives: 
      - Array loaded: ${representantes.value ? 'Yes' : 'No'}
      - Quantity: ${representantes.value?.length || 0}
      - First representative: ${representantes.value?.[0]?.nome || 'None'}`);
    }

    // Validation helpers
    const validarIdRelacionamento = async (tabela, campo, id) => {
      if (!id) return null; // Null values are valid

      try {
        const { data, error } = await supabase
          .from(tabela)
          .select('id')
          .eq('id', id)
          .single();

        if (error || !data) {
          console.warn(`ID ${id} not found in table ${tabela}, will be considered null`);
          return null;
        }

        return id; // Valid ID
      } catch (err) {
        console.error(`Error validating ID in ${tabela}:`, err);
        return null;
      }
    };

    // Adicione esta função dentro do setup(), antes do uso na função handleUpdate

    // Helper para validar e garantir UUID válido para responsável
    const ensureValidResponsavelId = (value) => {
      // Se o valor for vazio ou null, retorna null (sem responsável)
      if (!value) return null;

      // Se já for um UUID válido, retorna direto
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(value)) return value;

      // Se não for UUID, tenta encontrar por nome (improvável neste caso)
      const responsavel = responsaveisProcessos.value.find(r =>
        r.nome.toLowerCase() === value.toLowerCase());

      if (responsavel) return responsavel.id;

      // Se não encontrar, retorna null
      console.warn(`Valor inválido para responsável: ${value}`);
      return null;
    };

    // Form submission
    const handleSubmit = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        const dataPregao = new Date(formData.value.data_pregao + 'T12:00:00')

        const processoData = {
          numero_processo: `${formData.value.numero}/${formData.value.ano}`,
          ano: formData.value.ano,
          orgao: formData.value.orgao,
          data_pregao: dataPregao.toISOString().split('T')[0],
          hora_pregao: formData.value.hora_pregao,
          codigo_analise: formData.value.codigo_analise,
          estado: formData.value.estado,
          modalidade: formData.value.modalidade,
          site_pregao: formData.value.site_pregao,
          objeto_resumido: formData.value.objeto_resumido,
          objeto_completo: formData.value.objeto_completo,
          representante_id: formData.value.representante_id
        }

        console.log('Data to be inserted:', {
          data_pregao: dataPregao.toISOString().split('T')[0],
          hora_pregao: formData.value.hora_pregao
        });

        const { error } = await supabase
          .from('processos')
          .insert(processoData)

        if (error) throw error
        alert('Process registered successfully!')
        router.push('/processos')
      } catch (error) {
        console.error('Error:', error)
        alert('Error registering process')
      }
    };

    // Helper for filter options
    // Substitua a função opcoesUnicas por esta versão melhorada:

    const opcoesUnicas = (coluna) => {
      if (!processos.value || processos.value.length === 0) return [];

      const opcoes = new Set();

      // Para colunas especiais que precisam de tratamento diferenciado
      if (coluna === 'modalidade') {
        // Retorna diretamente as opções pré-definidas
        return opcoesModalidade;
      }

      processos.value.forEach(processo => {
        let valor = processo[coluna];

        // Pular valores nulos ou indefinidos
        if (valor === null || valor === undefined) return;

        // Tratamento específico para diferentes tipos de coluna
        switch (coluna) {
          case 'data_pregao':
            valor = formatDate(valor);
            break;
          case 'hora_pregao':
            valor = formatTime(valor);
            break;
          case 'status':
            valor = { value: valor, text: formatStatus(valor) };
            break;
          case 'responsavel_id':
            // Busca o nome do responsável
            const responsavel = responsaveisProcessos.value.find(r => r.id === valor);
            valor = { value: valor, text: responsavel ? responsavel.nome : valor };
            break;
          case 'representante_id':
            // Busca o nome do representante
            const representante = representantes.value.find(r => r.id === valor);
            valor = { value: valor, text: representante ? representante.nome : valor };
            break;
          case 'empresa_id':
            // Busca o nome da empresa
            const empresa = empresas.value.find(e => e.id === valor);
            valor = { value: valor, text: empresa ? empresa.nome : valor };
            break;
        }

        if (valor) opcoes.add(JSON.stringify(valor));
      });

      // Convertemos de volta os objetos JSON para JavaScript
      return Array.from(opcoes).map(item => {
        try {
          return JSON.parse(item);
        } catch {
          return item;
        }
      }).sort((a, b) => {
        // Ordenar string ou objeto com campo text
        const textA = typeof a === 'object' ? a.text : a;
        const textB = typeof b === 'object' ? b.text : b;
        return textA.localeCompare(textB);
      });
    };

    // Atualizar filtros quando um item é selecionado
    const toggleFiltroItem = (coluna, valor) => {
      if (!filtros.value[coluna]) {
        filtros.value[coluna] = [];
      }

      const index = filtros.value[coluna].indexOf(valor);
      if (index === -1) {
        // Adiciona o item ao filtro
        filtros.value[coluna].push(valor);
      } else {
        // Remove o item do filtro
        filtros.value[coluna].splice(index, 1);
      }
    };

    // Initialize filters
    const initializeFiltros = () => {
      const filtrosIniciais = {}
      colunas.forEach(coluna => {
        filtrosIniciais[coluna.campo] = []
      })
      return filtrosIniciais
    }

    // Lifecycle hooks
    onMounted(async () => {
      try {
        // 1. Start page visibility monitoring
        startVisibilityMonitoring()

        // 2. Initialize filters
        filtros.value = initializeFiltros()

        // 3. Register listener to close filter dropdowns when clicking outside
        document.addEventListener('click', (e) => {
          const isFilterClick = e.target.closest('.filtro-container')
          if (!isFilterClick) {
            Object.keys(mostrarFiltro.value).forEach(key => {
              mostrarFiltro.value[key] = false
            })
          }
        })

        // 4. Load data in parallel for better performance
        console.log('Starting data loading...');

        // Then load other data in parallel
        await Promise.all([
          loadProcessos(),
          loadRepresentantes(),
          loadEmpresas(),
          loadPlataformas(),
          loadSistemas(),
          loadResponsaveisProcessos() // Adicionar carregamento de responsáveis
        ]);

        console.log('All other data loaded successfully!');

        // 5. Load interface settings
        loadColumnWidths()

        // Adicionar este código no método onMounted após loadColumnWidths()
        loadColumnsOrder()

        // 6. Set up Realtime channel for real-time updates
        const channel = supabase.channel('processos-updates')
          .on('postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'processos'
            },
            () => {
              loadProcessos()
            }
          )
          .subscribe()

        // 7. Register channel in manager
        SupabaseManager.addSubscription('processos-updates', channel)

        // 8. Start auto-refresh
        startAutoRefresh()

        // Adicionar dentro de onMounted()
        document.addEventListener('keydown', handleKeyDown);

        // Verificar e processar notificações agendadas
        try {
          const result = await processScheduledNotifications();
          if (result.success && result.count > 0) {
            showToast(`${result.count} notificações enviadas automaticamente`, 'info');
          }
        } catch (error) {
          console.error('Erro ao processar notificações agendadas:', error);
        }

        // Verificar notificações pendentes
        await checkPendingNotifications();
        
        // Verificar notificações a cada 1 hora
        setInterval(checkPendingNotifications, 3600000);

        await loadSystemUpdates();
      } catch (error) {
        console.error('Error in component initialization:', error)
      }
    })

    // Cleanup on unmount
    onUnmounted(() => {
      // Stop visibility monitoring
      stopVisibilityMonitoring()

      // Stop auto-refresh
      stopAutoRefresh()

      // Remove Supabase channel
      const channel = SupabaseManager.getSubscription('processos-updates')
      if (channel) {
        supabase.removeChannel(channel)
        SupabaseManager.removeSubscription('processos-updates')
      }

      // Adicionar dentro de onUnmounted()
      document.removeEventListener('keydown', handleKeyDown);
    })

    // Use connection manager
    useConnectionManager(loadProcessos)

    // Dialog para distâncias
    const distanciaDialog = ref({
      show: false,
      position: {},
      processo: null,
      distancias: [],
      editandoIndex: -1,
      novaDistancia: {
        distancia_km: '',
        ponto_referencia_cidade: '',
        ponto_referencia_uf: ''
      }
    });

    // Funções para gerenciamento das distâncias
    const abrirDialogDistancia = async (processo, event) => {
      try {
        // Carregar as distâncias do processo
        const { data, error } = await supabase
          .from('processo_distancias')
          .select('*')
          .eq('processo_id', processo.id)
          .order('created_at');

        if (error) throw error;

        // Configurar o dialog
        const rect = event.target.getBoundingClientRect();
        distanciaDialog.value = {
          show: true,
          position: {
            top: `${rect.bottom + 10}px`,
            left: `${rect.left}px`
          },
          processo: processo,
          distancias: data || [],
          editandoIndex: -1,
          novaDistancia: {
            distancia_km: '',
            ponto_referencia_cidade: '',
            ponto_referencia_uf: ''
          }
        };
      } catch (error) {
        console.error('Erro ao abrir diálogo de distâncias:', error);
      }
    };

    const iniciarEdicaoDistancia = (distancia, index) => {
      distanciaDialog.value.editandoIndex = index;
      distanciaDialog.value.novaDistancia = {
        distancia_km: distancia.distancia_km,
        ponto_referencia_cidade: distancia.ponto_referencia_cidade,
        ponto_referencia_uf: distancia.ponto_referencia_uf,
        id: distancia.id
      };
    };

    const cancelarEdicaoDistancia = () => {
      distanciaDialog.value.editandoIndex = -1;
      distanciaDialog.value.novaDistancia = {
        distancia_km: '',
        ponto_referencia_cidade: '',
        ponto_referencia_uf: ''
      };
    };

    const salvarEdicaoDistancia = async () => {
      try {
        const { distancia_km, ponto_referencia_cidade, ponto_referencia_uf, id } = distanciaDialog.value.novaDistancia;

        if (!distancia_km || !ponto_referencia_cidade || !ponto_referencia_uf) {
          alert('Todos os campos são obrigatórios');
          return;
        }

        const { error } = await supabase
          .from('processo_distancias')
          .update({
            distancia_km,
            ponto_referencia_cidade,
            ponto_referencia_uf,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        if (error) throw error;

        // Atualiza a distância na lista local
        distanciaDialog.value.distancias[distanciaDialog.value.editandoIndex] = {
          ...distanciaDialog.value.distancias[distanciaDialog.value.editandoIndex],
          distancia_km,
          ponto_referencia_cidade,
          ponto_referencia_uf
        };

        // Limpa o formulário de edição
        cancelarEdicaoDistancia();
      } catch (error) {
        console.error('Erro ao salvar distância:', error);
      }
    };

    const adicionarDistancia = async () => {
      try {
        const { distancia_km, ponto_referencia_cidade, ponto_referencia_uf } = distanciaDialog.value.novaDistancia;

        if (!distancia_km || !ponto_referencia_cidade || !ponto_referencia_uf) {
          alert('Todos os campos são obrigatórios');
          return;
        }

        const { data, error } = await supabase
          .from('processo_distancias')
          .insert({
            processo_id: distanciaDialog.value.processo.id,
            distancia_km,
            ponto_referencia_cidade,
            ponto_referencia_uf,
            created_at: new Date().toISOString()
          })
          .select();

        if (error) throw error;

        // Adiciona a nova distância à lista local
        distanciaDialog.value.distancias.push(data[0]);

        // Limpa o formulário
        distanciaDialog.value.novaDistancia = {
          distancia_km: '',
          ponto_referencia_cidade: '',
          ponto_referencia_uf: ''
        };
      } catch (error) {
        console.error('Erro ao adicionar distância:', error);
      }
    };

    const excluirDistancia = async (distancia, index) => {
      if (!confirm('Tem certeza que deseja excluir esta distância?')) return;

      try {
        const { error } = await supabase
          .from('processo_distancias')
          .delete()
          .eq('id', distancia.id);

        if (error) throw error;

        // Remove a distância da lista local
        distanciaDialog.value.distancias.splice(index, 1);
      } catch (error) {
        console.error('Erro ao excluir distância:', error);
      }
    };

    const fecharDistanciaDialog = () => {
      distanciaDialog.value.show = false;
      // Recarregar processos para atualizar as distâncias na interface
      loadProcessos();
    };

    const {
      responsaveis: responsaveisProcessos,
      loadResponsaveis: loadResponsaveisProcessos,
      getResponsavelNome: getResponsavelProcessoNome
    } = useResponsaveis()

    // Adicionar esta função dentro do setup()

    const getOpcoesParaCampo = (coluna) => {
      if (coluna.campo === 'responsavel_id') {
        return responsaveisProcessos.value;
      } else if (coluna.campo === 'representante_id') {
        return representantes.value;
      } else if (coluna.campo === 'empresa_id') {
        return empresas.value;
      }
      // Adicione outras relações conforme necessário
      return [];
    };

    // Dialog para responsáveis
    const responsaveisDialog = ref({
      show: false,
      position: {},
      processo: null
    });

    // Função para lidar com o clique no responsável
    const handleDblClickResponsavel = async (field, processo, event) => {
      // Verifica se já carregou os responsáveis
      if (responsaveisProcessos.value.length === 0) {
        await loadResponsaveisProcessos();
      }

      // Configura o diálogo
      const cell = event.target.closest('td');
      const rect = cell.getBoundingClientRect();

      // Prepara dados para edição
      editingCell.value = {
        id: processo.id,
        field,
        value: processo[field]
      };

      responsaveisDialog.value = {
        show: true,
        position: {
          top: `${rect.bottom + 10}px`,
          left: `${rect.left}px`
        },
        processo
      };
    };

    // Função para remover o responsável selecionado
    const removerResponsavel = () => {
      editingCell.value.value = null;
    };

    // Função para lidar com a mudança de responsável no select
    const handleResponsavelChange = (event) => {
      editingCell.value.value = event.target.value;
    };

    // Função para salvar o responsável
    const saveResponsavel = async () => {
      try {
        if (!editingCell.value.id || !responsaveisDialog.value.processo) {
          hideResponsaveisDialog();
          return;
        }

        await handleUpdate(responsaveisDialog.value.processo);
        hideResponsaveisDialog();
      } catch (error) {
        console.error('Erro ao salvar responsável:', error);
        alert('Erro ao salvar responsável');
      }
    };

    // Função para fechar o diálogo de responsáveis
    const hideResponsaveisDialog = () => {
      responsaveisDialog.value = {
        show: false,
        position: {},
        processo: null
      };
    };

    // Dialog para representantes
    const representantesDialog = ref({
      show: false,
      position: {},
      processo: null
    });

    // Função para validar ID de representante
    const ensureValidRepresentanteId = (value) => {
      // Se o valor for vazio ou null, retorna null (sem representante)
      if (!value) return null;

      // Se já for um UUID válido, retorna direto
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(value)) return value;

      // Se não for UUID, tenta encontrar por nome (improvável neste caso)
      const representante = representantes.value.find(r =>
        r.nome.toLowerCase() === value.toLowerCase());

      if (representante) return representante.id;

      // Se não encontrar, retorna null
      console.warn(`Valor inválido para representante: ${value}`);
      return null;
    };

    // Função para lidar com o clique no representante
    const handleDblClickRepresentante = async (field, processo, event) => {
      // Verifica se já carregou os representantes
      if (representantes.value.length === 0) {
        await loadRepresentantes();
      }

      // Configura o diálogo
      const cell = event.target.closest('td');
      const rect = cell.getBoundingClientRect();

      // Prepara dados para edição
      editingCell.value = {
        id: processo.id,
        field,
        value: processo[field]
      };

      representantesDialog.value = {
        show: true,
        position: {
          top: `${rect.bottom + 10}px`,
          left: `${rect.left}px`
        },
        processo
      };
    };

    // Função para remover o representante selecionado
    const removerRepresentante = () => {
      editingCell.value.value = null;
    };

    // Função para lidar com a mudança de representante no select
    const handleRepresentanteChange = (event) => {
      editingCell.value.value = event.target.value;
    };

    // Função para salvar o representante
    const saveRepresentante = async () => {
      try {
        if (!editingCell.value.id || !representantesDialog.value.processo) {
          hideRepresentantesDialog();
          return;
        }

        await handleUpdate(representantesDialog.value.processo);
        hideRepresentantesDialog();
      } catch (error) {
        console.error('Erro ao salvar representante:', error);
        alert('Erro ao salvar representante');
      }
    };

    // Função para fechar o diálogo de representantes
    const hideRepresentantesDialog = () => {
      representantesDialog.value = {
        show: false,
        position: {},
        processo: null
      };
    };

    // Dialog para empresas
    const empresasDialog = ref({
      show: false,
      position: {},
      processo: null
    });

    // Função para formatar CNPJ na exibição
    const formatCNPJ = (cnpj) => {
      if (!cnpj) return '';
      return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
    };

    // Função para validar ID de empresa
    const ensureValidEmpresaId = (value) => {
      // Se o valor for vazio ou null, retorna null (sem empresa)
      if (!value) return null;

      // Se já for um UUID válido, retorna direto
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(value)) return value;

      // Se não for UUID, tenta encontrar por nome
      const empresa = empresas.value.find(e =>
        e.nome.toLowerCase() === value.toLowerCase());

      if (empresa) return empresa.id;

      // Se não encontrar, retorna null
      console.warn(`Valor inválido para empresa: ${value}`);
      return null;
    };

    // Função para lidar com o clique na empresa
    const handleDblClickEmpresa = async (field, processo, event) => {
      // Verifica se já carregou as empresas
      if (empresas.value.length === 0) {
        await loadEmpresas();
      }

      // Configura o diálogo
      const cell = event.target.closest('td');
      const rect = cell.getBoundingClientRect();

      // Prepara dados para edição
      editingCell.value = {
        id: processo.id,
        field,
        value: processo[field]
      };

      empresasDialog.value = {
        show: true,
        position: {
          top: `${rect.bottom + 10}px`,
          left: `${rect.left}px`
        },
        processo
      };
    };

    // Função para remover a empresa selecionada
    const removerEmpresa = () => {
      editingCell.value.value = null;
    };

    // Função para lidar com a mudança de empresa no select
    const handleEmpresaChange = (event) => {
      editingCell.value.value = event.target.value;
    };

    // Função para salvar a empresa
    const saveEmpresa = async () => {
      try {
        if (!editingCell.value.id || !empresasDialog.value.processo) {
          hideEmpresasDialog();
          return;
        }

        await handleUpdate(empresasDialog.value.processo);
        hideEmpresasDialog();
      } catch (error) {
        console.error('Erro ao salvar empresa:', error);
        alert('Erro ao salvar empresa');
      }
    };

    // Função para fechar o diálogo de empresas
    const hideEmpresasDialog = () => {
      empresasDialog.value = {
        show: false,
        position: {},
        processo: null
      };
    };

    // Adicionar no início do setup()
    const toasts = ref([])

    // Adicionar esta função dentro do setup()
    const showToast = (message, type = 'success', duration = 3000) => {
      const id = Date.now();
      toasts.value.push({ id, message, type });
      
      setTimeout(() => {
        toasts.value = toasts.value.filter(t => t.id !== id);
      }, duration);
    }

    // Adicionar no setup(), próximo aos outros refs
    const undoHistory = ref([]);  // Histórico de mudanças
    const redoHistory = ref([]);  // Histórico de mudanças refeitas
    const MAX_HISTORY_SIZE = 50; // Limite do histórico

    // Adicionar esta função dentro do setup()
    const handleKeyDown = (event) => {
      // Ctrl+Z para desfazer
      if (event.ctrlKey && event.key === 'z') {
        event.preventDefault();
        undoAction();
      }
      // Ctrl+Y para refazer
      else if (event.ctrlKey && event.key === 'y') {
        event.preventDefault();
        redoAction();
      }
    };

    // Adicionar dentro do setup()
    const undoAction = async () => {
      try {
        if (undoHistory.value.length === 0) {
          console.log('Nada para desfazer');
          return;
        }

        const lastAction = undoHistory.value.pop();
        console.log('Desfazendo ação:', lastAction);

        // Adicionar ao histórico de refazer
        redoHistory.value.push({
          id: lastAction.id,
          field: lastAction.field,
          oldValue: lastAction.newValue, // Inverte valores
          newValue: lastAction.oldValue
        });

        // Atualizar no banco de dados
        const updateData = {
          [lastAction.field]: lastAction.oldValue,
          updated_at: new Date().toISOString()
        };

        // Adicionar usuário que está fazendo a alteração
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          updateData.updated_by = user.id;
        }

        // Atualizar no banco de dados
        const { error } = await supabase
          .from('processos')
          .update(updateData)
          .eq('id', lastAction.id);

        if (error) throw error;

        // Registrar no log do sistema
        await logSystemAction({
          tipo: 'desfazer',
          tabela: 'processos',
          registro_id: lastAction.id,
          campo_alterado: lastAction.field,
          dados_anteriores: lastAction.newValue,
          dados_novos: lastAction.oldValue
        });

        // Recarregar os dados
        await loadProcessos();

        // Mostrar mensagem de confirmação
        showToast(`Ação desfeita: ${lastAction.field}`, 'success')
      } catch (error) {
        console.error('Erro ao desfazer ação:', error);
        showToast('Erro ao desfazer: ' + (error.message || 'Verifique os dados e tente novamente'), 'error')
      }
    };

    const redoAction = async () => {
      try {
        if (redoHistory.value.length === 0) {
          console.log('Nada para refazer');
          return;
        }

        const nextAction = redoHistory.value.pop();
        console.log('Refazendo ação:', nextAction);

        // Adicionar de volta ao histórico de desfazer
        undoHistory.value.push({
          id: nextAction.id,
          field: nextAction.field,
          oldValue: nextAction.newValue, // Inverte valores
          newValue: nextAction.oldValue
        });

        // Atualizar no banco de dados
        const updateData = {
          [nextAction.field]: nextAction.oldValue,
          updated_at: new Date().toISOString()
        };

        // Adicionar usuário que está fazendo a alteração
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          updateData.updated_by = user.id;
        }

        // Atualizar no banco de dados
        const { error } = await supabase
          .from('processos')
          .update(updateData)
          .eq('id', nextAction.id);

        if (error) throw error;

        // Registrar no log do sistema
        await logSystemAction({
          tipo: 'refazer',
          tabela: 'processos',
          registro_id: nextAction.id,
          campo_alterado: nextAction.field,
          dados_anteriores: nextAction.newValue,
          dados_novos: nextAction.oldValue
        });

        // Recarregar os dados
        await loadProcessos();

        // Mostrar mensagem de confirmação
        showToast(`Ação refeita: ${nextAction.field}`, 'success')
      } catch (error) {
        console.error('Erro ao refazer ação:', error);
        alert('Erro ao refazer: ' + (error.message || 'Verifique os dados e tente novamente'));
      }
    };

    // Completar a lista de opções de modalidade
    const opcoesModalidade = [
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

    // Adicione esta nova função

    const limparFiltroColuna = (coluna) => {
      if (filtros.value[coluna]) {
        filtros.value[coluna] = [];
      }
    };

    // Adicione esta função para filtrar as opções com base na pesquisa
    const filtrarOpcoesPorColuna = (coluna, opcoes) => {
      if (!filtroSearch.value[coluna]) {
        return opcoes;
      }

      const busca = filtroSearch.value[coluna].toLowerCase();

      return opcoes.filter(opcao => {
        if (typeof opcao === 'object' && opcao.text) {
          return opcao.text.toLowerCase().includes(busca);
        } else if (typeof opcao === 'string') {
          return opcao.toLowerCase().includes(busca);
        }
        return false;
      });
    };

    // Dialog para reagendamento
    const reagendamentoDialog = ref({
      show: false,
      processo: null,
      status: null,
      temNovaData: false,
      novaData: '',
      novaHora: ''
    });

    // Função para abrir o diálogo de reagendamento
    const abrirReagendamentoDialog = (processo, status) => {
      // Formatar a data original do processo para o formato yyyy-MM-dd
      const dataProcesso = processo.data_pregao ? new Date(processo.data_pregao) : new Date();
      const dataOriginal = dataProcesso.toISOString().split('T')[0];
      
      reagendamentoDialog.value = {
        show: true,
        processo: processo,
        status: status,
        temNovaData: status === 'demonstracao',
        novaData: '',
        novaHora: '',
        dataOriginal: dataOriginal, // Guarda a data original
        dataError: '',
        horaError: ''
      };
    };

    // Função para fechar o diálogo de reagendamento
    const hideReagendamentoDialog = () => {
      reagendamentoDialog.value.show = false;
    };

    // Função para confirmar que há nova data
    const confirmarTemNovaData = () => {
      reagendamentoDialog.value.temNovaData = true;
    };

    // Função para confirmar que não há nova data
    const confirmSemNovaData = async () => {
      // Apenas atualiza o status e fecha o diálogo
      await atualizarStatusProcesso(reagendamentoDialog.value.processo, reagendamentoDialog.value.status);
      hideReagendamentoDialog();
    };

    // Função para atualizar status do processo
    const atualizarStatusProcesso = async (processo, status) => {
      try {
        const updateData = {
          status: status,
          updated_at: new Date().toISOString()
        };

        // Adicionar usuário que está fazendo a alteração
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          updateData.updated_by = user.id;
        }

        // Atualizar no banco de dados
        const { error } = await supabase
          .from('processos')
          .update(updateData)
          .eq('id', processo.id);

        if (error) throw error;

        // Registrar no log do sistema
        await logSystemAction({
          tipo: 'atualizacao',
          tabela: 'processos',
          registro_id: processo.id,
          campo_alterado: 'status',
          dados_anteriores: processo.status,
          dados_novos: status
        });

        // Recarregar processos
        await loadProcessos();
        
        showToast(`Status atualizado para ${formatStatus(status)}`, 'success');
      } catch (error) {
        console.error('Erro ao atualizar status:', error);
        showToast('Erro ao atualizar status do processo', 'error');
      }
    };

    // Adicionar nova função para validação
    const validarDataHora = () => {
      let valido = true;
      reagendamentoDialog.value.dataError = '';
      reagendamentoDialog.value.horaError = '';
      
      // Validar data
      if (!reagendamentoDialog.value.novaData) {
        reagendamentoDialog.value.dataError = 'Data é obrigatória';
        valido = false;
      } else {
        const novaData = new Date(reagendamentoDialog.value.novaData);
        const dataOriginal = new Date(reagendamentoDialog.value.dataOriginal);
        
        // Comparar apenas as datas, sem considerar as horas
        novaData.setHours(0, 0, 0, 0);
        dataOriginal.setHours(0, 0, 0, 0);
        
        if (novaData < dataOriginal) {
          reagendamentoDialog.value.dataError = 'A nova data deve ser posterior à data original do processo';
          valido = false;
        }
      }
      
      // Validar hora
      if (!reagendamentoDialog.value.novaHora) {
        reagendamentoDialog.value.horaError = 'Hora é obrigatória';
        valido = false;
      } else {
        const [horas, minutos] = reagendamentoDialog.value.novaHora.split(':').map(Number);
        if (horas < 8 || horas > 18 || (horas === 18 && minutos > 0)) {
          reagendamentoDialog.value.horaError = 'A hora deve estar entre 08:00 e 18:00';
          valido = false;
        }
      }
      
      return valido;
    };

    // Função para tratar atualização de status
    const handleStatusUpdate = async (statusData) => {
      // Recarregar a lista de processos para refletir a mudança
      await loadProcessosAno(anoSelecionado.value);
      
      // Mostrar feedback ao usuário
      showToast(`Status do processo atualizado para ${statusData.newStatus}`, 'success');
    };

    // Adicionar essas variáveis e funções para o controle de status
    const selectedStatusMap = ref({});
    const nextNotificationDateMap = ref({});
    const { updateProcessoStatus } = useProcessoUpdate();
    
    // Remover a definição de statusOptions e usar o statusMap existente
    const statusOptions = computed(() => {
      // Obter as chaves e valores do statusMap na função formatStatus
      const statusMap = {
        'vamos_participar': 'Vamos Participar',
        'em_analise': 'Em Análise',
        'em_andamento': 'Em Andamento',
        'ganhamos': 'Ganhamos',
        'perdemos': 'Perdemos',
        'suspenso': 'Suspenso',
        'revogado': 'Revogado',
        'adiado': 'Adiado',
        'demonstracao': 'Demonstração',
        'cancelado': 'Cancelado',
        'nao_participar': 'Decidido Não Participar'
      };
      
      // Transformar em array no formato esperado
      return Object.entries(statusMap).map(([value, label]) => ({
        value,
        label
      }));
    });
    
    const getStatusClass = (processo) => {
      const status = selectedStatusMap.value[processo.id] || processo.status;
      return `status-${status.toLowerCase()}`;
    };
    
    const isRecurringStatus = (processo) => {
      const status = selectedStatusMap.value[processo.id] || processo.status;
      return ['suspenso', 'adiado', 'demonstracao'].includes(status);
    };
    
    // Modificação na função handleStatusChange para validação robusta
    const handleStatusChange = async (processo, event) => {
      try {
        const newStatus = event.target.value;
        console.log('Updating status to:', newStatus);
        
        // Se o status não mudou, não faz nada
        if (newStatus === processo.status) return;
        
        // Verificar se está mudando para "vamos_participar" e se os requisitos são atendidos
        if (newStatus.toLowerCase() === 'vamos_participar') {
          let mensagensErro = [];
          
          // 1. Verificação do portal/plataforma
          const plataformaInvalida = !processo.site_pregao || 
              processo.site_pregao === 'https://semurl.com.br' || 
              processo.site_pregao.toLowerCase().includes('a confirmar') ||
              processo.site_pregao.toLowerCase().includes('(a confirmar)') ||
              processo.site_pregao.toLowerCase().includes('a definir') ||
              processo.site_pregao.toLowerCase().includes('não definido') ||
              processo.site_pregao.toLowerCase().includes('pendente');
          
          // 2. Verificação da empresa participante
          const empresaInvalida = !processo.empresa_id;
          
          // Preparar mensagens de erro dependendo das condições
          if (plataformaInvalida) {
            mensagensErro.push('Portal/plataforma inválido ou não definido');
          }
          
          if (empresaInvalida) {
            mensagensErro.push('Empresa participante não selecionada');
          }
          
          // Se houver qualquer erro, impedir a alteração e exibir avisos
          if (mensagensErro.length > 0) {
            // IMPORTANTE: Reverter a seleção para o status anterior
            event.target.value = processo.status;
            
            // Exibir mensagem de erro clara
            showToast(
              `ATENÇÃO: Para alterar para "Vamos Participar", corrija: ${mensagensErro.join(' e ')}`, 
              'error', 
              7000
            );
            
            // Destacar visualmente os campos com problemas no console (para depuração)
            if (plataformaInvalida) {
              console.error('VALIDAÇÃO FALHOU: Portal/plataforma precisa ser definido adequadamente');
            }
            
            if (empresaInvalida) {
              console.error('VALIDAÇÃO FALHOU: Empresa participante precisa ser selecionada');
            }
            
            // Encerrar a função sem prosseguir com a atualização
            return;
          }
        }
        
        // Continuar com a atualização se passar nas validações
        console.log('Passed validations, updating status...');
        
        // O resto da função permanece igual
        // Atualiza o estado local imediatamente para feedback visual
        selectedStatusMap.value[processo.id] = newStatus;
        
        // Executa a atualização no banco de dados com tratamento de erro
        const result = await updateProcessoStatus(
          processo.id, 
          newStatus
        ).catch(error => {
          console.error('Erro na atualização de status:', error);
          return { success: false, message: error.message || 'Erro ao comunicar com o servidor' };
        });
        
        if (result.success) {
          // Continuar com operações secundárias...
        } else {
          // Reverter para o status anterior em caso de erro...
        }
      } catch (error) {
        // Tratamento de erro global...
      }
    };
    
    const loadNextNotificationDate = async (processoId, status) => {
      try {
        nextNotificationDateMap.value[processoId] = 'calculando...';
        
        const { data, error } = await supabase
          .from('notification_schedules')
          .select('next_notification')
          .eq('processo_id', processoId)
          .eq('active', true)
          .order('next_notification', { ascending: true })
          .limit(1)
          .single();
          
        if (error) throw error;
        
        if (data) {
          const date = new Date(data.next_notification);
          nextNotificationDateMap.value[processoId] = date.toLocaleDateString('pt-BR');
        } else {
          nextNotificationDateMap.value[processoId] = 'Amanhã';
        }
      } catch (error) {
        console.error('Erro ao carregar próxima data de notificação:', error);
        nextNotificationDateMap.value[processoId] = 'Não disponível';
      }
    };
    
    // Atualizar função de carregamento de processos para inicializar o estado do status
    const loadProcessosAno = async (ano) => {
      // ...existing code...
      
      // Inicializar o status selecionado para todos os processos
      processos.value.forEach(processo => {
        if (!selectedStatusMap.value[processo.id]) {
          selectedStatusMap.value[processo.id] = processo.status;
        }
        
        // Verificar se precisa carregar a próxima data de notificação
        if (['SUSPENSO', 'ADIADO', 'DEMONSTRACAO'].includes(processo.status)) {
          loadNextNotificationDate(processo.id, processo.status);
        }
      });
    };

    // Adicionar dentro do objeto setup() antes do return
    const statusInfoBalloon = ref({
      show: false,
      processo: null,
      nextNotification: '',
      position: {
        top: '0px',
        left: '0px'
      }
    });

    const showStatusInfo = (processo, event) => {
      // Só mostrar o balão se o status requer notificações
      if (!isRecurringStatus(processo)) return;
      
      // Calcular posição para o balão (abaixo do cursor)
      const x = event.clientX;
      const y = event.clientY;
      
      statusInfoBalloon.value = {
        show: true,
        processo: processo,
        nextNotification: nextNotificationDateMap.value[processo.id] || 'calculando...',
        position: {
          top: `${y + 25}px`,
          left: `${x - 150}px` // Centralizado em relação ao cursor
        }
      };
    };

    const hideStatusInfo = () => {
      statusInfoBalloon.value.show = false;
    };

    // Dialog para detalhes de análise
    const analiseDialog = ref({
      show: false,
      processo: null,
      codigoGPI: '',
      prazoResposta: '',
      codigoAnalise: ''
    });

    // Função para abrir o diálogo de análise
    const showAnaliseDialog = (processo, codigoAnalise) => {
      analiseDialog.value = {
        show: true,
        processo: processo,
        codigoAnalise: processo.codigo_gpi || codigoAnalise, // Use o código GPI existente ou o fornecido
        codigoGPI: processo.codigo_gpi || '',
        prazoResposta: processo.prazo_analise || ''
      };
    };

    // Função para fechar o diálogo de análise
    const hideAnaliseDialog = () => {
      analiseDialog.value.show = false;
    };

    // Função para salvar os detalhes da análise
    const salvarAnalise = async () => {
      try {
        if (!analiseDialog.value.processo || !analiseDialog.value.codigoGPI || !analiseDialog.value.prazoResposta) {
          showToast('Preencha todos os campos obrigatórios', 'error');
          return;
        }

        // Formatar a data corretamente para o banco
        const prazoFormatado = analiseDialog.value.prazoResposta instanceof Date 
          ? analiseDialog.value.prazoResposta.toISOString().split('T')[0] 
          : analiseDialog.value.prazoResposta;

        // 1. Atualizar o registro do processo com o código de análise
        const updateData = {
          codigo_analise: analiseDialog.value.codigoAnalise,
          codigo_gpi: analiseDialog.value.codigoGPI,
          prazo_analise: prazoFormatado,
          updated_at: new Date().toISOString()
        };

        // Adicionar usuário que está fazendo a alteração
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          updateData.updated_by = user.id;
        }

        // Atualizar no banco de dados
        const { error } = await supabase
          .from('processos')
          .update(updateData)
          .eq('id', analiseDialog.value.processo.id);

        if (error) throw error;

        // 2. Programar notificação para o prazo final
        const notificationData = {
          processo_id: analiseDialog.value.processo.id,
          tipo: 'analise',
          mensagem: `Prazo final para análise do processo ${analiseDialog.value.processo.numero_processo} (Código GPI: ${analiseDialog.value.codigoGPI})`,
          data_notificacao: new Date(prazoFormatado).toISOString(),
          created_at: new Date().toISOString(),
          active: true
        };

        // Inserir no sistema de notificações
        const { error: notificationError } = await supabase
          .from('notification_schedules')
          .insert(notificationData);

        if (notificationError) throw notificationError;

        // Registrar no log do sistema
        await logSystemAction({
          tipo: 'analise',
          tabela: 'processos',
          registro_id: analiseDialog.value.processo.id,
          campo_alterado: 'codigo_analise,codigo_gpi,prazo_analise',
          dados_anteriores: JSON.stringify({
            codigo_analise: analiseDialog.value.processo.codigo_analise,
            codigo_gpi: analiseDialog.value.processo.codigo_gpi,
            prazo_analise: analiseDialog.value.processo.prazo_analise
          }),
          dados_novos: JSON.stringify(updateData)
        });

        // Recarregar os dados
        await loadProcessos();
        
        // Fechar o diálogo
        hideAnaliseDialog();
        
        // Mostrar mensagem de sucesso
        showToast(`Análise registrada com sucesso! Código GPI: ${analiseDialog.value.codigoGPI}. Notificação agendada para ${formatDate(prazoFormatado)}`, 'success', 5000);
      } catch (error) {
        console.error('Erro ao salvar análise:', error);
        showToast('Erro ao salvar os detalhes da análise: ' + error.message, 'error');
      }
    };

    // Adicionar dentro do setup, após as outras funções
    const checkPendingNotifications = async () => {
      try {
        const today = new Date().toISOString();
        
        const { data, error } = await supabase
          .from('notification_schedules')
          .select('*, processos(*)')
          .eq('active', true)
          .eq('status', 'pending')
          .lte('next_notification', today)
          .order('next_notification', { ascending: true });
    
        if (error) throw error;
    
        for (const notification of data) {
          try {
            // Processar notificação
            await showToast(notification.mensagem, 'warning', 10000);
            
            // Atualizar status
            await supabase
              .from('notification_schedules')
              .update({
                status: 'completed',
                updated_at: new Date().toISOString()
              })
              .eq('id', notification.id);
    
          } catch (notifError) {
            console.error('Erro ao processar notificação:', notifError);
            
            // Atualizar tentativas
            await supabase
              .from('notification_schedules')
              .update({
                attempts: notification.attempts + 1,
                last_attempt: new Date().toISOString(),
                error_message: notifError.message,
                status: notification.attempts >= 2 ? 'failed' : 'pending'
              })
              .eq('id', notification.id);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar notificações:', error);
      }
    };

    // Adicione esta função dentro do setup()
    const handleAnaliseClick = (processo) => {
      // Abrir o modal diretamente sem passar pela edição
      showAnaliseDialog(processo, processo.codigo_analise || '');
    };

    const activeTab = ref('users'); // ou o que já existir
    const systemUpdates = ref([]);
    const showNewUpdateForm = ref(false);
    const previewingUpdate = ref(null);
    const newUpdate = ref({
      title: '',
      description: '',
      version: '',
      importance: 'media',
      release_date: new Date().toISOString().split('T')[0]
    });

    const loadSystemUpdates = async () => {
      try {
        const { data, error } = await supabase
          .from('system_updates')
          .select('*')
          .order('release_date', { ascending: false });
        
        if (error) throw error;
        
        systemUpdates.value = data;
      } catch (error) {
        console.error('Erro ao carregar atualizações:', error);
        showToastMessage('Erro ao carregar atualizações', 'error');
      }
    };

    const createNewUpdate = async () => {
      try {
        loading.value = true;
        
        const result = await createUpdate(newUpdate.value);
        
        if (result.success) {
          showToastMessage('Atualização criada com sucesso!');
          showNewUpdateForm.value = false;
          await loadSystemUpdates();
          
          // Limpar form
          newUpdate.value = {
            title: '',
            description: '',
            version: '',
            importance: 'media',
            release_date: new Date().toISOString().split('T')[0]
          };
        } else {
          throw new Error(result.message);
        }
      } catch (error) {
        console.error('Erro ao criar atualização:', error);
        showToastMessage('Erro ao criar atualização: ' + error.message, 'error');
      } finally {
        loading.value = false;
      }
    };

    const previewUpdate = (update) => {
      previewingUpdate.value = update;
    };

    const formatImportance = (importance) => {
      const map = {
        'baixa': 'Baixa',
        'media': 'Média',
        'alta': 'Alta'
      };
      return map[importance] || importance;
    };

    // Adicionar dentro do setup()
    const handleComponentUpdate = async (data) => {
      // Recarregar os processos para refletir a mudança
      await loadProcessos();
      
      // Mostrar mensagem de sucesso
      showToast(`Campo atualizado com sucesso`, 'success');
    };

    // Adicione estas funções dentro do método setup()

    // Referência para o diálogo de sistemas a implantar
    const sistemasImplantacaoDialog = ref({
      show: false,
      position: {},
      processo: null
    });

    // Função para mostrar o diálogo de sistemas a implantar
    const showSistemasImplantacaoDialog = (processo, event) => {
      const cell = event.target.closest('td');
      const rect = cell.getBoundingClientRect();
      
      sistemasImplantacaoDialog.value = {
        show: true,
        position: {
          top: `${rect.bottom + 10}px`,
          left: `${rect.left}px`
        },
        processo
      };
    };

    // Função para fechar o diálogo
    const hideSistemasImplantacaoDialog = () => {
      sistemasImplantacaoDialog.value = {
        show: false,
        position: {},
        processo: null
      };
    };

    // Função para formatar os sistemas a implantar para exibição
    const formatarSistemasImplantacao = (dados) => {
      if (!dados || !dados.sistemas_ids || dados.sistemas_ids.length === 0) {
        return dados?.informacoes_adicionais || '-';
      }
      
      const nomesSistemas = dados.sistemas_ids.map(id => getSistemaNome(id)).join(', ');
      
      if (dados.informacoes_adicionais) {
        return `${nomesSistemas} (${dados.informacoes_adicionais})`;
      }
      
      return nomesSistemas;
    };

    // Função para atualizar os sistemas a implantar
    const atualizarSistemasImplantacao = async (processo, dados) => {
      try {
        const { error } = await supabase
          .from('processos')
          .update({
            sistemas_implantacao: dados,
            updated_at: new Date().toISOString()
          })
          .eq('id', processo.id);
          
        if (error) throw error;
        
        // Registrar no log do sistema
        await logSystemAction({
          tipo: 'atualizacao',
          tabela: 'processos',
          registro_id: processo.id,
          campo_alterado: 'sistemas_implantacao',
          dados_anteriores: JSON.stringify(processo.sistemas_implantacao || {}),
          dados_novos: JSON.stringify(dados)
        });
        
        // Recarregar processos
        await loadProcessos();
        
        // Fechar diálogo
        hideSistemasImplantacaoDialog();
        
        // Mostrar mensagem de sucesso
        showToast('Sistemas a implantar atualizados com sucesso', 'success');
      } catch (error) {
        console.error('Erro ao atualizar sistemas a implantar:', error);
        showToast('Erro ao atualizar sistemas a implantar', 'error');
      }
    };

    // Substitua a função formatarMoeda atual por esta versão:

    const formatarMoeda = (valor) => {
      // Se valor for falsy (null, undefined, 0, ''), retorne apenas um traço
      if (!valor) return '-';
      
      // Verificar se é um número ou string
      let valorNumerico;
      
      if (typeof valor === 'string') {
        // Remove qualquer texto ou R$ que possa estar presente
        // Remove todos os pontos de milhar e substitui vírgula por ponto
        const valorLimpo = valor.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
        valorNumerico = parseFloat(valorLimpo);
      } else {
        valorNumerico = parseFloat(valor);
      }
      
      // Verificar se é um número válido e diferente de zero
      if (isNaN(valorNumerico) || valorNumerico === 0) return '-';
      
      // Formatar como moeda brasileira
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(valorNumerico);
    };

    // Dentro do setup()
    const confirmarReagendamento = async () => {
      try {
        if (!validarDataHora()) {
          return;
        }
    
        const processo = reagendamentoDialog.value.processo;
        const novoStatus = reagendamentoDialog.value.status;
        const novaData = reagendamentoDialog.value.novaData;
        const novaHora = reagendamentoDialog.value.novaHora;
    
        // Dados base para o novo registro
        const dadosBase = {
          ...processo,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
    
        // Remover o ID para criar um novo registro
        delete dadosBase.id;
    
        switch (novoStatus.toLowerCase()) {
          case 'adiado':
          case 'suspenso': {
            // 1. Criar novo registro com status default e nova data
            const novoProcesso = {
              ...dadosBase,
              data_pregao: novaData,
              hora_pregao: novaHora,
              status: 'em_analise' // Status default
            };
    
            // 2. Atualizar processo original com status adiado/suspenso
            const updateOriginal = {
              status: novoStatus,
              updated_at: new Date().toISOString()
            };
    
            // Executar operações em paralelo
            const [insertResult, updateResult] = await Promise.all([
              supabase.from('processos').insert([novoProcesso]).select().single(),
              supabase.from('processos').update(updateOriginal).eq('id', processo.id)
            ]);
    
            if (insertResult.error) throw insertResult.error;
            if (updateResult.error) throw updateResult.error;
    
            // Criar notificação apenas para o novo processo
            await agendarNotificacao({
              processo_id: insertResult.data.id,
              data: novaData,
              hora: novaHora,
              tipo: 'processo_reagendado',
              mensagem: `Novo agendamento do processo ${processo.numero_processo} para ${formatDate(novaData)} ${novaHora}`
            });
            break;
          }
    
          case 'demonstracao': {
            // Criar novo registro mantendo status demonstração
            const novoProcesso = {
              ...dadosBase,
              data_pregao: novaData,
              hora_pregao: novaHora,
              status: 'demonstracao'
            };
    
            // Inserir novo registro
            const { data, error } = await supabase
              .from('processos')
              .insert([novoProcesso])
              .select()
              .single();
    
            if (error) throw error;
    
            // Agendar notificações para ambas as datas
            await Promise.all([
              agendarNotificacao({
                processo_id: processo.id,
                data: processo.data_pregao,
                hora: processo.hora_pregao,
                tipo: 'demonstracao',
                mensagem: `Demonstração original do processo ${processo.numero_processo}`
              }),
              agendarNotificacao({
                processo_id: data.id,
                data: novaData,
                hora: novaHora,
                tipo: 'demonstracao',
                mensagem: `Nova demonstração do processo ${processo.numero_processo}`
              })
            ]);
            break;
          }
        }
    
        // Atualizar interface
        await loadProcessos();
        hideReagendamentoDialog();
        showToast(`Processo ${formatStatus(novoStatus)} registrado com sucesso`, 'success');
    
      } catch (error) {
        console.error('Erro ao reagendar processo:', error);
        showToast('Erro ao reagendar processo: ' + error.message, 'error');
      }
    };
    
    // Função auxiliar para agendar notificações
    const agendarNotificacao = async ({ processo_id, data, hora, tipo, mensagem }) => {
      try {
        const dataHora = new Date(`${data}T${hora}`);
        
        const notificacaoData = {
          processo_id,
          tipo,
          mensagem,
          data_notificacao: dataHora.toISOString(),
          next_notification: dataHora.toISOString(),
          created_at: new Date().toISOString(),
          active: true,
          status: 'pending'
        };
    
        const { error } = await supabase
          .from('notification_schedules')
          .insert([notificacaoData]);
    
        if (error) {
          console.error('Erro ao inserir notificação:', error);
          throw error;
        }
    
        console.log('Notificação agendada com sucesso');
        return true;
      } catch (error) {
        console.error('Erro ao agendar notificação:', error);
        throw error;
      }
    };

    // Return all reactive properties and methods for the template
    return {
      // ...existing return variables...
      handleStatusUpdate,

      // Estado, dados, etc...

      // Funções auxiliares
      getOpcoesParaCampo,

      // Resto do return...

      // State
      processos,
      loading,
      isLoading,
      isSidebarExpanded,
      confirmDialog,
      deleteConfirmDialog,
      sistemasDialog,
      editingCell,
      sortConfig,
      selectedRow,
      anoSelecionado,
      mostrarFiltro,
      filtros,
      estadoSearch,

      // Reference data
      representantes,
      empresas,
      sistemasAtivos,
      plataformas,
      estados,
      formData,
      colunas,
      colunasWidth,
      rowsHeight,

      // Computed properties
      anosDisponiveis,
      estadosFiltrados,
      processosFiltrados,
      temFiltrosAtivos,
      empresasCadastradas,
      showPlataformaField,

      // Helper functions
      formatDate,
      formatTime,
      formatModalidade,
      formatModalidadeCompleta,
      formatStatus,
      getModalidadeSigla,
      getPlataformaNome,
      getPortalName,
      getEmpresaNome,
      getRepresentanteNome,
      getSistemaNome,
      getSistemasNomesString,
      formatarDistancia,
      getDistancias,

      // Event handlers
      handleSidebarToggle,
      handleNewProcess,
      hideDeleteDialog,
      confirmDelete,
      exportToExcel,
      toggleFiltro,
      limparFiltros,
      handleSort,
      selecionarAno,
      selectRow,
      handleModalidadeChange,

      // Table editing
      startColumnResize,
      startRowResize,

      // Cell editing
      handleDblClick,
      handleConfirmEdit,
      hideConfirmDialog,
      cancelEdit,
      handleUpdate,

      // Systems handling
      handleSistemasChange,
      removerSistema,
      saveSistemas,
      hideSistemasDialog,

      // Form submission
      handleSubmit,

      // Filter options
      opcoesUnicas,

      // Distances dialog
      distanciaDialog,
      abrirDialogDistancia,
      iniciarEdicaoDistancia,
      excluirDistancia,
      salvarEdicaoDistancia,
      adicionarDistancia,
      cancelarEdicaoDistancia,
      fecharDistanciaDialog,

      // Adicionar as props relacionadas a responsáveis
      responsaveisProcessos,
      getResponsavelProcessoNome,

      // Responsáveis dialog
      responsaveisDialog,
      handleDblClickResponsavel,
      removerResponsavel,
      handleResponsavelChange,
      saveResponsavel,
      hideResponsaveisDialog,

      // Representantes dialog
      representantesDialog,
      handleDblClickRepresentante,
      removerRepresentante,
      handleRepresentanteChange,
      saveRepresentante,
      hideRepresentantesDialog,

      // Empresas dialog
      empresasDialog,
      formatCNPJ,
      handleDblClickEmpresa,
      removerEmpresa,
      handleEmpresaChange,
      saveEmpresa,
      hideEmpresasDialog,

      // Adicionar histórico de ações
      undoAction,
      redoAction,
      undoHistory,  // Adicionar esta linha
      redoHistory,  // Adicionar esta linha

      // Adicionar as novas propriedades para filtros
      filtrarOpcoes,
      toggleFiltroItem,
      filtroModalidadeSearch,
      opcoesModalidade,
      opcoesFiltradasModalidade,

      // Adicionar a nova função
      limparFiltroColuna,

      // Adicione esta função para filtrar as opções com base na pesquisa
      filtrarOpcoesPorColuna,

      colunasOrder,
      ordenarColunas,
      startColumnDrag,
      allowColumnDrop,
      handleColumnDrop,

      // Adicionar no return
      toasts,
      showToast,
      colunasOrdenadas,

      // Reagendamento
      reagendamentoDialog,
      abrirReagendamentoDialog,
      hideReagendamentoDialog,
      confirmarTemNovaData,
      confirmSemNovaData,
      confirmarReagendamento,
      validarDataHora,

      // Adicionar variáveis e funções do controle de status
      selectedStatusMap,
      nextNotificationDateMap,
      statusOptions,
      getStatusClass,
      isRecurringStatus,
      handleStatusChange,
      loadNextNotificationDate,

      // Adicionar no return
      statusInfoBalloon,
      showStatusInfo,
      hideStatusInfo,

      // Análise
      analiseDialog,
      showAnaliseDialog,
      hideAnaliseDialog,
      salvarAnalise,

      // Adicionar handleAnaliseClick ao objeto retornado pelo setup
      handleAnaliseClick,

      activeTab,
      systemUpdates,
      showNewUpdateForm,
      previewingUpdate,
      newUpdate,
      loadSystemUpdates,
      createNewUpdate,
      previewUpdate,
      formatImportance,
      handleComponentUpdate,

      // Adicionar ao objeto de retorno do setup()
      sistemasImplantacaoDialog,
      showSistemasImplantacaoDialog,
      hideSistemasImplantacaoDialog,
      formatarSistemasImplantacao,
      atualizarSistemasImplantacao,

      // Adicionar formatarMoeda ao return do setup
      formatarMoeda,

      calculateRows(text) {
        if (!text) return 10;
        
        // Calcula baseado no comprimento do texto
        const charCount = text.length;
        const lineBreaks = (text.match(/\n/g) || []).length;
        
        // Base: ~50 caracteres por linha
        const estimatedLines = Math.ceil(charCount / 900) + lineBreaks;
        
        // Limita entre 1 e 100 linhas
        return Math.min(Math.max(estimatedLines, 1), 100);
      }
    }
  }
}