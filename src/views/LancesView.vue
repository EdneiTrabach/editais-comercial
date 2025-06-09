<!-- src/views/LancesView.vue -->
<template>
  <div class="layout">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />

    <div class="main-content" :class="{ expanded: !isSidebarExpanded }">
      <div class="header-section">
        <h1>Planilha de Lances</h1>
        <div class="header-actions">
          <!-- Ações principais -->
          <div class="acoes-principais" v-if="step === 3">
            <button
              @click="salvarPlanilha"
              class="btn-salvar"
              :disabled="!alteracoesPendentes"
            >
              <i class="fas fa-save"></i>
              Salvar Planilha
            </button>

            <button @click="abrirReadequacao" class="btn-readequar">
              <i class="fas fa-calculator"></i>
              Readequar Proposta
            </button>

            <div class="dropdown-exportar">
              <button class="btn-exportar">
                <i class="fas fa-file-export"></i>
                Exportar
              </button>
              <div class="dropdown-content">
                <button @click="exportarExcel">
                  <i class="fas fa-file-excel"></i> Excel
                </button>
                <button @click="exportarPDF"><i class="fas fa-file-pdf"></i> PDF</button>
                <button @click="abrirDashboard">
                  <i class="fas fa-chart-bar"></i> Dashboard
                </button>
              </div>
            </div>

            <!-- Botão voltar -->
            <button v-if="step > 0" @click="voltarEtapa" class="btn-voltar">
              <i class="fas fa-arrow-left"></i>
              Voltar
            </button>
          </div>

          <!-- Botões de navegação -->
          <div class="navigation-actions">
            <button
              v-if="step < 3"
              @click="avancarEtapa"
              class="btn-avancar"
              :disabled="!podeAvancar"
            >
              Avançar
              <i class="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Conteúdo principal -->
      <div class="content-section">
        <!-- Seção de filtros de processos - apenas na etapa de seleção de processo -->
        <div class="processo-header-section" v-if="step === 1">
          <div class="processo-header-top">
            <h2>Selecione o Processo</h2>
            <div class="header-actions">
              <div class="visualizacao-toggle">
                <button
                  :class="['btn-toggle', { active: modoVisualizacao === 'grid' }]"
                  @click="alterarModoVisualizacao('grid')"
                >
                  <i class="fas fa-th"></i>
                </button>
                <button
                  :class="['btn-toggle', { active: modoVisualizacao === 'lista' }]"
                  @click="alterarModoVisualizacao('lista')"
                >
                  <i class="fas fa-list"></i>
                </button>
              </div>
              <button class="btn-novo-processo" @click="criarNovoProcesso">
                <i class="fas fa-plus"></i> Criar Novo Processo
              </button>
            </div>
          </div>

          <div class="filtros-container" :class="{ expanded: filtrosVisiveis }">
            <div class="filtros-header">
              <h3>Filtrar Processos</h3>
              <button
                class="btn-toggle-filtros"
                :class="{ active: filtrosVisiveis }"
                @click="toggleFiltros"
              >
                {{ filtrosVisiveis ? "Ocultar Filtros" : "Exibir Filtros" }}
                <i
                  class="fas"
                  :class="filtrosVisiveis ? 'fa-chevron-up' : 'fa-chevron-down'"
                ></i>
              </button>
            </div>

            <div class="filtros-content" v-show="filtrosVisiveis">
              <div class="filtros-grid">
                <div class="filtro-item">
                  <label for="orgao">Órgão</label>
                  <input
                    type="text"
                    id="orgao"
                    v-model="filtros.orgao"
                    placeholder="Nome do órgão"
                  />
                </div>

                <div class="filtro-item">
                  <label for="data">Data</label>
                  <input type="date" id="data" v-model="filtros.data" />
                </div>

                <div class="filtro-item">
                  <label for="numero">Número do Processo</label>
                  <input
                    type="text"
                    id="numero"
                    v-model="filtros.numeroProcesso"
                    placeholder="Ex: 001/2024"
                  />
                </div>

                <div class="filtro-item">
                  <label for="codigo-gpi">Código GPI</label>
                  <input
                    type="text"
                    id="codigo-gpi"
                    v-model="filtros.codigoGpi"
                    placeholder="Código GPI"
                  />
                </div>

                <div class="filtro-item">
                  <label for="estado">Estado</label>
                  <select id="estado" v-model="filtros.estado">
                    <option value="">Todos os estados</option>
                    <option value="AC">Acre</option>
                    <option value="AL">Alagoas</option>
                    <option value="AP">Amapá</option>
                    <option value="AM">Amazonas</option>
                    <option value="BA">Bahia</option>
                    <option value="CE">Ceará</option>
                    <option value="DF">Distrito Federal</option>
                    <option value="ES">Espírito Santo</option>
                    <option value="GO">Goiás</option>
                    <option value="MA">Maranhão</option>
                    <option value="MT">Mato Grosso</option>
                    <option value="MS">Mato Grosso do Sul</option>
                    <option value="MG">Minas Gerais</option>
                    <option value="PA">Pará</option>
                    <option value="PB">Paraíba</option>
                    <option value="PR">Paraná</option>
                    <option value="PE">Pernambuco</option>
                    <option value="PI">Piauí</option>
                    <option value="RJ">Rio de Janeiro</option>
                    <option value="RN">Rio Grande do Norte</option>
                    <option value="RS">Rio Grande do Sul</option>
                    <option value="RO">Rondônia</option>
                    <option value="RR">Roraima</option>
                    <option value="SC">Santa Catarina</option>
                    <option value="SP">São Paulo</option>
                    <option value="SE">Sergipe</option>
                    <option value="TO">Tocantins</option>
                  </select>
                </div>

                <div class="filtro-item">
                  <label for="sistema">Sistema</label>
                  <select id="sistema" v-model="filtros.sistema">
                    <option value="">Todos os sistemas</option>
                    <option
                      v-for="sistema in sistemas"
                      :key="sistema.id"
                      :value="sistema.id"
                    >
                      {{ sistema.nome }}
                    </option>
                  </select>
                </div>

                <div class="filtro-item">
                  <label for="status">Status</label>
                  <select id="status" v-model="filtros.status">
                    <option value="">Todos os status</option>
                    <option value="em_analise">Em Análise</option>
                    <option value="ganhamos">Ganhamos</option>
                    <option value="perdemos">Perdemos</option>
                    <option value="cancelado">Cancelado</option>
                    <option value="aguardando">Aguardando</option>
                  </select>
                </div>

                <div class="filtro-item">
                  <label for="responsavel">Responsável</label>
                  <input
                    type="text"
                    id="responsavel"
                    v-model="filtros.responsavel"
                    placeholder="Nome do responsável"
                  />
                </div>

                <div class="filtro-item filtro-acoes">
                  <button class="btn-limpar" @click="limparFiltros">
                    <i class="fas fa-eraser"></i> Limpar
                  </button>
                  <button class="btn-aplicar" @click="aplicarFiltros">
                    <i class="fas fa-search"></i> Filtrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Componente de seleção de ano -->
        <AnoSelection
          v-if="step === 0"
          :anos="anosDisponiveis"
          :processos="processos"
          :selectedAno="anoSelecionado"
          @select-ano="selecionarAno"
        />

        <!-- Componentes para cada etapa -->
        <ProcessoSelection
          v-if="step === 1"
          :processos="processos"
          :selectedProcesso="selectedProcesso"
          @select-processo="selectProcesso"
        />

        <SistemasSelection
          v-if="step === 2"
          :sistemas="sistemas"
          :itensDisponiveis="itensDisponiveis"
          v-model:itensSelecionados="itensSelecionados"
        />

        <PlanilhaValores
          v-if="step === 3"
          :itensPlanilha="itensPlanilha"
          :totalGeral="totalGeral"
          :valorEstimado="processoAtual?.valor_estimado"
          @calcular-total="calcularTotal"
          @adicionar-item="adicionarItem"
          @remover-item="removerItem"
        />

        <PlanilhaValoresReadequada
          v-if="step === 3"
          :itens-planilha="itensPlanilha"
          :total-geral="totalGeral"
          :valor-estimado="processoAtual?.valor_estimado"
          @adicionar-item="handleAdicionarItem"
          @exportar-pdf="exportarPDF"
          @exportar-excel="exportarExcel"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, computed, ref } from "vue";
import { supabase } from "@/lib/supabase";
import TheSidebar from "@/components/TheSidebar.vue";
import ProcessoSelection from "@/components/lances/ProcessoSelection.vue";
import SistemasSelection from "@/components/lances/SistemasSelection.vue";
import PlanilhaValores from "@/components/lances/PlanilhaValores.vue";
import AnoSelection from "@/components/lances/AnoSelection.vue";
import { useConnectionManager } from "@/composables/useConnectionManager";
import { SupabaseManager } from "@/lib/supabaseManager";
import { useLances } from "@/composables/useLances";
import { useRouter } from "vue-router"; // Adicione este import

// Adicionar estado para controle de alterações
const alteracoesPendentes = ref(false);

const {
  step,
  isSidebarExpanded,
  processos, // Agora recebemos processos diretamente
  sistemas,
  selectedProcesso,
  itensSelecionados,
  itensPlanilha,
  itensDisponiveis,
  totalGeral,
  podeAvancar,
  handleSidebarToggle,
  selectProcesso,
  calcularTotal,
  adicionarItem,
  removerItem,
  exportarPDF,
  exportarExcel,
  voltarEtapa,
  avancarEtapa,
  loadProcessos,
  carregarNomesSistemas,
  anoSelecionado,
  anosDisponiveis,
  selecionarAno,
} = useLances();

const router = useRouter();

// Computed property para obter o processo atual selecionado
const processoAtual = computed(() => {
  if (!selectedProcesso.value) return null;
  return processos.value.find((p) => p.id === selectedProcesso.value);
});

// Adicione a função abrirReadequacao
const abrirReadequacao = () => {
  try {
    router.push({
      name: "PlanilhaReadequada",
      query: {
        itens: encodeURIComponent(JSON.stringify(itensPlanilha.value)),
        totalGeral: totalGeral.value,
        valorEstimado: processoAtual.value?.valor_estimado,
      },
    });
  } catch (error) {
    console.error("Erro ao abrir readequação:", error);
  }
};

// Função para lidar com adição de item na readequação
const handleAdicionarItem = () => {
  // Recuperar estado da readequação
  const estadoSalvo = localStorage.getItem("estadoReadequacao");

  // Abrir modal de seleção de itens
  const modalConfig = {
    title: "Adicionar Item",
    callback: (novoItem) => {
      // Recuperar estado anterior
      if (estadoSalvo) {
        const estado = JSON.parse(estadoSalvo);

        // Adicionar novo item com valores já readequados
        const percentual = estado.percentual;
        const fator = 1 + parseFloat(percentual) / 100;

        const itemReadequado = {
          ...novoItem,
          valorUnitarioOriginal: novoItem.valorUnitario,
          valorUnitario: Number((novoItem.valorUnitario * fator).toFixed(2)),
          total: Number(
            (novoItem.valorUnitario * fator * novoItem.quantidade).toFixed(2)
          ),
        };

        // Atualizar lista de itens
        itensReadequados.value.push(itemReadequado);

        // Recalcular totais
        recalcularTotal();
      }

      // Limpar estado salvo
      localStorage.removeItem("estadoReadequacao");
    },
  };

  // Abrir modal de seleção de itens
  showItemSelectionModal.value = true;
  itemSelectionConfig.value = modalConfig;
};

// Estados para controle dos filtros
const filtrosVisiveis = ref(false);
const modoVisualizacao = ref("grid");
const filtros = ref({
  orgao: "",
  data: "",
  numeroProcesso: "",
  codigoGpi: "",
  sistema: "",
  estado: "",
  status: "",
  responsavel: "",
});

// Métodos para os filtros
const toggleFiltros = () => {
  filtrosVisiveis.value = !filtrosVisiveis.value;
};

const alterarModoVisualizacao = (modo) => {
  modoVisualizacao.value = modo;
  // Se você tiver um componente ProcessoSelection que aceita uma prop de modo,
  // você pode propagar isso para ele
};

const limparFiltros = () => {
  filtros.value = {
    orgao: "",
    data: "",
    numeroProcesso: "",
    codigoGpi: "",
    sistema: "",
    estado: "",
    status: "",
    responsavel: "",
  };
  // Recarregar processos sem filtros
  loadProcessos();
};

const aplicarFiltros = async () => {
  // Implementar lógica de filtragem
  try {
    // Iniciar query base
    let query = supabase.from("processos").select("*");

    // Adicionar filtros
    if (filtros.value.orgao) {
      query = query.ilike("orgao", `%${filtros.value.orgao}%`);
    }

    if (filtros.value.data) {
      query = query.eq("data_pregao", filtros.value.data);
    }

    if (filtros.value.numeroProcesso) {
      query = query.ilike("numero_processo", `%${filtros.value.numeroProcesso}%`);
    }

    if (filtros.value.codigoGpi) {
      query = query.ilike("codigo_analise", `%${filtros.value.codigoGpi}%`);
    }

    if (filtros.value.estado) {
      query = query.eq("estado", filtros.value.estado);
    }

    if (filtros.value.sistema) {
      // Para filtrar por sistema, é necessário uma lógica mais complexa
      // Normalmente seria necessário uma busca relacionada na tabela de sistemas
      // Esta é uma implementação simplificada
      query = query.contains("sistemas_ativos", [filtros.value.sistema]);
    }

    if (filtros.value.status) {
      query = query.eq("status", filtros.value.status);
    }

    if (filtros.value.responsavel) {
      query = query.ilike("responsavel_nome", `%${filtros.value.responsavel}%`);
    }

    // Adicionar filtro de ano atual
    if (anoSelecionado.value) {
      const anoInicio = `${anoSelecionado.value}-01-01`;
      const anoFim = `${anoSelecionado.value}-12-31`;
      query = query.gte("data_pregao", anoInicio).lte("data_pregao", anoFim);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Atualizar lista de processos com resultados filtrados
    if (data) {
      // Aqui você precisa atualizar o estado dos processos com os dados filtrados
      // Como você está usando um composable, pode ser necessário ajustar essa lógica
      // Exemplo: processosRef.value = data
    }
  } catch (error) {
    console.error("Erro ao aplicar filtros:", error);
  }
};

const criarNovoProcesso = () => {
  // Navegar para a página de criação de processo
  router.push("/processos/novo");
};

// Use o composable de conexão
useConnectionManager(loadProcessos);

onMounted(async () => {
  await loadProcessos();
  await carregarNomesSistemas();
});

// Quando criar um canal
const channel = supabase.channel("nome-do-canal");
channel.subscribe();
SupabaseManager.addSubscription("nome-do-canal", channel);

onUnmounted(() => {
  const channel = SupabaseManager.getSubscription("nome-do-canal");
  if (channel) {
    supabase.removeChannel(channel);
    SupabaseManager.removeSubscription("nome-do-canal");
  }
});
</script>

<style src="../assets/styles/LancesView.css"></style>
