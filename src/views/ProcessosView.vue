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
          
          <!-- Novo botão de Tour -->
          <button class="btn-tour" @click="startTour" title="Iniciar Tour">
            <img src="/icons/question-circle.svg" alt="Tour" class="icon" />
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
              <!-- Colunas ordenáveis -->
              <th v-for="(coluna, index) in ordenarColunas" :key="coluna.campo" :data-field="coluna.campo"
                draggable="true" @dragstart="startColumnDrag($event, index)" @dragover="allowColumnDrop($event)"
                @drop="handleColumnDrop($event, index)" :style="{ width: colunasWidth[coluna.campo] }"
                :class="{ 'resizable-column': true }">
                <div class="th-content">
                  {{ coluna.titulo }}
                  <!-- <div class="column-drag-handle" title="Arraste para reordenar">⋮⋮</div> -->
                  <!-- Sort buttons for date column -->
                  <div v-if="coluna.campo === 'data_pregao'" class="sort-buttons">
                    <button class="btn-sort"
                      :class="{ active: sortConfig.field === 'data_pregao' && sortConfig.direction === 'asc' }"
                      @click="handleSort('data_pregao', 'asc')">
                      ▲
                    </button>
                    <button class="btn-sort"
                      :class="{ active: sortConfig.field === 'data_pregao' && sortConfig.direction === 'desc' }"
                      @click="handleSort('data_pregao', 'desc')">
                      ▼
                    </button>
                  </div>

                  <!-- Filter button for filterable columns -->
                  <div
                    v-if="['modalidade', 'estado', 'numero_processo', 'orgao', 'status', 'responsavel_nome', 'site_pregao', 'representante', 'empresa'].includes(coluna.campo)"
                    class="filtro-container">
                    <button @click="toggleFiltro(coluna.campo)" class="btn-filtro"
                      :class="{ active: filtros[coluna.campo]?.length > 0 }">
                      <img src="/icons/filter.svg" alt="Filtrar" class="icon-filter" />
                    </button>

                    <!-- Dropdown de filtro para modalidade -->
                    <div v-if="mostrarFiltro[coluna.campo]" class="filtro-dropdown" :data-campo="coluna.campo">
                      <div class="dropdown-header">
                        <input type="search" :placeholder="`Filtrar ${coluna.titulo}`" class="filtro-search"
                          v-model="filtroModalidadeSearch" @input="filtrarOpcoes(coluna.campo)" />
                      </div>
                      <div class="dropdown-list">
                        <div v-for="opcao in opcoesFiltradasModalidade" :key="opcao.valor" class="filtro-opcao">
                          <label class="filtro-checkbox">
                            <input type="checkbox" :checked="filtros[coluna.campo]?.includes(opcao.valor)"
                              @change="toggleFiltroItem(coluna.campo, opcao.valor)" />
                            <span class="checkbox-label">{{ opcao.texto }}</span>
                          </label>
                        </div>
                      </div>
                      <div class="dropdown-footer">
                        <button @click="limparFiltroColuna(coluna.campo)" class="btn-limpar-filtro">
                          Limpar filtro
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="column-resize-handle" @mousedown.stop="startColumnResize($event, coluna.campo)"></div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(processo, index) in processosFiltrados" :key="processo.id" class="resizable-row"
              :class="{ 'selected-row': selectedRow === processo.id }" :data-status="processo.status"
              @click="selectRow(processo.id)" :style="{ height: rowsHeight[processo.id] }">
              <td class="row-number-cell">{{ index + 1 }}</td>

              <!-- Células de dados ordenáveis -->
              <td v-for="coluna in ordenarColunas" :key="coluna.campo" :data-field="coluna.campo" :data-id="processo.id"
                :class="{ 'selecionada': selectedRow === processo.id }"
                @dblclick="coluna.campo === 'codigo_analise' ? handleAnaliseClick(processo) : 
          coluna.campo === 'responsavel_id' ? handleDblClickResponsavel(coluna.campo, processo, $event) :
          coluna.campo === 'representante_id' ? handleDblClickRepresentante(coluna.campo, processo, $event) : 
          coluna.campo === 'empresa_id' ? handleDblClickEmpresa(coluna.campo, processo, $event) : 
          handleDblClick(coluna.campo, processo, $event)">
                
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
                  <select v-else-if="coluna.campo === 'status'" 
                    v-model="editingCell.value"
                    @change="handleUpdate(processo)" 
                    @blur="handleUpdate(processo)" 
                    @keyup.esc="cancelEdit()"
                    class="status-select"
                    :class="getStatusClass(processo)"
                    :title="isRecurringStatus(processo) ? `Notificações automáticas ativadas. Próxima notificação: ${nextNotificationDateMap[processo.id] || 'calculando...'}` : ''">
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

                  <!-- Portal/Plataforma field -->
                  <select v-else-if="coluna.campo === 'site_pregao'" v-model="editingCell.value"
                    @blur="handleUpdate(processo)" @change="handleUpdate(processo)" @keyup.esc="cancelEdit()">
                    <option value="">Selecione uma plataforma...</option>
                    <option v-for="plataforma in plataformas" :key="plataforma.id" :value="plataforma.url">
                      {{ plataforma.nome }}
                    </option>
                  </select>

                  <!-- Input genérico para campos sem tratamento específico (como Órgão) -->
                  <input v-else type="text" v-model="editingCell.value" @blur="handleUpdate(processo)"
                    @keyup.enter="handleUpdate(processo)" @keyup.esc="cancelEdit()">
                </template>

                <!-- View Mode -->
                <template v-else>
                  <!-- Date field -->
                  <span v-if="coluna.campo === 'data_pregao'">
                    {{ formatDate(processo.data_pregao) }}
                  </span>

                  <!-- Time field -->
                  <span v-else-if="coluna.campo === 'hora_pregao'">
                    {{ formatTime(processo.hora_pregao) }}
                  </span>

                  <!-- Modality field -->
                  <span v-else-if="coluna.campo === 'modalidade'">
                    <span :title="formatModalidadeCompleta(processo.modalidade)">
                      {{ getModalidadeSigla(processo.modalidade) }}
                    </span>
                  </span>

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
                  <span v-else-if="coluna.campo === 'site_pregao'">
                    <div class="portal-link">
                      <a v-if="processo.site_pregao" :href="processo.site_pregao" target="_blank"
                        rel="noopener noreferrer" class="portal-button">
                        {{ getPlataformaNome(processo.site_pregao) }}
                      </a>
                      <span v-else>-</span>
                    </div>
                  </span>

                  <!-- Company field -->
                  <span v-else-if="coluna.campo === 'empresa_id'">
                    <div class="responsavel-container">
                      <span class="responsavel-display">
                        {{ getEmpresaNome(processo.empresa_id) || 'Sem empresa' }}
                      </span>
                    </div>
                  </span>

                  <!-- Distances field -->
                  <span v-else-if="coluna.campo === 'distancias'">
                    <div class="distancias-stack">
                      <div v-for="dist in getDistancias(processo.id)" :key="dist.id" class="distancia-chip">
                        {{ dist.distancia_km }}km ({{ dist.ponto_referencia_cidade }}/{{ dist.ponto_referencia_uf }})
                      </div>
                    </div>
                  </span>

                  <!-- Systems field -->
                  <span v-else-if="coluna.campo === 'sistemas_ativos'">
                    <div class="sistemas-chips">
                      <div v-if="processo.sistemas_ativos && processo.sistemas_ativos.length > 0" class="sistemas-lista">
                        {{ getSistemasNomesString(processo.sistemas_ativos) }}
                      </div>
                      <div v-else class="sem-sistemas">-</div>
                    </div>
                  </span>

                  <!-- Distance type display -->
                  <span v-else-if="coluna.tipoExibicao === 'distancia'">
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
                  </span>

                  <!-- Representative ID field -->
                  <span v-else-if="coluna.campo === 'representante_id'">
                    <div class="responsavel-container">
                      <span class="responsavel-display">
                        {{ getRepresentanteNome(processo.representante_id) || 'Sem representante' }}
                      </span>
                    </div>
                  </span>

                  <!-- Responsible ID field -->
                  <span v-else-if="coluna.campo === 'responsavel_id'">
                    <div class="responsavel-container">
                      <span class="responsavel-display">
                        {{ getResponsavelProcessoNome(processo.responsavel_id) || 'Sem responsável' }}
                      </span>
                    </div>
                  </span>

                  <!-- Default display for other fields -->
                  <template v-else-if="coluna.campo === 'status'">
                    <!-- Mostrar apenas o texto formatado do status em modo de visualização -->
                    <span 
                      class="status-display" 
                      :class="getStatusClass(processo)"
                      @mouseenter="showStatusInfo(processo, $event)" 
                      @mouseleave="hideStatusInfo"
                      :title="isRecurringStatus(processo) ? `Notificações automáticas ativadas. Próxima notificação: ${nextNotificationDateMap[processo.id] || 'calculando...'}` : ''"
                    >
                      {{ formatStatus(selectedStatusMap[processo.id] || processo.status) }}
                    </span>
                  </template>

                  <!-- Default display for other fields -->
                  <span v-else>
                    {{ processo[coluna.campo] || '-' }}
                  </span>

                  <!-- Tratamento especial para coluna codigo_analise -->
                  <div v-if="coluna.campo === 'codigo_analise'" class="analise-cell">
                    <template v-if="processo.codigo_analise">
                      <!-- Se já tem código de análise, mostra só o GPI e prazo -->
                      <span class="codigo-gpi">
                        <!-- GPI: {{ processo.codigo_gpi }} -->
                        <span v-if="processo.prazo_analise" class="prazo">
                          (Prazo: {{ formatDate(processo.prazo_analise) }})
                        </span>
                      </span>
                    </template>
                    <template v-else>
                      <!-- Se não tem código, mostra o botão de adicionar -->
                      <span>Definir análise</span>
                      <button class="btn-small btn-add-analise" @click="handleAnaliseClick(processo)">+</button>
                    </template>
                  </div>
                </template>
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

      <!-- Dialog para reagendamento de processos -->
      <div v-if="reagendamentoDialog.show" class="modal-overlay">
        <div class="confirm-dialog">
          <div class="confirm-content">
            <h3>{{ reagendamentoDialog.status === 'demonstracao' ? 'Agendamento de Demonstração' : 'Reagendamento do Processo' }}</h3>
            <p>O processo "{{ reagendamentoDialog.processo?.numero_processo }}" foi marcado como 
              {{ reagendamentoDialog.status === 'suspenso' ? 'SUSPENSO' : 
                 reagendamentoDialog.status === 'adiado' ? 'ADIADO' : 'DEMONSTRAÇÃO' }}.
            </p>
            <p>{{ reagendamentoDialog.status === 'demonstracao' ? 'Informe a data da demonstração:' : 'Já existe uma nova data para a reabertura deste processo?' }}</p>
            
            <div v-if="reagendamentoDialog.temNovaData || reagendamentoDialog.status === 'demonstracao'" class="form-row">
              <div class="form-group">
                <label>Nova Data</label>
                <input type="date" v-model="reagendamentoDialog.novaData" 
                       :min="reagendamentoDialog.dataOriginal" />
                <span v-if="reagendamentoDialog.novaData" class="ano-hint">
                  Ano: {{ new Date(reagendamentoDialog.novaData).getFullYear() }}
                </span>
                <span v-if="reagendamentoDialog.dataError" class="error-message">
                  {{ reagendamentoDialog.dataError }}
                </span>
              </div>
              <div class="form-group">
                <label>Nova Hora</label>
                <input type="time" v-model="reagendamentoDialog.novaHora" min="08:00" max="18:00" />
                <span v-if="reagendamentoDialog.horaError" class="error-message">
                  {{ reagendamentoDialog.horaError }}
                </span>
              </div>
            </div>

            <div class="confirm-actions">
              <button class="btn-cancel" @click="hideReagendamentoDialog">Cancelar</button>
              <button v-if="!reagendamentoDialog.temNovaData && reagendamentoDialog.status !== 'demonstracao'" class="btn-secondary" @click="confirmSemNovaData">
                Não, apenas alterar o status
              </button>
              <button v-if="!reagendamentoDialog.temNovaData && reagendamentoDialog.status !== 'demonstracao'" class="btn-confirm" @click="confirmarTemNovaData">
                Sim, informar nova data
              </button>
              <button v-if="reagendamentoDialog.temNovaData || reagendamentoDialog.status === 'demonstracao'" class="btn-confirm" @click="confirmarReagendamento" 
                :disabled="!reagendamentoDialog.novaData || !reagendamentoDialog.novaHora">
                Confirmar {{ reagendamentoDialog.status === 'demonstracao' ? 'Demonstração' : 'Reagendamento' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Diálogo para detalhes de análise -->
      <div v-if="analiseDialog.show" class="modal-overlay">
        <div class="confirm-dialog analise-dialog">
          <div class="confirm-content">
            <h3>Detalhes da Análise</h3>
            <p>Processo: {{ analiseDialog.processo?.numero_processo }}</p>
            
            <!-- <div class="form-row">
              <div class="form-group">
                <label>Código de análise</label>
                <input 
                  type="text" 
                  v-model="analiseDialog.codigoAnalise" 
                  placeholder="Código de análise"
                />
              </div>
            </div> -->
            
            <div class="form-row">
              <div class="form-group">
                <label>Código de análise no GPI</label>
                <input 
                  type="text" 
                  v-model="analiseDialog.codigoGPI" 
                  placeholder="Digite o código GPI" 
                  required 
                />
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Prazo final para resposta da análise</label>
                <input 
                  type="date" 
                  v-model="analiseDialog.prazoResposta" 
                  :min="new Date().toISOString().split('T')[0]" 
                  required 
                />
              </div>
            </div>

            <div class="confirm-actions">
              <button class="btn-cancel" @click="hideAnaliseDialog">Cancelar</button>
              <button 
                class="btn-confirm" 
                @click="salvarAnalise" 
                :disabled="!this.analiseDialog.codigoGPI || !this.analiseDialog.prazoResposta"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="toast-container">
        <div v-for="toast in toasts" :key="toast.id" class="toast" :class="toast.type">
          {{ toast.message }}
        </div>
      </div>

      <!-- Tour component (movido para o final do template) -->
      <Shepherd 
        :steps="tourSteps" 
        ref="tourGuide" 
        :showButton="false"
        @complete="onTourComplete"
        @cancel="onTourCancel"
      />

      <!-- Balão de informações de status (posicionado no final do template, antes do fechamento da div main-content) -->
      <div v-if="statusInfoBalloon.show" class="status-info-balloon" :style="statusInfoBalloon.position">
        <div class="balloon-arrow"></div>
        <div class="balloon-content">
          <span class="info-icon">ℹ️</span>
          <span class="info-text">
            Notificações automáticas ativadas. 
            Próxima notificação: {{ statusInfoBalloon.nextNotification || 'calculando...' }}
          </span>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
// Import the component logic from the separate JS file
import ProcessosViewModel from './ProcessosView.js';
import Shepherd from '@/components/Shepherd.vue';
import { supabase } from '@/lib/supabase'; // Adicione esta importação

// Para uso no Vue DevTools ou em um componente temporário
async function checkTableStructure() {
  const { data, error } = await supabase
    .from('notification_schedules')
    .select('*')
    .limit(1);
  
  if (data && data.length > 0) {
    console.log("Estrutura da tabela:", Object.keys(data[0]));
  } else {
    console.log("Não foi possível obter a estrutura da tabela");
  }
}

// Certifique-se de que a função showToast está disponível no escopo
const showToast = (message, type = 'success', duration = 3000) => {
  const id = Date.now();
  toasts.value.push({ id, message, type });
  
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }, duration);
};

// Export the component with the imported logic
export default {
  ...ProcessosViewModel,
  components: {
    ...ProcessosViewModel.components || {},
    Shepherd
  },
  data() {
    const baseData = typeof ProcessosViewModel.data === 'function' 
      ? ProcessosViewModel.data() 
      : {};
    
    return {
      ...baseData,
      tourSteps: [
        {
          id: 'intro',
          title: 'Bem-vindo ao Sistema de Processos Licitatórios',
          text: 'Este tour irá guiá-lo pelos principais recursos e funcionalidades desta tela.',
          attachTo: {
            element: '.header-processos',
            on: 'bottom'
          },
          buttons: [
            {
              text: 'Pular Tour',
              action: function() { return this.cancel(); },
              classes: 'shepherd-button-secondary'
            },
            {
              text: 'Próximo',
              action: function() { return this.next(); },
              classes: 'shepherd-button-primary'
            }
          ]
        },
        {
          id: 'actionButtons',
          title: 'Ações Rápidas',
          text: 'Aqui você encontra os botões para desfazer e refazer alterações, iniciar este tour, exportar dados para Excel e adicionar novos processos.',
          attachTo: {
            element: '.actions',
            on: 'bottom'
          },
          buttons: [
            {
              text: 'Voltar',
              action: function() { return this.back(); },
              classes: 'shepherd-button-secondary'
            },
            {
              text: 'Próximo',
              action: function() { return this.next(); },
              classes: 'shepherd-button-primary'
            }
          ]
        },
        {
          id: 'tabela',
          title: 'Tabela de Processos',
          text: 'Todos os processos licitatórios são listados nesta tabela. Você pode clicar duas vezes em uma célula para editar seu conteúdo.',
          attachTo: {
            element: '.table-container',
            on: 'top'
          },
          buttons: [
            {
              text: 'Voltar',
              action: function() { return this.back(); },
              classes: 'shepherd-button-secondary'
            },
            {
              text: 'Próximo',
              action: function() { return this.next(); },
              classes: 'shepherd-button-primary'
            }
          ]
        },
        {
          id: 'filtros',
          title: 'Filtros',
          text: 'Use os ícones de filtro nas colunas para filtrar os dados por valores específicos.',
          attachTo: {
            element: '.filtro-container',
            on: 'right'
          },
          buttons: [
            {
              text: 'Voltar',
              action: function() { return this.back(); },
              classes: 'shepherd-button-secondary'
            },
            {
              text: 'Próximo',
              action: function() { return this.next(); },
              classes: 'shepherd-button-primary'
            }
          ]
        },
        {
          id: 'anosTabs',
          title: 'Navegação por Anos',
          text: 'Use estas abas para navegar entre processos de diferentes anos.',
          attachTo: {
            element: '.anos-tabs',
            on: 'top'
          },
          buttons: [
            {
              text: 'Voltar',
              action: function() { return this.back(); },
              classes: 'shepherd-button-secondary'
            },
            {
              text: 'Próximo',
              action: function() { return this.next(); },
              classes: 'shepherd-button-primary'
            }
          ]
        },
        {
          id: 'concluir',
          title: 'Tour Concluído!',
          text: 'Agora você conhece os principais recursos desta tela. Explore e aproveite o sistema!',
          buttons: [
            {
              text: 'Concluir',
              action: function() { return this.complete(); },
              classes: 'shepherd-button-primary'
            }
          ]
        }
      ]
    };
  },
  methods: {
    ...ProcessosViewModel.methods,
    startTour() {
      if (this.$refs.tourGuide) {
        this.$refs.tourGuide.startTour();
      } else {
        console.error('Tour guide reference not found');
      }
    },
    onTourComplete() {
      if (typeof this.showToast === 'function') {
        this.showToast('Tour concluído! Aproveite o sistema.', 'success');
      }
    },
    onTourCancel() {
      if (typeof this.showToast === 'function') {
        this.showToast('Tour cancelado. Você pode iniciá-lo novamente a qualquer momento.', 'info');
      }
    },
    // Função para salvar os detalhes da análise
    async salvarAnalise() {
      try {
        if (!this.analiseDialog.processo || !this.analiseDialog.codigoGPI || !this.analiseDialog.prazoResposta) {
          this.showToast('Preencha todos os campos obrigatórios', 'error');
          return;
        }

        // Formatar a data corretamente para o banco
        const prazoFormatado = this.analiseDialog.prazoResposta instanceof Date 
          ? this.analiseDialog.prazoResposta.toISOString().split('T')[0] 
          : this.analiseDialog.prazoResposta;

        // 1. Atualizar o registro do processo com o código de análise
        const updateData = {
          codigo_analise: this.analiseDialog.codigoGPI,
          codigo_gpi: this.analiseDialog.codigoGPI,
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
          .eq('id', this.analiseDialog.processo.id);

        if (error) throw error;

        // 2. Programar notificação para o prazo final - CORREÇÃO AQUI
        const notificationData = {
          processo_id: this.analiseDialog.processo.id,
          status: 'analise',
          // Usar o campo message como mostrado nos dados de exemplo
          message: `Prazo final para análise do processo ${this.analiseDialog.processo.numero_processo} (Código GPI: ${this.analiseDialog.codigoGPI})`,
          next_notification: new Date(prazoFormatado).toISOString(),
          last_updated: new Date().toISOString(),
          created_at: new Date().toISOString(),
          active: true
        };

        // Inserir no sistema de notificações
        const { error: notificationError } = await supabase
          .from('notification_schedules')
          .insert(notificationData);

        if (notificationError) throw notificationError;

        // Recarregar os dados - IMPORTANTE: Use a função do seu ViewModel
        try {
          if (ProcessosViewModel.methods && ProcessosViewModel.methods.loadProcessos) {
            await ProcessosViewModel.methods.loadProcessos();
          } else {
            // Fallback: carregar de outra forma
            const { data } = await supabase
              .from('processos')
              .select('*')
              .order('data_pregao', { ascending: true })
              .order('created_at', { ascending: true });
              
            if (data) {
              // Atualizar os dados no componente
              this.$root.$emit('processos-updated', data);
            }
          }
        } catch (loadError) {
          console.error('Erro ao recarregar processos:', loadError);
        }
        
        // Fechar o diálogo
        this.hideAnaliseDialog();
        
        // Mostrar mensagem de sucesso
        this.showToast(`Análise registrada com sucesso! Código GPI: ${this.analiseDialog.codigoGPI}. Notificação agendada para ${this.formatDate(prazoFormatado)}`, 'success', 5000);
      } catch (error) {
        console.error('Erro ao salvar análise:', error);
        this.showToast('Erro ao salvar os detalhes da análise: ' + error.message, 'error');
      }
    },
    // Adicione esta função aos methods
    async logSystemAction(dados) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        const logData = {
          usuario_id: user.id,
          usuario_email: user.email,
          tipo: dados.tipo,
          tabela: dados.tabela,
          registro_id: dados.registro_id,
          dados_anteriores: dados.dados_anteriores,
          dados_novos: dados_novos,
          data_hora: new Date().toISOString()
        };
    
        const { error } = await supabase
          .from('system_logs')
          .insert(logData);
    
        if (error) throw error;
      } catch (error) {
        console.error('Error logging action:', error);
      }
    },
    loadProcessos: async function() {
      try {
        console.log('Recarregando processos...');
        const { data, error } = await supabase
          .from('processos')
          .select('*')
          .order('data_pregao', { ascending: true })
          .order('created_at', { ascending: true });
          
        if (error) throw error;
        
        // Se você tem isso no seu ProcessosViewModel
        if (ProcessosViewModel.methods && typeof ProcessosViewModel.methods.processarProcessos === 'function') {
          await ProcessosViewModel.methods.processarProcessos(data);
        } else {
          // Caso contrário, atualize diretamente
          this.processos = data;
        }
        
        console.log('Processos recarregados com sucesso!');
      } catch (err) {
        console.error('Erro ao recarregar processos:', err);
      }
    }
  }
};
</script>

<style src="@/assets/styles/ProcessosView.css"></style>
<style src="/src/assets/styles/modules/toast.css"></style>
<style src="/src/assets/styles/components/actions.css"></style>
<style src="/src/assets/styles/components/filters.css"></style>
