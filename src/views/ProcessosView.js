import { ref, onMounted, computed, nextTick, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import TheSidebar from '@/components/TheSidebar.vue'
import * as XLSX from 'xlsx'
import { writeFileXLSX, utils } from 'xlsx'
import { buildUrl } from '@/utils/url'
import BaseImage from '@/components/BaseImage.vue'
import '../assets/styles/dark-mode.css'
import { useConnectionManager } from '@/composables/useConnectionManager'
import { SupabaseManager } from '@/lib/supabaseManager'
import { useResponsaveis } from '@/composables/useResponsaveis'

export default {
  name: 'ProcessosView',
  
  components: {
    TheSidebar,
    BaseImage
  },
  
  setup() {
    // Router and basic component state
    const router = useRouter()
    const isSidebarExpanded = ref(true)
    const processos = ref([])
    const loading = ref(false)
    const isLoading = ref(false)
    const loadingTimeout = ref(null)

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
      { titulo: 'Impugnações', campo: 'impugnacoes' },
      {
        titulo: 'Empresa Participante',
        campo: 'empresa_id',
        tabelaRelacionada: 'empresas',
        campoExibicao: 'nome',
        tipoEdicao: 'select'
      }
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
      const anos = new Set(processos.value.map(p => p.ano))
      return Array.from(anos).sort((a, b) => b - a) // Descending order
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
      if (!processos.value) return []

      return processos.value
        .filter(processo => processo.ano === anoSelecionado.value)
        .filter(processo => {
          return colunas.every(coluna => {
            if (!filtros.value[coluna.campo] || filtros.value[coluna.campo].length === 0) {
              return true
            }

            let valorProcesso = processo[coluna.campo]
            if (!valorProcesso) return false

            switch (coluna.campo) {
              case 'data_pregao':
                valorProcesso = formatDate(valorProcesso)
                break
              case 'hora_pregao':
                valorProcesso = formatTime(valorProcesso)
                break
              case 'modalidade':
                valorProcesso = formatModalidade(valorProcesso)
                break
            }

            return filtros.value[coluna.campo].includes(valorProcesso)
          })
        })
    })

    const temFiltrosAtivos = computed(() => {
      return Object.values(filtros.value).some(f => f.length > 0)
    })

    const empresasCadastradas = computed(() => {
      return empresas.value.filter(empresa => empresa.id) // Filter only valid companies
    })

    const showPlataformaField = computed(() => {
      return formData.value.modalidade === 'pregao_eletronico';
    });

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

      // Check if the process has basic distance data
      if (processo.distancia_km && processo.ponto_referencia_cidade && processo.ponto_referencia_uf) {
        return `${processo.distancia_km} km (${processo.ponto_referencia_cidade}/${processo.ponto_referencia_uf})`;
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
      if (isLoading.value) return

      try {
        isLoading.value = true
        console.log('Starting process loading...')

        // Query processes
        const { data, error } = await supabase
          .from('processos')
          .select(`*`)
          .order('data_pregao', { ascending: true })

        if (error) throw error

        // Additional data processing
        const processosComNomes = []

        for (const processo of data || []) {
          // Fetch system names for each process
          let sistemasNomes = '-'
          if (processo.sistemas_ativos && processo.sistemas_ativos.length > 0) {
            sistemasNomes = await getSistemasNomes(processo.sistemas_ativos)
          }

          // Add the process with sistemas_nomes field populated
          processosComNomes.push({
            ...processo,
            sistemas_nomes: sistemasNomes
          })
        }

        processos.value = processosComNomes
        console.log('Processes loaded with system names:', processos.value.length)

      } catch (error) {
        console.error('Error loading processes:', error)
      } finally {
        isLoading.value = false
      }
    }

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

    const handleDelete = (processo) => {
      deleteConfirmDialog.value = {
        show: true,
        processo
      }
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
        const { data: { user } } = await supabase.auth.getUser()

        const logData = {
          usuario_id: user.id,
          usuario_email: user.email,
          tipo: dados.tipo,
          tabela: dados.tabela,
          registro_id: dados.registro_id,
          dados_anteriores: dados.dados_anteriores,
          dados_novos: dados.dados_novos,
          data_hora: new Date().toISOString()
        }

        const { error } = await supabase
          .from('system_logs')
          .insert(logData)

        if (error) throw error
      } catch (error) {
        console.error('Error logging action:', error)
      }
    }

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
      mostrarFiltro.value[coluna] = !mostrarFiltro.value[coluna]
    }

    const limparFiltros = () => {
      Object.keys(filtros.value).forEach(key => {
        filtros.value[key] = []
      })
    }

    const handleSort = async (field, direction) => {
      if (sortConfig.value.field === field && sortConfig.value.direction === direction) {
        return
      }

      sortConfig.value = {
        field,
        direction
      }

      await loadProcessos()
    }

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

    const handleUpdate = async (processo) => {
      try {
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
            
            // Se mesmo após a conversão não temos um UUID válido, cancelar a atualização
            if (!updateValue) {
              console.error('Valor inválido para empresa:', editingCell.value.value);
              alert('Empresa inválida. Por favor, selecione uma empresa válida da lista.');
              cancelEdit();
              return;
            }
            
            console.log(`Atualizando empresa para: ${updateValue} (validado)`);
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
    const opcoesUnicas = (coluna) => {
      const opcoes = new Set()
      processos.value.forEach(processo => {
        let valor = processo[coluna]

        if (coluna === 'data_pregao') {
          valor = formatDate(valor)
        } else if (coluna === 'hora_pregao') {
          valor = formatTime(valor)
        } else if (coluna === 'modalidade') {
          valor = formatModalidade(valor)
        }

        if (valor) opcoes.add(valor)
      })
      return Array.from(opcoes).sort()
    }

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
        alert(`Ação desfeita: ${lastAction.field}`);
      } catch (error) {
        console.error('Erro ao desfazer ação:', error);
        alert('Erro ao desfazer: ' + (error.message || 'Verifique os dados e tente novamente'));
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
        alert(`Ação refeita: ${nextAction.field}`);
      } catch (error) {
        console.error('Erro ao refazer ação:', error);
        alert('Erro ao refazer: ' + (error.message || 'Verifique os dados e tente novamente'));
      }
    };

    // Return all reactive properties and methods for the template
    return {
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
      handleDelete,
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
      redoHistory  // Adicionar esta linha
    }
  }
}