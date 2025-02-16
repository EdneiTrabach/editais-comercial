<template>
  <div class="layout">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />

    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <!-- Loading overlay -->
      <div v-if="loading" class="loading-overlay">
        <div class="loading-spinner"></div>
      </div>
      <div class="header">
        <h1>Novo Processo Licitatório</h1>
      </div>

      <div class="form-container">
        <form @submit.prevent="handleSubmit" class="form-grid">
          <div class="form-group">
            <RequiredLabel text="Número do Processo" :isRequired="true" />
            <div class="processo-input">
              <input v-model="formData.numero" type="text" required placeholder="Número" />
              <span class="separator">/</span>
              <input v-model="formData.ano" type="number" required :min="currentYear - 2" :max="currentYear + 2"
                placeholder="Ano" />
            </div>
          </div>

          <div class="form-group">
            <RequiredLabel text="Data do Pregão" :isRequired="true" />
            <input v-model="formData.data_pregao" type="date" required :class="{ 'error': dateError }"
              @change="validateDate" />
            <small v-if="dateError" class="error-message">{{ dateError }}</small>
          </div>

          <div class="form-group">
            <RequiredLabel text="Hora do Pregão" :isRequired="true" />
            <input v-model="formData.hora_pregao" type="time" required min="08:00" max="18:00" @change="validateTime" />
            <small v-if="timeError" class="error-message">{{ timeError }}</small>
          </div>

          <div class="form-group">
            <RequiredLabel text="Estado" :isRequired="true" />
            <select v-model="formData.estado" required>
              <option value="">Selecione o estado...</option>
              <option v-for="estado in estados" :key="estado.uf" :value="estado.uf">
                {{ estado.nome }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <RequiredLabel text="Órgão" :isRequired="true" />
            <input v-model="formData.orgao" type="text" required placeholder="Nome do órgão" />
          </div>

          <div class="form-group">
            <RequiredLabel text="Modalidade" :isRequired="true" />
            <select v-model="formData.modalidade" required @change="handleModalidadeChange">
              <option value="">Selecione...</option>
              <option value="pregao_eletronico">Pregão Eletrônico</option>
              <option value="pregao_presencial">Pregão Presencial</option>
              <option value="credenciamento">Credenciamento</option>
              <option value="concorrencia">Concorrência</option>
              <option value="concurso">Concurso</option>
              <option value="leilao">Leilão</option>
              <option value="dialogo_competitivo">Diálogo Competitivo</option>
              <option value="tomada_precos">Tomada de Preços</option>
              <option value="chamamento_publico">Chamamento Público</option>
              <option value="rdc">RDC</option>
              <option value="rdc_eletronico">RDC Eletrônico</option>
              <option value="srp">SRP</option>
              <option value="srp_eletronico">SRP Eletrônico</option>
              <option value="srp_internacional">SRP Internacional</option>
            </select>
          </div>

          <!-- Campo de Plataforma -->
          <div class="form-group" v-if="showPlataformaField">
            <RequiredLabel text="Plataforma" :isRequired="true" />
            <div class="plataforma-container">
              <select v-model="formData.site_pregao" required>
                <option value="">Selecione a plataforma...</option>
                <option 
                  v-for="plataforma in plataformas" 
                  :key="plataforma.id" 
                  :value="plataforma.url"
                >
                  {{ plataforma.nome }}
                </option>
              </select>
              <button 
                type="button" 
                class="btn-add-plataforma" 
                @click="showPlataformaModal = true"
              >
                <img src="/icons/adicao.svg" alt="Nova Plataforma" class="icon" />
              </button>
            </div>
          </div>

          <div class="form-group full-width">
            <RequiredLabel text="Objeto Resumido (máx. 700 caracteres)" :isRequired="false" />
            <div class="objeto-container">
              <input v-model="formData.objeto_resumido" type="string" maxlength="700" required
                placeholder="Breve descrição do objeto" />
              <small>{{ formData.objeto_resumido?.length || 0 }}/700</small>

              <div class="form-group">
                <label>Sistemas Incluídos</label>
                <div class="sistemas-grid">
                  <div v-for="sistema in sistemasAtivos" :key="sistema.id" class="sistema-chip"
                    :class="{ selected: sistemasSelecionados.includes(sistema.id) }" @click="toggleSistema(sistema.id)">
                    {{ sistema.nome }}
                    <span v-if="sistemasSelecionados.includes(sistema.id)" class="check-icon">✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="form-group full-width">
            <RequiredLabel text="Objeto Completo" :isRequired="true" />
            <textarea v-model="formData.objeto_completo" rows="4" required
              placeholder="Descrição completa do objeto conforme Art. 40"></textarea>
          </div>

          <!-- Campo de Representante -->
          <div class="form-group">
            <RequiredLabel text="Representante" :isRequired="true" />
            <div class="representante-container">
              <select v-model="formData.representante" required>
                <option value="">Selecione o representante...</option>
                <option 
                  v-for="rep in representantes" 
                  :key="rep.id" 
                  :value="rep.id"
                >
                  {{ rep.nome }}
                </option>
              </select>
              <button 
                type="button" 
                class="btn-add-representante" 
                @click="showRepresentanteModal = true"
              >
                <img src="/icons/adicao.svg" alt="Novo Representante" class="icon" />
              </button>
            </div>
          </div>

          <div class="form-group">
            <RequiredLabel text="Observações" :isRequired="false" />
            <input v-model="formData.campo_adicional1" type="text" placeholder="Obesevarções adicionais" />
          </div>

          <div class="form-group">
            <RequiredLabel text="Campo Adicional 2" :isRequired="false" />
            <input v-model="formData.campo_adicional2" type="text" placeholder="Campo opcional 2" />
          </div>

          <div class="form-group">
            <RequiredLabel text="Responsável" :isRequired="false" />
            <input type="text" :value="'(definir)'" disabled />
          </div>

          <div class="form-actions">
            <button type="button" class="btn-cancelar" @click="router.push('/funcionalidades')">
              Cancelar
            </button>
            <button type="submit" class="btn-salvar" :disabled="loading">
              {{ loading ? 'Salvando...' : 'Salvar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Modal para adicionar nova plataforma -->
  <div v-if="showPlataformaModal" class="modal-overlay">
    <div class="modal-content">
      <h3>Nova Plataforma</h3>
      <form @submit.prevent="handleAddPlataforma">
        <div class="form-group">
          <RequiredLabel text="Nome da Plataforma" :isRequired="true" />
          <input v-model="novaPlatforma.nome" required type="text">
        </div>
        <div class="form-group">
          <RequiredLabel text="URL da Plataforma" :isRequired="true" />
          <input v-model="novaPlatforma.url" required type="url">
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-cancelar" @click="showPlataformaModal = false">
            Cancelar
          </button>
          <button type="submit" class="btn-salvar">
            Salvar
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Modal para adicionar novo representante -->
  <div v-if="showRepresentanteModal" class="modal-overlay">
    <div class="modal-content">
      <h3>Novo Representante</h3>
      <form @submit.prevent="handleAddRepresentante" class="form-grid">
        <div class="form-group">
          <RequiredLabel text="Nome" :isRequired="true" />
          <input v-model="novoRepresentante.nome" type="text" required placeholder="Nome completo" />
        </div>
        <div class="form-group">
          <RequiredLabel text="Documento" :isRequired="false" />
          <input v-model="novoRepresentante.documento" type="text" placeholder="CPF/CNPJ" />
        </div>
        <div class="form-group">
          <RequiredLabel text="Email" :isRequired="false" />
          <input v-model="novoRepresentante.email" type="email" placeholder="email@exemplo.com" />
        </div>
        <div class="form-group">
          <RequiredLabel text="Telefone" :isRequired="false" />
          <input v-model="novoRepresentante.telefone" type="tel" placeholder="(00) 00000-0000" />
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-cancelar" @click="showRepresentanteModal = false">
            Cancelar
          </button>
          <button type="submit" class="btn-salvar">
            Salvar
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import TheSidebar from '@/components/TheSidebar.vue'
import RequiredLabel from '@/components/RequiredLabel.vue'
import debounce from 'lodash/debounce' // Importação correta do debounce

// Estado reativo para controle de carregamento e subscription
const loading = ref(false)
const realtimeSubscription = ref(null)

// Configuração do listener realtime
const setupRealtimeListener = () => {
  realtimeSubscription.value = supabase
    .channel('processos-changes')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'processos' 
      }, 
      () => {
        loadData()
      }
    )
    .subscribe()
}

// Função para carregar dados debounced
const loadData = debounce(async () => {
  try {
    loading.value = true
    
    // Carregamento paralelo dos dados necessários
    const [processosResponse, plataformasResponse, representantesResponse] = await Promise.all([
      supabase.from('processos').select('*'),
      supabase.from('plataformas').select('*'),
      supabase.from('representantes').select('*')
    ])

    if (processosResponse.error) throw processosResponse.error
    if (plataformasResponse.error) throw plataformasResponse.error
    if (representantesResponse.error) throw representantesResponse.error

    plataformas.value = plataformasResponse.data
    representantes.value = representantesResponse.data

  } catch (error) {
    console.error('Erro ao carregar dados:', error)
  } finally {
    loading.value = false
  }
}, 300)

// Função para validar formulário
const validateForm = () => {
  const errors = []
  
  if (!formData.value.numero) errors.push('Número do processo é obrigatório')
  if (!formData.value.orgao) errors.push('Órgão é obrigatório')
  if (!formData.value.data_pregao) errors.push('Data do pregão é obrigatória')
  if (!formData.value.hora_pregao) errors.push('Hora do pregão é obrigatória')
  if (!formData.value.modalidade) errors.push('Modalidade é obrigatória')
  
  return errors
}

// Modifique a função handleSubmit no EditaisView.vue
const handleSubmit = async () => {
  try {
    loading.value = true
    const processData = {
      numero_processo: `${formData.numero}/${formData.ano}`,
      orgao: formData.orgao,
      data_pregao: formData.data_pregao,
      hora_pregao: formData.hora_pregao,
      estado: formData.estado,
      modalidade: formData.modalidade,
      site_pregao: formData.site_pregao,
      objeto_resumido: formData.objeto_resumido,
      objeto_completo: formData.objeto_completo,
      representante: formData.representante,
      status: formData.status || '',
      responsavel_id: user.value.id,
      sistemasAtivos: formData.sistemasAtivos || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('processos')
      .insert(processData)

    if (error) throw error

    router.push('/editais')
  } catch (error) {
    console.error('Erro ao salvar processo:', error)
    alert('Erro ao salvar processo: ' + error.message)
  } finally {
    loading.value = false
  }
}
// Adicione esta função de carregamento de sistemas
const loadSistemas = async () => {
  try {
    const { data, error } = await supabase
      .from('sistemas')
      .select('*')
      .eq('status', 'ACTIVE')
      .order('nome')

    if (error) throw error
    sistemasAtivos.value = data
  } catch (error) {
    console.error('Erro ao carregar sistemas:', error)
  }
}

// Modifique o onMounted para carregar tudo de uma vez
onMounted(() => {
  Promise.all([
    loadData(),
    loadPlataformas(),
    loadRepresentantes(),
    loadSistemas()
  ]).catch(error => {
    console.error('Erro ao carregar dados iniciais:', error)
  })
  setupRealtimeListener()
  startAutoRefresh()
})

// Lifecycle hooks
onMounted(() => {
  loadData()
  setupRealtimeListener()
})

onUnmounted(() => {
  if (realtimeSubscription.value) {
    supabase.removeChannel(realtimeSubscription.value)
  }
})

const router = useRouter()
const isSidebarExpanded = ref(true)
const currentYear = new Date().getFullYear()
const plataformas = ref([])
const showPlataformaModal = ref(false)
const novaPlatforma = ref({ nome: '', url: '' })
const representantes = ref([])
const showRepresentanteModal = ref(false)
const novoRepresentante = ref({
  nome: '',
  documento: '',
  email: '',
  telefone: ''
})

const formData = ref({
  numero: '', // Alterado de numero_processo para numero
  ano: new Date().getFullYear(),
  orgao: '',
  data_pregao: '',
  hora_pregao: '',
  estado: '',
  modalidade: '',
  site_pregao: '', // Agora usado diretamente para todas as modalidades eletrônicas
  objeto_resumido: '',
  sistemasAtivos: [],
  objeto_completo: '',
  representante: '',
  status: '' // Certifique-se que está vazio aqui
})

const estados = [
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
]

const handleSidebarToggle = (expanded) => {
  isSidebarExpanded.value = expanded
}

const loadPlataformas = async () => {
  try {
    const { data, error } = await supabase
      .from('plataformas')
      .select('*')
      .order('nome')

    if (error) throw error
    plataformas.value = data || []
    console.log('Plataformas carregadas:', plataformas.value)
  } catch (error) {
    console.error('Erro ao carregar plataformas:', error)
  }
}

const loadRepresentantes = async () => {
  try {
    const { data, error } = await supabase
      .from('representantes')
      .select('*')
      .order('nome')

    if (error) throw error
    representantes.value = data || []
    console.log('Representantes carregados:', representantes.value)
  } catch (error) {
    console.error('Erro ao carregar representantes:', error)
  }
}

// Garantir que os dados sejam carregados quando o componente montar
onMounted(() => {
  loadPlataformas()
  loadRepresentantes()
})

const handleAddPlataforma = async () => {
  try {
    const { error } = await supabase
      .from('plataformas')
      .insert({
        nome: novaPlatforma.value.nome,
        url: novaPlatforma.value.url
      })

    if (error) throw error

    // Recarrega as plataformas
    await loadPlataformas()

    // Limpa e fecha o modal
    novaPlatforma.value = { nome: '', url: '' }
    showPlataformaModal.value = false

  } catch (error) {
    console.error('Erro ao adicionar plataforma:', error)
    alert('Erro ao adicionar plataforma')
  }
}

// Adiciona novo representante
const handleAddRepresentante = async () => {
  try {
    const { error } = await supabase
      .from('representantes')
      .insert(novoRepresentante.value)

    if (error) throw error

    await loadRepresentantes()
    showRepresentanteModal.value = false
    novoRepresentante.value = { nome: '', documento: '', email: '', telefone: '' }
  } catch (error) {
    console.error('Erro ao adicionar representante:', error)
    alert('Erro ao adicionar representante')
  }
}

// Carrega os representantes quando o componente montar
onMounted(() => {
  loadRepresentantes()
})

const handleOpenRepresentanteModal = () => {
  console.log('Abrindo modal...')
  showRepresentanteModal.value = true
  console.log('Estado do modal:', showRepresentanteModal.value)
}

// Adicione estas funções no <script setup>
const isWeekend = (date) => {
  const day = new Date(date).getDay()
  return day === 0 || day === 6 // 0 é domingo, 6 é sábado
}

// Definição dos feriados apenas com dia e mês
const holidays = [
  { day: 1, month: 1 },    // Ano Novo
  { day: 12, month: 2 },   // Carnaval
  { day: 13, month: 2 },   // Carnaval
  { day: 29, month: 3 },   // Sexta-feira Santa (aproximado, pois é móvel)
  { day: 21, month: 4 },   // Tiradentes
  { day: 1, month: 5 },    // Dia do Trabalho
  { day: 20, month: 6 },   // Corpus Christi (aproximado, pois é móvel)
  { day: 7, month: 9 },    // Independência
  { day: 12, month: 10 },  // Nossa Senhora
  { day: 2, month: 11 },   // Finados
  { day: 15, month: 11 },  // Proclamação da República
  { day: 25, month: 12 }   // Natal
]

// Modifique a função isHoliday
const isHoliday = (date) => {
  const d = new Date(date)
  const day = d.getDate()
  const month = d.getMonth() + 1 // getMonth() retorna 0-11

  return holidays.some(holiday =>
    holiday.day === day && holiday.month === month
  )
}

// Modifique a função isBusinessDay para garantir o formato correto da data
const isBusinessDay = (date) => {
  // Garante que estamos trabalhando com um objeto Date
  const dateObj = new Date(date)

  // Verifica se é final de semana
  if (isWeekend(dateObj)) {
    return false
  }

  // Verifica se é feriado
  const day = dateObj.getDate()
  const month = dateObj.getMonth() + 1

  return !holidays.some(holiday =>
    holiday.day === day && holiday.month === month
  )
}

// Função para encontrar o próximo dia útil
const getNextBusinessDay = (date) => {
  let nextDate = new Date(date)
  do {
    nextDate.setDate(nextDate.getDate() + 1)
  } while (!isBusinessDay(nextDate.toISOString().split('T')[0]))
  return nextDate.toISOString().split('T')[0]
}

// Adicione estas refs
const dateError = ref('')
const timeError = ref('')

// Modifique também a função validateDate
const validateDate = () => {
  if (!formData.value.data_pregao) return false

  const selectedDate = new Date(formData.value.data_pregao + 'T00:00:00') // Adiciona horário para evitar problemas de timezone
  const today = new Date()
  const minDate = new Date(today)
  minDate.setDate(today.getDate() + 1)

  const maxDate = new Date(today)
  maxDate.setMonth(today.getMonth() + 12)

  dateError.value = ''

  // 1. Primeira verificação: é dia útil?
  if (!isBusinessDay(selectedDate)) {
    const nextBusinessDay = getNextBusinessDay(selectedDate)
    dateError.value = `Esta data não é um dia útil (feriado ou fim de semana). Próximo dia útil disponível: ${new Date(nextBusinessDay).toLocaleDateString('pt-BR')}`
    return false
  }

  // 2. Verifica se a data é anterior ao dia seguinte
  if (selectedDate < minDate) {
    dateError.value = `A data deve ser posterior a ${minDate.toLocaleDateString('pt-BR')}`
    return false
  }

  // 3. Verifica se a data é posterior a 12 meses
  if (selectedDate > maxDate) {
    dateError.value = `A data não pode ser posterior a ${maxDate.toLocaleDateString('pt-BR')}`
    return false
  }

  return true
}

// Adicione a função de validação do horário
const validateTime = () => {
  if (!formData.value.hora_pregao) return false

  const [hours, minutes] = formData.value.hora_pregao.split(':').map(Number)
  const time = hours * 60 + minutes // Converte para minutos
  const minTime = 8 * 60  // 08:00
  const maxTime = 18 * 60 // 18:00

  if (time < minTime || time > maxTime) {
    timeError.value = 'O horário deve estar entre 08:00 e 18:00'
    return false
  }

  timeError.value = ''
  return true
}

const formatModalidade = (modalidade) => {
  const modalidades = {
    'pregao': 'Pregão',
    'concorrencia': 'Concorrência',
    'concurso': 'Concurso',
    'leilao': 'Leilão',
    'dialogo_competitivo': 'Diálogo Competitivo',
    'credenciamento': 'Credenciamento',
    'pre_qualificacao': 'Pré-Qualificação',
    'manifestacao_interesse': 'Procedimento de Manifestação de Interesse',
    'licitacao_internacional': 'Licitação Internacional',
    'outros': 'Outros',
    'pregao_eletronico': 'Pregão Eletrônico',
    'pregao_presencial': 'Pregão Presencial',
    'tomada_precos': 'Tomada de Preços',
    'chamamento_publico': 'Chamamento Público',
    'rdc': 'Regime Diferenciado de Contratações',
    'rdc_eletronico': 'Regime Diferenciado de Contratações Eletrônico',
    'srp': 'Sistema de Registro de Preços',
    'srp_eletronico': 'Sistema de Registro de Preços Eletrônico',
    'srp_internacional': 'Sistema de Registro de Preços Internacional',
  }

  return modalidades[modalidade] || modalidade
}

// Computed property para controlar a visibilidade do campo de plataforma
const showPlataformaField = computed(() => {
  return [
    'pregao_eletronico',
    'rdc_eletronico',
    'srp_eletronico',
    'srp_internacional'
  ].includes(formData.value.modalidade)
})

// Função para lidar com a mudança de modalidade
const handleModalidadeChange = () => {
  // Limpa o campo de plataforma se mudar para pregão presencial
  if (formData.value.modalidade === 'pregao_presencial') {
    formData.value.site_pregao = ''
  }
}

const sistemasAtivos = ref([])
const sistemasSelecionados = ref([])

// Função para carregar sistemas ativos
const loadSistemasAtivos = async () => {
  try {
    const { data, error } = await supabase
      .from('sistemas')
      .select('id, nome')
      .eq('status', 'ACTIVE')
      .order('nome');

    if (error) throw error;
    sistemasAtivos.value = data;
  } catch (error) {
    console.error('Erro ao carregar sistemas:', error);
  }
};

onMounted(() => {
  loadSistemasAtivos();
});

// Função para alternar seleção de sistema
const toggleSistema = (sistemaId) => {
  const index = sistemasSelecionados.value.indexOf(sistemaId)
  if (index === -1) {
    sistemasSelecionados.value.push(sistemaId)
  } else {
    sistemasSelecionados.value.splice(index, 1)
  }
}

// Carregue os sistemas quando o componente montar
onMounted(() => {
  loadSistemas()
})

onMounted(() => {
  Promise.all([
    loadSistemas(),
    loadPlataformas(),
    loadRepresentantes()
  ]).catch(error => {
    console.error('Erro ao carregar dados iniciais:', error)
  })
})

// Em EditaisView.vue
const refreshInterval = ref(null)

const startAutoRefresh = () => {
  refreshInterval.value = setInterval(() => {
    loadProcessos()
  }, 30000) // Atualiza a cada 30 segundos
}

const stopAutoRefresh = () => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
}

// Monitore visibilidade da página
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopAutoRefresh()
  } else {
    startAutoRefresh()
    loadProcessos() // Recarrega imediatamente ao voltar
  }
})

onMounted(() => {
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})

// Em EditaisView.vue
const processos = ref([])

const loadProcessos = debounce(async () => {
  try {
    loading.value = true
    const { data, error } = await supabase
      .from('processos')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    processos.value = data
  } catch (error) {
    console.error('Erro ao carregar processos:', error)
  } finally {
    loading.value = false
  }
}, 300)

// Cache para melhorar performance
const processosCache = new Map()

const getProcesso = async (id) => {
  if (processosCache.has(id)) {
    return processosCache.get(id)
  }
  
  const { data } = await supabase
    .from('processos')
    .select('*')
    .eq('id', id)
    .single()
    
  if (data) {
    processosCache.set(id, data)
  }
  return data
}
</script>

<style scoped>
/* Importação da fonte JetBrains Mono */
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');

/* Aplicação da fonte no layout */
.layout {
  font-family: 'JetBrains Mono', monospace;
  display: flex;
  min-height: 100vh;
}

/* Garantir que todos os elementos usem a fonte */
.main-content,
input,
select,
textarea,
button,
label,
.modal-content {
  font-family: 'JetBrains Mono', monospace;
}

.layout {
  display: flex;
  min-height: 100vh;
}

.main-content {
  /* margin-left: 300px; */
  padding: 2rem;
  transition: margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
  background: #f8f9fa;
}

.main-content.expanded {
  margin-left: 0px;
}

.header {
  margin-bottom: 2rem;
}

.header h1 {
  color: #193155;
  font-size: 1.8rem;
  font-weight: 600;
}

.form-container {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.8rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.full-width {
  grid-column: 1 / -1;
}

.processo-input {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

/* Estilo base para inputs */
input,
select,
textarea {
  padding: 0.9rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  transition: all 0.3s ease;
  background: #f8f9fa;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9rem;
  color: #495057;
}

/* Remove o estilo padrão de invalid */
input[type="date"]:invalid {
  border-color: #e9ecef;
}

/* Estilo para o estado de erro */
input.error {
  border-color: #dc3545;
  background-color: #fff8f8;
}

/* Estilo para o foco */
input:focus {
  outline: none;
  border-color: #193155;
  box-shadow: 0 0 0 3px rgba(25, 49, 85, 0.1);
  background: white;
}

/* Estilo para hover */
input:hover:not(.error) {
  border-color: #ced4da;
}

/* Mensagem de erro */
.error-message {
  color: #dc3545;
  font-size: 0.8rem;
  margin-top: 0.2rem;
}

input,
select,
textarea {
  padding: 0.9rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  transition: all 0.3s ease;
  background: #f8f9fa;
  font-family: 'JetBrains Mono', monospace;
  /* Garantindo a fonte aqui também */
  font-size: 0.9rem;
  /* Ajuste o tamanho se necessário */
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: #193155;
  box-shadow: 0 0 0 3px rgba(25, 49, 85, 0.1);
  background: white;
}

.form-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

.btn-cancelar,
.btn-salvar {
  padding: 0.9rem 2rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.btn-cancelar {
  background: #e9ecef;
  color: #495057;
}

.btn-salvar {
  background: #193155;
  color: white;
}

.btn-cancelar:hover,
.btn-salvar:hover {
  transform: translateY(-2px);
}

.btn-cancelar:hover {
  background: #dee2e6;
}

.btn-salvar:hover {
  background: #254677;
  box-shadow: 0 4px 12px rgba(25, 49, 85, 0.2);
}

small {
  color: #6c757d;
  font-size: 0.8rem;
}

textarea {
  resize: vertical;
  min-height: 120px;
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 70px;
    padding: 1rem;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-cancelar,
  .btn-salvar {
    width: 100%;
  }
}

/* Adicione estes estilos */
.plataforma-container {
  display: flex;
  gap: 1rem;
}

.plataforma-container select {
  flex: 1;
}

.btn-add-plataforma {
  padding: 0.9rem 1rem;
  background: #193155;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-add-plataforma:hover {
  background: #254677;
  transform: translateY(-2px);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  /* Maior que o overlay */
}

.representante-container {
  display: flex;
  gap: 1rem;
  align-items: center;
  /* Garante alinhamento vertical */
  width: 100%;
  /* Garante que ocupe toda a largura */
}

.representante-container select {
  flex: 1;
  min-width: 0;
  /* Evita overflow */
}

.btn-add-representante {
  padding: 0.9rem 1rem;
  background: #193155;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  /* Evita quebra do texto */
  min-width: fit-content;
  /* Garante espaço para o texto */
}

.btn-add-representante:hover {
  background: #254677;
  transform: translateY(-2px);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  /* Maior que o overlay */
}

.modal-content h3 {
  color: #193155;
  margin-bottom: 1.5rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

@media (max-width: 768px) {
  .representante-container {
    flex-direction: column;
    gap: 0.5rem;
  }

  .btn-add-representante {
    width: 100%;
  }
}

.error-message {
  color: #dc3545;
  font-size: 0.8rem;
  margin-top: 0.2rem;
}

input[type="date"] {
  color: #495057;
  border-color: #e9ecef !important;
  /* Força a cor padrão */
  background: #f8f9fa;
}

/* Aplica cor vermelha apenas quando houver erro validado */
input[type="date"].error {
  border-color: #dc3545 !important;
  background-color: #fff8f8;
}

/* Estilo hover */
input[type="date"]:hover:not(.error) {
  border-color: #ced4da !important;
}

/* Estilo focus */
input[type="date"]:focus:not(.error) {
  outline: none;
  border-color: #193155 !important;
  box-shadow: 0 0 0 3px rgba(25, 49, 85, 0.1);
  background: white;
}

.objeto-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sistemas-selection {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
}

.sistemas-selection h4 {
  color: #193155;
  margin-bottom: 1rem;
  font-size: 1rem;
}

.sistemas-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.sistema-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.sistema-chip:hover {
  border-color: #193155;
}

.sistema-chip.selected {
  background: #193155;
  color: white;
  border-color: #193155;
}

.check-icon {
  font-size: 0.8rem;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #193155;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>