<template>
  <!-- Grid view (cartões) -->
  <div v-if="modoVisualizacao === 'grid'" class="processos-grid">
    <div
      v-for="processo in processos"
      :key="processo.id"
      @click="handleProcessoSelect(processo)"
      class="processo-card"
      :class="{
        selected: selectedProcesso === processo.id,
        'not-in-analysis': !isStillInAnalysis(processo),
        'analise-status-atende': getStatusAnalise(processo) === 'atende',
        'analise-status-nao-atende': getStatusAnalise(processo) === 'nao-atende',
        'analise-status-nao-analisado': getStatusAnalise(processo) === 'nao-analisado',
      }"
      :data-current-status="formatStatus(processo.status)"
    >
      <div class="card-header">
        <span class="card-numero">{{ processo.numero_processo }}</span>
        <span
          class="card-status"
          :class="'status-' + processo.status?.toLowerCase()?.replace(/[_\s]/g, '-')"
        >
          {{ formatStatus(processo.status) }}
        </span>
      </div>
      <div class="card-body">
        <div class="card-orgao">{{ processo.orgao }}</div>
        <div class="card-info">
          <div class="info-item">
            <i class="fas fa-building"></i>
            <span>{{ formatarModalidade(processo.modalidade) || "N/A" }}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-map-marker-alt"></i>
            <span>{{ processo.estado || "N/A" }}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-hashtag"></i>
            <span>Código: {{ processo.codigo_analise || "N/A" }}</span>
          </div>
        </div>
        <div class="card-footer">
          <div class="info-item">
            <i class="fas fa-user"></i>
            <span>{{ getResponsavel(processo) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- List view (tabela) -->
  <div v-else class="processos-lista" role="region" aria-label="Lista de processos">
    <table class="table-processos" role="grid">
      <caption class="sr-only">
        Lista de processos licitatórios
      </caption>
      <thead class="thead-light">
        <tr class="table-header" role="row">
          <th
            class="coluna-tabela-analises"
            role="columnheader"
            scope="col"
            id="col-numero"
          >
            Número
          </th>
          <th
            class="coluna-tabela-analises"
            role="columnheader"
            scope="col"
            id="col-orgao"
          >
            Órgão
          </th>
          <th
            class="coluna-tabela-analises"
            role="columnheader"
            scope="col"
            id="col-modalidade"
          >
            Modalidade
          </th>
          <th
            class="coluna-tabela-analises"
            role="columnheader"
            scope="col"
            id="col-estado"
          >
            Estado
          </th>
          <th
            class="coluna-tabela-analises"
            role="columnheader"
            scope="col"
            id="col-codigo"
          >
            Código
          </th>
          <th
            class="coluna-tabela-analises"
            role="columnheader"
            scope="col"
            id="col-status"
          >
            Status
          </th>
          <th
            class="coluna-tabela-analises"
            role="columnheader"
            scope="col"
            id="col-responsavel"
          >
            Responsável
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="processo in processos"
          :key="processo.id"
          @click="handleProcessoSelect(processo)"
          @keydown.enter="handleProcessoSelect(processo)"
          @keydown.space.prevent="handleProcessoSelect(processo)"
          class="processo-row"
          role="row"
          tabindex="0"
          :aria-selected="selectedProcesso === processo.id"
          :class="{
            selected: selectedProcesso === processo.id,
            'not-in-analysis': !isStillInAnalysis(processo),
            'analise-status-atende': getStatusAnalise(processo) === 'atende',
            'analise-status-nao-atende': getStatusAnalise(processo) === 'nao-atende',
            'analise-status-nao-analisado':
              getStatusAnalise(processo) === 'nao-analisado',
          }"
          :data-current-status="formatStatus(processo.status)"
        >
          <td class="numero-processo" role="cell" :headers="col - numero">
            {{ processo.numero_processo }}
          </td>
          <td role="cell" :headers="col - orgao">{{ processo.orgao }}</td>
          <td role="cell" :headers="col - modalidade">
            {{ formatarModalidade(processo.modalidade) }}
          </td>
          <td role="cell" :headers="col - estado">{{ processo.estado || "N/A" }}</td>
          <td role="cell" :headers="col - codigo">
            {{ processo.codigo_analise || "N/A" }}
          </td>
          <td role="cell" :headers="col - status">
            <span
              class="status-badge"
              :class="'status-' + processo.status?.toLowerCase()?.replace(/[_\s]/g, '-')"
            >
              {{ formatStatus(processo.status) }}
            </span>
          </td>
          <td role="cell" :headers="col - responsavel">{{ getResponsavel(processo) }}</td>
        </tr>
        <tr v-if="processos.length === 0" class="empty-row">
          <td colspan="7" class="empty-message">Nenhum processo encontrado</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Modal de Novo Processo -->
  <div v-if="showNovoProcessoModal" class="modal-overlay" @click.self="fecharModal">
    <div class="modal-content">
      <h3>Novo Processo</h3>
      <form @submit.prevent="criarNovoProcesso">
        <div class="form-group">
          <label>Órgão*</label>
          <input v-model="novoProcesso.orgao" required placeholder="Nome do órgão" />
        </div>

        <div class="form-group">
          <label>Data do Pregão*</label>
          <input v-model="novoProcesso.data_pregao" type="date" required />
        </div>

        <div class="form-group">
          <label>Hora do Pregão*</label>
          <input v-model="novoProcesso.hora_pregao" type="time" required />
        </div>

        <div class="form-group">
          <label>Modalidade</label>
          <select v-model="novoProcesso.modalidade">
            <option value="pregao_eletronico">Pregão Eletrônico</option>
            <option value="pregao_presencial">Pregão Presencial</option>
            <option value="concorrencia">Concorrência</option>
            <option value="tomada_preco">Tomada de Preço</option>
            <option value="convite">Convite</option>
            <option value="inexigibilidade">Inexigibilidade</option>
          </select>
        </div>

        <div class="form-group">
          <label>Estado</label>
          <select v-model="novoProcesso.estado">
            <option value="">Selecione o estado</option>
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

        <div class="form-group">
          <label>Código de Análise</label>
          <input v-model="novoProcesso.codigo_analise" placeholder="Código de análise" />
        </div>

        <div class="form-group">
          <label>Responsável</label>
          <input
            v-model="novoProcesso.responsavel"
            placeholder="Responsável pelo processo"
          />
        </div>

        <div class="form-group">
          <label>Objeto Resumido*</label>
          <textarea
            v-model="novoProcesso.objeto_resumido"
            required
            rows="3"
            placeholder="Breve descrição do objeto"
          ></textarea>
        </div>

        <div class="form-buttons">
          <button type="button" class="btn-cancelar" @click="fecharModal">
            Cancelar
          </button>
          <button type="submit" class="btn-criar" :disabled="loading">
            {{ loading ? "Criando..." : "Criar Processo" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { supabase } from "@/lib/supabase";

export default {
  name: "ProcessoSelection",

  props: {
    processos: Array,
    selectedProcesso: [Number, String, Object],
    modoVisualizacao: {
      type: String,
      default: "grid",
      validator: (value) => ["grid", "lista"].includes(value),
    },
  },

  emits: ["select-processo"],

  data() {
    return {
      showNovoProcessoModal: false,
      loading: false,
      novoProcesso: {
        orgao: "",
        data_pregao: "",
        hora_pregao: "",
        objeto_resumido: "",
        status: "em_analise",
        responsavel: "",
        modalidade: "pregao_eletronico",
        estado: "ES",
      },
      showOnlyInAnalysis: false,
      analisesCache: {}, // Cache para armazenar estados das análises
      statusAnaliseProcessos: {}, // Cache para armazenar status de análise dos processos
    };
  },

  methods: {
    // Novo método para lidar com a seleção de processos
    handleProcessoSelect(processo) {
      // Emitir evento apenas para selecionar o processo, sem avançar automaticamente
      this.$emit("select-processo", processo);
    },

    formatStatus(status) {
      if (!status) return "Desconhecido";

      const statusMap = {
        em_analise: "Em Análise",
        ganhamos: "Ganhamos",
        perdemos: "Perdemos",
        desistimos: "Desistimos",
        cancelado: "Cancelado",
        adiado: "Adiado",
        aguardando: "Aguardando",
      };

      return statusMap[status.toLowerCase()] || status;
    },

    formatarData(dateString) {
      if (!dateString) return "-";

      try {
        const date = new Date(dateString);
        return date.toLocaleDateString("pt-BR");
      } catch (error) {
        return dateString;
      }
    },

    formatarModalidade(modalidade) {
      if (!modalidade) return "N/A";

      // Transformar de snake_case para formato legível
      return modalidade
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    },

    isStillInAnalysis(processo) {
      return processo.status && processo.status.toLowerCase() === "em_analise";
    },

    abrirModal() {
      // Reiniciar estado do formulário
      this.novoProcesso = {
        orgao: "",
        data_pregao: "",
        hora_pregao: "",
        objeto_resumido: "",
        status: "em_analise",
        responsavel: "",
        modalidade: "pregao_eletronico",
        estado: "ES",
      };
      this.showNovoProcessoModal = true;
    },

    fecharModal() {
      this.showNovoProcessoModal = false;
    },

    async criarNovoProcesso() {
      try {
        this.loading = true;

        const processoData = {
          ...this.novoProcesso,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ano: parseInt(this.novoProcesso.data_pregao.split("-")[0], 10),
        };

        // Garantir que o status padrão não seja em_analise
        // Para evitar que novos processos apareçam automaticamente na tela de análises
        if (!processoData.status) {
          processoData.status = "cadastrado";
        }

        const { data, error } = await supabase
          .from("processos")
          .insert(processoData)
          .select()
          .single();

        if (error) throw error;

        // Fechar modal e emitir evento com o novo processo
        this.showNovoProcessoModal = false;
        this.$emit("select-processo", data);
      } catch (error) {
        console.error("Erro ao criar processo:", error);
        alert("Erro ao criar processo. Por favor, tente novamente.");
      } finally {
        this.loading = false;
      }
    },

    // Função especial para obter o responsável
    getResponsavel(processo) {
      // Verificação simplificada sem depender do relacionamento com usuarios
      if (processo && processo.responsavel && processo.responsavel.trim()) {
        return processo.responsavel;
      }

      // Se não houver valor no campo responsavel, retornar mensagem padrão
      return "Não atribuído";
    },

    // Método para determinar o status de análise do processo
    async getStatusAnalise(processo) {
      // Verificar se já temos o status em cache
      if (this.statusAnaliseProcessos[processo.id]) {
        return this.statusAnaliseProcessos[processo.id];
      }

      try {
        // Buscar dados de análise deste processo
        const { data: analiseData, error: analiseError } = await supabase
          .from("analises_itens")
          .select("total_itens, nao_atendidos, obrigatorio, percentual_minimo")
          .eq("processo_id", processo.id);

        // Se não tem registros na tabela de análises, retornar null
        if (!analiseData || analiseData.length === 0) {
          return null;
        }

        // Verificar se algum item foi realmente analisado
        const itensAnalisados =
          analiseData?.filter(
            (item) =>
              item.total_itens &&
              item.total_itens > 0 &&
              item.nao_atendidos !== null &&
              item.nao_atendidos !== undefined
          ) || [];

        // Se não há itens analisados, considerar não analisado
        if (itensAnalisados.length === 0) {
          this.statusAnaliseProcessos[processo.id] = "nao-analisado";
          return "nao-analisado";
        }

        // Calcular se atende aos requisitos
        let atende = true;
        for (const item of itensAnalisados) {
          const percentualMinimo = item.obrigatorio ? 90 : 70;
          const percentualAtendimento =
            ((item.total_itens - item.nao_atendidos) / item.total_itens) * 100;

          if (percentualAtendimento < (item.percentual_minimo || percentualMinimo)) {
            atende = false;
            break;
          }
        }

        const status = atende ? "atende" : "nao-atende";
        this.statusAnaliseProcessos[processo.id] = status;
        return status;
      } catch (error) {
        console.error("Erro ao obter status de análise:", error);
        return null;
      }
    },
  },

  async mounted() {
    // Para cada processo em análise, pré-carregar status
    if (this.processos && this.processos.length > 0) {
      for (const processo of this.processos) {
        if (processo.status === "em_analise") {
          await this.getStatusAnalise(processo);
        }
      }
    }
  },
};
</script>

<style>
/* Estilos para visualização em grade (cartões) */
.processos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.processo-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease-in-out;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.processo-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.processo-card.selected {
  box-shadow: 0 0 0 2px #4285f4, 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* Status de análise para cards */
.processo-card.analise-status-atende {
  border-left: 4px solid #28a745 !important; /* Verde para atende */
}

.processo-card.analise-status-nao-atende {
  border-left: 4px solid #dc3545 !important; /* Vermelho para não atende */
}

.processo-card.analise-status-nao-analisado {
  border-left: 4px solid #fd7e14 !important; /* Laranja para não analisado */
}

/* Status de análise para linhas da tabela */
.processo-row.analise-status-atende td:first-child {
  border-left: 4px solid #28a745;
}

.processo-row.analise-status-nao-atende td:first-child {
  border-left: 4px solid #dc3545;
}

.processo-row.analise-status-nao-analisado td:first-child {
  border-left: 4px solid #fd7e14;
}

/* Estilos originais de not-in-analysis (modificados para prioridade menor) */
.processo-card.not-in-analysis:not(.analise-status-atende):not(.analise-status-nao-atende):not(.analise-status-nao-analisado) {
  border-left: 4px solid orange;
}

.processo-row.not-in-analysis:not(.analise-status-atende):not(.analise-status-nao-atende):not(.analise-status-nao-analisado)
  td:first-child {
  border-left: 4px solid orange;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.card-numero {
  font-weight: 600;
  color: #333;
  font-size: 1.1rem;
}

.card-status {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
}

.card-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-grow: 1;
}

.card-orgao {
  font-weight: 600;
  font-size: 1.1rem;
  color: #333;
  line-height: 1.3;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #555;
  font-size: 0.9rem;
}

.info-item i {
  width: 16px;
  color: #666;
  text-align: center;
}

.card-footer {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px dashed #eee;
}

/* Estilos para visualização em lista (tabela) com suporte a temas */
.processos-lista {
  margin-top: 20px;
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  background-color: var(--bg-card, #ffffff);
  position: relative;
}

/* Indicador de rolagem horizontal em telas pequenas */
.processos-lista::after {
  content: "";
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 40px;
  background: linear-gradient(to right, transparent, var(--bg-card, #ffffff));
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s;
}

@media (max-width: 768px) {
  .processos-lista:not(.scrolled)::after {
    opacity: 1;
    animation: pulse 1.5s infinite alternate;
  }
}

/* Animação para indicador de rolagem */
@keyframes pulse {
  from {
    opacity: 0.2;
  }
  to {
    opacity: 0.8;
  }
}

.table-processos {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 800px;
  color: var(--text-primary, #333333);
}

/* Cabeçalho fixo */
.table-processos thead {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: var(--bg-header, #f8f9fa);
}

.table-processos th {
  color: var(--text-header, #1e293b);
  font-weight: 600;
  text-align: left;
  padding: 1rem;
  border-bottom: 2px solid var(--border-header, #e2e8f0);
  transition: background-color 0.3s;
  white-space: nowrap;
  font-size: 0.9rem;
}

.table-processos td {
  padding: 1rem;
  border-bottom: 1px solid var(--border-light, #e2e8f0);
  transition: all 0.2s ease;
  vertical-align: middle;
}

.table-processos tbody tr {
  transition: all 0.2s ease;
  border-bottom: 1px solid var(--border-light, #e2e8f0);
}

.table-processos tbody tr:hover {
  background-color: var(--bg-hover, rgba(0, 0, 0, 0.02));
}

.table-processos tbody tr:focus,
.table-processos tbody tr:focus-within {
  outline: 2px solid var(--color-focus, #4285f4);
  outline-offset: -2px;
}

.processo-row.selected {
  background-color: var(--bg-selected, #e0f2fe);
}

/* Status de análise para linhas da tabela com suporte a temas */
.processo-row.analise-status-atende td:first-child {
  border-left: 4px solid var(--color-success, #28a745);
}

.processo-row.analise-status-nao-atende td:first-child {
  border-left: 4px solid var(--color-danger, #dc3545);
}

.processo-row.analise-status-nao-analisado td:first-child {
  border-left: 4px solid var(--color-warning, #fd7e14);
}

/* Estilos para os badges de status com suporte a temas */
.status-badge {
  display: inline-block;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  line-height: 1;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.status-em-analise {
  background-color: var(--color-warning-bg, #fff3e0);
  color: var(--color-warning-text, #33291a);
}

.status-ganhamos {
  background-color: var(--color-success-bg, #e6f7ed);
  color: var(--color-success-text, #1d4731);
}

.status-perdemos {
  background-color: var(--color-danger-bg, #fdedef);
  color: var(--color-danger-text, #581b23);
}

.status-cancelado {
  background-color: var(--color-neutral-bg, #f0f0f0);
  color: var(--color-neutral-text, #666666);
}

.status-aguardando {
  background-color: var(--color-info-bg, #e3f2fd);
  color: var(--color-info-text, #0d3c61);
}

.numero-processo {
  font-weight: 600;
  color: var(--text-accent, #2563eb);
}

.empty-message {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--text-muted, #64748b);
  font-style: italic;
}

/* Classe para acessibilidade */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Suporte a tema escuro */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg-card: #1e293b;
    --bg-header: #0f172a;
    --text-primary: #e2e8f0;
    --text-header: #f8fafc;
    --border-header: #334155;
    --border-light: #334155;
    --bg-hover: rgba(255, 255, 255, 0.05);
    --bg-selected: #1e4a76;
    --text-accent: #60a5fa;
    --text-muted: #94a3b8;

    /* Status colors */
    --color-warning-bg: #422006;
    --color-warning-text: #fdba74;
    --color-success-bg: #052e16;
    --color-success-text: #86efac;
    --color-danger-bg: #450a0a;
    --color-danger-text: #fca5a5;
    --color-neutral-bg: #27272a;
    --color-neutral-text: #d4d4d8;
    --color-info-bg: #082f49;
    --color-info-text: #7dd3fc;
  }
}

/* Acessibilidade: preferências de redução de movimento */
@media (prefers-reduced-motion: reduce) {
  .status-badge,
  .table-processos tbody tr,
  .processos-lista::after {
    transition: none !important;
    animation: none !important;
  }
}

/* Responsividade aprimorada */
@media (max-width: 768px) {
  .table-processos {
    font-size: 0.85rem;
  }

  .table-processos th,
  .table-processos td {
    padding: 0.75rem 0.5rem;
  }

  .status-badge {
    padding: 0.25rem 0.5rem;
    font-size: 0.7rem;
  }
}

/* Acréscimo para impressão */
@media print {
  .processos-lista {
    box-shadow: none;
  }

  .table-processos {
    width: 100%;
  }

  .table-processos th {
    background-color: #f0f0f0 !important;
    color: #000 !important;
  }

  .status-badge {
    border: 1px solid #ddd;
  }
}

/* Responsividade */
@media (max-width: 768px) {
  .processos-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }

  .table-processos {
    font-size: 0.9rem;
  }
}

@media (max-width: 576px) {
  .processos-grid {
    grid-template-columns: 1fr;
  }
}
/* Adicione este CSS à folha de estilos correspondente (provavelmente em src/assets/styles/analises/processo-lista.css) */

.processo-card {
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  border-left: 4px solid transparent;
}

.processo-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.processo-card.selected {
  border: 2px solid #4285f4;
  box-shadow: 0 0 0 2px #4285f4, 0 4px 8px rgba(0, 0, 0, 0.15);
  background-color: #f0f7ff;
}

/* Estilos específicos para status */
.processo-card.not-in-analysis {
  position: relative;
}

.processo-card.status-vamos-participar .card-status {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

</style>
