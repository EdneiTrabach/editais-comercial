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
import AcoesColumn from '@/components/columns/table/AcoesColumn.vue'
import AdvancedFilterComponent from '@/components/filters/AdvancedFilterComponent.vue'
import EmpresaVencedoraDialog from '../components/EmpresaVencedoraDialog.vue';
import AtualPrestadorColuna from '@/components/AtualPrestadorColuna.vue';

export default {
  name: 'ProcessosView',

  components: {
    TheSidebar,
    BaseImage,
    SystemUpdateModal,
    SistemasImplantacaoSelector,
    AcoesColumn,
    AdvancedFilterComponent,
    EmpresaVencedoraDialog,
    AtualPrestadorColuna
  },

  setup() {
    const router = useRouter()
    const isSidebarExpanded = ref(true)
    const processos = ref([])
    const loading = ref(false)
    const isLoading = ref(false)
    const loadingTimeout = ref(null)
    const filtroModalidadeSearch = ref('');
    const filtroSearch = ref({})

    const sistemasNomesCache = ref({})

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

    const impugnacaoDialog = ref({
      show: false,
      processo: null,
      dataLimite: '',
      itens: '',
      formaEnvio: '',
      formaEnvioOutro: '',
      status: 'nao_iniciado',
      observacoes: ''
    });

    const duplicateDialog = ref({
      show: false,
      processo: null,
      loading: false
    });

    const empresaVencedoraDialog = ref({
      show: false,
      processoId: null,
      dadosAtuais: ''
    });

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

    const representantes = ref([])
    const empresas = ref([])
    const sistemasAtivos = ref([])
    const plataformas = ref([])

    const colunasWidth = ref({})
    const rowsHeight = ref({})

    const colunasOrder = ref([])

    // Valores padrão para largura das colunas
    const colunasWidthOriginais = {
      data_pregao: '120px',
      hora_pregao: '100px',
      modalidade: '120px',
      estado: '80px',
      numero_processo: '180px',
      objeto_resumido: '300px',
      objeto_completo: '700px',
      sistemas_ativos: '200px',
      codigo_analise: '160px',
      orgao: '250px',
      valor_estimado: '150px',
      status: '150px',
      responsavel_id: '200px',
      distancia_km: '200px', 
      site_pregao: '180px',
      representante_id: '200px',
      campo_adicional1: '300px',
      impugnacoes: '250px',
      empresa_id: '200px',
      empresa_vencedora: '200px',
      sistemas_implantacao: '180px',
      acoes: '100px'
    };

    const loadColumnsOrder = () => {
      try {
        const savedOrder = localStorage.getItem('table-columns-order');
        if (savedOrder) {
          const savedColumns = JSON.parse(savedOrder);
          const currentColumns = colunas.map(coluna => coluna.campo);
          const missingColumns = currentColumns.filter(campo => !savedColumns.includes(campo));
          if (missingColumns.length > 0) {
            colunasOrder.value = [...savedColumns, ...missingColumns];
            saveColumnsOrder();
          } else {
            colunasOrder.value = savedColumns;
          }
        } else {
          resetColumnOrder();
        }
      } catch (error) {
        console.error('Erro ao carregar ordem das colunas:', error);
        resetColumnOrder();
      }
    }

    const saveColumnsOrder = () => {
      try {
        localStorage.setItem('table-columns-order', JSON.stringify(colunasOrder.value))
      } catch (error) {
        console.error('Erro ao salvar ordem das colunas:', error)
      }
    }

    const resetColumnOrder = () => {
      colunasOrder.value = colunas.map(coluna => coluna.campo);
      saveColumnsOrder();
    }

    const startColumnDrag = (event, index) => {
      event.dataTransfer.setData('text/plain', index)
      event.currentTarget.classList.add('dragging')
    }

    const allowColumnDrop = (event) => {
      event.preventDefault()
    }

    const handleColumnDrop = (event, targetIndex) => {
      event.preventDefault()
      const draggedIndex = parseInt(event.dataTransfer.getData('text/plain'))

      document.querySelectorAll('th').forEach(th => th.classList.remove('dragging'))

      if (draggedIndex === targetIndex) return

      const columnOrder = [...colunasOrder.value]
      const draggedColumn = columnOrder[draggedIndex]

      columnOrder.splice(draggedIndex, 1)
      columnOrder.splice(targetIndex, 0, draggedColumn)

      colunasOrder.value = columnOrder
      saveColumnsOrder()
    }

    const ordenarColunas = computed(() => {
      return colunasOrder.value.length > 0
        ? colunasOrder.value
            .map(campo => colunas.find(coluna => coluna.campo === campo))
            .filter(coluna => coluna && coluna.campo !== 'acoes')
        : colunas.filter(coluna => coluna.campo !== 'acoes');
    })

    const colunasOrdenadas = computed(() => {
      if (colunasOrder.value.length > 0) {
        return colunasOrder.value
          .map(campo => colunas.find(coluna => coluna.campo === campo))
          .filter(Boolean);
      }
      return colunas;
    });

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
      { titulo: 'Valor Estimado', campo: 'valor_estimado' },
      { titulo: 'Status', campo: 'status' },
      {
        titulo: 'Responsáveis',
        campo: 'responsavel_id',
        tabelaRelacionada: 'responsaveis_processos',
        campoExibicao: 'nome',
        tipoEdicao: 'select'
      },
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
        titulo: 'Atual Prestador',
        campo: 'empresa_atual_prestadora',
        tipoExibicao: 'componente',
        componente: 'AtualPrestadorColuna'
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
      {
        titulo: 'Ações',
        campo: 'acoes',
        tipoExibicao: 'componente',
        componente: 'AcoesColumn',
        fixedRight: true
      },
    ]

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

    const formData = ref({
      status: null
    })

    const anosDisponiveis = computed(() => {
      const anos = new Set();
      
      processos.value.forEach(processo => {
        if (processo.data_pregao) {
          const ano = new Date(processo.data_pregao).getFullYear();
          anos.add(ano);
        }
        if (processo.ano) {
          anos.add(parseInt(processo.ano));
        }
      });
    
      return Array.from(anos).sort((a, b) => b - a);
    })

    const estadosFiltrados = computed(() => {
      if (!estadoSearch.value) return estados.value

      const busca = estadoSearch.value.toLowerCase()
      return estados.value.filter(estado =>
        estado.nome.toLowerCase().includes(busca) ||
        estado.uf.toLowerCase().includes(busca)
      )
    })

    const processosFiltrados = computed(() => {
      if (!processos.value) return [];

      return processos.value
        .filter(processo => {
          const anoPregao = processo.data_pregao ? new Date(processo.data_pregao).getFullYear() : null;
          const anoProcesso = processo.ano ? parseInt(processo.ano) : null;
          
          return anoPregao === anoSelecionado.value || anoProcesso === anoSelecionado.value;
        })
        .filter(processo => {
          return colunas.every(coluna => {
            if (!filtros.value[coluna.campo] || filtros.value[coluna.campo].length === 0) {
              return true;
            }

            let valorProcesso = processo[coluna.campo];

            if (valorProcesso === null || valorProcesso === undefined) {
              return false;
            }

            switch (coluna.campo) {
              case 'data_pregao':
                return filtros.value[coluna.campo].includes(formatDate(valorProcesso));

              case 'hora_pregao':
                return filtros.value[coluna.campo].includes(formatTime(valorProcesso));

              case 'modalidade':
                return filtros.value[coluna.campo].includes(valorProcesso);

              case 'status':
                return filtros.value[coluna.campo].includes(valorProcesso);

              case 'representante_id':
              case 'responsavel_id':
              case 'empresa_id':
                return filtros.value[coluna.campo].includes(valorProcesso);

              default:
                if (typeof valorProcesso === 'string') {
                  return filtros.value[coluna.campo].some(filtro =>
                    valorProcesso.toLowerCase().includes(filtro.toLowerCase())
                  );
                } else {
                  return filtros.value[coluna.campo].includes(valorProcesso);
                }
            }
          });
        })
        .filter(processo => {
          if (advancedFilters.value.dataInicio) {
            if (!processo.data_pregao) return false;
            if (processo.data_pregao < advancedFilters.value.dataInicio) return false;
          }
          
          if (advancedFilters.value.dataFim) {
            if (!processo.data_pregao) return false;
            if (processo.data_pregao > advancedFilters.value.dataFim) return false;
          }
          
          if (advancedFilters.value.status && advancedFilters.value.status.length > 0) {
            if (!advancedFilters.value.status.includes(processo.status)) return false;
          }
          
          if (advancedFilters.value.modalidade && advancedFilters.value.modalidade.length > 0) {
            if (!advancedFilters.value.modalidade.includes(processo.modalidade)) return false;
          }
          
          if (advancedFilters.value.responsavel && advancedFilters.value.responsavel.length > 0) {
            if (!processo.responsavel_id || !advancedFilters.value.responsavel.includes(processo.responsavel_id)) return false;
          }
          
          if (advancedFilters.value.estados && advancedFilters.value.estados.length > 0) {
            if (!processo.estado || !advancedFilters.value.estados.includes(processo.estado)) return false;
          }
          
          if (advancedFilters.value.valorMin) {
            const valorMin = parseFloat(advancedFilters.value.valorMin.replace(',', '.'));
            const valorProcesso = parseFloat(processo.valor_estimado) || 0;
            
            if (valorProcesso < valorMin) return false;
          }
          
          if (advancedFilters.value.valorMax) {
            const valorMax = parseFloat(advancedFilters.value.valorMax.replace(',', '.'));
            const valorProcesso = parseFloat(processo.valor_estimado) || 0;
            
            if (valorProcesso > valorMax) return false;
          }
          
          return true;
        });
    });

    const temFiltrosAtivos = computed(() => {
      return Object.values(filtros.value).some(f => f.length > 0)
    })

    const empresasCadastradas = computed(() => {
      return empresas.value.filter(empresa => empresa.id)
    })

    const showPlataformaField = computed(() => {
      return formData.value.modalidade === 'pregao_eletronico';
    });

    const opcoesFiltradasModalidade = computed(() => {
      if (!filtroModalidadeSearch.value) {
        return opcoesModalidade;
      }

      const busca = filtroModalidadeSearch.value.toLowerCase();
      return opcoesModalidade.filter(opcao =>
        opcao.texto.toLowerCase().includes(busca)
      );
    });

    const filtrarOpcoes = (coluna) => {
      console.log('Filtrando opções para coluna:', coluna);
    };

    const getSistemasNomesFromCache = async (sistemasIds) => {
      if (!sistemasIds || !sistemasIds.length) return '-';

      const cacheKey = sistemasIds.sort().join(',');

      if (sistemasNomesCache.value[cacheKey]) {
        return sistemasNomesCache.value[cacheKey];
      }

      const resultado = await getSistemasNomes(sistemasIds);
      sistemasNomesCache.value[cacheKey] = resultado;

      return resultado;
    }

    const formatDate = (dateString) => {
      if (!dateString) return '-';
      try {
        const [date] = dateString.split('T');
        const [year, month, day] = date.split('-');
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

    const getEmpresaCor = (id) => {
      if (!id) return null;
      const empresa = empresas.value.find(e => e.id === id);
      return empresa?.color || null;
    };

    const getLightColor = (hexColor) => {
      if (!hexColor) return "#f5f5f5";
      
      // Remove o # se existir
      hexColor = hexColor.replace('#', '');
      
      // Converte para RGB
      const r = parseInt(hexColor.substr(0, 2), 16);
      const g = parseInt(hexColor.substr(2, 2), 16);
      const b = parseInt(hexColor.substr(4, 2), 16);
      
      // Calcula a versão mais clara (similar aos status)
      // Garantindo que a cor seja clara o suficiente para ser usada como fundo
      return `rgba(${r}, ${g}, ${b}, 0.15)`;
    };

    const getContrastColorForEmpresa = (hexColor) => {
      if (!hexColor || hexColor === '#FFFFFF') return '#000000';
      
      hexColor = hexColor.replace('#', '');
      
      const r = parseInt(hexColor.substr(0, 2), 16);
      const g = parseInt(hexColor.substr(2, 2), 16);
      const b = parseInt(hexColor.substr(4, 2), 16);
      
      const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
      
      return (yiq >= 128) ? '#000000' : '#FFFFFF';
    };

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
      
      // Verifica se há múltiplas distâncias
      if (processo._distancias && processo._distancias.length > 0) {
        return processo._distancias.map(d => {
          if (d.texto_completo) {
            return d.texto_completo;
          } else {
            return `${d.distancia_km} km${d.ponto_referencia_cidade ? 
              ` (${d.ponto_referencia_cidade}/${d.ponto_referencia_uf})` : ''}`;
          }
        }).join('\n');
      }
    
      // Caso tenha apenas uma distância no formato antigo
      if (processo.distancia_km) {
        return `${processo.distancia_km} km${processo.ponto_referencia_cidade ? 
          ` (${processo.ponto_referencia_cidade}/${processo.ponto_referencia_uf})` : ''}`;
      }
    
      return '-';
    };

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

    const processarProcessos = async (data) => {
      if (!data || !Array.isArray(data)) {
        console.error('Dados inválidos para processamento');
        return;
      }

      const processosPromises = data.map(async (processo) => {
        // Carregar distâncias para cada processo
        try {
          const { data: distancias } = await supabase
            .from('processo_distancias')
            .select('*')
            .eq('processo_id', processo.id)
            .order('created_at');
          
          // Se não há distâncias na tabela específica mas existe no formato antigo
          if ((!distancias || distancias.length === 0) && processo.distancia_km) {
            // Migrar distância do formato antigo para o novo formato
            const novaDistancia = {
              processo_id: processo.id,
              distancia_km: processo.distancia_km,
              ponto_referencia_cidade: processo.ponto_referencia_cidade || null,
              ponto_referencia_uf: processo.ponto_referencia_uf || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            // Inserir a distância na tabela específica
            const { data: novaDist, error } = await supabase
              .from('processo_distancias')
              .insert([novaDistancia])
              .select();
              
            if (error) {
              console.error(`Erro ao migrar distância para o processo ${processo.id}:`, error);
            } else {
              // Anexar a nova distância ao processo
              processo._distancias = novaDist || [];
            }
          } else {
            // Usar as distâncias já existentes na tabela processo_distancias
            processo._distancias = distancias || [];
          }
          
        } catch (err) {
          console.error(`Erro ao carregar distâncias para processo ${processo.id}:`, err);
          processo._distancias = [];
          
          // Se ocorreu erro mas tem dados no formato antigo, usar esses dados
          if (processo.distancia_km) {
            processo._distancias = [{
              distancia_km: processo.distancia_km,
              ponto_referencia_cidade: processo.ponto_referencia_cidade || null,
              ponto_referencia_uf: processo.ponto_referencia_uf || null
            }];
          }
        }

        return processo;
      });

      processos.value = await Promise.all(processosPromises);
      return processos.value;
    };

    const loadProcessos = async () => {
      if (isLoading.value) return;

      try {
        isLoading.value = true;

        const { data, error } = await supabase
          .from('processos')
          .select('*')
          .order('data_pregao', { ascending: true });

        if (error) throw error;

        await processarProcessos(data);

        const anos = anosDisponiveis.value;
        if (!anos.includes(anoSelecionado.value) && anos.length > 0) {
          anoSelecionado.value = anos[0];
          showToast(`Visualização alterada para o ano ${anos[0]}`, 'info');
        }

      } catch (error) {
        console.error('Erro ao carregar processos:', error);
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
          .select('id, nome, cnpj, color')
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

    const logSystemAction = async (dados) => {
      try {
        if (!dados || !dados.registro_id) {
          console.warn('Dados de log incompletos');
          return;
        }
    
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.warn('Usuário não autenticado para logging');
          return;
        }
    
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
    
        try {
          const { error } = await supabase
            .from('system_logs')
            .insert(logData);
            
          if (error && error.message && error.message.includes('does not exist')) {
            console.warn('Tabela system_logs não encontrada. Logging desativado.');
            return;
          } else if (error) {
            console.warn('Erro ao inserir log (não crítico):', error.message || 'Erro desconhecido');
          }
        } catch (error) {
          console.warn('Erro no sistema de logging (não crítico):', error && error.message ? error.message : 'Erro desconhecido');
        }
      } catch (error) {
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

    const toggleFiltro = (coluna) => {
      Object.keys(mostrarFiltro.value).forEach(key => {
        if (key !== coluna) {
          mostrarFiltro.value[key] = false;
        }
      });

      mostrarFiltro.value[coluna] = !mostrarFiltro.value[coluna];

      if (mostrarFiltro.value[coluna]) {
        filtroModalidadeSearch.value = '';

        nextTick(() => {
          const dropdown = document.querySelector(`.filtro-dropdown[data-campo="${coluna}"]`);

          if (dropdown) {
            const container = dropdown.closest('.filtro-container');
            if (container) {
              const rect = container.getBoundingClientRect();

              if (window.innerWidth - rect.right < 250) {
                dropdown.style.right = '0';
                dropdown.style.left = 'auto';
              } else {
                dropdown.style.left = '0';
                dropdown.style.right = 'auto';
              }

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

    const limparTodosFiltros = () => {
      // Limpar filtros normais
      limparFiltros();
      
      // Limpar filtros avançados
      clearAdvancedFilters();
      
      showToast('Todos os filtros foram removidos', 'info');
    };

    const handleSort = async (field, direction) => {
      try {
        sortConfig.value = { field, direction };

        processos.value.sort((a, b) => {
          if (field === 'data_pregao') {
            const dateA = new Date(a[field] || '1900-01-01');
            const dateB = new Date(b[field] || '1900-01-01');
            
            const comparison = dateA - dateB;
            
            return direction === 'desc' ? -comparison : comparison;
          }
          return 0;
        });

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
          
          if (!colunasWidth.value['objeto_completo'] || 
              parseInt(colunasWidth.value['objeto_completo']) < 700) {
            colunasWidth.value['objeto_completo'] = '700px'
          }
        } else {
          resetColumnWidths();
        }
        
        saveColumnWidths()
      } catch (error) {
        console.error('Error loading column widths:', error)
        resetColumnWidths();
      }
    }

    const saveColumnWidths = () => {
      try {
        localStorage.setItem('table-columns-width', JSON.stringify(colunasWidth.value))
      } catch (error) {
        console.error('Error saving column widths:', error)
      }
    }

    const resetColumnWidths = () => {
      colunasWidth.value = { ...colunasWidthOriginais };
      saveColumnWidths();
    }

    const handleDblClick = async (field, processo, event) => {
      if (field === 'impugnacoes') {
        showImpugnacaoDialog(processo);
        return;
      }

      if (editingCell.value.id === processo.id && editingCell.value.field === field) {
        return;
      }

      const cell = event.target.closest('td');
      const rect = cell.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      if (field === 'sistemas_ativos') {
        editingCell.value = {
          id: processo.id,
          field,
          value: Array.isArray(processo[field]) ? [...processo[field]] : []
        };

        sistemasDialog.value = {
          show: true,
          position: {
            top: `${rect.bottom + scrollTop + 10}px`,
            left: `${rect.left + scrollLeft}px`
          },
          processo
        };
        return;
      }

      if (field === 'representante_id') {
        console.log('Clicked on representative field');
        debugRepresentantes();

        if (representantes.value.length === 0) {
          console.log('Loading representatives on demand...');
          await loadRepresentantes();

          debugRepresentantes();

          if (representantes.value.length === 0) {
            console.error('Could not load representatives.');
            alert('Could not load the list of representatives.');
            return;
          }
        }
      }

      if (field === 'responsavel_id') {

        if (representantes.value.length === 0) {
          console.log('Loading representatives on demand...');
          await loadRepresentantes();

          debugRepresentantes();

          if (representantes.value.length === 0) {
            console.error('Could not load representatives.');
            alert('Could not load the list of representatives.');
            return;
          }
        }
      }

      if (field === 'responsavel_id') {
        console.log('Clicked on responsável field');

        if (responsaveisProcessos.value.length === 0) {
          console.log('Loading responsáveis on demand...');
          await loadResponsaveisProcessos();

          if (responsaveisProcessos.value.length === 0) {
            console.error('Could not load responsáveis.');
            alert('Não foi possível carregar a lista de responsáveis.');
            return;
          }
        }
      }

      confirmDialog.value = {
        show: true,
        position: {
          top: `${rect.bottom + scrollTop + 10}px`,
          left: `${rect.left + scrollLeft}px`
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

    const showImpugnacaoDialog = (processo) => {
      impugnacaoDialog.value.show = true;
      impugnacaoDialog.value.processo = processo;

      impugnacaoDialog.value.dataLimite = processo.impugnacao_data_limite || '';
      impugnacaoDialog.value.itens = processo.impugnacao_itens || '';
      impugnacaoDialog.value.status = processo.impugnacao_status || 'nao_iniciado';

      if (processo.impugnacao_forma_envio) {
        if (['email', 'portal', 'fisico'].includes(processo.impugnacao_forma_envio)) {
          impugnacaoDialog.value.formaEnvio = processo.impugnacao_forma_envio;
          impugnacaoDialog.value.formaEnvioOutro = '';
        } else {
          impugnacaoDialog.value.formaEnvio = 'outro';
          impugnacaoDialog.value.formaEnvioOutro = processo.impugnacao_forma_envio;
        }
      } else {
        impugnacaoDialog.value.formaEnvio = '';
        impugnacaoDialog.value.formaEnvioOutro = '';
      }

      impugnacaoDialog.value.observacoes = processo.impugnacoes || '';
    };

    const hideImpugnacaoDialog = () => {
      impugnacaoDialog.value.show = false;
    };

    const salvarImpugnacao = async () => {
      try {
        if (!impugnacaoDialog.value.processo) {
          showToast('Erro ao identificar o processo', 'error');
          return;
        }

        const processo = impugnacaoDialog.value.processo;

        const formaEnvio = impugnacaoDialog.value.formaEnvio === 'outro'
          ? impugnacaoDialog.value.formaEnvioOutro
          : impugnacaoDialog.value.formaEnvio;

        const updateData = {
          impugnacao_data_limite: impugnacaoDialog.value.dataLimite,
          impugnacao_itens: impugnacaoDialog.value.itens,
          impugnacao_forma_envio: formaEnvio,
          impugnacao_status: impugnacaoDialog.value.status,
          impugnacoes: impugnacaoDialog.value.observacoes,
          updated_at: new Date().toISOString()
        };

        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          updateData.updated_by = user.id;
        }

        const { error } = await supabase
          .from('processos')
          .update(updateData)
          .eq('id', processo.id);

        if (error) throw error;

        const index = processos.value.findIndex(p => p.id === processo.id);
        if (index !== -1) {
          processos.value[index] = { ...processos.value[index], ...updateData };
        }

        await logSystemAction({
          tipo: 'update_impugnacao',
          tabela: 'processos',
          registro_id: processo.id,
          dados_anteriores: { 
            impugnacao_data_limite: processo.impugnacao_data_limite,
            impugnacao_itens: processo.impugnacao_itens,
            impugnacao_forma_envio: processo.impugnacao_forma_envio,
            impugnacao_status: processo.impugnacao_status,
            impugnacoes: processo.impugnacoes
          },
          dados_novos: updateData
        });

        hideImpugnacaoDialog();
        showToast('Dados de impugnação salvos com sucesso!', 'success');

        if (impugnacaoDialog.value.status === 'enviado') {
          const dataLembrete = new Date();
          dataLembrete.setDate(dataLembrete.getDate() + 3);

          const notificationData = {
            processo_id: processo.id,
            status: 'impugnacao_acompanhamento',
            message: `Acompanhar resposta da impugnação do processo ${processo.numero_processo}`,
            next_notification: dataLembrete.toISOString(),
            created_at: new Date().toISOString(),
            active: true
          };

          await supabase
            .from('notification_schedules')
            .insert(notificationData);

          showToast('Notificação de acompanhamento programada.', 'info');
        }

      } catch (error) {
        console.error('Erro ao salvar impugnação:', error);
        showToast(`Erro ao salvar dados de impugnação: ${error.message}`, 'error');
      }
    };

    const handleConfirmEdit = () => {
      confirmDialog.value.callback?.()
      hideConfirmDialog()

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

    const handleUpdate = async (processo) => {
      try {
        if (editingCell.value.field === 'data_pregao') {
          const anoAntigo = new Date(processo.data_pregao).getFullYear();
          const anoNovo = new Date(editingCell.value.value).getFullYear();
          
          if (anoAntigo !== anoNovo) {
            console.log(`Mudança de ano detectada: ${anoAntigo} -> ${anoNovo}`);
            
            const updateData = {
              data_pregao: editingCell.value.value,
              ano: anoNovo,
              updated_at: new Date().toISOString(),
              updated_by: (await supabase.auth.getUser()).data.user?.id
            };

            const { error } = await supabase
              .from('processos')
              .update(updateData)
              .eq('id', processo.id);

            if (error) throw error;

            await loadProcessos();

            if (anoSelecionado.value === anoAntigo) {
              anoSelecionado.value = anoNovo;
            }

            showToast(`Processo movido para o ano ${anoNovo}`, 'success');
            
            cancelEdit();
            return;
          }
        }

        if (editingCell.value.id !== processo.id) return;

        if (editingCell.value.value === processo[editingCell.value.field]) {
          console.log('Value did not change, canceling update')
          cancelEdit()
          return
        }

        let updateValue = editingCell.value.value

        switch (editingCell.value.field) {
          case 'data_pregao':
            if (typeof updateValue === 'string') {
              if (updateValue.includes('/')) {
                const [day, month, year] = updateValue.split('/')
                updateValue = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
              } else if (updateValue.includes('-')) {
                const [year, month, day] = updateValue.split('-')
                updateValue = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
              }
            }
            break

          case 'hora_pregao':
            if (typeof updateValue === 'string') {
              const [hours, minutes] = updateValue.split(':')
              updateValue = `${hours.padStart(2, '0')}:${minutes ? minutes.padStart(2, '0') : '00'}`
            }
            break

          case 'sistemas_ativos':
            updateValue = Array.isArray(updateValue) ? updateValue : []
            break

          case 'representante_id':
            updateValue = updateValue || null;
            console.log('Updating representative to:', updateValue);

            if (updateValue) {
              const representante = representantes.value.find(r => r.id === updateValue);
              if (representante) {
                console.log(`Selected representative name: ${representante.nome}`);
              } else {
                console.warn('Selected representative ID not found in list!');
                await loadRepresentantes();
              }
            }
            break;

          case 'responsavel_id':
            updateValue = ensureValidResponsavelId(updateValue)

            if (!updateValue) {
              console.error('Valor inválido para responsável:', editingCell.value.value)
              alert('Responsável inválido. Por favor, selecione um responsável válido da lista.')
              cancelEdit()
              return
            }

            console.log(`Atualizando responsável para: ${updateValue} (validado)`)
            break

          case 'empresa_id':
            updateValue = ensureValidEmpresaId(updateValue);

            console.log(`Atualizando empresa para: ${updateValue === null ? 'vazio' : updateValue} (validado)`);
            break

          case 'distancia_km':
            const distanciaNum = parseFloat(editingCell.value.value.replace(/[^\d.,]/g, '').replace(',', '.'));
            
            if (isNaN(distanciaNum)) {
              alert('A distância deve ser um número válido');
              cancelEdit();
              return;
            }
            
            const { data: existingDistancia } = await supabase
              .from('processo_distancias')
              .select('*')
              .eq('processo_id', processo.id)
              .single();
          
            if (existingDistancia) {
              const { error } = await supabase
                .from('processo_distancias')
                .update({
                  distancia_km: distanciaNum,
                  updated_at: new Date().toISOString()
                })
                .eq('id', existingDistancia.id);
          
              if (error) throw error;
            } else {
              const { error } = await supabase
                .from('processo_distancias')
                .insert({
                  processo_id: processo.id,
                  distancia_km: distanciaNum,
                  created_at: new Date().toISOString()
                });
          
              if (error) throw error;
            }
          
            updateValue = distanciaNum;
            break;
        }

        // Adicione essa condição especial no método handleUpdate, aproximadamente na linha 1590 
        // após verificar qual o valor a atualizar e antes de tentar atualizar o banco

        if (editingCell.value.field === 'empresa_atual_prestadora') {
          try {
            // Para empresa atual prestadora, salvar na tabela específica em vez da tabela processos
            const { data: { user } } = await supabase.auth.getUser()
            
            // Preparar payload para salvar na tabela específica
            const payload = {
              processo_id: processo.id,
              empresa_id: updateValue, // assumindo que updateValue é o ID da empresa
              updated_at: new Date().toISOString(),
              updated_by: user?.id || null
            }
            
            // Usar upsert para inserir ou atualizar
            const { error } = await supabase
              .from('processos_empresa_atual_prestadora')
              .upsert(payload, { onConflict: 'processo_id' });
              
            if (error) throw error;
            
            await loadProcessos();
            console.log('Atual Prestador atualizado com sucesso');
            cancelEdit();
            return; // Importante: retornar para evitar a execução do código abaixo
          } catch (error) {
            console.error('Error updating atual prestador:', error);
            alert(`Error updating atual prestador: ${error.message}`);
            cancelEdit();
            return;
          }
        }

        if (updateValue === processo[editingCell.value.field]) {
          console.log('Value did not change, canceling update')
          cancelEdit()
          return
        }

        console.log(`Updating ${editingCell.value.field} to:`, updateValue)

        const updateData = {
          [editingCell.value.field]: updateValue,
          updated_at: new Date().toISOString()
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (user?.id) {
          updateData.updated_by = user.id
        }

        console.log('Dados para atualização:', {
          campo: editingCell.value.field,
          valor: updateValue,
          tipo: typeof updateValue
        });

        undoHistory.value.push({
          id: processo.id,
          field: editingCell.value.field,
          oldValue: processo[editingCell.value.field],
          newValue: updateValue
        });

        if (undoHistory.value.length > MAX_HISTORY_SIZE) {
          undoHistory.value.shift();
        }

        redoHistory.value = [];

        if (editingCell.value.field === 'status' && 
            ['suspenso', 'adiado', 'demonstracao'].includes(updateValue) && 
            processo.status !== updateValue) {
          
          cancelEdit();
          abrirReagendamentoDialog(processo, updateValue);
          return;
        }

        if (editingCell.value.field === 'codigo_analise' && editingCell.value.value) {
          cancelEdit();
          showAnaliseDialog(processo, editingCell.value.value);
          return;
        }

        console.log('Update data:', updateData)

        const { error } = await supabase
          .from('processos')
          .update(updateData)
          .eq('id', processo.id)

        if (error) {
          console.error('Error updating:', error)
          throw error
        }

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
          console.warn('Error in change log:', logError)
        }

        await loadProcessos()
        console.log('Update completed successfully')

      } catch (error) {
        console.error('Error updating:', error)
        alert(`Error updating field: ${error.message || 'Check the data and try again'}`)
      } finally {
        cancelEdit()
      }
    }

    const handleSistemasChange = (event) => {
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
        const novosSistemasAtivos = editingCell.value.value;
        
        const updateData = {
          sistemas_ativos: novosSistemasAtivos,
          updated_at: new Date().toISOString()
        };

        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          updateData.updated_by = user.id;
        }

        const { error } = await supabase
          .from('processos')
          .update(updateData)
          .eq('id', processo.id);

        if (error) throw error;

        await logSystemAction({
          tipo: 'atualizacao',
          tabela: 'processos',
          registro_id: processo.id,
          campo_alterado: 'sistemas_ativos',
          dados_anteriores: processo.sistemas_ativos,
          dados_novos: novosSistemasAtivos
        });

        // Sincronizar com análises e mostrar feedback
        const resultado = await atualizarAnalisesAposMudancaSistemas(processo.id, novosSistemasAtivos);
        if (resultado) {
          showToast(`Sistemas atualizados e sincronizados com análises: ${resultado.adicionados} adicionados, ${resultado.removidos} removidos`, 'success');
        } else {
          showToast('Sistemas atualizados com sucesso', 'success');
        }

        await loadProcessos();

        hideSistemasDialog();
      } catch (error) {
        console.error('Erro ao salvar sistemas:', error);
        showToast('Erro ao salvar sistemas', 'error');
      }
    };

    const hideSistemasDialog = () => {
      sistemasDialog.value = {
        show: false,
        position: {},
        processo: null
      };

      editingCell.value = {
        id: null,
        field: null,
        value: null
      };
    };

    const pageVisibilityHandler = () => {
      if (!document.hidden) {
        loadProcessos().catch(console.error)
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
      stopAutoRefresh()
      refreshInterval.value = setInterval(() => {
        loadProcessos()
      }, 30000)
    }

    const stopAutoRefresh = () => {
      if (refreshInterval.value) {
        clearInterval(refreshInterval.value)
        refreshInterval.value = null
      }
    }

    const debugRepresentantes = () => {
      console.log(`Status of representatives: 
      - Array loaded: ${representantes.value ? 'Yes' : 'No'}
      - Quantity: ${representantes.value?.length || 0}
      - First representative: ${representantes.value?.[0]?.nome || 'None'}`);
    }

    const validarIdRelacionamento = async (tabela, campo, id) => {
      if (!id) return null;

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

        return id;
      } catch (err) {
        console.error(`Error validating ID in ${tabela}:`, err);
        return null;
      }
    };

    const ensureValidResponsavelId = (value) => {
      if (!value) return null;

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(value)) return value;

      const responsavel = responsaveisProcessos.value.find(r =>
        r.nome.toLowerCase() === value.toLowerCase());

      if (responsavel) return responsavel.id;

      console.warn(`Valor inválido para responsável: ${value}`);
      return null;
    };

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

    const opcoesUnicas = (coluna) => {
      if (!processos.value || processos.value.length === 0) return [];

      const opcoes = new Set();

      if (coluna === 'modalidade') {
        return opcoesModalidade;
      }

      processos.value.forEach(processo => {
        let valor = processo[coluna];

        if (valor === null || valor === undefined) return;

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
            const responsavel = responsaveisProcessos.value.find(r => r.id === valor);
            valor = { value: valor, text: responsavel ? responsavel.nome : valor };
            break;
          case 'representante_id':
            const representante = representantes.value.find(r => r.id === valor);
            valor = { value: valor, text: representante ? representante.nome : valor };
            break;
          case 'empresa_id':
            const empresa = empresas.value.find(e => e.id === valor);
            valor = { value: valor, text: empresa ? empresa.nome : valor };
            break;
        }

        if (valor) opcoes.add(JSON.stringify(valor));
      });

      return Array.from(opcoes).map(item => {
        try {
          return JSON.parse(item);
        } catch {
          return item;
        }
      }).sort((a, b) => {
        const textA = typeof a === 'object' ? a.text : a;
        const textB = typeof b === 'object' ? b.text : b;
        return textA.localeCompare(textB);
      });
    };

    const toggleFiltroItem = (coluna, valor) => {
      if (!filtros.value[coluna]) {
        filtros.value[coluna] = [];
      }

      const index = filtros.value[coluna].indexOf(valor);
      if (index === -1) {
        filtros.value[coluna].push(valor);
      } else {
        filtros.value[coluna].splice(index, 1);
      }
    };

    const initializeFiltros = () => {
      const filtrosIniciais = {}
      colunas.forEach(coluna => {
        filtrosIniciais[coluna.campo] = []
      })
      return filtrosIniciais
    }

    onMounted(async () => {
      try {
        startVisibilityMonitoring()

        filtros.value = initializeFiltros()

        document.addEventListener('click', (e) => {
          const isFilterClick = e.target.closest('.filtro-container')
          if (!isFilterClick) {
            Object.keys(mostrarFiltro.value).forEach(key => {
              mostrarFiltro.value[key] = false
            })
          }
        })

        console.log('Starting data loading...');

        await Promise.all([
          loadProcessos(),
          loadRepresentantes(),
          loadEmpresas(),
          loadPlataformas(),
          loadSistemas(),
          loadResponsaveisProcessos()
        ]);

        console.log('All other data loaded successfully!');

        loadColumnWidths()
        loadColumnsOrder()

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

        SupabaseManager.addSubscription('processos-updates', channel)

        startAutoRefresh()

        document.addEventListener('keydown', handleKeyDown);

        try {
          const result = await processScheduledNotifications();
          if (result.success && result.count > 0) {
            showToast(`${result.count} notificações enviadas automaticamente`, 'info');
          }
        } catch (error) {
          console.error('Erro ao processar notificações agendadas:', error);
        }

        await checkPendingNotifications();
        
        setInterval(checkPendingNotifications, 3600000);

        await loadSystemUpdates();
      } catch (error) {
        console.error('Error in component initialization:', error)
      }
    })

    onUnmounted(() => {
      stopVisibilityMonitoring()
      stopAutoRefresh()

      const channel = SupabaseManager.getSubscription('processos-updates')
      if (channel) {
        supabase.removeChannel(channel)
        SupabaseManager.removeSubscription('processos-updates')
      }

      document.removeEventListener('keydown', handleKeyDown);
    })

    useConnectionManager(loadProcessos)

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

    const abrirDialogDistancia = async (processo, event) => {
      try {
        // Carrega as distâncias existentes para este processo
        const { data, error } = await supabase
          .from('processo_distancias')
          .select('*')
          .eq('processo_id', processo.id)
          .order('created_at');

        if (error) throw error;

        // Posiciona o diálogo próximo ao local do clique
        const rect = event.target.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        distanciaDialog.value = {
          show: true,
          position: {
            top: `${rect.bottom + scrollTop + 10}px`,
            left: `${rect.left + scrollLeft}px`
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
        showToast('Erro ao carregar distâncias', 'error');
      }
    };

    const iniciarEdicaoDistancia = (distancia, index) => {
      distanciaDialog.value.editandoIndex = index;
      distanciaDialog.value.novaDistancia = {
        distancia_km: distancia.distancia_km,
        ponto_referencia_cidade: distancia.ponto_referencia_cidade || '',
        ponto_referencia_uf: distancia.ponto_referencia_uf || '',
        texto_completo: distancia.texto_completo || '',
        id: distancia.id
      };
    };

    const cancelarEdicaoDistancia = () => {
      distanciaDialog.value.editandoIndex = -1;
      distanciaDialog.value.novaDistancia = {
        distancia_km: '',
        ponto_referencia_cidade: '',
        ponto_referencia_uf: '',
        texto_completo: ''
      };
    };

    const salvarEdicaoDistancia = async () => {
      try {
        const { distancia_km, ponto_referencia_cidade, ponto_referencia_uf, texto_completo, id } = distanciaDialog.value.novaDistancia;

        if (!distancia_km) {
          showToast('A distância é obrigatória', 'error');
          return;
        }

        const updateData = {
          distancia_km,
          updated_at: new Date().toISOString()
        };

        // Campos opcionais só são atualizados se tiverem valor
        if (ponto_referencia_cidade) updateData.ponto_referencia_cidade = ponto_referencia_cidade;
        if (ponto_referencia_uf) updateData.ponto_referencia_uf = ponto_referencia_uf;
        if (texto_completo) updateData.texto_completo = texto_completo;

        const { error } = await supabase
          .from('processo_distancias')
          .update(updateData)
          .eq('id', id);

        if (error) throw error;

        // Atualiza a lista local para refletir as mudanças
        distanciaDialog.value.distancias[distanciaDialog.value.editandoIndex] = {
          ...distanciaDialog.value.distancias[distanciaDialog.value.editandoIndex],
          ...updateData
        };

        // Registrar no log do sistema
        await logSystemAction({
          tipo: 'atualizacao',
          tabela: 'processo_distancias',
          registro_id: id,
          campo_alterado: 'distancia',
          dados_anteriores: JSON.stringify(distanciaDialog.value.distancias[distanciaDialog.value.editandoIndex]),
          dados_novos: JSON.stringify(updateData)
        });

        showToast('Distância atualizada com sucesso', 'success');
        cancelarEdicaoDistancia();
      } catch (error) {
        console.error('Erro ao salvar edição da distância:', error);
        showToast('Erro ao salvar distância', 'error');
      }
    };

    const adicionarDistancia = async () => {
      try {
        const { distancia_km, ponto_referencia_cidade, ponto_referencia_uf, texto_completo } = distanciaDialog.value.novaDistancia;

        if (!distancia_km) {
          showToast('A distância é obrigatória', 'error');
          return;
        }

        const newData = {
          processo_id: distanciaDialog.value.processo.id,
          distancia_km,
          created_at: new Date().toISOString()
        };

        // Campos opcionais só são adicionados se tiverem valor
        if (ponto_referencia_cidade) newData.ponto_referencia_cidade = ponto_referencia_cidade;
        if (ponto_referencia_uf) newData.ponto_referencia_uf = ponto_referencia_uf;
        if (texto_completo) newData.texto_completo = texto_completo;

        const { data, error } = await supabase
          .from('processo_distancias')
          .insert(newData)
          .select();

        if (error) throw error;

        // Adiciona à lista local
        distanciaDialog.value.distancias.push(data[0]);

        // Limpa o formulário
        distanciaDialog.value.novaDistancia = {
          distancia_km: '',
          ponto_referencia_cidade: '',
          ponto_referencia_uf: '',
          texto_completo: ''
        };

        showToast('Distância adicionada com sucesso', 'success');
      } catch (error) {
        console.error('Erro ao adicionar distância:', error);
        showToast('Erro ao adicionar distância', 'error');
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

        // Remove da lista local
        distanciaDialog.value.distancias.splice(index, 1);

        // Registrar no log do sistema
        await logSystemAction({
          tipo: 'exclusao',
          tabela: 'processo_distancias',
          registro_id: distancia.id,
          dados_anteriores: JSON.stringify(distancia)
        });

        showToast('Distância excluída com sucesso', 'success');
      } catch (error) {
        console.error('Erro ao excluir distância:', error);
        showToast('Erro ao excluir distância', 'error');
      }
    };

    const fecharDistanciaDialog = () => {
      distanciaDialog.value.show = false;
      // Recarregar processos para atualizar a visualização
      loadProcessos();
    };

    const {
      responsaveis: responsaveisProcessos,
      loadResponsaveis: loadResponsaveisProcessos,
      getResponsavelNome: getResponsavelProcessoNome
    } = useResponsaveis()

    const getOpcoesParaCampo = (coluna) => {
      if (coluna.campo === 'responsavel_id') {
        return responsaveisProcessos.value;
      } else if (coluna.campo === 'representante_id') {
        return representantes.value;
      } else if (coluna.campo === 'empresa_id') {
        return empresas.value;
      }
      return [];
    };

    const responsaveisDialog = ref({
      show: false,
      position: {},
      processo: null
    });

    const handleDblClickResponsavel = async (field, processo, event) => {
      if (responsaveisProcessos.value.length === 0) {
        await loadResponsaveisProcessos();
      }

      const cell = event.target.closest('td');
      const rect = cell.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      editingCell.value = {
        id: processo.id,
        field,
        value: processo[field]
      };

      responsaveisDialog.value = {
        show: true,
        position: {
          top: `${rect.bottom + scrollTop + 10}px`,
          left: `${rect.left + scrollLeft}px`
        },
        processo
      };
    };

    const removerResponsavel = () => {
      editingCell.value.value = null;
    };

    const handleResponsavelChange = (event) => {
      editingCell.value.value = event.target.value;
    };

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

    const hideResponsaveisDialog = () => {
      responsaveisDialog.value = {
        show: false,
        position: {},
        processo: null
      };
    };

    const representantesDialog = ref({
      show: false,
      position: {},
      processo: null
    });

    const ensureValidRepresentanteId = (value) => {
      if (!value) return null;

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(value)) return value;

      const representante = representantes.value.find(r =>
        r.nome.toLowerCase() === value.toLowerCase());

      if (representante) return representante.id;

      console.warn(`Valor inválido para representante: ${value}`);
      return null;
    };

    const handleDblClickRepresentante = async (field, processo, event) => {
      if (representantes.value.length === 0) {
        await loadRepresentantes();
      }

      const cell = event.target.closest('td');
      const rect = cell.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      editingCell.value = {
        id: processo.id,
        field,
        value: processo[field]
      };

      representantesDialog.value = {
        show: true,
        position: {
          top: `${rect.bottom + scrollTop + 10}px`,
          left: `${rect.left + scrollLeft}px`
        },
        processo
      };
    };

    const removerRepresentante = () => {
      editingCell.value.value = null;
    };

    const handleRepresentanteChange = (event) => {
      editingCell.value.value = event.target.value;
    };

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

    const hideRepresentantesDialog = () => {
      representantesDialog.value = {
        show: false,
        position: {},
        processo: null
      };
    };

    const empresasDialog = ref({
      show: false,
      position: {},
      processo: null
    });

    const formatCNPJ = (cnpj) => {
      if (!cnpj) return '';
      return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
    };

    const ensureValidEmpresaId = (value) => {
      if (!value) return null;

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(value)) return value;

      const empresa = empresas.value.find(e =>
        e.nome.toLowerCase() === value.toLowerCase());

      if (empresa) return empresa.id;

      console.warn(`Valor inválido para empresa: ${value}`);
      return null;
    };

    const handleDblClickEmpresa = async (field, processo, event) => {
      if (empresas.value.length === 0) {
        await loadEmpresas();
      }

      const cell = event.target.closest('td');
      const rect = cell.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      editingCell.value = {
        id: processo.id,
        field,
        value: processo[field]
      };

      empresasDialog.value = {
        show: true,
        position: {
          top: `${rect.bottom + scrollTop + 10}px`,
          left: `${rect.left + scrollLeft}px`
        },
        processo
      };
    };

    const removerEmpresa = () => {
      editingCell.value.value = null;
    };

    const handleEmpresaChange = (event) => {
      editingCell.value.value = event.target.value;
    };

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

    const hideEmpresasDialog = () => {
      empresasDialog.value = {
        show: false,
        position: {},
        processo: null
      };
    };

    const toasts = ref([])

    const showToast = (message, type = 'success', duration = 3000) => {
      const id = Date.now();
      toasts.value.push({ id, message, type });
      
      setTimeout(() => {
        toasts.value = toasts.value.filter(t => t.id !== id);
      }, duration);
    }

    const undoHistory = ref([]);
    const redoHistory = ref([]);
    const MAX_HISTORY_SIZE = 50;

    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === 'z') {
        event.preventDefault();
        undoAction();
      }
      else if (event.ctrlKey && event.key === 'y') {
        event.preventDefault();
        redoAction();
      }
    };

    const undoAction = async () => {
      try {
        if (undoHistory.value.length === 0) {
          console.log('Nada para desfazer');
          return;
        }

        const lastAction = undoHistory.value.pop();
        console.log('Desfazendo ação:', lastAction);

        redoHistory.value.push({
          id: lastAction.id,
          field: lastAction.field,
          oldValue: lastAction.newValue,
          newValue: lastAction.oldValue
        });

        const updateData = {
          [lastAction.field]: lastAction.oldValue,
          updated_at: new Date().toISOString()
        };

        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          updateData.updated_by = user.id;
        }

        const { error } = await supabase
          .from('processos')
          .update(updateData)
          .eq('id', lastAction.id);

        if (error) throw error;

        await logSystemAction({
          tipo: 'desfazer',
          tabela: 'processos',
          registro_id: lastAction.id,
          campo_alterado: lastAction.field,
          dados_anteriores: lastAction.newValue,
          dados_novos: lastAction.oldValue
        });

        await loadProcessos();

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

        undoHistory.value.push({
          id: nextAction.id,
          field: nextAction.field,
          oldValue: nextAction.newValue,
          newValue: nextAction.oldValue
        });

        const updateData = {
          [nextAction.field]: nextAction.oldValue,
          updated_at: new Date().toISOString()
        };

        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          updateData.updated_by = user.id;
        }

        const { error } = await supabase
          .from('processos')
          .update(updateData)
          .eq('id', nextAction.id);

        if (error) throw error;

        await logSystemAction({
          tipo: 'refazer',
          tabela: 'processos',
          registro_id: nextAction.id,
          campo_alterado: nextAction.field,
          dados_anteriores: nextAction.newValue,
          dados_novos: nextAction.oldValue
        });

        await loadProcessos();

        showToast(`Ação refeita: ${nextAction.field}`, 'success')
      } catch (error) {
        console.error('Erro ao refazer ação:', error);
        alert('Erro ao refazer: ' + (error.message || 'Verifique os dados e tente novamente'));
      }
    };

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

    const limparFiltroColuna = (coluna) => {
      if (filtros.value[coluna]) {
        filtros.value[coluna] = [];
      }
    };

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

    const reagendamentoDialog = ref({
      show: false,
      processo: null,
      status: null,
      temNovaData: false,
      novaData: '',
      novaHora: ''
    });

    const abrirReagendamentoDialog = (processo, status) => {
      const dataProcesso = processo.data_pregao ? new Date(processo.data_pregao) : new Date();
      const dataOriginal = dataProcesso.toISOString().split('T')[0];
      
      reagendamentoDialog.value = {
        show: true,
        processo: processo,
        status: status,
        temNovaData: status === 'demonstracao',
        novaData: '',
        novaHora: '',
        dataOriginal: dataOriginal,
        dataError: '',
        horaError: ''
      };
    };

    const hideReagendamentoDialog = () => {
      reagendamentoDialog.value.show = false;
    };

    const confirmarTemNovaData = () => {
      reagendamentoDialog.value.temNovaData = true;
    };

    const confirmSemNovaData = async () => {
      await atualizarStatusProcesso(reagendamentoDialog.value.processo, reagendamentoDialog.value.status);
      hideReagendamentoDialog();
    };

    const atualizarStatusProcesso = async (processo, status) => {
      try {
        const updateData = {
          status: status,
          updated_at: new Date().toISOString()
        };

        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          updateData.updated_by = user.id;
        }

        const { error } = await supabase
          .from('processos')
          .update(updateData)
          .eq('id', processo.id);

        if (error) throw error;

        await logSystemAction({
          tipo: 'atualizacao',
          tabela: 'processos',
          registro_id: processo.id,
          campo_alterado: 'status',
          dados_anteriores: processo.status,
          dados_novos: status
        });

        await loadProcessos();
        
        showToast(`Status atualizado para ${formatStatus(status)}`, 'success');
      } catch (error) {
        console.error('Erro ao atualizar status:', error);
        showToast('Erro ao atualizar status do processo', 'error');
      }
    };

    const validarDataHora = () => {
      let valido = true;
      reagendamentoDialog.value.dataError = '';
      reagendamentoDialog.value.horaError = '';
      
      if (!reagendamentoDialog.value.novaData) {
        reagendamentoDialog.value.dataError = 'Data é obrigatória';
        valido = false;
      } else {
        const novaData = new Date(reagendamentoDialog.value.novaData);
        const dataOriginal = new Date(reagendamentoDialog.value.dataOriginal);
        
        novaData.setHours(0, 0, 0, 0);
        dataOriginal.setHours(0, 0, 0, 0);
        
        if (novaData < dataOriginal) {
          reagendamentoDialog.value.dataError = 'A nova data deve ser posterior à data original do processo';
          valido = false;
        }
      }
      
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

    const handleStatusUpdate = async (statusData) => {
      await loadProcessosAno(anoSelecionado.value);
      showToast(`Status do processo atualizado para ${statusData.newStatus}`, 'success');
    };

    const selectedStatusMap = ref({});
    const nextNotificationDateMap = ref({});
    const { updateProcessoStatus } = useProcessoUpdate();
    
    const statusOptions = computed(() => {
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
    
    const handleStatusChange = async (processo, event) => {
      try {
        const newStatus = event.target.value;
        console.log('Atualizando status para:', newStatus);
        
        if (newStatus === processo.status) return;
        
        // Verificar se o status é "em_analise" (considerando variações)
        const isAnaliseStatus = ['em_analise', 'em analise', 'EM_ANALISE'].includes(newStatus.toLowerCase());
        
        // Atualizar status na tabela de processos
        const updateData = {
          status: newStatus,
          updated_at: new Date().toISOString()
        };

        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          updateData.updated_by = user.id;
        }

        const { error } = await supabase
          .from('processos')
          .update(updateData)
          .eq('id', processo.id);

        if (error) throw error;

        // Se o status for "em_analise", registrar automaticamente na tabela analises_itens
        if (isAnaliseStatus) {
          await registrarProcessoParaAnalise(processo);
        }

        await loadProcessos();
        
        showToast(`Status atualizado para ${formatStatus(newStatus)}`, 'success');
      } catch (error) {
        console.error('Erro ao atualizar status:', error);
        showToast('Erro ao atualizar status do processo', 'error');
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
    
    const loadProcessosAno = async (ano) => {
      processos.value.forEach(processo => {
        if (!selectedStatusMap.value[processo.id]) {
          selectedStatusMap.value[processo.id] = processo.status;
        }
        
        if (['SUSPENSO', 'ADIADO', 'DEMONSTRACAO'].includes(processo.status)) {
          loadNextNotificationDate(processo.id, processo.status);
        }
      });
    };

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
      if (!isRecurringStatus(processo)) return;
      
      const x = event.clientX;
      const y = event.clientY;
      
      statusInfoBalloon.value = {
        show: true,
        processo: processo,
        nextNotification: nextNotificationDateMap.value[processo.id] || 'calculando...',
        position: {
          top: `${y + 25}px`,
          left: `${x - 150}px`
        }
      };
    };

    const hideStatusInfo = () => {
      statusInfoBalloon.value.show = false;
    };

    const analiseDialog = ref({
      show: false,
      processo: null,
      codigoGPI: '',
      prazoResposta: '',
      codigoAnalise: ''
    });

    const showAnaliseDialog = (processo, codigoAnalise) => {
      analiseDialog.value = {
        show: true,
        processo: processo,
        codigoAnalise: processo.codigo_gpi || codigoAnalise,
        codigoGPI: processo.codigo_gpi || '',
        prazoResposta: processo.prazo_analise || ''
      };
    };

    const hideAnaliseDialog = () => {
      analiseDialog.value.show = false;
    };

    const salvarAnalise = async () => {
      try {
        if (!analiseDialog.value.processo || !analiseDialog.value.codigoGPI || !analiseDialog.value.prazoResposta) {
          showToast('Preencha todos os campos obrigatórios', 'error');
          return;
        }

        const prazoFormatado = analiseDialog.value.prazoResposta instanceof Date 
          ? analiseDialog.value.prazoResposta.toISOString().split('T')[0] 
          : analiseDialog.value.prazoResposta;

        const updateData = {
          codigo_analise: analiseDialog.value.codigoAnalise,
          codigo_gpi: analiseDialog.value.codigoGPI,
          prazo_analise: prazoFormatado,
          updated_at: new Date().toISOString()
        };

        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          updateData.updated_by = user.id;
        }

        const { error } = await supabase
          .from('processos')
          .update(updateData)
          .eq('id', analiseDialog.value.processo.id);

        if (error) throw error;

        const notificationData = {
          processo_id: analiseDialog.value.processo.id,
          tipo: 'analise',
          mensagem: `Prazo final para análise do processo ${analiseDialog.value.processo.numero_processo} (Código GPI: ${analiseDialog.value.codigoGPI})`,
          data_notificacao: new Date(prazoFormatado).toISOString(),
          created_at: new Date().toISOString(),
          active: true
        };

        const { error: notificationError } = await supabase
          .from('notification_schedules')
          .insert(notificationData);

        if (notificationError) throw notificationError;

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
          dados_novos: updateData
        });

        await loadProcessos();
        
        hideAnaliseDialog();
        
        showToast(`Análise registrada com sucesso! Código GPI: ${analiseDialog.value.codigoGPI}. Notificação agendada para ${formatDate(prazoFormatado)}`, 'success', 5000);
      } catch (error) {
        console.error('Erro ao salvar análise:', error);
        showToast('Erro ao salvar os detalhes da análise: ' + error.message, 'error');
      }
    };

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
            await showToast(notification.mensagem, 'warning', 10000);
            
            await supabase
              .from('notification_schedules')
              .update({
                status: 'completed',
                updated_at: new Date().toISOString()
              })
              .eq('id', notification.id);
    
          } catch (notifError) {
            console.error('Erro ao processar notificação:', notifError);
            
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

    const handleAnaliseClick = (processo) => {
      showAnaliseDialog(processo, processo.codigo_analise || '');
    };

    const activeTab = ref('users');
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

    const handleComponentUpdate = async (data) => {
      await loadProcessos();
      showToast(`Campo atualizado com sucesso`, 'success');
    };

    const sistemasImplantacaoDialog = ref({
      show: false,
      position: { top: '50px', left: '50px', maxWidth: '90%' },
      processo: null
    });

    const showSistemasImplantacaoDialog = (processo, event) => {
      const cell = event.target.closest('td');
      const rect = cell.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      sistemasImplantacaoDialog.value = {
        show: true,
        position: {
          top: `${rect.bottom + scrollTop + 10}px`,
          left: `${rect.left + scrollLeft}px`
        },
        processo
      };
    };

    const hideSistemasImplantacaoDialog = () => {
      sistemasImplantacaoDialog.value = {
        show: false,
        position: {},
        processo: null
      };
    };

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
        
        await logSystemAction({
          tipo: 'atualizacao',
          tabela: 'processos',
          registro_id: processo.id,
          campo_alterado: 'sistemas_implantacao',
          dados_anteriores: JSON.stringify(processo.sistemas_implantacao || {}),
          dados_novos: JSON.stringify(dados)
        });
        
        await loadProcessos();
        
        hideSistemasImplantacaoDialog();
        
        showToast('Sistemas a implantar atualizados com sucesso', 'success');
      } catch (error) {
        console.error('Erro ao atualizar sistemas a implantar:', error);
        showToast('Erro ao atualizar sistemas a implantar', 'error');
      }
    };

    const formatarMoeda = (valor) => {
      if (!valor) return '-';
      
      let valorNumerico;
      
      if (typeof valor === 'string') {
        const valorLimpo = valor.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
        valorNumerico = parseFloat(valorLimpo);
      } else {
        valorNumerico = parseFloat(valor);
      }
      
      if (isNaN(valorNumerico) || valorNumerico === 0) return '-';
      
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(valorNumerico);
    };

    const confirmarReagendamento = async () => {
      try {
        if (!validarDataHora()) {
          return;
        }
    
        const processo = reagendamentoDialog.value.processo;
        const novoStatus = reagendamentoDialog.value.status;
        const novaData = reagendamentoDialog.value.novaData;
        const novaHora = reagendamentoDialog.value.novaHora;
    
        // Criar uma cópia do processo original para o novo processo
        const dadosBase = { ...processo };
        
        // Remover propriedades que não devem ser copiadas/duplicadas
        delete dadosBase.id;
        delete dadosBase._distancias; // Remover o campo virtual que causa erro
        delete dadosBase.updated_by;
        
        // Definir timestamps para o novo registro
        dadosBase.created_at = new Date().toISOString();
        dadosBase.updated_at = new Date().toISOString();
    
        switch (novoStatus.toLowerCase()) {
          case 'adiado':
          case 'suspenso': {
            const novoProcesso = {
              ...dadosBase,
              data_pregao: novaData,
              hora_pregao: novaHora,
              status: '' // Status em branco por padrão para o novo processo
            };
    
            const updateOriginal = {
              status: novoStatus,
              updated_at: new Date().toISOString()
            };
    
            // Adicionar o usuário que está fazendo a alteração
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.id) {
              updateOriginal.updated_by = user.id;
              novoProcesso.updated_by = user.id;
            }
    
            const [insertResult, updateResult] = await Promise.all([
              supabase.from('processos').insert([novoProcesso]).select().single(),
              supabase.from('processos').update(updateOriginal).eq('id', processo.id)
            ]);
    
            if (insertResult.error) throw insertResult.error;
            if (updateResult.error) throw updateResult.error;
    
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
            const novoProcesso = {
              ...dadosBase,
              data_pregao: novaData,
              hora_pregao: novaHora,
              status: '' // Status em branco por padrão para o novo processo
            };
    
            // Adicionar o usuário que está fazendo a alteração
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.id) {
              novoProcesso.updated_by = user.id;
            }
    
            const { data, error } = await supabase
              .from('processos')
              .insert([novoProcesso])
              .select()
              .single();
    
            if (error) throw error;
    
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
    
        await loadProcessos();
        hideReagendamentoDialog();
        showToast(`Processo ${formatStatus(novoStatus)} registrado com sucesso. Novo processo criado para ${formatDate(novaData)}`, 'success');
      } catch (error) {
        console.error('Erro ao reagendar processo:', error);
        showToast('Erro ao reagendar processo: ' + error.message, 'error');
      }
    };
    
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

    const handleDelete = (processo) => {
      deleteConfirmDialog.value = {
        show: true,
        processo: processo
      };
    };

    const showAdvancedFilter = ref(false);
    const advancedFilters = ref({
      dataInicio: '',
      dataFim: '',
      status: [],
      modalidade: [],
      responsavel: [],
      estados: [],
      valorMin: '',
      valorMax: ''
    });
    
    const activeAdvancedFiltersCount = computed(() => {
      let count = 0;
      
      if (advancedFilters.value.dataInicio) count++;
      if (advancedFilters.value.dataFim) count++;
      if (advancedFilters.value.status.length) count += advancedFilters.value.status.length;
      if (advancedFilters.value.modalidade.length) count += advancedFilters.value.modalidade.length;
      if (advancedFilters.value.responsavel.length) count += advancedFilters.value.responsavel.length;
      if (advancedFilters.value.estados.length) count += advancedFilters.value.estados.length;
      if (advancedFilters.value.valorMin) count++;
      if (advancedFilters.value.valorMax) count++;
      
      return count;
    });
    
    const toggleAdvancedFilter = () => {
      showAdvancedFilter.value = !showAdvancedFilter.value;
      
      // Se o filtro estiver sendo aberto, rolar para cima para garantir visibilidade
      if (showAdvancedFilter.value) {
        nextTick(() => {
          const scrollableContent = document.querySelector('.scrollable-content');
          if (scrollableContent) {
            scrollableContent.scrollTo({
              top: 0,
              behavior: 'smooth'
            });
          }
        });
      }
      
      // Se estiver fechando o filtro e houver filtros ativos, mostrar feedback
      if (!showAdvancedFilter.value && activeAdvancedFiltersCount.value > 0) {
        showToast(`${activeAdvancedFiltersCount.value} filtros avançados aplicados`, 'info');
      }
    };
    
    const updateAdvancedFilters = (filters) => {
      advancedFilters.value = { ...filters };
    };
    
    const applyAdvancedFilters = (filters) => {
      advancedFilters.value = { ...filters };
      showAdvancedFilter.value = false;
      
      showToast(`${activeAdvancedFiltersCount.value} filtros aplicados com sucesso`, 'success');
    };
    
    const clearAdvancedFilters = () => {
      advancedFilters.value = {
        dataInicio: '',
        dataFim: '',
        status: [],
        modalidade: [],
        responsavel: [],
        estados: [],
        valorMin: '',
        valorMax: ''
      };
      
      showToast('Filtros avançados removidos', 'info');
    };

    // Função para verificar se o processo tem dados de impugnação
    const hasImpugnacaoData = (processo) => {
      return processo.impugnacao_data_limite || 
             processo.impugnacao_status || 
             processo.impugnacao_forma_envio || 
             processo.impugnacao_itens || 
             processo.impugnacoes;
    };

    // Função para verificar se um processo tem dados relevantes de impugnação para exibição
    const hasRelevantImpugnacaoData = (processo) => {
      if (!processo) return false;
      
      // Verifica se algum dos campos tem valor significativo
      return (
        // Tem data limite definida
        (processo.impugnacao_data_limite && processo.impugnacao_data_limite !== '-') ||
        
        // Tem itens a serem impugnados
        (processo.impugnacao_itens && processo.impugnacao_itens.trim() !== '' && processo.impugnacao_itens !== '-') ||
        
        // Tem observações de impugnação 
        (processo.impugnacoes && processo.impugnacoes.trim() !== '' && processo.impugnacoes !== '-') ||
        
        // Tem forma de envio definida
        (processo.impugnacao_forma_envio && processo.impugnacao_forma_envio !== '-') ||
        
        // Status diferente do padrão "não iniciado"
        (processo.impugnacao_status && processo.impugnacao_status !== 'nao_iniciado')
      );
    };

    // Função para formatar o status de impugnação
    const formatImpugnacaoStatus = (status) => {
      if (!status) return 'Não iniciado';
      
      const statusMap = {
        'nao_iniciado': 'Não iniciado',
        'em_andamento': 'Em andamento',
        'enviado': 'Enviado',
        'respondido': 'Respondido',
        'aprovado': 'Aprovado',
        'rejeitado': 'Rejeitado'
      };
      
      return statusMap[status] || status;
    };

    async function updateProcesso(processo) {
      console.log('updateProcesso chamado', { 
        id: processo.id, 
        numero: processo.numero_processo,
        responsavel_id: processo.responsavel_id
      });
      
      try {
        // Criar uma cópia do objeto para não modificar o original
        const processToUpdate = { ...processo };
        
        // Removendo propriedades temporárias/virtuais que não existem no banco de dados
        delete processToUpdate._distancias;
        delete processToUpdate.representantes;
        delete processToUpdate.profiles;
        
        // Garantir que campos com valor null sejam enviados explicitamente
        // para o banco como null e não sejam ignorados na atualização
        if (processo.responsavel_id === null) {
          console.log('Enviando responsavel_id como NULL explicitamente');
          processToUpdate.responsavel_id = null;
        }
        
        // Registrar a atualização para histórico de ações
        if (undoHistory.value) {
          const currentProcess = processos.value.find(p => p.id === processo.id);
          if (currentProcess) {
            undoHistory.value.push({
              type: 'update',
              id: processo.id,
              oldData: { ...currentProcess },
              newData: { ...processToUpdate }
            });
            // Limpar o redo history quando uma nova ação é executada
            redoHistory.value = [];
          }
        }
        
        // Adicionar timestamp e usuário de atualização
        processToUpdate.updated_at = new Date().toISOString();
        
        // Se estiver disponível, adicionar o usuário que fez a alteração
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          processToUpdate.updated_by = user.id;
        }
        
        console.log('Enviando dados para atualização:', processToUpdate);
        
        // Realizar a atualização no banco de dados
        const { error } = await supabase
          .from('processos')
          .update(processToUpdate)
          .eq('id', processo.id);
        
        if (error) {
          console.error('Erro na atualização do processo:', error);
          showToast(`Erro ao atualizar o processo: ${error.message}`, 'error');
          throw error;
        }
        
        console.log('Processo atualizado com sucesso:', processo.id);
        
        // Atualizar o processo na lista local
        const index = processos.value.findIndex(p => p.id === processo.id);
        if (index !== -1) {
          // Mantém as propriedades virtuais do objeto original
          if (processos.value[index]._distancias) {
            processToUpdate._distancias = processos.value[index]._distancias;
          }
          
          processos.value[index] = { ...processToUpdate };
        }
        
        // Registrar a alteração no log do sistema
        await logSystemAction({
          tipo: 'update',
          tabela: 'processos',
          registro_id: processo.id,
          dados_anteriores: JSON.stringify(processos.value.find(p => p.id === processo.id)),
          dados_novos: JSON.stringify(processToUpdate)
        });
        
        return true;
      } catch (error) {
        console.error('Erro na atualização:', error);
        showToast(`Erro ao atualizar dados: ${error.message}`, 'error');
        return false;
      }
    }

    const showDuplicateDialog = (processo) => {
      duplicateDialog.value.processo = { ...processo };
      duplicateDialog.value.show = true;
    };

    const hideDuplicateDialog = () => {
      duplicateDialog.value.show = false;
      duplicateDialog.value.processo = null;
    };

    /**
     * Executa a duplicação do processo com base nos dados do diálogo
     */
    const executarDuplicacao = async (dadosDuplicacao) => {
      try {
        // Inicia o indicador de carregamento
        duplicateDialog.value.loading = true;
        
        const { processoOriginal, novaData, novaHora, opcoes } = dadosDuplicacao;
        
        // Criar uma cópia do processo original
        const novoProcesso = { ...processoOriginal };
        
        // Remover o ID para criar um novo registro e qualquer campo virtual que não existe no banco
        delete novoProcesso.id;
        delete novoProcesso._distancias; // Removendo campo virtual que não existe no banco de dados
        
        // Atualizar data e hora
        novoProcesso.data_pregao = novaData;
        novoProcesso.hora_pregao = novaHora;
        
        // Definir status com base nas opções
        if (!opcoes.manterStatus) {
          novoProcesso.status = 'em_analise'; // Status padrão para novos processos
        }
        
        // Limpar dados que não devem ser copiados
        if (!opcoes.copiarResponsaveis) {
          novoProcesso.responsavel_id = null;
        }
        
        if (!opcoes.copiarObservacoes) {
          novoProcesso.campo_adicional1 = null;
          novoProcesso.campo_adicional2 = null;
        }
        
        if (!opcoes.copiarImpugnacoes) {
          novoProcesso.impugnacoes = null;
          novoProcesso.impugnacao_data_limite = null;
          novoProcesso.impugnacao_itens = null;
          novoProcesso.impugnacao_forma_envio = null;
          novoProcesso.impugnacao_status = 'nao_iniciado';
        }
        
        // Atualizar campos de data de criação e atualização
        novoProcesso.created_at = new Date().toISOString();
        novoProcesso.updated_at = new Date().toISOString();
        
        // Adicionar o usuário que está criando o duplicado
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          novoProcesso.updated_by = user.id;
        }
        
        // Inserir o novo processo duplicado
        const { data: novoProcessoInserido, error } = await supabase
          .from('processos')
          .insert(novoProcesso)
          .select()
          .single();
        
        if (error) throw error;
        
        // Buscar as distâncias associadas ao processo original para duplicá-las
        const { data: distanciasOriginais, error: errorDistancias } = await supabase
          .from('processo_distancias')
          .select('*')
          .eq('processo_id', processoOriginal.id);
        
        // Se houver distâncias e não houver erro, duplicar as distâncias
        if (distanciasOriginais && distanciasOriginais.length > 0 && !errorDistancias) {
          const distanciasNovas = distanciasOriginais.map(distancia => {
            // Criar uma cópia da distância e associar ao novo processo
            const novaDistancia = { ...distancia };
            delete novaDistancia.id; // Remover ID para criar um novo registro
            novaDistancia.processo_id = novoProcessoInserido.id;
            novaDistancia.created_at = new Date().toISOString();
            novaDistancia.updated_at = new Date().toISOString();
            return novaDistancia;
          });
          
          // Inserir as novas distâncias
          const { error: distanciasError } = await supabase
            .from('processo_distancias')
            .insert(distanciasNovas);
          
          if (distanciasError) console.error('Erro ao duplicar distâncias:', distanciasError);
        }
        
        // Registrar no log do sistema
        await logSystemAction({
          tipo: 'duplicate',
          tabela: 'processos',
          registro_id: novoProcessoInserido.id,
          dados_anteriores: { id: processoOriginal.id, numero_processo: processoOriginal.numero_processo },
          dados_novos: novoProcessoInserido
        });
        
        // Recarregar os processos
        await loadProcessos();
        
        // Fechar o diálogo
        hideDuplicateDialog();
        
        // Mostrar mensagem de sucesso
        showToast(`Processo duplicado com sucesso para ${formatDate(novaData)}`, 'success');
        
      } catch (error) {
        console.error('Erro ao duplicar processo:', error);
        showToast(`Erro ao duplicar processo: ${error.message}`, 'error');
      } finally {
        duplicateDialog.value.loading = false;
      }
    };

    const handleDuplicate = (processo) => {
      showDuplicateDialog(processo);
    };

    /**
     * Abre o diálogo para editar empresa vencedora
     */
    const openEmpresaVencedoraDialog = (processo) => {
      console.log('Abrindo diálogo de empresa vencedora para processo:', processo.id);
      // Abre diretamente o modal sem mostrar confirmação
      empresaVencedoraDialog.value = {
        show: true,
        processoId: processo.id,
        dadosAtuais: processo.empresa_vencedora || ''
      };
    };

    const closeEmpresaVencedoraDialog = () => {
      empresaVencedoraDialog.value.show = false;
    };

    const saveEmpresaVencedora = async ({ processoId, empresaVencedora }) => {
      try {
        loading.value = true;

        const { error } = await supabase
          .from('processos')
          .update({ empresa_vencedora: empresaVencedora })
          .eq('id', processoId);

        if (error) throw error;

        await logSystemAction({
          tipo: 'update',
          tabela: 'processos',
          registro_id: processoId,
          campo: 'empresa_vencedora',
          dados_novos: empresaVencedora
        });

        await loadProcessos();

        showToast('Informações da empresa vencedora atualizadas com sucesso!', 'success');
      } catch (error) {
        console.error('Erro ao salvar empresa vencedora:', error);
        showToast(`Erro ao salvar: ${error.message}`, 'error');
      } finally {
        loading.value = false;
      }
    };

    /**
     * Verifica se uma string pode ser interpretada como um objeto JSON
     */
    const isJsonObject = (str) => {
      if (!str) return false;
      if (typeof str === 'object') return true;
      
      try {
        const obj = JSON.parse(str);
        return typeof obj === 'object' && obj !== null;
      } catch (e) {
        return false;
      }
    };

    /**
     * Obtém o nome da empresa vencedora de um valor JSON ou string
     */
    const getEmpresaVencedoraNome = (valor) => {
      if (!valor) return '';
      
      try {
        const dados = typeof valor === 'object' ? valor : JSON.parse(valor);
        return dados.nomeEmpresa || 'Empresa sem nome';
      } catch (e) {
        return valor;
      }
    };

    /**
     * Obtém o número do contrato da empresa vencedora
     */
    const getEmpresaVencedoraContrato = (valor) => {
      if (!valor) return '';
      
      try {
        const dados = typeof valor === 'object' ? valor : JSON.parse(valor);
        return dados.numeroContrato || '';
      } catch (e) {
        return '';
      }
    };

    // Função para obter a contagem de sistemas a implantar de um processo
    const getSistemasImplantacaoCount = (processo) => {
      if (!processo.sistemas_implantacao) return 0;
      
      try {
        const dadosSistemas = typeof processo.sistemas_implantacao === 'object'
          ? processo.sistemas_implantacao
          : JSON.parse(processo.sistemas_implantacao);
          
        return dadosSistemas.sistemas_ids ? dadosSistemas.sistemas_ids.length : 0;
      } catch (error) {
        console.error('Erro ao obter contagem de sistemas a implantar:', error);
        return 0;
      }
    };

    const resetarConfiguracaoTabela = () => {
      try {
        // Resetar a ordem das colunas para o padrão
        resetColumnOrder();
        
        // Resetar a largura das colunas para o padrão
        resetColumnWidths();
        
        showToast('Configurações da tabela foram resetadas com sucesso!', 'success');
      } catch (error) {
        console.error('Erro ao resetar configurações da tabela:', error);
        showToast('Erro ao resetar as configurações da tabela.', 'error');
      }
    };

    async function buildProcessosQuery() {
      let query = supabase.from('processos').select('*');
      
      // Adicionar filtros conforme necessário
      // ...
      
      // Sempre aplicar estas ordenações ao final
      query = query.order('created_at', { ascending: true })
                   .order('id', { ascending: true });
      3
      return query;
    }

    const registrarProcessoParaAnalise = async (processo) => {
      try {
        console.log('Registrando processo para análise:', processo.id);
        
        // Garantir que temos os dados atualizados do processo
        const { data: processoAtualizado, error: processoError } = await supabase
          .from('processos')
          .select('*')
          .eq('id', processo.id)
          .single();
        
        if (processoError) throw processoError;
        
        // Extrair sistemas_ativos e garantir que é um array
        const sistemasAtivos = Array.isArray(processoAtualizado.sistemas_ativos) 
          ? processoAtualizado.sistemas_ativos 
          : (typeof processoAtualizado.sistemas_ativos === 'string' 
              ? JSON.parse(processoAtualizado.sistemas_ativos || '[]') 
              : (processoAtualizado.sistemas_ativos || []));
        
        console.log('Sistemas ativos encontrados:', sistemasAtivos);
        
        // Verificar registros existentes na tabela analises_itens
        const { data: existentes, error: existentesError } = await supabase
          .from('analises_itens')
          .select('id, sistema_id')
          .eq('processo_id', processo.id);
        
        if (existentesError) throw existentesError;
        
        // Mapear sistemas que já estão registrados
        const sistemasRegistrados = existentes ? existentes.map(item => item.sistema_id) : [];
        
        // Encontrar sistemas que precisam ser adicionados (estão em sistemas_ativos mas não em sistemasRegistrados)
        const sistemasParaAdicionar = sistemasAtivos.filter(id => !sistemasRegistrados.includes(id));
        
        console.log('Sistemas para adicionar:', sistemasParaAdicionar);
        
        if (sistemasParaAdicionar.length > 0) {
          // Criar um registro para cada sistema novo
          const registros = sistemasParaAdicionar.map(sistemaId => ({
            processo_id: processo.id,
            sistema_id: sistemaId,
            total_itens: 0,
            nao_atendidos: 0,
            obrigatorio: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));
          
          const { error: insertError } = await supabase
            .from('analises_itens')
            .insert(registros);
          
          if (insertError) {
            console.error('Erro ao inserir novos registros:', insertError);
            throw insertError;
          }
          
          console.log('Registros de sistemas inseridos com sucesso');
          showToast('Processo registrado para análise com sucesso', 'success');
        } else if (existentes && existentes.length > 0) {
          console.log('Processo já está registrado para análise e sistemas estão atualizados');
          showToast('Processo já registrado para análise', 'info');
        } else if (sistemasAtivos.length === 0) {
          // Se não tiver sistemas ativos, criar registro vazio
          const { error: insertError } = await supabase
            .from('analises_itens')
            .insert({
              processo_id: processo.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          
          if (insertError) {
            console.error('Erro ao inserir registro vazio:', insertError);
            throw insertError;
          }
          
          console.log('Registro vazio inserido com sucesso');
          showToast('Processo registrado para análise', 'success');
        }
      } catch (error) {
        console.error('Erro ao registrar processo para análise:', error);
        showToast('Erro ao registrar processo para análise', 'error');
      }
    };

    // Adicione esta função ao ProcessosView.js ou ajuste a existente
    // para ser chamada quando for necessário atualizar o campo empresa_atual_prestadora

    const handleEmpresaAtualChange = async (processo, novoValor) => {
      try {
        // Validação para garantir que é um UUID válido ou null
        // Se não for um UUID válido, defina como null
        let empresaId = null;
        
        if (novoValor) {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (uuidRegex.test(novoValor)) {
            empresaId = novoValor;
          } else {
            // Tentar encontrar a empresa pelo nome
            const empresa = empresas.value.find(e => e.nome === novoValor);
            if (empresa && empresa.id) {
              empresaId = empresa.id;
            } else {
              throw new Error("ID da empresa inválido ou empresa não encontrada");
            }
          }
        }
        
        const { data: { user } } = await supabase.auth.getUser();
        
        const payload = {
          processo_id: processo.id,
          empresa_id: empresaId,  // Agora garante que é null ou UUID válido
          updated_at: new Date().toISOString(),
          updated_by: user?.id || null
        };
        
        console.log("Enviando payload para atualização:", payload);
        
        const { error } = await supabase
          .from('processos_empresa_atual_prestadora')
          .upsert(payload, { onConflict: 'processo_id' });
          
        if (error) throw error;
        
        return true;
      } catch (error) {
        console.error('Erro ao atualizar empresa atual:', error);
        showToast(`Erro ao atualizar empresa atual: ${error.message}`, 'error');
        return false;
      }
    };

    // Adicione esta função aos métodos do componente
    const verificarTabelaAnalises = async (processo) => {
      try {
        const { data, error } = await supabase
          .from('analises_itens')
          .select('*')
          .eq('processo_id', processo.id);
          
        if (error) throw error;
        
        console.log('Registros na tabela analises_itens para o processo:', data);
        
        if (!data || data.length === 0) {
          showToast('Processo não está registrado na tabela de análises', 'warning');
          
          if (confirm('Deseja registrar este processo para análise agora?')) {
            await forcarRegistroAnalise(processo);
          }
        } else {
          showToast(`Processo já possui ${data.length} registros na tabela de análises`, 'info');
        }
      } catch (error) {
        console.error('Erro ao verificar tabela de análises:', error);
        showToast('Erro ao verificar tabela de análises', 'error');
      }
    };

    // Adicione esta função aos seus métodos

    const forcarRegistroAnalise = async (processo) => {
      try {
        // Primeiro excluir qualquer registro existente para evitar duplicações
        await supabase
          .from('analises_itens')
          .delete()
          .eq('processo_id', processo.id);
          
        // Agora registrar novamente
        await registrarProcessoParaAnalise(processo);
        
        showToast('Processo forçado para análise com sucesso!', 'success');
        
        // Opcionalmente, redirecionar para a tela de análises
        router.push('/analises');
      } catch (error) {
        console.error('Erro ao forçar registro para análise:', error);
        showToast('Erro ao forçar registro para análise', 'error');
      }
    };

    const atualizarAnalisesAposMudancaSistemas = async (processoId, novosSistemasAtivos) => {
      try {
        // Verificar se o processo está em análise
        const { data: processo, error: processoError } = await supabase
          .from('processos')
          .select('status')
          .eq('id', processoId)
          .single();
          
        if (processoError) throw processoError;
        
        // Se o status for "Em Análise", atualizar registros de análise
        if (processo.status === 'em_analise' || processo.status === 'EM_ANALISE') {
          // Buscar registros existentes
          const { data: registrosExistentes, error: registrosError } = await supabase
            .from('analises_itens')
            .select('id, sistema_id')
            .eq('processo_id', processoId);
            
          if (registrosError) throw registrosError;
          
          // Extrair IDs de sistemas já registrados
          const sistemasRegistrados = registrosExistentes.map(item => item.sistema_id);
          
          // Identificar sistemas para adicionar e remover
          const sistemasParaAdicionar = novosSistemasAtivos.filter(id => !sistemasRegistrados.includes(id));
          const sistemasParaRemover = sistemasRegistrados.filter(id => !novosSistemasAtivos.includes(id));
          
          const promises = [];
          
          // Adicionar novos sistemas
          if (sistemasParaAdicionar.length > 0) {
            const registros = sistemasParaAdicionar.map(sistemaId => ({
              processo_id: processoId,
              sistema_id: sistemaId,
              total_itens: 0,
              nao_atendidos: 0,
              obrigatorio: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }));
            
            promises.push(
              supabase.from('analises_itens').insert(registros)
            );
          }
          
          // Remover sistemas que não estão mais ativos
          if (sistemasParaRemover.length > 0) {
            promises.push(
              supabase
                .from('analises_itens')
                .delete()
                .eq('processo_id', processoId)
                .in('sistema_id', sistemasParaRemover)
            );
          }
          
          // Executar todas as operações
          if (promises.length > 0) {
            await Promise.all(promises);
            console.log(`Sistemas sincronizados: ${sistemasParaAdicionar.length} adicionados, ${sistemasParaRemover.length} removidos`);
            return { adicionados: sistemasParaAdicionar.length, removidos: sistemasParaRemover.length };
          }
        }
        
        return null;
      } catch (error) {
        console.error('Erro ao atualizar análises após mudança de sistemas:', error);
        throw error;
      }
    };

    return {
      handleStatusUpdate,
      getOpcoesParaCampo,
      processos,
      loading,
      isLoading,
      isSidebarExpanded,
      confirmDialog,
      deleteConfirmDialog,
      sistemasDialog,
      impugnacaoDialog,
      duplicateDialog,
      empresaVencedoraDialog,
      editingCell,
      sortConfig,
      selectedRow,
      anoSelecionado,
      mostrarFiltro,
      filtros,
      estadoSearch,
      representantes,
      empresas,
      sistemasAtivos,
      plataformas,
      estados,
      formData,
      colunas,
      colunasWidth,
      colunasWidthOriginais, // Exportar os valores originais
      rowsHeight,
      anosDisponiveis,
      estadosFiltrados,
      processosFiltrados,
      temFiltrosAtivos,
      empresasCadastradas,
      showPlataformaField,
      formatDate,
      formatTime,
      formatModalidade,
      formatModalidadeCompleta,
      formatStatus,
      getModalidadeSigla,
      getPlataformaNome,
      getPortalName,
      getEmpresaNome,
      getEmpresaCor,
      getLightColor,
      getContrastColorForEmpresa,
      getRepresentanteNome,
      getSistemaNome,
      getSistemasNomesString,
      formatarDistancia,
      getDistancias,
      handleSidebarToggle,
      handleNewProcess,
      hideDeleteDialog,
      confirmDelete,
      exportToExcel,
      toggleFiltro,
      limparFiltros,
      limparTodosFiltros,
      handleSort,
      selecionarAno,
      selectRow,
      handleModalidadeChange,
      startColumnResize,
      startRowResize,
      handleDblClick,
      showImpugnacaoDialog,
      hideImpugnacaoDialog,
      salvarImpugnacao,
      handleConfirmEdit,
      hideConfirmDialog,
      cancelEdit,
      handleUpdate,
      handleSistemasChange,
      removerSistema,
      saveSistemas,
      hideSistemasDialog,
      handleSubmit,
      opcoesUnicas,
      distanciaDialog,
      abrirDialogDistancia,
      iniciarEdicaoDistancia,
      excluirDistancia,
      salvarEdicaoDistancia,
      adicionarDistancia,
      cancelarEdicaoDistancia,
      fecharDistanciaDialog,
      responsaveisProcessos,
      getResponsavelProcessoNome,
      responsaveisDialog,
      handleDblClickResponsavel,
      removerResponsavel,
      handleResponsavelChange,
      saveResponsavel,
      hideResponsaveisDialog,
      representantesDialog,
      handleDblClickRepresentante,
      removerRepresentante,
      handleRepresentanteChange,
      saveRepresentante,
      hideRepresentantesDialog,
      empresasDialog,
      formatCNPJ,
      handleDblClickEmpresa,
      removerEmpresa,
      handleEmpresaChange,
      saveEmpresa,
      hideEmpresasDialog,
      undoAction,
      redoAction,
      undoHistory,
      redoHistory,
      filtrarOpcoes,
      toggleFiltroItem,
      filtroModalidadeSearch,
      opcoesModalidade,
      opcoesFiltradasModalidade,
      limparFiltroColuna,
      filtrarOpcoesPorColuna,
      colunasOrder,
      ordenarColunas,
      startColumnDrag,
      allowColumnDrop,
      handleColumnDrop,
      toasts,
      showToast,
      colunasOrdenadas,
      reagendamentoDialog,
      abrirReagendamentoDialog,
      hideReagendamentoDialog,
      confirmarTemNovaData,
      confirmSemNovaData,
      confirmarReagendamento,
      validarDataHora,
      selectedStatusMap,
      nextNotificationDateMap,
      statusOptions,
      getStatusClass,
      isRecurringStatus,
      handleStatusChange,
      loadNextNotificationDate,
      statusInfoBalloon,
      showStatusInfo,
      hideStatusInfo,
      analiseDialog,
      showAnaliseDialog,
      hideAnaliseDialog,
      salvarAnalise,
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
      sistemasImplantacaoDialog,
      showSistemasImplantacaoDialog,
      hideSistemasImplantacaoDialog,
      formatarSistemasImplantacao,
      atualizarSistemasImplantacao,
      formatarMoeda,
      calculateRows(text) {
        if (!text) return 10;
        
        const charCount = text.length;
        const lineBreaks = (text.match(/\n/g) || []).length;
        
        const estimatedLines = Math.ceil(charCount / 900) + lineBreaks;
        
        return Math.min(Math.max(estimatedLines, 1), 100);
      },
      handleDelete,
      showAdvancedFilter,
      advancedFilters,
      activeAdvancedFiltersCount,
      toggleAdvancedFilter,
      updateAdvancedFilters,
      applyAdvancedFilters,
      clearAdvancedFilters,
      hasImpugnacaoData,
      hasRelevantImpugnacaoData,
      formatImpugnacaoStatus,
      updateProcesso,
      showDuplicateDialog,
      hideDuplicateDialog,
      executarDuplicacao,
      handleDuplicate,
      openEmpresaVencedoraDialog,
      closeEmpresaVencedoraDialog,
      saveEmpresaVencedora,
      isJsonObject,
      getEmpresaVencedoraNome,
      getEmpresaVencedoraContrato,
      getSistemasImplantacaoCount,
      resetarConfiguracaoTabela, // Nova função para resetar configurações da tabela
      forcarRegistroAnalise,
      verificarTabelaAnalises,
      atualizarAnalisesAposMudancaSistemas
    }
  }
}