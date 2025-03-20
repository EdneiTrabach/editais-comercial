<template>
  <div class="layout">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />

    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <!-- Header Section -->
      <div class="header-processos">
        <h1>Processos Licitatórios</h1>

        <div class="actions">
          <button class="btn-action-actions" @click="undoAction" :disabled="!undoHistory || undoHistory.length === 0"
            title="Desfazer (Ctrl+Z)">
            <img src="/icons/undo.svg" alt="Desfazer" class="icon" />
          </button>
          <button class="btn-action-actions" @click="redoAction" :disabled="!redoHistory || redoHistory.length === 0"
            title="Refazer (Ctrl+Y)">
            <img src="/icons/redo.svg" alt="Refazer" class="icon" />
          </button>
          <button class="btn-export" @click="exportToExcel">
            <img src="/icons/excel.svg" alt="Exportar" class="icon" />
            Exportar
          </button>
          <button class="btn-add" @click="handleNewProcess">
            <img src="/icons/adicao.svg" alt="Adicionar" class="icon icon-add" />
            Novo Processo
          </button>
        </div>
      </div>

      <!-- Active Filters -->
      <div class="filtros-ativos" v-if="temFiltrosAtivos">
        <span>Filtros ativos:</span>
        <button @click="limparFiltros" class="btn-limpar-filtros">
          Limpar todos os filtros
        </button>
      </div>

      <!-- Data Table -->
      <div class="table-container">
        <table class="excel-table resizable">
          <thead>
            <tr>
              <th class="row-number-cell"></th>
              <!-- Colunas dinâmicas e reordenáveis -->
              <th v-for="(coluna, index) in colunasOrdenadas" 
                  :key="coluna.campo" 
                  class="resizable-column" 
                  :data-field="coluna.campo"
                  :style="{ width: colunasWidth[coluna.campo] }"
                  draggable="true"
                  @dragstart="startColumnDrag($event, index)"
                  @dragover="allowColumnDrop($event)"
                  @drop="handleColumnDrop($event, index)">
                <div class="th-content">
                  {{ coluna.titulo }}
                  
                  <!-- Conteúdo do cabeçalho como estava antes -->
                </div>
                <div class="column-resize-handle" @mousedown.stop="startColumnResize($event, coluna.campo)"></div>
              </th>
              
              <!-- Coluna de ações (sempre no final) -->
              <th class="actions-column" style="position: sticky; right: 0; z-index: 10; background: #f8f9fa;">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(processo, index) in processosFiltrados" :key="processo.id" class="resizable-row"
              :class="{ 'selected-row': selectedRow === processo.id }" :data-status="processo.status"
              @click="selectRow(processo.id)" :style="{ height: rowsHeight[processo.id] }">
              <td class="row-number-cell">{{ index + 1 }}</td>
              
              <!-- Células de dados para colunas dinâmicas -->
              <td v-for="coluna in colunasOrdenadas" 
                  :key="coluna.campo" 
                  :data-field="coluna.campo"
                  @dblclick="handleDblClick(coluna.campo, processo, $event)">
                <!-- Conteúdo das células como estava antes -->
                <!-- Editing Mode -->
                <template v-if="editingCell.id === processo.id && editingCell.field === coluna.campo">
                  <!-- Analysis Code field -->
                  <!-- <input v-if="coluna.campo === 'codigo_analise'" type="text" v-model="editingCell.value"
                    @blur="handleUpdate(processo)" @keyup.enter="handleUpdate(processo)" @keyup.esc="cancelEdit()"
                    placeholder="Digite o código"> -->

                  <!-- Date field -->
                  <input v-if="coluna.campo === 'data_pregao'" ref="editInput" type="date" v-model="editingCell.value"
                    :min="new Date().toISOString().split('T')[0]" @blur="handleUpdate(processo)"
                    @keyup.enter="handleUpdate(processo)" @keyup.esc="cancelEdit()">

                  <!-- Time field -->
                  <input v-else-if="coluna.campo === 'hora_pregao'" type="time" v-model="editingCell.value" min="08:00"
                    max="18:00" @blur="handleUpdate(processo)" @keyup.enter="handleUpdate(processo)"
                    @keyup.esc="cancelEdit()">

                  <!-- State field -->
                  <select v-else-if="coluna.campo === 'estado'" v-model="editingCell.value"
                    @change="handleUpdate(processo)" @blur="handleUpdate(processo)" @keyup.esc="cancelEdit()">
                    <option value="">Selecione o estado...</option>
                    <option v-for="estado in estados" :key="estado.uf" :value="estado.uf">
                      {{ estado.nome }}
                    </option>
                  </select>

                  <!-- Impugnações field -->
                  <textarea v-else-if="coluna.campo === 'impugnacoes'" v-model="editingCell.value"
                    @blur="handleUpdate(processo)" @keyup.enter="handleUpdate(processo)" @keyup.esc="cancelEdit()"
                    rows="3" placeholder="Digite as impugnações..."></textarea>

                  <!-- Representative field -->
                  <select v-else-if="coluna.campo === 'representante'" v-model="editingCell.value"
                    @change="handleUpdate(processo)" @blur="handleUpdate(processo)" @keyup.esc="cancelEdit()">
                    <option value="">Selecione o representante...</option>
                    <option v-for="rep in representantes" :key="rep.id" :value="rep.id">
                      {{ rep.nome }}
                    </option>
                  </select>

                  <!-- Full Object field -->
                  <textarea v-else-if="coluna.campo === 'objeto_completo'" v-model="editingCell.value"
                    @blur="handleUpdate(processo)" @keyup.enter="handleUpdate(processo)" @keyup.esc="cancelEdit()"
                    rows="3"></textarea>

                  <!-- Modality field -->
                  <select v-else-if="coluna.campo === 'modalidade'" v-model="editingCell.value"
                    @blur="handleUpdate(processo)" @change="handleUpdate(processo)" @keyup.esc="cancelEdit()">
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

                  <!-- Status field -->
                  <select v-else-if="coluna.campo === 'status'" v-model="editingCell.value"
                    @change="handleUpdate(processo)" @blur="handleUpdate(processo)" @keyup.esc="cancelEdit()"
                    class="status-select">
                    <option value="">Selecione um status...</option>
                    <option value="em_analise">Em Análise</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="vamos_participar">Vamos Participar</option>
                    <option value="ganhamos">Ganhamos</option>
                    <option value="perdemos">Perdemos</option>
                    <option value="suspenso">Suspenso</option>
                    <option value="revogado">Revogado</option>
                    <option value="adiado">Adiado</option>
                    <option value="demonstracao">Demonstração</option>
                    <option value="cancelado">Cancelado</option>
                    <option value="nao_participar">Decidido Não Participar</option>
                  </select>

                  <!-- Systems field -->
                  <template v-else-if="coluna.campo === 'sistemas_ativos'">
                    <div class="sistemas-dropdown-container">
                      <div class="sistemas-selected">
                        <div v-for="id in editingCell.value" :key="id" class="sistema-chip">
                          {{ getSistemaNome(id) }}
                          <span @click.stop="removerSistema(id)" class="sistema-remove">×</span>
                        </div>
                      </div>
                      <!-- <select multiple class="sistemas-select" @change="handleSistemasChange($event)">
                        <option v-for="sistema in sistemasAtivos" :key="sistema.id" :value="sistema.id"
                          :selected="editingCell.value && editingCell.value.includes(sistema.id)">
                          {{ sistema.nome }}
                        </option>
                      </select> -->
                    </div>
                  </template>

                  <!-- Additional field (Observações) -->
                  <textarea v-else-if="coluna.campo === 'campo_adicional1'" v-model="editingCell.value" rows="3" 
                    class="observacoes-edit" @blur="handleUpdate(processo)" @keyup.enter="handleUpdate(processo)"
                    @keyup.esc="cancelEdit()"></textarea>

                  <!-- Default input for codigo_analise -->
                  <input v-else-if="coluna.campo === 'codigo_analise'" type="text" v-model="editingCell.value"
                    @blur="handleUpdate(processo)" @keyup.enter="handleUpdate(processo)" @keyup.esc="cancelEdit()"
                    placeholder="Digite o código">
                    
                  <!-- Input genérico para campos sem tratamento específico (como Órgão) -->
                  <input v-else type="text" v-model="editingCell.value"
                    @blur="handleUpdate(processo)" @keyup.enter="handleUpdate(processo)" @keyup.esc="cancelEdit()">
                </template>

                <!-- View Mode -->
                <template v-else>
                  <!-- Date field -->
                  <template v-if="coluna.campo === 'data_pregao'">
                    {{ formatDate(processo.data_pregao) }}
                  </template>

                  <!-- Time field -->
                  <template v-else-if="coluna.campo === 'hora_pregao'">
                    {{ formatTime(processo.hora_pregao) }}
                  </template>

                  <!-- Modality field -->
                  <template v-else-if="coluna.campo === 'modalidade'">
                    <span :title="formatModalidadeCompleta(processo.modalidade)">
                      {{ getModalidadeSigla(processo.modalidade) }}
                    </span>
                  </template>

                  <!-- Object fields -->
                  <span v-else-if="coluna.campo === 'objeto_resumido' || coluna.campo === 'objeto_completo'"
                    class="objeto-cell">
                    {{ processo[coluna.campo] || '-' }}
                  </span>

                  <!-- Representative field -->
                  <span v-else-if="coluna.campo === 'representante'">
                    {{ processo.representantes?.nome || '-' }}
                  </span>

                  <!-- Responsible name field -->
                  <span v-else-if="coluna.campo === 'responsavel_nome'">
                    {{ processo.profiles?.nome || '-' }}
                  </span>

                  <!-- Site field -->
                  <template v-else-if="coluna.campo === 'site_pregao'">
                    <div class="portal-link">
                      <a v-if="processo.site_pregao" :href="processo.site_pregao" target="_blank"
                        rel="noopener noreferrer" class="portal-button">
                        {{ getPlataformaNome(processo.site_pregao) }}
                      </a>
                      <span v-else>-</span>
                    </div>
                  </template>

                  <!-- Status field -->
                  <span v-else-if="coluna.campo === 'status'" :class="['status', processo.status]">
                    {{ formatStatus(processo.status) }}
                  </span>

                  <!-- Company field -->
                  <template v-else-if="coluna.campo === 'empresa_id'">
                    <div class="responsavel-container"
                      @dblclick="handleDblClickEmpresa(coluna.campo, processo, $event)">
                      <span class="responsavel-display">
                        {{ getEmpresaNome(processo.empresa_id) || 'Sem empresa' }}
                      </span>
                    </div>
                  </template>

                  <!-- Distances field -->
              <td v-else-if="coluna.campo === 'distancias'">
                <div class="distancias-stack">
                  <div v-for="dist in getDistancias(processo.id)" :key="dist.id" class="distancia-chip">
                    {{ dist.distancia_km }}km ({{ dist.ponto_referencia_cidade }}/{{ dist.ponto_referencia_uf }})
                  </div>
                </div>
              </td>

              <!-- Systems field -->
              <template v-else-if="coluna.campo === 'sistemas_ativos'">
                <div class="sistemas-chips">
                  <div v-if="processo.sistemas_ativos && processo.sistemas_ativos.length > 0" class="sistemas-lista">
                    {{ getSistemasNomesString(processo.sistemas_ativos) }}
                  </div>
                  <div v-else class="sem-sistemas">-</div>
                </div>
              </template>

              <!-- Distance type display -->
              <template v-else-if="coluna.tipoExibicao === 'distancia'">
                <div class="distancia-container" @dblclick="abrirDialogDistancia(processo, $event)">
                  <div v-if="processo.distancia_km || processo.ponto_referencia_cidade" class="distancia-preview">
                    {{ formatarDistancia(processo) }}
                  </div>
                  <div v-else class="distancia-multiple">
                    <span v-if="Array.isArray(processo._distancias) && processo._distancias.length > 0">
                      <div v-for="(distancia, idx) in processo._distancias" :key="idx" class="distancia-item">
                        {{ distancia.distancia_km }} km ({{ distancia.ponto_referencia_cidade }}/{{
                          distancia.ponto_referencia_uf }})
                      </div>
                    </span>
                    <span v-else class="sem-distancia">Clique para adicionar</span>
                  </div>
                </div>
              </template>

              <!-- Representative ID field -->
              <template v-else-if="coluna.campo === 'representante_id'">
                <div class="responsavel-container"
                  @dblclick="handleDblClickRepresentante(coluna.campo, processo, $event)">
                  <span class="responsavel-display">
                    {{ getRepresentanteNome(processo.representante_id) || 'Sem representante' }}
                  </span>
                </div>
              </template>

              <!-- Responsible ID field -->
              <template v-else-if="coluna.campo === 'responsavel_id'">
                <div class="responsavel-container"
                  @dblclick="handleDblClickResponsavel(coluna.campo, processo, $event)">
                  <span class="responsavel-display">
                    {{ getResponsavelProcessoNome(processo.responsavel_id) || 'Sem responsável' }}
                  </span>
                </div>
              </template>

              <!-- Default display for other fields -->
              <span v-else>
                {{ processo[coluna.campo] || '-' }}
              </span>
</template>
</td>
              
              <!-- Célula de ações (sempre no final) -->
              <td class="actions-cell" style="position: sticky; right: 0; z-index: 10; background: white;">
                <div class="action-buttons">
                  <button class="btn-icon delete" @click="handleDelete(processo)">
                    <BaseImage src="icons/lixeira.svg" alt="Excluir" class="icon icon-delete" fallbackImage="icons/fallback.svg" />
                  </button>
                </div>
              </td>
              
              <!-- Row resize handle -->
              <div class="row-resize-handle" @mousedown.stop="startRowResize($event, processo.id)"></div>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Year tabs -->
      <div class="anos-tabs">
        <div class="tabs-header">
          <button v-for="ano in anosDisponiveis" :key="ano" :class="['tab-button', { active: anoSelecionado === ano }]"
            @click="selecionarAno(ano)">
            {{ ano }}
          </button>
        </div>
      </div>

      <!-- Confirm dialog -->
      <div v-if="confirmDialog.show" class="confirm-dialog" :style="confirmDialog.position">
        <div class="confirm-content">
          <p>Deseja editar este campo?</p>
          <div class="confirm-actions">
            <button @click="handleConfirmEdit" class="btn-confirm">Confirmar</button>
            <button @click="hideConfirmDialog" class="btn-cancel">Cancelar</button>
          </div>
        </div>
      </div>

      <!-- Delete confirm dialog -->
      <div v-if="deleteConfirmDialog.show" class="modal-overlay">
        <div class="confirm-dialog">
          <div class="confirm-content">
            <h3>Confirmar Exclusão</h3>
            <p>Tem certeza que deseja excluir este processo?</p>
            <p class="warning-text">Esta ação não poderá ser desfeita!</p>
            <div class="confirm-actions">
              <button class="btn-cancel" @click="hideDeleteDialog">Cancelar</button>
              <button class="btn-confirm delete" @click="confirmDelete">
                Excluir
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Systems dialog -->
      <div v-if="sistemasDialog.show" class="sistemas-dialog" :style="sistemasDialog.position">
        <div class="sistemas-dialog-content">
          <h3>Selecionar Sistemas</h3>
          <div class="sistemas-selected">
            <div v-for="id in editingCell.value" :key="id" class="sistema-chip">
              {{ getSistemaNome(id) }}
              <span @click.stop="removerSistema(id)" class="sistema-remove">×</span>
            </div>
          </div>
          <select multiple class="sistemas-select" @change="handleSistemasChange($event)">
            <option v-for="sistema in sistemasAtivos" :key="sistema.id" :value="sistema.id"
              :selected="editingCell.value && editingCell.value.includes(sistema.id)">
              {{ sistema.nome }}
            </option>
          </select>
          <div class="sistemas-dialog-actions">
            <button @click="saveSistemas" class="btn-confirm">Salvar</button>
            <button @click="hideSistemasDialog" class="btn-cancel">Cancelar</button>
          </div>
        </div>
      </div>

      <!-- Dialog para gerenciar distâncias -->
      <div v-if="distanciaDialog.show" class="distancia-dialog" :style="distanciaDialog.position">
        <div class="distancia-dialog-content">
          <h3>{{ distanciaDialog.processo?.numero_processo }} - Distâncias</h3>

          <div class="distancias-list">
            <table class="distancias-table">
              <thead>
                <tr>
                  <th>Distância (km)</th>
                  <th>Cidade</th>
                  <th>UF</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(distancia, index) in distanciaDialog.distancias" :key="distancia.id">
                  <td>{{ distancia.distancia_km }}</td>
                  <td>{{ distancia.ponto_referencia_cidade }}</td>
                  <td>{{ distancia.ponto_referencia_uf }}</td>
                  <td class="distancia-acoes">
                    <button class="btn-icon edit" @click="iniciarEdicaoDistancia(distancia, index)">
                      <img src="/icons/edicao.svg" alt="Editar" class="icon-small" />
                    </button>
                    <button class="btn-icon delete" @click="excluirDistancia(distancia, index)">
                      <img src="/icons/edicao.svg" alt="Excluir" class="icon-small" />
                    </button>
                  </td>
                </tr>
                <tr v-if="distanciaDialog.distancias.length === 0">
                  <td colspan="4" class="no-records">Nenhuma distância cadastrada</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="distancia-form">
            <h4>{{ distanciaDialog.editandoIndex >= 0 ? 'Editar Distância' : 'Nova Distância' }}</h4>
            <div class="form-row">
              <div class="form-group">
                <label>Distância (km)</label>
                <input type="number" min="0" step="0.1" v-model="distanciaDialog.novaDistancia.distancia_km"
                  placeholder="Digite a distância" />
              </div>

              <div class="form-group">
                <label>Cidade</label>
                <input type="text" v-model="distanciaDialog.novaDistancia.ponto_referencia_cidade"
                  placeholder="Digite a cidade" />
              </div>

              <div class="form-group">
                <label>UF</label>
                <select v-model="distanciaDialog.novaDistancia.ponto_referencia_uf">
                  <option value="">Selecione</option>
                  <option v-for="estado in estados" :key="estado.uf" :value="estado.uf">
                    {{ estado.uf }}
                  </option>
                </select>
              </div>
            </div>

            <div class="form-actions">
              <button v-if="distanciaDialog.editandoIndex >= 0" class="btn-save" @click="salvarEdicaoDistancia">
                Salvar Alterações
              </button>
              <button v-else class="btn-add" @click="adicionarDistancia">
                Adicionar
              </button>

              <button v-if="distanciaDialog.editandoIndex >= 0" class="btn-cancel" @click="cancelarEdicaoDistancia">
                Cancelar Edição
              </button>
            </div>
          </div>

          <div class="dialog-footer">
            <button class="btn-close" @click="fecharDistanciaDialog">Fechar</button>
          </div>
        </div>
      </div>

      <!-- Responsáveis dialog -->
      <div v-if="responsaveisDialog.show" class="sistemas-dialog" :style="responsaveisDialog.position">
        <div class="sistemas-dialog-content">
          <h3>Selecionar Responsável</h3>
          <div class="sistemas-selected">
            <div v-if="editingCell.value" class="sistema-chip">
              {{ getResponsavelProcessoNome(editingCell.value) }}
              <span @click.stop="removerResponsavel()" class="sistema-remove">×</span>
            </div>
          </div>
          <select class="sistemas-select" @change="handleResponsavelChange($event)">
            <option value="">Sem responsável</option>
            <option v-for="resp in responsaveisProcessos" :key="resp.id" :value="resp.id"
              :selected="editingCell.value === resp.id">
              {{ resp.nome }} ({{ resp.departamento || 'Sem depto' }})
            </option>
          </select>
          <div class="sistemas-dialog-actions">
            <button @click="saveResponsavel" class="btn-confirm">Salvar</button>
            <button @click="hideResponsaveisDialog" class="btn-cancel">Cancelar</button>
          </div>
        </div>
      </div>

      <!-- Representantes dialog -->
      <div v-if="representantesDialog.show" class="sistemas-dialog" :style="representantesDialog.position">
        <div class="sistemas-dialog-content">
          <h3>Selecionar Representante</h3>
          <div class="sistemas-selected">
            <div v-if="editingCell.value" class="sistema-chip">
              {{ getRepresentanteNome(editingCell.value) }}
              <span @click.stop="removerRepresentante()" class="sistema-remove">×</span>
            </div>
          </div>
          <select class="sistemas-select" @change="handleRepresentanteChange($event)">
            <option value="">Sem representante</option>
            <option v-for="rep in representantes" :key="rep.id" :value="rep.id" :selected="editingCell.value === rep.id">
              {{ rep.nome }}
            </option>
          </select>
          <div class="sistemas-dialog-actions">
            <button @click="saveRepresentante" class="btn-confirm">Salvar</button>
            <button @click="hideRepresentantesDialog" class="btn-cancel">Cancelar</button>
          </div>
        </div>
      </div>

      <!-- Empresas dialog -->
      <div v-if="empresasDialog.show" class="sistemas-dialog" :style="empresasDialog.position">
        <div class="sistemas-dialog-content">
          <h3>Selecionar Empresa</h3>
          <div class="sistemas-selected">
            <div v-if="editingCell.value" class="sistema-chip">
              {{ getEmpresaNome(editingCell.value) }}
              <span @click.stop="removerEmpresa()" class="sistema-remove">×</span>
            </div>
          </div>
          <select class="sistemas-select" @change="handleEmpresaChange($event)">
            <option value="">Sem empresa</option>
            <option v-for="empresa in empresas" :key="empresa.id" :value="empresa.id"
              :selected="editingCell.value === empresa.id">
              {{ empresa.nome }} <span v-if="empresa.cnpj" class="empresa-cnpj">({{ formatCNPJ(empresa.cnpj) }})</span>
            </option>
          </select>
          <div class="sistemas-dialog-actions">
            <button @click="saveEmpresa" class="btn-confirm">Salvar</button>
            <button @click="hideEmpresasDialog" class="btn-cancel">Cancelar</button>
          </div>
        </div>
      </div>

      <div class="toast-container">
        <div v-for="toast in toasts" :key="toast.id" class="toast" :class="toast.type">
          {{ toast.message }}
        </div>
      </div>

    </div>
  </div>
</template>

<script>
// Import the component logic from the separate JS file
import ProcessosViewModel from './ProcessosView.js';

// Export the component with the imported logic
export default ProcessosViewModel;
</script>

<style src="@/assets/styles/ProcessosView.css"></style>
<style src="/src/assets/styles/modules/toast.css"></style>
<style src="/src/assets//styles/components/actions.css"></style>
