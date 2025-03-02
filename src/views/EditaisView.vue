<template>
  <div class="layout">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <div v-if="showTimeoutMessage" class="timeout-message">
        Se o carregamento persistir, por favor recarregue a página
      </div>
    </div>
    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <!-- Loading overlay -->
      <div class="header">
        <h1>Novo Processo Licitatório</h1>
        <!-- Adicione após o header no template -->
          <button class="btn-import" @click="showImportModal = true">
            Importar Publicação
          </button>
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
                <option v-for="plataforma in plataformas" :key="plataforma.id" :value="plataforma.url">
                  {{ plataforma.nome }}
                </option>
              </select>
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

          <!-- Adicione após o campo de objeto_completo -->
          <div class="form-group full-width">
            <RequiredLabel text="Cálculo de Distância" :isRequired="false" />
            <div class="distancia-container">
              <div class="pontos-container">
                <!-- Ponto de Origem -->
                <div class="ponto-origem">
                  <label>Ponto de Origem (Referência)</label>
                  <div class="referencia-container">
                    <select v-model="filtroEstadoReferencia">
                      <option value="">Todos os Estados</option>
                      <option v-for="estado in estados" :key="estado.uf" :value="estado.uf">
                        {{ estado.nome }}
                      </option>
                    </select>
                    <select v-model="pontoReferencia">
                      <option value="">Selecione o ponto de referência...</option>
                      <option v-for="ponto in pontosFiltrados" :key="ponto.cidade" :value="ponto">
                        {{ ponto.cidade }}/{{ ponto.uf }}
                      </option>
                    </select>
                  </div>
                </div>

                <!-- Cidade do Órgão -->
                <div class="ponto-destino">
                  <label>Cidade do Órgão</label>
                  <div class="cidade-input">
                    <select v-model="estadoDestino" @change="carregarMunicipios">
                      <option value="">Estado...</option>
                      <option v-for="estado in estados" :key="estado.uf" :value="estado.uf">
                        {{ estado.nome }}
                      </option>
                    </select>
                    <select v-model="cidadeOrgao" :disabled="!estadoDestino || !municipiosCarregados">
                      <option value="">Cidade...</option>
                      <option v-for="municipio in municipios" :key="municipio.id" :value="municipio">
                        {{ municipio.nome }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Botões e Resultado -->
              <div class="distancia-actions">
                <button @click="calcularDistancia" class="btn-calcular"
                :disabled="calculandoDistancia || !pontoReferencia || !cidadeOrgao || !formData.estado">
                {{ calculandoDistancia ? 'Calculando...' : 'Calcular Distância' }}
              </button>

                <div v-if="distanciaCalculada" class="distancia-result">
                  <span class="distance-value">{{ distanciaCalculada }}</span>
                  <button @click="adicionarDistanciaLista" class="btn-add-distancia">
                    <span>Adicionar à Lista</span>
                    <span class="icon">+</span>
                  </button>
                </div>
              </div>

              <!-- Adicione após o div.distancia-actions -->
              <div v-if="distanciasSalvas.length > 0" class="distancias-lista">
                <h4>Distâncias Calculadas</h4>
                <div class="distancia-items">
                  <div v-for="(dist, index) in distanciasSalvas" :key="index" class="distancia-item">
                    <span class="distancia-valor">{{ dist.distancia_km }}km</span>
                    <span class="distancia-cidade">de {{ dist.cidade_destino }}/{{ dist.uf_destino }}</span>
                    <button @click="removerDaLista(index)" class="btn-remover">×</button>
                  </div>
                </div>
              </div>

              <!-- Lista de Distâncias Salvas -->
            </div>
          </div>

          <!-- Campo de Representante -->
          <div class="form-group">
            <RequiredLabel text="Representante" :isRequired="true" />
            <div class="representante-container">
              <select v-model="formData.representante" required>
                <option value="">Selecione o representante...</option>
                <option v-for="rep in representantes" :key="rep.id" :value="rep.id">
                  {{ rep.nome }}
                </option>
              </select>
            </div>
          </div>

          <!-- Adicione este campo após o campo de representante -->
          <div class="form-group">
            <RequiredLabel text="Valor Estimado" :isRequired="false" />
            <div class="valor-container">
              <span class="currency-symbol">R$</span>
              <input 
                v-model="formData.valor_estimado" 
                type="text" 
                placeholder="0,00"
                @input="formatarValorEstimado"
              />
            </div>
          </div>

          <!-- Adicionar esta seção após o campo de valor estimado, caso deseje visualizar a publicação -->
          <div v-if="formData.publicacao_original" class="form-group full-width">
            <RequiredLabel text="Publicação Original" :isRequired="false" />
            <div class="publicacao-container">
              <textarea v-model="formData.publicacao_original" rows="6" readonly class="publicacao-text"></textarea>
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
            <button v-if="formData.extraction_id" type="button" class="btn-correcoes" @click="salvarCorrecoes">
              Salvar Correções
            </button>
            <button type="submit" class="btn-salvar" :disabled="loading">
              {{ loading ? 'Salvando...' : 'Salvar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Adicione logo após o fechamento da div.layout -->
  <div class="toast-container">
    <div v-if="toast.show" :class="['toast', `toast-${toast.type}`]">
      {{ toast.message }}
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

  <!-- Adicione o modal de importação -->
  <div v-if="showImportModal" class="modal-overlay">
    <div class="modal-content import-modal">
      <h3>Importar Publicação</h3>
      <div class="form-group">
        <label>Cole aqui o texto da publicação:</label>
        <textarea v-model="publicacaoText" rows="10"
          placeholder="Cole aqui o texto completo da publicação..."></textarea>
      </div>
      <div class="modal-actions">
        <button class="btn-cancelar" @click="closeImportModal">
          Cancelar
        </button>
        <button class="btn-import" @click="processarPublicacao">
          Processar Publicação
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import TheSidebar from '@/components/TheSidebar.vue'
import RequiredLabel from '@/components/RequiredLabel.vue'
import debounce from 'lodash/debounce'
import { calcularDistanciaHaversine } from '@/utils/distance.js'
import { ibgeService } from '@/services/ibgeService'
import { coordenadasMunicipais } from '@/data/coordenadasMunicipios'
import { useVisibilityHandler } from '@/composables/useVisibilityHandler'
import { SupabaseManager } from '@/lib/supabaseManager'
import { calcularDistanciaRota } from '@/utils/googleMapsService';
import { useConnectionManager } from '@/composables/useConnectionManager'

const processamentosCache = {
  // Cache para publicações já processadas
  dados: new Map(),

  // Cache para coordenadas de cidades
  coordenadas: new Map(),

  // Cache para órgãos frequentes
  orgaos: new Map(),

  // Configuração de expiração (24 horas em milissegundos)
  TEMPO_EXPIRACAO: 24 * 60 * 60 * 1000,

  // Método para salvar no cache
  salvar(chave, dados, tipo = 'dados') {
    this[tipo].set(chave, {
      dados,
      timestamp: Date.now()
    })
  },

  // Método para recuperar do cache
  obter(chave, tipo = 'dados') {
    const item = this[tipo].get(chave)
    if (!item) return null

    // Verifica se o cache expirou
    if (Date.now() - item.timestamp > this.TEMPO_EXPIRACAO) {
      this[tipo].delete(chave)
      return null
    }

    return item.dados
  },

  // Método para gerar chave única para publicação
  gerarChave(texto) {
    return texto
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '')
      .substring(0, 100)
  },

  // Adicione esta função
  limparCache() {
    this.dados.clear();
    this.coordenadas.clear();
    this.orgaos.clear();
    console.log('Cache limpo com sucesso');
  }
}

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
    
    // Adicione loadProcessos() aqui se precisar
    await loadProcessos()
    
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

    // Validar formulário
    const errors = validateForm()
    if (errors.length > 0) {
      showToast(errors.join('\n'), 'error')
      return
    }

    // Validações cruzadas
    const errosCruzados = executarValidacoesCruzadas(formData.value)
    if (errosCruzados.length > 0) {
      showToast(errosCruzados.join('\n'), 'warning')
      // Permite continuar, mas mostra aviso
    }

    // Obter o usuário atual
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) throw userError
    if (!user) throw new Error('Usuário não autenticado')

    const processData = {
      numero_processo: `${formData.value.numero}/${formData.value.ano}`,
      ano: formData.value.ano,
      orgao: formData.value.orgao,
      data_pregao: formData.value.data_pregao,
      hora_pregao: formData.value.hora_pregao,
      estado: formData.value.estado,
      modalidade: formData.value.modalidade,
      site_pregao: formData.value.site_pregao,
      objeto_resumido: formData.value.objeto_resumido,
      objeto_completo: formData.value.objeto_completo,
      representante: formData.value.representante,
      status: formData.value.status || '',
      responsavel_id: user.id,
      sistemas_ativos: sistemasSelecionados.value,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      distancia_km: formData.value.distancia_km,
      ponto_referencia_cidade: formData.value.ponto_referencia_cidade,
      ponto_referencia_uf: formData.value.ponto_referencia_uf,
      valor_estimado: formData.value.valor_estimado,
      publicacao_original: formData.value.publicacao_original || null, // Adicionando o texto original
    }

    // Primeiro insere o processo
    const { data: processo, error: processoError } = await supabase
      .from('processos')
      .insert(processData)
      .select()
      .single()

    if (processoError) throw processoError

    // Depois de inserir o processo, insere as distâncias
    if (distanciasSalvas.value.length > 0) {
      const distanciasData = distanciasSalvas.value.map(dist => ({
        processo_id: processo.id, // ID do processo recém-criado
        ...dist
      }))

      const { error: distanciasError } = await supabase
        .from('processo_distancias')
        .insert(distanciasData)

      if (distanciasError) throw distanciasError
    }

    showToast('Processo cadastrado com sucesso!', 'success')
    // Aguarda um momento para o usuário ver a mensagem antes de redirecionar
    setTimeout(() => {
      router.push('/processos')
    }, 1500)

  } catch (error) {
    console.error('Erro ao salvar processo:', error)
    showToast(error.message || 'Erro ao cadastrar processo', 'error')
  } finally {
    loading.value = false
  }
}

// Adicione estas refs para o sistema de toast
const toast = ref({
  show: false,
  message: '',
  type: 'success'
})

// Função para mostrar toast
const showToast = (message, type = 'success') => {
  toast.value = {
    show: true,
    message,
    type
  }
  setTimeout(() => {
    toast.value.show = false
  }, 3000)
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
  ano: new Date().getFullYear(), // Inicializa com o ano atual
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
  status: '', // Certifique-se que está vazio aqui
  distancia_km: null,
  ponto_referencia_cidade: '',
  ponto_referencia_uf: '',
  valor_estimado: ''
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

const processos = ref([])
const showImportModal = ref(false)
const publicacaoText = ref('')
const camposNaoEncontrados = ref([])

// Função para fechar modal
const closeImportModal = () => {
  showImportModal.value = false
  publicacaoText.value = ''
  camposNaoEncontrados.value = []
}

// Primeiro, adicione estas refs para controlar o progresso
const progressoExtracao = ref({
  status: 'idle', // idle, processing, success, error
  etapa: '',
  porcentagem: 0,
  detalhes: []
})

// Adicione antes da função processarPublicacao
const patterns = {
  // Captura diferentes formatos de número/ano
  numeroProcesso: /(?:(?:PE|PP|processo)[\s.\/]*(\d+)[\s.\/]*(\d{4}))|(?:(\d+)[\s.\/]*(\d{4}))|(?:processo[\s.:]*(\d+)[\s.\/]*(\d{4}))/i,

  // Captura diversos formatos de data e hora
  dataHora: /(?:(?:data|prazo|abertura)[\s.:]*(\d{2}\/\d{2}\/\d{4})(?:[\s,]*(?:às|as|a|hora|hs|h)?[\s.:]*(\d{1,2}[:h]\d{2})?)|(?:(\d{2}\/\d{2}\/\d{4})\s*(?:às|as|a|hora|hs|h)?\s*(\d{1,2}[:h]\d{2})))/i,

  // Captura diferentes formatos de órgão
  orgao: /(?:(?:órgão|unid\.\s*licitante)[\s.:]+([^\n]+))|(?:FACULDADE\s+[A-ZÀ-Ú\s]+)|(?:FMJ)/i,

  // Captura modalidade
  modalidade: /(?:modalidade[\s.:]*)?(?:(?:pregão\s+eletrônico|PE|licitação\s+eletrônica))/i,

  // Captura objeto
  objeto: /(?:\*\s*([^*]+)\s*\*)|(?:objeto[\s.:]+([^\n]+))/i,

  // Atualize o padrão existente para valores
  valor: /(?:valor[\s.:]*estimado|valor[\s.:]*global|valor[\s.:]*total|valor[\s.:]*máximo)[\s.:]*(?:de)?[\s.:]*R\$[\s.]*([\d.,]+)|\bR\$[\s.]*([\d.,]+)/i
}

// Modifique a função processarPublicacao para armazenar o texto original
const processarPublicacao = async () => {
  try {
    loading.value = true
    const texto = publicacaoText.value

    // Armazena o texto original no formData
    formData.value.publicacao_original = texto

    // Inicia o progresso
    progressoExtracao.value = {
      status: 'processing',
      etapa: 'Iniciando processamento',
      porcentagem: 0,
      detalhes: []
    }

    // Verifica cache
    const chaveCache = processamentosCache.gerarChave(texto)
    const dadosCache = processamentosCache.obter(chaveCache)

    if (dadosCache) {
      progressoExtracao.value.etapa = 'Dados encontrados no cache'
      progressoExtracao.value.porcentagem = 100
      Object.assign(formData.value, dadosCache)
      showToast('Dados recuperados do cache com sucesso!', 'success')
      closeImportModal()
      return
    }

    const dadosExtraidos = {
      numero: '',
      ano: '',
      orgao: '',
      data_pregao: '',
      hora_pregao: '',
      modalidade: '',
      objeto_resumido: '',
      objeto_completo: ''
    }

    // Extração do número do processo (10%)
    progressoExtracao.value.etapa = 'Extraindo número do processo'
    progressoExtracao.value.porcentagem = 10
    const matchNumero = texto.match(patterns.numeroProcesso)
    if (matchNumero) {
      dadosExtraidos.numero = matchNumero[1] || matchNumero[3] || matchNumero[5]
      dadosExtraidos.ano = matchNumero[2] || matchNumero[4] || matchNumero[6]
      progressoExtracao.value.detalhes.push('✓ Número do processo extraído')
    }

    // Extração de data e hora (30%)
    progressoExtracao.value.etapa = 'Extraindo data e hora'
    progressoExtracao.value.porcentagem = 30
    const matchDataHora = texto.match(patterns.dataHora)
    if (matchDataHora) {
      const data = matchDataHora[1] || matchDataHora[3]
      const hora = matchDataHora[2] || matchDataHora[4]

      if (data) {
        const [dia, mes, ano] = data.split('/')
        dadosExtraidos.data_pregao = `${ano}-${mes}-${dia}`
      }

      if (hora) {
        dadosExtraidos.hora_pregao = hora.replace(/[h]s?/i, ':').padEnd(5, '0')
      }
      progressoExtracao.value.detalhes.push('✓ Data e hora extraídas')
    }

    // Extração do órgão (50%)
    progressoExtracao.value.etapa = 'Extraindo órgão'
    progressoExtracao.value.porcentagem = 50
    const matchOrgao = texto.match(patterns.orgao)
    if (matchOrgao) {
      // ... código existente ...
      progressoExtracao.value.detalhes.push('✓ Órgão extraído')
    }

    // Extração da modalidade (70%)
    progressoExtracao.value.etapa = 'Extraindo modalidade'
    progressoExtracao.value.porcentagem = 70
    const matchModalidade = texto.match(patterns.modalidade)
    if (matchModalidade) {
      // ... código existente ...
      progressoExtracao.value.detalhes.push('✓ Modalidade extraída')
    }

    // Extração do objeto (90%)
    progressoExtracao.value.etapa = 'Extraindo objeto'
    progressoExtracao.value.porcentagem = 90
    const matchObjeto = texto.match(patterns.objeto)
    if (matchObjeto) {
      // ... código existente ...
      progressoExtracao.value.detalhes.push('✓ Objeto extraído')
    }

    // Extração do valor estimado (80%)
    progressoExtracao.value.etapa = 'Extraindo valor estimado'
    progressoExtracao.value.porcentagem = 80
    const matchValor = texto.match(patterns.valor)
    if (matchValor) {
      let valorExtraido = matchValor[1].replace(/\./g, '').replace(',', '.')
      // Formata para o padrão brasileiro
      dadosExtraidos.valor_estimado = parseFloat(valorExtraido)
        .toLocaleString('pt-BR', { minimumFractionDigits: 2 })
      progressoExtracao.value.detalhes.push('✓ Valor estimado extraído')
    }

    // Finalização (100%)
    progressoExtracao.value.etapa = 'Finalizando processamento'
    progressoExtracao.value.porcentagem = 100
    progressoExtracao.value.status = 'success'

    // Salva no cache e atualiza formulário
    processamentosCache.salvar(chaveCache, dadosExtraidos)
    Object.assign(formData.value, dadosExtraidos)

    showToast('Processamento concluído com sucesso!', 'success')
    setTimeout(() => closeImportModal(), 1500)

  } catch (error) {
    progressoExtracao.value.status = 'error'
    console.error('Erro ao processar publicação:', error)
    showToast('Erro ao processar publicação', 'error')
  } finally {
    loading.value = false
  }
}

// Função auxiliar para mapear modalidades
const mapearModalidade = (modalidadeTexto) => {
  const mapa = {
    'pregão eletrônico': 'pregao_eletronico',
    'pregão presencial': 'pregao_presencial',
    'tomada de preços': 'tomada_precos',
    'concorrência': 'concorrencia',
    'leilão': 'leilao'
  }

  const modalidadeLower = modalidadeTexto.toLowerCase()
  return mapa[modalidadeLower] || ''
}

// Adicione estes refs
const pontoReferencia = ref(null)
const cidadeOrgao = ref('')
const distanciaCalculada = ref(null)

// Array com pontos de referência por estado
const pontosReferencia = [
  { uf: 'MG', cidade: 'Governador Valadares', lat: -18.8513, lng: -41.9555 },
  { uf: 'MG', cidade: 'Belo Horizonte', lat: -19.9167, lng: -43.9345 },
  { uf: 'MG', cidade: 'Uberlândia', lat: -18.9113, lng: -48.2622 },
  { uf: 'MG', cidade: 'Juiz de Fora', lat: -21.7642, lng: -43.3496 },
  { uf: 'SP', cidade: 'São Paulo', lat: -23.5505, lng: -46.6333 },
  { uf: 'RJ', cidade: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729 },
  { uf: 'ES', cidade: 'Vitória', lat: -20.2976, lng: -40.2958 },
  { uf: 'BA', cidade: 'Salvador', lat: -12.9718, lng: -38.5011 },
  { uf: 'PR', cidade: 'Curitiba', lat: -25.4284, lng: -49.2733 },
  { uf: 'GO', cidade: 'Goiânia', lat: -16.6869, lng: -49.2648 },
  { uf: 'RS', cidade: 'Porto Alegre', lat: -30.0346, lng: -51.2177 },
]

// Função para calcular distância usando Google Maps Distance Matrix API
// Modifique a função calcularDistancia para usar cache de coordenadas

// Função para salvar a distância no formData
const salvarDistancia = () => {
  if (!pontoReferencia.value || !distanciaCalculada.value) {
    showToast('Selecione um ponto de referência e calcule a distância primeiro', 'error')
    return
  }

  formData.value.distancia_km = parseFloat(distanciaCalculada.value.replace(' km', ''))
  formData.value.ponto_referencia_cidade = pontoReferencia.value.cidade
  formData.value.ponto_referencia_uf = pontoReferencia.value.uf

  showToast('Distância salva com sucesso!', 'success')
}

const validarCidade = () => {
  return cidadeOrgao.value.length >= 3;
};

// Adicione estes refs
const distanciaManual = ref(false)
const distanciaManualValue = ref(null)

// Função para alternar modo manual
const toggleModoManual = () => {
  distanciaManual.value = !distanciaManual.value;
  if (!distanciaManual.value) {
    calcularDistancia();
  }
}

// Função para salvar distância manual
const salvarDistanciaManual = () => {
  if (!distanciaManualValue.value) {
    showToast('Digite um valor de distância', 'error')
    return
  }

  formData.value.distancia_km = parseFloat(distanciaManualValue.value)
  formData.value.ponto_referencia_cidade = pontoReferencia.value.cidade
  formData.value.ponto_referencia_uf = pontoReferencia.value.uf

  showToast('Distância manual salva com sucesso!', 'success')
}

// Função para calcular a similaridade entre strings
const calcularSimilaridade = (str1, str2) => {
  const s1 = str1.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const s2 = str2.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  let longer = s1.length >= s2.length ? s1 : s2
  let shorter = s1.length >= s2.length ? s2 : s1

  const longerLength = longer.length
  if (longerLength === 0) return 1.0

  return (longerLength - editDistance(longer, shorter)) / longerLength
}

// Função para calcular a distância de edição
const editDistance = (s1, s2) => {
  const custos = []
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) custos[j] = j
      else {
        if (j > 0) {
          let newValue = custos[j - 1]
          if (s1.charAt(i - 1) !== s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue), custos[j]) + 1
          custos[j - 1] = lastValue
          lastValue = newValue
        }
      }
    }
    if (i > 0) custos[s2.length] = lastValue
  }
  return custos[s2.length]
}

const modalidades = {
  patterns: /(?:modalidade[\s:]*)?(?:(pregão\s+eletrônico|pregão\s+presencial|dispensa\s+(?:de\s+)?licitação|tomada\s+de\s+preços|concorrência|chamada\s+pública|leilão))|(?:PE\/|PP\/|DL\/|TP\/|CP\/)/i,

  mapeamento: {
    'pregão eletrônico': 'pregao_eletronico',
    'pregão presencial': 'pregao_presencial',
    'dispensa de licitação': 'dispensa',
    'tomada de preços': 'tomada_precos',
    'concorrência': 'concorrencia',
    'leilão': 'leilao',
    'chamada pública': 'chamada_publica'
  }
}

const dataHora = {
  patterns: {
    completo: /(?:(?:dia|data|abertura|realizar-se)[\s.:]*(\d{2}\/\d{2}\/\d{4})(?:[\s,]*(?:às|as|a|hora|hs|h)?[\s.:]*(\d{1,2}[:h]\d{2})?)|(?:(\d{2}\/\d{2}\/\d{4})\s*(?:às|as|a|hora|hs|h)?\s*(\d{1,2}[:h]\d{2})))/i,

    dataSimples: /(\d{2}\/\d{2}\/\d{4})/i,

    horaSimples: /(\d{1,2}[:h]\d{2})(?:\s*hs?)?/i
  }
}

const orgao = {
  patterns: {
    principal: /(?:PREFEITURA\s+MUNICIPAL\s+DE\s+[A-ZÀ-Ú\s]+(?:\s*[-–]\s*[A-ZÀ-Ú]{2})?)|(?:MUNICÍPIO\s+DE\s+[A-ZÀ-Ú\s]+)|(?:CÂMARA\s+MUNICIPAL\s+DE\s+[A-ZÀ-Ú\s]+)|(?:CONSÓRCIO\s+[A-ZÀ-Ú\s]+)|(?:FUNDO\s+MUNICIPAL\s+DE\s+[A-ZÀ-Ú\s]+)|(?:SERVIÇO\s+[A-ZÀ-Ú\s]+)/i,

    cnpj: /(?:cnpj[\s.:]*(?:n[º°.])?[\s.:]*)([\d./-]+)/i,

    endereco: /(?:endereço|situada?[\s:]*(?:na|no|à)?[\s:]*([^,\n.]+)(?:[,\s]+(?:n[º°.][\s:]*\d+)?)?(?:[,\s]+(?:centro|bairro)[,\s]+)?([A-ZÀ-Ú][A-Za-zÀ-ú\s]+)(?:\/|\s*-\s*)([A-Z]{2}))/i
  }
}

const objeto = {
  patterns: {
    principal: /(?:objeto|finalidade)[\s.:]*([^.]*?(?=\b(?:local|data|valor|prazo|edital)\b|$))|(?:OBJETO[\s.:]*([^.]*?(?=\b(?:local|data|valor|prazo|edital)\b|$)))/i,

    resumido: /(?:objeto\s+resumido|resumo)[\s.:]*([^.]*?(?=\b(?:local|data|valor|prazo|edital)\b|$))/i
  }
}

const plataformasPatterns = {
  patterns: {
    principal: /(?:(?:portal|site|endereço\s+eletrônico|plataforma)[\s:]*(?:da\s+)?([^\s,]+\.(?:gov|com|org|br)[^\s,]*)|(?:www\.[^\s,]+))/i,

    dominios: /((?:www\.)?[a-z0-9-]+\.(?:gov|com|org|br)\.?(?:[a-z]{2,})?)/i
  }
}

// Removed duplicate declaration of processarPublicacao

// Adicione esta função ao script
const validacoesCruzadas = {
  // Validação cruzada entre data e modalidade
  validarDataModalidade: (data, modalidade) => {
    const diasUteis = {
      'pregao_eletronico': 8,
      'pregao_presencial': 8,
      'tomada_precos': 15,
      'concorrencia': 30,
      'leilao': 15
    }

    if (!data || !modalidade) return true

    const dataLimite = new Date()
    dataLimite.setDate(dataLimite.getDate() + (diasUteis[modalidade] || 8))
    const dataPregao = new Date(data)

    return dataPregao >= dataLimite
  },

  // Validação cruzada entre modalidade e valor estimado
  validarModalidadeValor: (modalidade, valor) => {
    const limitesModalidade = {
      'pregao_eletronico': { min: 0, max: Infinity },
      'tomada_precos': { min: 0, max: 3300000 }, // Valores exemplo
      'concorrencia': { min: 3300000, max: Infinity }
    }

    if (!modalidade || !valor) return true
    const limite = limitesModalidade[modalidade]
    return limite ? (valor >= limite.min && valor <= limite.max) : true
  },

  // Validação cruzada entre estado e plataforma
  validarEstadoPlataforma: (estado, plataforma) => {
    const plataformasRegionais = {
      'MG': ['compras.mg.gov.br', 'licitacoes-e.com.br'],
      'SP': ['bec.sp.gov.br', 'licitacoes-e.com.br'],
      // Adicione mais estados e suas plataformas
    }

    if (!estado || !plataforma) return true
    const plataformasPermitidas = plataformasRegionais[estado] || []
    return plataformasPermitidas.some(p => plataforma.includes(p))
  }
}

// Adicione esta função para executar todas as validações cruzadas
const executarValidacoesCruzadas = (formData) => {
  const erros = []

  // Valida data x modalidade
  if (!validacoesCruzadas.validarDataModalidade(formData.data_pregao, formData.modalidade)) {
    erros.push(`O prazo mínimo para ${formatModalidade(formData.modalidade)} não foi respeitado`)
  }

  // Valida modalidade x valor (se houver)
  if (formData.valor_estimado &&
    !validacoesCruzadas.validarModalidadeValor(formData.modalidade, formData.valor_estimado)) {
    erros.push('O valor não é compatível com a modalidade selecionada')
  }

  // Valida estado x plataforma
  if (formData.site_pregao &&
    !validacoesCruzadas.validarEstadoPlataforma(formData.estado, formData.site_pregao)) {
    erros.push('A plataforma selecionada não é compatível com o estado')
  }

  return erros
}

// Adicione watchers para validações em tempo real
watch(() => formData.value.modalidade, (newModalidade) => {
  if (formData.value.data_pregao) {
    const valid = validacoesCruzadas.validarDataModalidade(
      formData.value.data_pregao,
      newModalidade
    )
    if (!valid) {
      showToast('Atenção: Prazo mínimo para esta modalidade não atendido', 'warning')
    }
  }
})

watch(() => formData.value.site_pregao, (newPlataforma) => {
  if (formData.value.estado && newPlataforma) {
    const valid = validacoesCruzadas.validarEstadoPlataforma(
      formData.value.estado,
      newPlataforma
    )
    if (!valid) {
      showToast('Atenção: Plataforma não comum para este estado', 'warning')
    }
  }
})

// Adicione estes refs
const municipios = ref([])
const municipiosCarregados = ref(false)

// Função para carregar municípios quando o estado for selecionado
const carregarMunicipios = async () => {
  if (!estadoDestino.value) return

  try {
    console.log('Carregando municípios para:', estadoDestino.value)
    municipiosCarregados.value = false
    municipios.value = await ibgeService.getMunicipios(estadoDestino.value)
    console.log('Municípios carregados:', municipios.value)
    municipiosCarregados.value = true
  } catch (error) {
    console.error('Erro ao carregar municípios:', error)
    showToast('Erro ao carregar municípios', 'error')
  }
}

// Novo ref para controlar o filtro de estado dos pontos de referência
const filtroEstadoReferencia = ref('')

// Computed property para filtrar os pontos de referência
const pontosFiltrados = computed(() => {
  if (!filtroEstadoReferencia.value) {
    // Se não houver filtro, mostra todos os pontos
    return pontosReferencia
  }

  // Filtra apenas os pontos do estado selecionado
  return pontosReferencia.filter(ponto => ponto.uf === filtroEstadoReferencia.value)
})

// Watch para atualizar automaticamente o filtro quando o estado principal for selecionado
watch(() => formData.value.estado, (novoEstado) => {
  filtroEstadoReferencia.value = novoEstado

  // Carrega os municípios automaticamente quando o estado for selecionado
  if (novoEstado) {
    carregarMunicipios()
  } else {
    municipios.value = []
    municipiosCarregados.value = false
  }
})

// Adicione estes refs
const distanciasSalvas = ref([])

// Função para carregar distâncias existentes
const carregarDistancias = async () => {
  try {
    const { data, error } = await supabase
      .from('processo_distancias')
      .select('*')
      .eq('processo_id', formData.value.id)
      .order('created_at', { ascending: true })

    if (error) throw error
    distanciasSalvas.value = data
  } catch (error) {
    console.error('Erro ao carregar distâncias:', error)
    showToast('Erro ao carregar distâncias', 'error')
  }
}

// Função para adicionar nova distância
const adicionarDistancia = async () => {
  try {
    const novaDistancia = {
      processo_id: formData.value.id,
      distancia_km: distanciaManual.value ?
        parseFloat(distanciaManualValue.value) :
        parseFloat(distanciaCalculada.value),
      ponto_referencia_cidade: pontoReferencia.value.cidade,
      ponto_referencia_uf: pontoReferencia.value.uf
    }

    const { error } = await supabase
      .from('processo_distancias')
      .insert(novaDistancia)

    if (error) throw error

    await carregarDistancias()
    showToast('Distância adicionada com sucesso!', 'success')
  } catch (error) {
    console.error('Erro ao adicionar distância:', error)
    showToast('Erro ao adicionar distância', 'error')
  }
}

// Função para remover distância
const removerDistancia = async (id) => {
  try {
    const { error } = await supabase
      .from('processo_distancias')
      .delete()
      .eq('id', id)

    if (error) throw error

    await carregarDistancias()
    showToast('Distância removida com sucesso!', 'success')
  } catch (error) {
    console.error('Erro ao remover distância:', error)
    showToast('Erro ao remover distância', 'error')
  }
}

// Carregue as distâncias ao montar o componente
onMounted(() => {
  if (formData.value.id) {
    carregarDistancias()
  }
})

// Adicione este ref
const estadoDestino = ref('')

// Adicione um watch para sincronizar inicialmente o estadoDestino com o estado principal
watch(() => formData.value.estado, (novoEstado) => {
  if (novoEstado && !estadoDestino.value) {
    estadoDestino.value = novoEstado
    carregarMunicipios()
  }
}, { immediate: true })

// Adicione esta função
const adicionarDistanciaLista = () => {
  if (!distanciaCalculada.value || !pontoReferencia.value || !cidadeOrgao.value) {
    showToast('Selecione os pontos e calcule a distância primeiro', 'warning')
    return
  }

  const novaDistancia = {
    distancia_km: parseFloat(distanciaCalculada.value),
    ponto_referencia_cidade: pontoReferencia.value.cidade,
    ponto_referencia_uf: pontoReferencia.value.uf,
    cidade_destino: cidadeOrgao.value.nome,
    uf_destino: estadoDestino.value
  }

  distanciasSalvas.value.push(novaDistancia)
  distanciaCalculada.value = null
}

const removerDaLista = (index) => {
  distanciasSalvas.value.splice(index, 1)
  showToast('Distância removida da lista', 'success')
}

// Modifique o onMounted e onUnmounted
onMounted(() => {
  // Use apenas o composable para gerenciar reconexões
  startAutoRefresh()
  
  Promise.all([
    loadSistemas(),
    loadPlataformas(),
    loadRepresentantes()
  ]).catch(error => {
    console.error('Erro ao carregar dados iniciais:', error)
  })
})

onUnmounted(() => {
  stopAutoRefresh()
})

// No início do arquivo, junto com outros refs
const calculandoDistancia = ref(false)

// Modifique a função calcularDistancia
const calcularDistancia = async () => {
  if (!pontoReferencia.value || !cidadeOrgao.value || !estadoDestino.value) {
    showToast('Selecione o ponto de origem e destino', 'warning')
    return
  }

  try {
    calculandoDistancia.value = true
    showToast('Calculando rota real...', 'info');
    
    const municipio = cidadeOrgao.value;
    const estado = estadoDestino.value;

    const coordenadasDestino = coordenadasMunicipais[estado]?.[municipio.nome];

    if (!coordenadasDestino) {
      throw new Error(`Coordenadas não encontradas para ${municipio.nome}/${estado}`);
    }

    const distancia = await calcularDistanciaRota(
      pontoReferencia.value,
      coordenadasDestino
    );

    distanciaCalculada.value = `${distancia} km`;
    showToast('Distância calculada com sucesso!', 'success');

  } catch (error) {
    console.error('Erro ao calcular distância:', error);
    showToast('Erro ao calcular distância. Usando aproximação.', 'warning');
    // Tenta fallback com Haversine
    const distancia = calcularDistanciaHaversine(
      pontoReferencia.value.lat,
      pontoReferencia.value.lng,
      coordenadasDestino.latitude,
      coordenadasDestino.longitude
    );
    distanciaCalculada.value = `${distancia} km (aproximado)`;
  } finally {
    calculandoDistancia.value = false;
  }
}

// Adicione no início do componente
onMounted(() => {
  console.log('Coordenadas disponíveis:', Object.keys(coordenadasMunicipais))
})

// Refs para refresh e cache
const refreshInterval = ref(null)
const processosCache = new Map()

const startAutoRefresh = () => {
  stopAutoRefresh() // Limpa timer anterior
  refreshInterval.value = setInterval(() => {
    loadProcessos().catch(console.error)
  }, 30000)
}

const stopAutoRefresh = () => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
}

// Função de carregamento com cache
const loadProcessos = async () => {
  if (isLoading.value) return

  try {
    isLoading.value = true
    const { data, error } = await supabase
      .from('processos')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    processos.value = data

    // Atualiza cache
    data.forEach(processo => {
      processosCache.set(processo.id, processo)
    })
  } catch (error) {
    console.error('Erro ao carregar processos:', error)
  } finally {
    isLoading.value = false
  }
}

// Função para obter processo do cache
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

// Ajuste das refs de loading

const lastLoadTime = ref(Date.now())
const LOADING_COOLDOWN = 120000 // 2 minutos em milliseconds

// Modificar o pageVisibilityHandler
const pageVisibilityHandler = async () => {
  if (!document.hidden) {
    loadProcessos().catch(console.error)
  }
}

// Adicione o cache de dados
const dataCache = {
  sistemas: null,
  plataformas: null,
  representantes: null,
  lastUpdate: null,
  CACHE_DURATION: 120000 // 2 minutos
}

// Modificar funções de carregamento
const loadSistemas = async () => {
  // Verifica cache
  if (dataCache.sistemas &&
    Date.now() - dataCache.lastUpdate < dataCache.CACHE_DURATION) {
    return dataCache.sistemas
  }

  try {
    const { data, error } = await supabase
      .from('sistemas')
      .select('*')
      .eq('status', 'ACTIVE')
      .order('nome')

    if (error) throw error

    // Atualiza cache
    dataCache.sistemas = data
    dataCache.lastUpdate = Date.now()

    sistemasAtivos.value = data
    return data
  } catch (error) {
    console.error('Erro ao carregar sistemas:', error)
    return null
  }
}

// Adicionar ao início do arquivo
const setupSupabaseErrorHandling = () => {
  supabase.channel('system-error')
    .on('system', { event: '*' }, (payload) => {
      if (payload.type === 'connection_error') {
        isLoading.value = false
        console.error('Erro de conexão Supabase:', payload)
      }
    })
    .subscribe()
}

// Adicionar ao onMounted
onMounted(() => {
  setupSupabaseErrorHandling()
  startVisibilityMonitoring()
  startAutoRefresh()
  handleLoading(() => Promise.all([
    loadSistemas(),
    loadPlataformas(),
    loadRepresentantes()
  ]))
})

// Adicione estas refs
const showTimeoutMessage = ref(false)
const TIMEOUT_MESSAGE_DELAY = 10000 // 10 segundos

// Proper reactive refs
const isLoading = ref(false)
const loadingTimeout = ref(null)

// Use visibility handler
const { isVisible } = useVisibilityHandler()

// Improved loading handler with timeout
const handleLoading = async (loadingFunction) => {
  try {
    isLoading.value = true

    // Set loading timeout
    loadingTimeout.value = setTimeout(() => {
      isLoading.value = false
    }, 10000) // 10s max loading time

    await loadingFunction()
  } catch (error) {
    console.error('Loading error:', error)
  } finally {
    if (loadingTimeout.value) {
      clearTimeout(loadingTimeout.value)
    }
    isLoading.value = false
  }
}

// Watch for visibility changes
watch(isVisible, async (newValue) => {
  if (newValue) {
    await handleLoading(() => loadData())
  }
})

onUnmounted(() => {
  // Clear any pending timeouts
  if (loadingTimeout.value) {
    clearTimeout(loadingTimeout.value)
  }
})

onMounted(() => {
  setupRealtimeSubscription()
})

onUnmounted(() => {
  const channel = SupabaseManager.subscriptions.get('processos-changes')
  if (channel) {
    supabase.removeChannel(channel)
    SupabaseManager.removeSubscription('processos-changes')
  }
})

const setupRealtimeSubscription = () => {
  try {
    const channel = supabase
      .channel('processos-changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'processos'
        },
        (payload) => {
          console.log('Mudança detectada:', payload)
          loadProcessos()
        }
      )
      .subscribe()

    // Registra a subscrição
    SupabaseManager.addSubscription('processos-changes', channel)
  } catch (error) {
    console.error('Erro ao configurar realtime:', error)
  }
}

// Função para monitorar visibilidade
const setupVisibilityHandling = () => {
  document.addEventListener('visibilitychange', async () => {
    if (!document.hidden) {
      // Reconecta quando a aba ficar visível novamente
      await SupabaseManager.handleReconnect()
      await loadProcessos() // Recarrega dados
    }
  })
}

// Modificar o onMounted
onMounted(() => {
  setupRealtimeSubscription()
  setupVisibilityHandling()
})

// Modificar o onUnmounted
onUnmounted(() => {
  const channel = SupabaseManager.subscriptions.get('processos-changes')
  if (channel) {
    supabase.removeChannel(channel)
    SupabaseManager.removeSubscription('processos-changes')
  }
  document.removeEventListener('visibilitychange', setupVisibilityHandling)
})

const loadPageData = async () => {
  if (isLoading.value) return
  
  try {
    isLoading.value = true
    await Promise.all([
      loadProcessos(),
      loadPlataformas(),
      loadRepresentantes(),
      loadSistemas()
    ])
  } catch (error) {
    console.error('Erro ao carregar dados:', error)
  } finally {
    isLoading.value = false
  }
}

// Use o composable no primeiro onMounted
onMounted(() => {
  useConnectionManager(loadPageData)
  
  const channel = supabase.channel('editais-updates')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'processos' }, 
      () => loadPageData()
    )
    .subscribe()
  
  SupabaseManager.addSubscription('editais-updates', channel)
})

// Limpar cache quando o componente é montado
onMounted(() => {
  processamentosCache.limparCache();
  // Resto do código existente...
})

// Adicione esta função ao componente
const formatarValorEstimado = () => {
  // Remove qualquer caracter que não seja número
  let valor = formData.value.valor_estimado.replace(/\D/g, '')
  
  // Converte para valor decimal (divide por 100)
  valor = (parseInt(valor) / 100).toFixed(2)
  
  // Formata para o padrão brasileiro
  formData.value.valor_estimado = valor.replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}
</script>

<style scoped>
/* Importação da fonte JetBrains Mono */
/* @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap'); */

/* Aplicação da fonte no layout */
.layout {
  font-family: 'Roboto', sans-serif;
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
  font-family: 'Roboto', sans-serif;
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
  display: flex;
  justify-content: space-between;
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
  gap: 2rem; /* Aumente o espaço aqui */
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-bottom: 0.5rem; /* Adicione essa margem */
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
  font-family: 'Roboto', sans-serif;
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
  font-family: 'Roboto', sans-serif;
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
  inset: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  flex-direction: column;
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
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

/* Adicione ao final do <style> */
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
}

.toast {
  padding: 1rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  animation: slideIn 0.3s ease-out;
  min-width: 300px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toast-success {
  background: #28a745;
  color: white;
}

.toast-error {
  background: #dc3545;
  color: white;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast::before {
  content: '✓';
  font-weight: bold;
}

.toast-error::before {
  content: '✕';
}

/* Adicione ao final do <style> */
.header-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
}

.btn-import {
  margin-bottom: 1rem;
}

.btn-import {
  padding: 0.9rem 1.5rem;
  background: #193155;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-import:hover {
  background: #254677;
  transform: translateY(-2px);
}

.import-modal {
  max-width: 800px;
  width: 90%;
}

.import-modal textarea {
  width: 93%;
  min-height: 300px;
  font-family: monospace;
  padding: 1rem;
  line-height: 1.5;
}

.campos-nao-encontrados {
  margin-top: 1rem;
  padding: 1rem;
  background: #fff3cd;
  border: 1px solid #ffeeba;
  border-radius: 8px;
  color: #856404;
}

.btn-import {
  background: #193155;
  color: white;
  padding: 0.9rem 2rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-import:hover {
  background: #254677;
  transform: translateY(-2px);
}

.import-modal {
  max-width: 600px;
}

.distancia-container {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.pontos-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.cidade-input {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.cidade-input input {
  flex: 1;
}

.distancia-result {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.distancia-automatica,
.distancia-manual {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.manual-input {
  display: flex;
  gap: 1rem;
  align-items: center;
  width: 100%;
}

.manual-input input {
  width: 150px;
}

.toggle-manual {
  margin-top: 0.5rem;
}

.toggle-manual a {
  color: #193155;
  text-decoration: none;
  font-size: 0.9rem;
}

.toggle-manual a:hover {
  text-decoration: underline;
}

.distance-value {
  font-size: 1.2rem;
  font-weight: 500;
  color: #193155;
  padding: 0.5rem 1rem;
  background: #f8f9fa;
  border-radius: 6px;
}

/* Adicione ao final do <style> */
.calcular-button {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

.btn-calcular {
  background: #193155;
  color: white;
  padding: 0.9rem 2rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 200px;
}

.btn-calcular:hover:not(:disabled) {
  background: #254677;
  transform: translateY(-2px);
}

.btn-calcular:disabled {
  background: #e9ecef;
  cursor: not-allowed;
}

.btn-correcoes {
  padding: 0.9rem 2rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-correcoes:hover {
  background: #218838;
  transform: translateY(-2px);
}

.progress-container {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.progress-bar {
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.progress-fill {
  height: 100%;
  background: #193155;
  transition: width 0.3s ease;
}

.progress-fill.error {
  background: #dc3545;
}

.progress-fill.success {
  background: #28a745;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.progress-stage {
  color: #495057;
  font-weight: 500;
}

.progress-percentage {
  color: #193155;
  font-weight: 600;
}

.progress-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.progress-detail-item {
  font-size: 0.85rem;
  color: #6c757d;
  padding: 0.25rem 0;
}

.warning-text {
  color: #856404;
  background-color: #fff3cd;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  margin-top: 0.5rem;
}

.referencia-container {
  display: flex;
  gap: 0.5rem;
}

.referencia-container select {
  flex: 1;
}

.referencia-container select:first-child {
  flex: 0.4;
  /* Estado ocupa menos espaço */
}

.distancias-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.distancia-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 6px;
}

.distancia-valor {
  font-weight: 500;
  color: #193155;
}

.distancia-referencia {
  color: #6c757d;
  font-size: 0.9rem;
}

.btn-remove {
  margin-left: auto;
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.btn-remove:hover {
  background: #ffebeb;
}

.nova-distancia {
  border-top: 1px solid #e9ecef;
  padding-top: 1rem;
}

/* Ajuste o CSS existente no EditaisView.vue */
.distancia-container {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.pontos-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

/* Adicione os estilos responsivos */
@media (max-width: 1228px) {
  .pontos-container {
    grid-template-columns: 1fr;
  }

  .referencia-container {
    flex-direction: column;
  }

  .referencia-container select {
    width: 100%;
  }
}

.distancia-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 4px;
  gap: 1rem;
}

.btn-add-distancia {
  padding: 0.75rem 1rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-add-distancia:hover {
  background: #218838;
  transform: translateY(-1px);
}

.distancias-lista {
  margin-top: 2rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.distancias-lista h4 {
  color: #193155;
  margin-bottom: 1rem;
  font-size: 1rem;
}

.distancia-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.distancia-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.distancia-valor {
  font-weight: 500;
  color: #193155;
}

.distancia-cidade {
  color: #6c757d;
}

.btn-remover {
  margin-left: auto;
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.btn-remover:hover {
  background: #ffebeb;
}

.distancias-lista {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.distancia-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.distancia-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.distancia-valor {
  font-weight: 500;
  color: #193155;
  margin-right: 0.5rem;
}

.distancia-texto {
  color: #6c757d;
}

.btn-remover {
  margin-left: auto;
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.btn-remover:hover {
  background: #ffebeb;
}

.distancia-error {
  color: #dc3545;
  background: #fff8f8;
  padding: 0.75rem;
  border-radius: 6px;
  margin-top: 0.5rem;
  font-size: 0.9rem;
}

.btn-calcular:disabled {
  background: #e9ecef;
  cursor: not-allowed;
  transform: none;
}

.timeout-message {
  margin-top: 1rem;
  color: #ff0000;
  font-size: 2rem;
  flex-wrap: wrap;
}

/* Estilo para o campo de valor */
.valor-container {
  display: flex;
  align-items: center;
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
}

.valor-container input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 0.9rem 0.5rem;
}

.valor-container input:focus {
  box-shadow: none;
  outline: none;
}

.currency-symbol {
  padding-left: 0.9rem;
  color: #495057;
  font-weight: 500;
}

/* Adicione ao seu estilo CSS */
.publicacao-container {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid #e9ecef;
}

.publicacao-text {
  width: 100%;
  background: #f8f9fa;
  border: none;
  font-family: monospace;
  cursor: default;
}

.publicacao-text:focus {
  outline: none;
  box-shadow: none;
}
</style>