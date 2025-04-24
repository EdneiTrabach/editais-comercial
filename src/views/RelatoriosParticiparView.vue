<template>
  <div class="relatorios-participar-container">
    <TheSidebar @toggle="handleSidebarToggle" />

    <div class="main-content" :class="{ 'sidebar-expanded': isSidebarExpanded }">
      <div class="content-wrapper">
        <div class="header-section">
          <h1>Relatórios de Processos com Participação</h1>
          <div class="header-actions">
            <button class="btn btn-primary" @click="sincronizarTodosProcessos">
              <i class="fas fa-sync"></i> Sincronizar Processos
            </button>
            <button class="btn btn-success" @click="exportarExcel">
              <i class="fas fa-file-excel"></i> Exportar Excel
            </button>
          </div>
        </div>

        <!-- Seleção de Ano -->
        <AnoSelection :anos="anosDisponiveis" :processos="processos" :selectedAno="anoSelecionado"
          @select-ano="selecionarAno" />

        <!-- Filtros -->
        <div class="filter-section">
          <div class="filter-group">
            <label>Status:</label>
            <select v-model="filtros.status" class="filter-select">
              <option value="">Todos</option>
              <option value="vamos_participar">Vamos Participar</option>
              <option value="ganhamos">Ganhamos</option>
              <option value="perdemos">Perdemos</option>
            </select>
          </div>

          <div class="filter-group">
            <label>Responsável:</label>
            <input type="text" v-model="filtros.responsavel" placeholder="Filtrar por responsável" class="filter-input">
          </div>

          <button class="btn btn-outline-primary" @click="limparFiltros">
            Limpar Filtros
          </button>
        </div>

        <!-- Tabela de Processos -->
        <div class="table-container">
          <div v-if="loading" class="loading-indicator">
            <i class="fas fa-spinner fa-spin"></i> Carregando dados...
          </div>

          <div v-else-if="processosFiltrados.length === 0" class="no-data">
            <i class="fas fa-info-circle"></i>
            Nenhum processo encontrado com os filtros selecionados.
          </div>

          <table v-else class="table table-striped">
            <thead>
              <tr>
                <th>Número do Processo</th>
                <th>Órgão</th>
                <th>Data Pregão</th>
                <th>Status</th>
                <th>Valor Estimado</th>
                <th>Responsável</th>
                <th>Sistemas</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="processo in processosFiltrados" :key="processo.id" :class="{
                'row-ganhamos': processo.status === 'ganhamos',
                'row-perdemos': processo.status === 'perdemos'
              }">
                <td>{{ processo.numero_processo }}</td>
                <td>{{ processo.orgao }}</td>
                <td>{{ formatarData(processo.data_pregao) }}</td>
                <td>
                  <span class="status-badge" :class="`status-${processo.status?.replaceAll('_', '-')}`">
                    {{ formatarStatus(processo.status) }}
                  </span>
                </td>
                <td>{{ formatarMoeda(processo.valor_estimado) }}</td>
                <td>{{ getResponsavelNome(processo.responsavel_id) }}</td>
                <td>{{ getSistemasNomes(processo.sistemas_ativos) }}</td>
                <td>
                  <div class="btn-group">
                    <button class="btn btn-sm btn-info" @click="verDetalhes(processo)">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-primary" @click="irParaProcesso(processo)">
                      <i class="fas fa-edit"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Modal de Detalhes -->
        <div v-if="modalDetalhes.show" class="modal-overlay" @click.self="fecharModal">
          <div class="modal-content">
            <div class="modal-header">
              <h3>Detalhes do Processo</h3>
              <button class="btn-close" @click="fecharModal">&times;</button>
            </div>
            <div class="modal-body">
              <div v-if="modalDetalhes.processo">
                <h4>{{ modalDetalhes.processo.numero_processo }}</h4>
                <div class="detalhes-grid">
                  <div class="detalhe-item">
                    <strong>Órgão:</strong> {{ modalDetalhes.processo.orgao }}
                  </div>
                  <div class="detalhe-item">
                    <strong>Data Pregão:</strong> {{ formatarData(modalDetalhes.processo.data_pregao) }}
                  </div>
                  <div class="detalhe-item">
                    <strong>Valor Estimado:</strong> {{ formatarMoeda(modalDetalhes.processo.valor_estimado) }}
                  </div>
                  <div class="detalhe-item">
                    <strong>Status:</strong> {{ formatarStatus(modalDetalhes.processo.status) }}
                  </div>
                  <div class="detalhe-item full-width">
                    <strong>Objeto:</strong> {{ modalDetalhes.processo.objeto_resumido }}
                  </div>
                  <div class="detalhe-item full-width">
                    <strong>Sistemas:</strong> {{ getSistemasNomes(modalDetalhes.processo.sistemas_ativos) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RelatoriosParticiparView'
}
</script>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/lib/supabase';
import TheSidebar from '@/components/TheSidebar.vue';
// Corrigindo o caminho de importação do AnoSelection
import AnoSelection from '@/components/lances/AnoSelection.vue';
import { writeFileXLSX, utils } from 'xlsx';

const router = useRouter();
const isSidebarExpanded = ref(true);
const processos = ref([]);
const loading = ref(false);
const anoSelecionado = ref(new Date().getFullYear());
const anosDisponiveis = ref([]);
const responsaveis = ref([]);
const sistemas = ref([]);

// Filtros
const filtros = ref({
  status: 'vamos_participar',
  responsavel: ''
});

// Modal de detalhes
const modalDetalhes = ref({
  show: false,
  processo: null
});

// Carrega os processos com status "vamos_participar" (ou outros status relevantes)
const carregarProcessos = async () => {
  try {
    loading.value = true;
    
    // Primeira tentativa: buscar todos os dados necessários com um relacionamento específico
    const { data, error } = await supabase
      .from('processos')
      .select(`
        *,
        responsaveis:responsaveis_processos!processos_responsavel_id_fkey(id, nome)
      `)
      .or('status.eq.vamos_participar,status.eq.ganhamos,status.eq.perdemos')
      .order('data_pregao', { ascending: false });
    
    if (error) {
      console.error('Erro na consulta principal:', error);
      
      // Tentativa alternativa: buscar sem relacionamentos
      const { data: dataSimples, error: errorSimples } = await supabase
        .from('processos')
        .select('*')
        .or('status.eq.vamos_participar,status.eq.ganhamos,status.eq.perdemos')
        .order('data_pregao', { ascending: false });
      
      if (errorSimples) {
        console.error('Erro na consulta alternativa:', errorSimples);
        throw errorSimples;
      }
      
      processos.value = dataSimples || [];
    } else {
      processos.value = data || [];
    }
    
    // Extrair anos disponíveis
    const anos = [...new Set(processos.value
      .filter(p => p.data_pregao)
      .map(p => new Date(p.data_pregao).getFullYear()))];
    
    anosDisponiveis.value = anos.sort((a, b) => b - a);
    
    // Se não tem o ano atual nos dados, usar o ano mais recente
    if (anosDisponiveis.value.length > 0 && !anosDisponiveis.value.includes(anoSelecionado.value)) {
      anoSelecionado.value = anosDisponiveis.value[0];
    }
    
  } catch (error) {
    console.error('Erro ao carregar processos:', error.message || 'Erro desconhecido');
    alert(`Erro ao carregar processos: ${error.message || 'Verifique o console para mais detalhes'}`);
  } finally {
    loading.value = false;
  }
};

// Carrega os responsáveis
const carregarResponsaveis = async () => {
  try {
    const { data, error } = await supabase
      .from('responsaveis_processos')
      .select('id, nome');

    if (error) throw error;
    responsaveis.value = data || [];
  } catch (error) {
    console.error('Erro ao carregar responsáveis:', error);
  }
};

// Carrega os sistemas
const carregarSistemas = async () => {
  try {
    const { data, error } = await supabase
      .from('sistemas')
      .select('id, nome');

    if (error) throw error;
    sistemas.value = data || [];
  } catch (error) {
    console.error('Erro ao carregar sistemas:', error);
  }
};

// Criar uma ref para o intervalo
const intervalRef = ref(null);

// Função para iniciar o monitoramento
const iniciarMonitoramentoStatus = () => {
  // Limpar qualquer intervalo anterior se existir
  if (intervalRef.value) {
    clearInterval(intervalRef.value);
  }
  
  // Configurar um novo intervalo
  intervalRef.value = setInterval(async () => {
    await carregarProcessos();
  }, 30000); // 30 segundos
};

// Usar onUnmounted fora de qualquer função assíncrona
onUnmounted(() => {
  if (intervalRef.value) {
    clearInterval(intervalRef.value);
    intervalRef.value = null;
  }
});

// Dentro do onMounted, apenas chamar a função sem usar onUnmounted
onMounted(async () => {
  await Promise.all([
    carregarProcessos(),
    carregarResponsaveis(),
    carregarSistemas()
  ]);
  
  iniciarMonitoramentoStatus();
});

// Processos filtrados por ano e filtros adicionais
const processosFiltrados = computed(() => {
  if (!processos.value) return [];

  return processos.value.filter(processo => {
    // Filtrar por ano
    if (processo.data_pregao) {
      const ano = new Date(processo.data_pregao).getFullYear();
      if (ano !== anoSelecionado.value) return false;
    }

    // Filtrar por status
    if (filtros.value.status && processo.status !== filtros.value.status) {
      return false;
    }

    // Filtrar por responsável
    if (filtros.value.responsavel && filtros.value.responsavel.trim() !== '') {
      const responsavelNome = getResponsavelNome(processo.responsavel_id).toLowerCase();
      if (!responsavelNome.includes(filtros.value.responsavel.toLowerCase())) {
        return false;
      }
    }

    return true;
  });
});

// Funções auxiliares
const formatarData = (dataString) => {
  if (!dataString) return '-';
  const data = new Date(dataString);
  return data.toLocaleDateString('pt-BR');
};

const formatarStatus = (status) => {
  if (!status) return '-';

  const statusMap = {
    'vamos_participar': 'Vamos Participar',
    'ganhamos': 'Ganhamos',
    'perdemos': 'Perdemos',
    'em_analise': 'Em Análise',
    'suspenso': 'Suspenso',
    'adiado': 'Adiado'
  };

  return statusMap[status] || status.replace(/_/g, ' ');
};

const formatarMoeda = (valor) => {
  if (!valor) return 'R$ 0,00';

  const valorNumerico = typeof valor === 'string'
    ? parseFloat(valor.replace(/[^0-9,.-]/g, '').replace(',', '.'))
    : parseFloat(valor);

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valorNumerico);
};

// Substitua a função getResponsavelNome:

const getResponsavelNome = (responsavelId) => {
  if (!responsavelId) return '-';
  
  // Procurar na lista de responsáveis carregados
  const resp = responsaveis.value.find(r => r.id === responsavelId);
  return resp ? resp.nome : '-';
};

// Substitua a função getSistemasNomes:

const getSistemasNomes = (sistemasIds) => {
  if (!sistemasIds || !sistemasIds.length) return '-';
  
  const nomes = sistemasIds.map(id => {
    const sistema = sistemas.value.find(s => s.id === id);
    return sistema ? sistema.nome : 'Sistema Desconhecido';
  });
  
  return nomes.join(', ');
};

// Funções de ação
const handleSidebarToggle = (expanded) => {
  isSidebarExpanded.value = expanded;
};

const selecionarAno = (ano) => {
  anoSelecionado.value = ano;
};

const limparFiltros = () => {
  filtros.value.status = 'vamos_participar';
  filtros.value.responsavel = '';
};

const sincronizarTodosProcessos = async () => {
  try {
    loading.value = true;

    // Atualizar dados da tabela
    await carregarProcessos();

    alert('Processos sincronizados com sucesso!');
  } catch (error) {
    console.error('Erro ao sincronizar processos:', error);
    alert('Erro ao sincronizar processos');
  } finally {
    loading.value = false;
  }
};

const exportarExcel = () => {
  // Formatar dados para exportação
  const dataToExport = processosFiltrados.value.map(processo => ({
    'Número do Processo': processo.numero_processo || '-',
    'Órgão': processo.orgao || '-',
    'Data Pregão': formatarData(processo.data_pregao),
    'Status': formatarStatus(processo.status),
    'Valor Estimado': formatarMoeda(processo.valor_estimado),
    'Responsável': getResponsavelNome(processo.responsavel_id),
    'Sistemas': getSistemasNomes(processo.sistemas_ativos)
  }));

  // Gerar o arquivo Excel
  const ws = utils.json_to_sheet(dataToExport);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Processos com Participação');
  writeFileXLSX(wb, `relatorio_participacao_${anoSelecionado.value}.xlsx`);
};

const verDetalhes = (processo) => {
  modalDetalhes.value = {
    show: true,
    processo: processo
  };
};

const fecharModal = () => {
  modalDetalhes.value.show = false;
};

const irParaProcesso = (processo) => {
  router.push(`/processos/${processo.id}`);
};
</script>

<style>
.relatorios-participar-container {
  display: flex;
  overflow: hidden;
}

.main-content {
  flex-grow: 1;
  margin-left: 80px;
  padding: 20px;
  transition: margin-left 0.3s;
  overflow-y: auto;
}

.main-content.sidebar-expanded {
  margin-left: 240px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.filter-section {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  min-width: 200px;
}

.filter-group label {
  margin-bottom: 5px;
  font-weight: 500;
}

.filter-select,
.filter-input {
  padding: 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
}

.table-container {
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #e9ecef;
}

th {
  background-color: #f8f9fa;
  font-weight: 600;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-vamos-participar {
  background-color: #e3f2fd;
  color: #0d47a1;
}

.status-ganhamos {
  background-color: #e8f5e9;
  color: #1b5e20;
}

.status-perdemos {
  background-color: #ffebee;
  color: #b71c1c;
}

.row-ganhamos {
  background-color: #f0fff0;
}

.row-perdemos {
  background-color: #fff0f0;
}

/* Modal de Detalhes */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 80%;
  max-width: 800px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #e9ecef;
}

.modal-body {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
}

.detalhes-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-top: 15px;
}

.detalhe-item {
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.full-width {
  grid-column: span 2;
}

/* Estilos adicionais */
.loading-indicator {
  text-align: center;
  padding: 30px;
  font-size: 18px;
  color: #666;
}

.no-data {
  text-align: center;
  padding: 30px;
  background-color: #f8f9fa;
  border-radius: 6px;
  color: #666;
}

.status-badge {
  text-transform: capitalize;
}
</style>